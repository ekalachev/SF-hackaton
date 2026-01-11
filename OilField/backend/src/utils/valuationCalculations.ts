/**
 * Valuation Calculations - Dynamic NPV calculation utilities
 *
 * Ported from scripts/generate_valuations.py
 * Implements hyperbolic decline curve analysis and NPV calculation
 */

// Economic assumptions
export const DEFAULT_OIL_PRICE_USD = 75;
export const DEFAULT_OPERATING_COST_USD = 15;
export const DEFAULT_DISCOUNT_RATE = 0.10;
export const DEFAULT_ROYALTY_RATE = 0.20;
export const FORECAST_MONTHS = 120; // 10 years

export interface ProductionRecord {
  date: string;
  oilBbl: number;
}

export interface DeclineCurveParams {
  qi: number;  // Initial rate
  di: number;  // Initial decline rate
  b: number;   // Hyperbolic exponent
  rSquared: number;
}

export interface ValuationResult {
  npvUsd: number;
  marketValueUsd: number;
  discountPct: number;
  confidence: number;
  remainingReservesBbl: number;
  forecast: number[];
}

/**
 * Calculate hyperbolic decline rate at time t
 * Formula: q(t) = qi / (1 + b * di * t)^(1/b)
 */
function hyperbolicDecline(qi: number, di: number, b: number, timeYears: number): number {
  if (b === 0) {
    // Exponential decline
    return qi * Math.exp(-di * timeYears);
  }

  const denominator = Math.pow(1 + b * di * timeYears, 1 / b);
  return qi / denominator;
}

/**
 * Fit decline curve to production history using weighted least squares
 *
 * Uses exponential decay weights to prioritize recent production data.
 * This handles wells with changing trajectories better than equal weighting.
 *
 * @param productionHistory - Production records
 * @param recentMonths - Number of recent months to consider (default 12)
 * @param decayLambda - Exponential decay rate (default 0.25, ~3 month half-life)
 */
export function fitDeclineCurve(
  productionHistory: ProductionRecord[],
  recentMonths: number = 12,
  decayLambda: number = 0.25
): DeclineCurveParams {
  if (productionHistory.length < 2) {
    return {
      qi: productionHistory[0]?.oilBbl ?? 0,
      di: 0.15, // Default 15% annual decline
      b: 0.5,
      rSquared: 0.5,
    };
  }

  // Sort by date descending to get most recent first
  const sortedDesc = [...productionHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Take only the most recent N months
  const recentData = sortedDesc.slice(0, recentMonths);

  // Filter out zero production months for curve fitting
  const nonZero = recentData.filter(p => p.oilBbl > 0);

  if (nonZero.length < 2) {
    return {
      qi: recentData[0]?.oilBbl ?? 0,
      di: 0.15,
      b: 0.5,
      rSquared: 0.5,
    };
  }

  // Sort to ascending for curve fitting (oldest first)
  const sorted = [...nonZero].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate time from most recent date and apply exponential decay weights
  const mostRecentTime = new Date(sortedDesc[0].date).getTime();
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;

  // Prepare data with weights: w(t) = e^(-λ * ageInMonths)
  // Recent data gets weight ~1.0, older data decays toward 0
  // Time is measured as age from most recent (so most recent = 0, older = positive)
  const data = sorted.map(p => {
    const dateTime = new Date(p.date).getTime();
    const ageMonths = (mostRecentTime - dateTime) / msPerMonth; // months from most recent
    const t = ageMonths / 12; // convert to years for decline rate
    const weight = Math.exp(-decayLambda * ageMonths);
    return { t, lnQ: Math.log(p.oilBbl), weight };
  });

  // Weighted linear regression on ln(q) vs time
  // Calculate weighted means
  const sumW = data.reduce((sum, d) => sum + d.weight, 0);
  const weightedMeanT = data.reduce((sum, d) => sum + d.weight * d.t, 0) / sumW;
  const weightedMeanLnQ = data.reduce((sum, d) => sum + d.weight * d.lnQ, 0) / sumW;

  // Calculate weighted slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (const d of data) {
    numerator += d.weight * (d.t - weightedMeanT) * (d.lnQ - weightedMeanLnQ);
    denominator += d.weight * (d.t - weightedMeanT) * (d.t - weightedMeanT);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = weightedMeanLnQ - slope * weightedMeanT;

  // Extract parameters
  // With t = age from most recent, intercept gives current production estimate
  // slope > 0 means older data had higher production (normal decline)
  const qi = Math.exp(intercept);
  const di = slope; // Decline rate (positive when production was higher in past)

  // Calculate weighted R-squared
  let ssRes = 0;
  let ssTot = 0;

  for (const d of data) {
    const predicted = intercept + slope * d.t;
    ssRes += d.weight * Math.pow(d.lnQ - predicted, 2);
    ssTot += d.weight * Math.pow(d.lnQ - weightedMeanLnQ, 2);
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Use hyperbolic b factor of 0.5 (industry typical)
  return {
    qi: Math.max(qi, 1), // Ensure positive
    di: Math.max(di, 0.05), // Minimum 5% decline
    b: 0.5,
    rSquared: Math.max(0, Math.min(1, rSquared)),
  };
}

/**
 * Forecast future production using decline curve
 */
export function forecastProduction(
  qi: number,
  di: number,
  b: number,
  months: number
): number[] {
  const forecast: number[] = [];

  for (let month = 0; month < months; month++) {
    const timeYears = month / 12;
    const qMonth = hyperbolicDecline(qi, di, b, timeYears);
    forecast.push(Math.max(0, qMonth));
  }

  return forecast;
}

/**
 * Calculate Net Present Value (NPV) of future production
 */
export function calculateNpv(
  monthlyProduction: number[],
  oilPrice: number = DEFAULT_OIL_PRICE_USD,
  operatingCost: number = DEFAULT_OPERATING_COST_USD,
  discountRate: number = DEFAULT_DISCOUNT_RATE
): number {
  if (monthlyProduction.length === 0) {
    return 0;
  }

  // Monthly discount rate
  const monthlyDiscountRate = Math.pow(1 + discountRate, 1 / 12) - 1;

  let npv = 0;

  for (let month = 0; month < monthlyProduction.length; month++) {
    const production = monthlyProduction[month];

    if (production <= 0) {
      continue;
    }

    // Revenue
    const revenue = production * oilPrice;

    // Operating costs
    const opex = production * operatingCost;

    // Net cash flow
    const cashFlow = revenue - opex;

    // Discount to present value
    const pv = cashFlow / Math.pow(1 + monthlyDiscountRate, month);

    npv += pv;
  }

  return npv;
}

/**
 * Calculate confidence score for valuation
 */
export function calculateConfidence(
  productionHistory: ProductionRecord[],
  rSquared: number
): number {
  // 1. Data quality: 24 months ideal
  const dataQuality = Math.min(1, productionHistory.length / 24);

  // 2. Production stability: coefficient of variation
  const productions = productionHistory.map(p => p.oilBbl).filter(p => p > 0);

  let stability = 0.5;
  if (productions.length >= 2) {
    const mean = productions.reduce((a, b) => a + b, 0) / productions.length;
    if (mean > 0) {
      const variance = productions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / productions.length;
      const stdDev = Math.sqrt(variance);
      const coeffVariation = stdDev / mean;
      stability = Math.max(0, 1 - Math.min(1, coeffVariation));
    }
  }

  // 3. Fit quality from R-squared
  const fitQuality = rSquared;

  // Weighted average
  const confidence = 0.5 * fitQuality + 0.3 * dataQuality + 0.2 * stability;

  // Clamp to range [0.75, 0.95]
  return Math.max(0.75, Math.min(0.95, confidence * 1.2));
}

/**
 * Estimate market value from NPV
 * Uses a multiplier based on industry comparables
 */
export function estimateMarketValue(npv: number, wellIndex: number = 0): number {
  // Use well index to create variation in multipliers
  // This simulates market inefficiencies
  const category = wellIndex % 3;

  let multiplier: number;

  if (category === 0) {
    // ~33% undervalued (higher market value relative to NPV)
    multiplier = 1.4 + Math.random() * 0.25;
  } else if (category === 1) {
    // ~33% fair value
    multiplier = 1.15 + Math.random() * 0.2;
  } else {
    // ~33% overvalued
    multiplier = 0.95 + Math.random() * 0.2;
  }

  return npv * multiplier;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(npv: number, marketValue: number): number {
  if (marketValue === 0) {
    return 0;
  }

  return ((marketValue - npv) / marketValue) * 100;
}

/**
 * Complete valuation calculation for a well
 */
export function calculateValuation(
  productionHistory: ProductionRecord[],
  wellIndex: number = 0
): ValuationResult {
  // 1. Fit decline curve
  const { qi, di, b, rSquared } = fitDeclineCurve(productionHistory);

  // 2. Forecast future production
  const forecast = forecastProduction(qi, di, b, FORECAST_MONTHS);

  // 3. Calculate NPV
  const npvUsd = calculateNpv(forecast);

  // 4. Calculate remaining reserves
  const remainingReservesBbl = forecast.reduce((sum, p) => sum + p, 0);

  // 5. Estimate market value
  const marketValueUsd = estimateMarketValue(npvUsd, wellIndex);

  // 6. Calculate discount percentage
  const discountPct = calculateDiscountPercentage(npvUsd, marketValueUsd);

  // 7. Calculate confidence
  const confidence = calculateConfidence(productionHistory, rSquared);

  return {
    npvUsd: Math.round(npvUsd * 100) / 100,
    marketValueUsd: Math.round(marketValueUsd * 100) / 100,
    discountPct: Math.round(discountPct * 100) / 100,
    confidence: Math.round(confidence * 1000) / 1000,
    remainingReservesBbl: Math.round(remainingReservesBbl * 100) / 100,
    forecast,
  };
}

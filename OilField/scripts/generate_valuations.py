#!/usr/bin/env python3
"""
Generate DCA (Decline Curve Analysis) valuations for all wells.

This script implements the valuation service logic from TECHNICAL_EXECUTION_PLAN.md
lines 817-898, using simplified DCA for MVP as per MVP_SCOPE.md lines 155-171.

Following SOLID principles:
- Single Responsibility: Each function has one clear purpose
- Open/Closed: Functions are extensible without modification
- Dependency Inversion: Functions depend on abstractions (type hints)
"""

import json
import math
import random
from pathlib import Path
from typing import List, Dict, Tuple, TypedDict
from scipy.optimize import curve_fit
import numpy as np


# Type definitions for strong typing
class ProductionRecord(TypedDict):
    """Production record for a single month."""
    date: str
    oil_bbl: float
    gas_mcf: float
    water_bbl: float
    days_produced: int


class Valuation(TypedDict):
    """Valuation result for a well."""
    npvUsd: float
    marketValueUsd: float
    discountPct: float
    confidence: float
    remainingReservesBbl: float


class DCAParameters(TypedDict):
    """Decline Curve Analysis parameters."""
    qi: float  # Initial production rate (bbl/month)
    di: float  # Decline rate (annual)
    b: float   # Hyperbolic exponent
    r_squared: float  # Goodness of fit


# Constants (per TECHNICAL_EXECUTION_PLAN.md lines 787-794)
DEFAULT_OIL_PRICE_USD = 75.0  # WTI oil price $/bbl
DEFAULT_OPERATING_COST_USD = 15.0  # Operating cost $/bbl
DEFAULT_DISCOUNT_RATE = 0.10  # 10% annual discount rate
FORECAST_MONTHS = 120  # 10 years forecast


def calculate_hyperbolic_decline(
    qi: float, di: float, b: float, time_years: float
) -> float:
    """
    Calculate production rate using hyperbolic decline curve.

    Formula from TECHNICAL_EXECUTION_PLAN.md line 852:
    q(t) = qi / (1 + b * di * t)^(1/b)

    Args:
        qi: Initial production rate (bbl/month)
        di: Initial decline rate (annual)
        b: Hyperbolic exponent (0=exponential, 1=harmonic)
        time_years: Time in years from start

    Returns:
        Production rate at time t (bbl/month)
    """
    if b == 0:
        # Exponential decline: q(t) = qi * exp(-di * t)
        return qi * math.exp(-di * time_years)
    elif b == 1:
        # Harmonic decline: q(t) = qi / (1 + di * t)
        return qi / (1 + di * time_years)
    else:
        # Hyperbolic decline
        denominator = 1 + b * di * time_years
        if denominator <= 0:
            return 0.0
        return qi / math.pow(denominator, 1 / b)


def fit_decline_curve(
    production_history: List[Dict[str, float]]
) -> Tuple[float, float, float, float]:
    """
    Fit decline curve to production history using curve fitting.

    Implementation based on TECHNICAL_EXECUTION_PLAN.md lines 817-860.

    Args:
        production_history: List of monthly production records

    Returns:
        Tuple of (qi, di, b, r_squared)
        - qi: Initial production rate (bbl/month)
        - di: Decline rate (annual)
        - b: Hyperbolic exponent
        - r_squared: Coefficient of determination (fit quality)
    """
    # Extract oil production values
    productions = [record["oil_bbl"] for record in production_history]

    if len(productions) < 3:
        # Not enough data - return defaults
        qi_default = max(productions) if productions else 1000
        return qi_default, 0.3, 0.5, 0.5

    # Time in years from oldest to newest (reverse chronological order assumed)
    productions_reversed = list(reversed(productions))
    time_months = np.arange(len(productions_reversed))
    time_years = time_months / 12.0

    # Initial guess: qi from peak, di from decline rate, b=0.5 (hyperbolic)
    qi_initial = max(productions_reversed)

    # Define the hyperbolic decline function for curve fitting
    def decline_func(t: np.ndarray, qi: float, di: float, b: float) -> np.ndarray:
        """Hyperbolic decline function for curve fitting."""
        result = np.zeros_like(t)
        for i, time in enumerate(t):
            if b < 0.01:  # Exponential
                result[i] = qi * np.exp(-di * time)
            elif b > 0.99:  # Harmonic
                result[i] = qi / (1 + di * time)
            else:  # Hyperbolic
                denominator = 1 + b * di * time
                if denominator > 0:
                    result[i] = qi / (denominator ** (1 / b))
                else:
                    result[i] = 0
        return result

    try:
        # Curve fit with bounds to ensure realistic parameters
        popt, _ = curve_fit(
            decline_func,
            time_years,
            productions_reversed,
            p0=[qi_initial, 0.3, 0.5],  # Initial guess
            bounds=(
                [0, 0.05, 0.0],
                [qi_initial * 1.5, 0.95, 1.0]
            ),  # Bounds
            maxfev=5000
        )

        qi_fit, di_fit, b_fit = popt

        # Calculate R² for goodness of fit
        y_pred = decline_func(time_years, qi_fit, di_fit, b_fit)
        y_true = productions_reversed

        # R² = 1 - (SS_res / SS_tot)
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)

        if ss_tot > 0:
            r_squared = max(0.0, 1 - (ss_res / ss_tot))
        else:
            r_squared = 0.5

        return float(qi_fit), float(di_fit), float(b_fit), float(r_squared)

    except (RuntimeError, ValueError, TypeError):
        # Curve fitting failed - use simple estimation
        qi_fallback = qi_initial
        if len(productions_reversed) >= 6:
            recent_avg = np.mean(productions_reversed[-6:])
        else:
            recent_avg = productions_reversed[-1]
        di_fallback = max(
            0.05, min(0.5, (qi_fallback - recent_avg) / qi_fallback)
        )

        return float(qi_fallback), float(di_fallback), 0.5, 0.5


def forecast_production(qi: float, di: float, b: float, months: int) -> List[float]:
    """
    Forecast future production using decline curve parameters.

    Implementation based on TECHNICAL_EXECUTION_PLAN.md lines 837-860.

    Args:
        qi: Initial production rate (bbl/month)
        di: Decline rate (annual)
        b: Hyperbolic exponent
        months: Number of months to forecast

    Returns:
        List of monthly production values (bbl)
    """
    forecast = []

    for month in range(months):
        time_years = month / 12.0
        q_month = calculate_hyperbolic_decline(qi, di, b, time_years)

        # Ensure non-negative production
        forecast.append(max(0.0, q_month))

    return forecast


def calculate_npv(
    monthly_production: List[float],
    oil_price: float,
    operating_cost: float,
    discount_rate: float,
) -> float:
    """
    Calculate Net Present Value (NPV) of future production.

    Implementation based on TECHNICAL_EXECUTION_PLAN.md lines 862-898.

    Args:
        monthly_production: List of monthly production values (bbl)
        oil_price: Oil price in USD/bbl
        operating_cost: Operating cost in USD/bbl
        discount_rate: Annual discount rate (e.g., 0.10 for 10%)

    Returns:
        NPV in USD
    """
    if not monthly_production:
        return 0.0

    # Monthly discount rate
    monthly_discount_rate = math.pow(1 + discount_rate, 1 / 12) - 1

    npv = 0.0

    for month, production in enumerate(monthly_production):
        if production <= 0:
            continue

        # Revenue
        revenue = production * oil_price

        # Operating costs
        opex = production * operating_cost

        # Net cash flow (simplified - no royalties or taxes for MVP)
        cash_flow = revenue - opex

        # Discount to present value
        pv = cash_flow / math.pow(1 + monthly_discount_rate, month)

        npv += pv

    return npv


def calculate_confidence_score(
    production_history: List[Dict[str, float]], r_squared: float
) -> float:
    """
    Calculate confidence score for valuation.

    Based on TECHNICAL_EXECUTION_PLAN.md lines 900-921:
    - Data completeness (more months = higher confidence)
    - Production stability (lower variance = higher confidence)
    - Decline curve fit quality (higher R² = higher confidence)

    Args:
        production_history: List of monthly production records
        r_squared: R² from decline curve fitting

    Returns:
        Confidence score between 0.75 and 0.95
    """
    # 1. Data quality: 24 months ideal
    data_quality = min(1.0, len(production_history) / 24.0)

    # 2. Production stability: coefficient of variation
    productions = [record["oil_bbl"] for record in production_history]

    if len(productions) < 2:
        stability = 0.5
    else:
        mean_prod = np.mean(productions)
        if mean_prod > 0:
            std_prod = np.std(productions)
            coeff_variation = std_prod / mean_prod
            stability = max(0.0, 1.0 - min(1.0, coeff_variation))
        else:
            stability = 0.5

    # 3. Fit quality from R²
    fit_quality = r_squared

    # Weighted average: fit quality most important
    confidence = (
        0.5 * fit_quality + 0.3 * data_quality + 0.2 * stability
    )

    # Clamp to range [0.75, 0.95] as per requirements
    confidence = max(0.75, min(0.95, confidence * 1.2))

    return round(confidence, 3)


def estimate_market_value(npv: float, seed: int | None = None) -> float:
    """
    Estimate market value from NPV.

    Based on TECHNICAL_EXECUTION_PLAN.md line 978:
    Market value = NPV * 1.5 ± 10% for realism

    Args:
        npv: Net Present Value in USD
        seed: Random seed for reproducibility (optional)

    Returns:
        Estimated market value in USD
    """
    if seed is not None:
        random.seed(seed)

    # Base multiplier: 1.5x NPV (industry typical)
    base_multiplier = 1.5

    # Add randomness: ±10%
    randomness = random.uniform(-0.10, 0.10)
    multiplier = base_multiplier * (1 + randomness)

    market_value = npv * multiplier

    return round(market_value, 2)


def calculate_discount_percentage(npv: float, market_value: float) -> float:
    """
    Calculate discount percentage.

    Formula: discount % = (market_value - npv) / market_value * 100

    Args:
        npv: AI calculated NPV in USD
        market_value: Estimated market value in USD

    Returns:
        Discount percentage (positive = undervalued, negative = overvalued)
    """
    if market_value == 0:
        return 0.0

    discount_pct = ((market_value - npv) / market_value) * 100

    return round(discount_pct, 2)


def valuate_well(
    production_history: List[Dict[str, float]],
    seed: int | None = None,
    well_index: int = 0
) -> Valuation:
    """
    Calculate complete valuation for a well.

    This is the main integration function that combines all DCA components.

    Args:
        production_history: List of monthly production records
        seed: Random seed for reproducibility (optional)
        well_index: Index of well (used to vary discount distribution)

    Returns:
        Valuation dictionary with all required fields
    """
    # 1. Fit decline curve
    qi, di, b, r_squared = fit_decline_curve(production_history)

    # 2. Forecast future production
    forecast = forecast_production(qi, di, b, FORECAST_MONTHS)

    # 3. Calculate NPV
    npv = calculate_npv(
        forecast,
        DEFAULT_OIL_PRICE_USD,
        DEFAULT_OPERATING_COST_USD,
        DEFAULT_DISCOUNT_RATE,
    )

    # 4. Calculate remaining reserves
    remaining_reserves = sum(forecast)

    # 5. Estimate market value with varied distribution
    # Vary the market value to create undervalued/fair/overvalued mix
    # Target: ~40% undervalued (>25%), ~30% fair (10-25%), ~30% overvalued
    if seed is not None:
        random.seed(seed)

    # Use well index to determine category tendency
    category_random = random.random()

    if well_index % 3 == 0:  # ~33% undervalued tendency
        # Higher market value relative to NPV
        multiplier = random.uniform(1.4, 1.65)
    elif well_index % 3 == 1:  # ~33% fair value tendency
        # Medium market value
        multiplier = random.uniform(1.15, 1.35)
    else:  # ~33% overvalued tendency
        # Lower market value
        multiplier = random.uniform(0.95, 1.15)

    market_value = npv * multiplier

    # 6. Calculate discount percentage
    discount_pct = calculate_discount_percentage(npv, market_value)

    # 7. Calculate confidence score
    confidence = calculate_confidence_score(production_history, r_squared)

    return {
        "npvUsd": round(npv, 2),
        "marketValueUsd": round(market_value, 2),
        "discountPct": discount_pct,
        "confidence": confidence,
        "remainingReservesBbl": round(remaining_reserves, 2),
    }


def main() -> None:
    """
    Main function to generate valuations for all wells.

    Reads wells.json, calculates valuations, and writes back.
    """
    # Read wells.json
    wells_path = Path(__file__).parent.parent / "data" / "processed" / "wells.json"

    with open(wells_path, "r") as f:
        wells = json.load(f)

    print(f"Loaded {len(wells)} wells from {wells_path}")

    # Track statistics
    valuations_count = 0
    undervalued_count = 0
    fairly_valued_count = 0
    overvalued_count = 0

    npv_values = []
    discount_values = []
    confidence_values = []

    # Generate valuations for each well
    for i, well in enumerate(wells):
        well_id = well["id"]
        production_history = well.get("production_history", [])

        if not production_history:
            print(f"⚠️  Well {well_id}: No production history, skipping")
            continue

        # Use well index as seed for reproducibility
        valuation = valuate_well(production_history, seed=i, well_index=i)

        # Update well with valuation
        well["valuation"] = valuation

        # Track statistics
        valuations_count += 1
        npv_values.append(valuation["npvUsd"])
        discount_values.append(valuation["discountPct"])
        confidence_values.append(valuation["confidence"])

        # Categorize by discount
        if valuation["discountPct"] > 25:
            undervalued_count += 1
            category = "UNDERVALUED"
        elif valuation["discountPct"] > 10:
            fairly_valued_count += 1
            category = "FAIRLY VALUED"
        else:
            overvalued_count += 1
            category = "OVERVALUED"

        print(
            f"✓ {well_id}: NPV=${valuation['npvUsd']:,.0f}, "
            f"Market=${valuation['marketValueUsd']:,.0f}, "
            f"Discount={valuation['discountPct']:.1f}%, "
            f"Confidence={valuation['confidence']:.2f} [{category}]"
        )

    # Write updated wells.json
    with open(wells_path, "w") as f:
        json.dump(wells, f, indent=2)

    print("\n✅ Valuations generated and saved to "
          f"{wells_path}\n")

    # Print statistics
    print("\n" + "=" * 70)
    print("VALUATION STATISTICS")
    print("=" * 70)
    print(f"Total wells valuated: {valuations_count}")
    print(f"\nNPV Range: ${min(npv_values):,.0f} - ${max(npv_values):,.0f}")
    print(f"Average NPV: ${sum(npv_values) / len(npv_values):,.0f}")
    print(f"\nDiscount % Range: {min(discount_values):.1f}% - {max(discount_values):.1f}%")
    print(f"Average Discount: {sum(discount_values) / len(discount_values):.1f}%")
    print(f"\nConfidence Range: {min(confidence_values):.2f} - {max(confidence_values):.2f}")
    print(f"Average Confidence: {sum(confidence_values) / len(confidence_values):.2f}")
    print("\n📊 CATEGORIZATION:")
    print(f"   Undervalued (>25% discount): {undervalued_count} wells")
    print(f"   Fairly valued (10-25% discount): {fairly_valued_count} wells")
    print(f"   Overvalued (<10% discount): {overvalued_count} wells")
    print("=" * 70)


if __name__ == "__main__":
    main()

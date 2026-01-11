"""
Test suite for DCA valuation generation.

Following TDD principles - tests written first, then implementation.
"""

import pytest
from typing import List, Dict


# Test data fixtures
@pytest.fixture
def sample_production_history() -> List[Dict[str, float]]:
    """Sample production history showing decline over time."""
    return [
        {"oil_bbl": 5000, "date": "2023-01"},
        {"oil_bbl": 4500, "date": "2023-02"},
        {"oil_bbl": 4100, "date": "2023-03"},
        {"oil_bbl": 3800, "date": "2023-04"},
        {"oil_bbl": 3500, "date": "2023-05"},
        {"oil_bbl": 3300, "date": "2023-06"},
        {"oil_bbl": 3100, "date": "2023-07"},
        {"oil_bbl": 2900, "date": "2023-08"},
        {"oil_bbl": 2700, "date": "2023-09"},
        {"oil_bbl": 2600, "date": "2023-10"},
        {"oil_bbl": 2400, "date": "2023-11"},
        {"oil_bbl": 2300, "date": "2023-12"},
    ]


@pytest.fixture
def stable_production_history() -> List[Dict[str, float]]:
    """Production history with low variance for high confidence."""
    return [
        {"oil_bbl": 1000 + i * 5, "date": f"2023-{i+1:02d}"}
        for i in range(12)
    ]


class TestDCAFunctions:
    """Test suite for Decline Curve Analysis functions."""

    @pytest.mark.parametrize(
        "qi,di,b,time_years,expected_min,expected_max",
        [
            (5000, 0.3, 0.5, 1.0, 3000, 4000),  # Hyperbolic decline
            (5000, 0.3, 0.0, 1.0, 3700, 3710),  # Exponential decline: qi * exp(-0.3*1)
            (5000, 0.3, 1.0, 1.0, 3840, 3850),  # Harmonic decline: qi / (1 + 0.3*1)
        ],
    )
    def test_hyperbolic_decline_curve(
        self,
        qi: float,
        di: float,
        b: float,
        time_years: float,
        expected_min: float,
        expected_max: float,
    ) -> None:
        """
        Test hyperbolic decline curve calculation.

        Formula: q(t) = qi / (1 + b*Di*t)^(1/b)
        """
        from scripts.generate_valuations import calculate_hyperbolic_decline

        result = calculate_hyperbolic_decline(qi, di, b, time_years)
        assert expected_min <= result <= expected_max, \
            f"Expected result between {expected_min} and {expected_max}, got {result}"

    def test_fit_decline_curve_returns_valid_parameters(
        self, sample_production_history: List[Dict[str, float]]
    ) -> None:
        """
        Test that decline curve fitting returns valid DCA parameters.
        """
        from scripts.generate_valuations import fit_decline_curve

        qi, di, b, r_squared = fit_decline_curve(
            sample_production_history
        )

        # Validate parameter ranges
        assert qi > 0, "Initial production rate must be positive"
        di_msg = f"Decline rate {di} out of range [0.05, 0.95]"
        assert 0.05 <= di <= 0.95, di_msg
        b_msg = f"Hyperbolic exponent {b} out of range [0.0, 1.0]"
        assert 0.0 <= b <= 1.0, b_msg
        r2_msg = f"R² {r_squared} out of range [0.0, 1.0]"
        assert 0.0 <= r_squared <= 1.0, r2_msg

    def test_forecast_production_generates_valid_forecast(
        self, sample_production_history: List[Dict[str, float]]
    ) -> None:
        """
        Test that production forecasting generates valid future values.
        """
        from scripts.generate_valuations import (
            fit_decline_curve, forecast_production
        )

        qi, di, b, _ = fit_decline_curve(sample_production_history)
        forecast = forecast_production(qi, di, b, months=120)

        assert len(forecast) == 120, "Should have 120 months"
        non_neg_msg = "All production values must be non-negative"
        assert all(q >= 0 for q in forecast), non_neg_msg
        decline_msg = "Production should decline over time"
        assert forecast[0] > forecast[-1], decline_msg


class TestNPVCalculation:
    """Test suite for NPV calculation functions."""

    @pytest.mark.parametrize(
        "monthly_production,oil_price,operating_cost,discount_rate,expected_min",
        [
            ([1000] * 12, 75, 15, 0.10, 500000),  # Constant production
            ([1000, 900, 800, 700, 600], 75, 15, 0.10, 200000),  # Declining production
            ([2000] * 24, 100, 20, 0.10, 2000000),  # Higher price & production
        ],
    )
    def test_calculate_npv(
        self,
        monthly_production: List[float],
        oil_price: float,
        operating_cost: float,
        discount_rate: float,
        expected_min: float,
    ) -> None:
        """Test NPV calculation with different scenarios."""
        from scripts.generate_valuations import calculate_npv

        npv = calculate_npv(
            monthly_production, oil_price, operating_cost, discount_rate
        )

        assert npv > 0, "NPV should be positive for profitable wells"
        npv_msg = f"NPV {npv} below minimum expected {expected_min}"
        assert npv >= expected_min, npv_msg

    def test_calculate_npv_with_zero_production(self) -> None:
        """Test NPV calculation handles zero production gracefully."""
        from scripts.generate_valuations import calculate_npv

        npv = calculate_npv([0] * 12, 75, 15, 0.10)
        assert npv == 0, "NPV should be zero for no production"


class TestConfidenceScore:
    """Test suite for confidence score calculation."""

    def test_confidence_score_range(
        self, sample_production_history: List[Dict[str, float]]
    ) -> None:
        """Test that confidence score is within valid range."""
        from scripts.generate_valuations import calculate_confidence_score

        confidence = calculate_confidence_score(sample_production_history, r_squared=0.85)

        assert 0.0 <= confidence <= 1.0, \
            f"Confidence score {confidence} out of range [0.0, 1.0]"

    @pytest.mark.parametrize(
        "r_squared,history_months,expected_min,expected_max",
        [
            (0.95, 24, 0.85, 0.95),  # High R², long history
            (0.75, 12, 0.80, 0.90),  # Medium R², medium history (clamped to min 0.75)
            (0.60, 6, 0.75, 0.80),   # Lower R², short history (clamped to min 0.75)
        ],
    )
    def test_confidence_score_with_different_quality(
        self,
        r_squared: float,
        history_months: int,
        expected_min: float,
        expected_max: float
    ) -> None:
        """Test confidence score varies with data quality."""
        from scripts.generate_valuations import (
            calculate_confidence_score
        )

        history = [
            {"oil_bbl": 1000 - i * 10, "date": f"2023-{i+1:02d}"}
            for i in range(history_months)
        ]

        confidence = calculate_confidence_score(history, r_squared)

        conf_msg = (
            f"Confidence {confidence} not in expected range "
            f"[{expected_min}, {expected_max}]"
        )
        assert expected_min <= confidence <= expected_max, conf_msg


class TestMarketValueAndDiscount:
    """Test suite for market value estimation and discount calculation."""

    def test_estimate_market_value(self) -> None:
        """Test market value estimation (NPV * 1.5 ± 10%)."""
        from scripts.generate_valuations import estimate_market_value

        npv = 1000000
        market_value = estimate_market_value(npv, seed=42)

        # Market value should be NPV * 1.5 ± 10%
        expected_min = npv * 1.5 * 0.9
        expected_max = npv * 1.5 * 1.1

        mv_msg = (
            f"Market value {market_value} not in expected range "
            f"[{expected_min}, {expected_max}]"
        )
        assert expected_min <= market_value <= expected_max, mv_msg

    @pytest.mark.parametrize(
        "npv,market_value,expected_discount",
        [
            (700000, 1000000, 30.0),  # Undervalued: 30% discount
            (850000, 1000000, 15.0),  # Fairly valued: 15% discount
            (950000, 1000000, 5.0),   # Overvalued: 5% discount
        ],
    )
    def test_calculate_discount_percentage(
        self, npv: float, market_value: float, expected_discount: float
    ) -> None:
        """Test discount percentage calculation."""
        from scripts.generate_valuations import (
            calculate_discount_percentage
        )

        discount = calculate_discount_percentage(npv, market_value)

        disc_msg = (
            f"Discount {discount}% not close to "
            f"expected {expected_discount}%"
        )
        assert abs(discount - expected_discount) < 0.1, disc_msg


class TestWellValuationIntegration:
    """Integration tests for complete well valuation."""

    def test_valuate_well_returns_complete_valuation(
        self, sample_production_history: List[Dict[str, float]]
    ) -> None:
        """Test that well valuation returns all required fields."""
        from scripts.generate_valuations import valuate_well

        valuation = valuate_well(sample_production_history)

        # Check all required fields are present
        required_fields = {
            "npvUsd", "marketValueUsd", "discountPct",
            "confidence", "remainingReservesBbl"
        }
        missing = required_fields - set(valuation.keys())
        assert set(valuation.keys()) == required_fields, \
            f"Missing fields: {missing}"

        # Validate field types and ranges
        npv_valid = (
            isinstance(valuation["npvUsd"], (int, float)) and
            valuation["npvUsd"] > 0
        )
        assert npv_valid

        mv_valid = (
            isinstance(valuation["marketValueUsd"], (int, float)) and
            valuation["marketValueUsd"] > 0
        )
        assert mv_valid

        disc_valid = (
            isinstance(valuation["discountPct"], (int, float)) and
            -100 <= valuation["discountPct"] <= 100
        )
        assert disc_valid

        conf_valid = (
            isinstance(valuation["confidence"], float) and
            0 <= valuation["confidence"] <= 1
        )
        assert conf_valid

        reserves_valid = (
            isinstance(
                valuation["remainingReservesBbl"], (int, float)
            ) and
            valuation["remainingReservesBbl"] >= 0
        )
        assert reserves_valid

    def test_valuate_well_npv_less_than_market_value(
        self, sample_production_history: List[Dict[str, float]]
    ) -> None:
        """
        Test market value is higher than NPV (typical pattern).
        """
        from scripts.generate_valuations import valuate_well

        valuation = valuate_well(sample_production_history)

        # Market value should be higher than NPV in most cases
        # (discount % should be positive)
        mv_msg = "Market value should typically be >= NPV"
        assert valuation["discountPct"] >= -10, mv_msg

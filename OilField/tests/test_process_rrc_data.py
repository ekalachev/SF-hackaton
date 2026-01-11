"""
Unit tests for RRC data processing script.
Following TDD approach - tests written first.
"""

import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import pytest
import pandas as pd
import json

from process_rrc_data import RRCDataProcessor


class TestRRCDataProcessor:
    """Test suite for RRC data processing."""

    @pytest.fixture
    def processor(self, tmp_path):
        """Create processor with temporary directories."""
        input_dir = tmp_path / "input"
        output_dir = tmp_path / "output"
        input_dir.mkdir()
        output_dir.mkdir()
        return RRCDataProcessor(input_dir, output_dir)

    @pytest.fixture
    def sample_wells_df(self):
        """Create sample wells DataFrame for testing."""
        return pd.DataFrame(
            [
                {
                    "api": "42423000010002",
                    "well_name": "Brown 76B",
                    "operator": "ConocoPhillips Company",
                    "county": "Smith",
                    "field": "East Texas",
                    "latitude": 32.307503,
                    "longitude": -95.389988,
                    "depth_ft": 11912,
                    "completion_date": "2022-02-02",
                    "status": "Active",
                    "well_type": "Oil",
                    "well_id": 1,
                },
                {
                    "api": "42423000020002",
                    "well_name": "Jackson 293H",
                    "operator": "Occidental Petroleum Corporation",
                    "county": "Smith",
                    "field": "East Texas",
                    "latitude": 32.369798,
                    "longitude": -95.259193,
                    "depth_ft": 12359,
                    "completion_date": "2023-08-27",
                    "status": "Active",
                    "well_type": "Oil",
                    "well_id": 2,
                },
                {
                    "api": "42423000030002",
                    "well_name": "Invalid Well",
                    "operator": "Test Co",
                    "county": "Smith",
                    "field": "East Texas",
                    "latitude": 50.0,  # Invalid - outside Texas
                    "longitude": -95.0,
                    "depth_ft": 10000,
                    "completion_date": "2023-01-01",
                    "status": "Active",
                    "well_type": "Oil",
                    "well_id": 3,
                },
            ]
        )

    @pytest.fixture
    def sample_production_df(self):
        """Create sample production DataFrame for testing."""
        # Create 12 months of production for testing (6+ months required)
        data = []
        for month in range(1, 13):
            data.extend(
                [
                    {
                        "api": "42423000010002",
                        "operator": "ConocoPhillips Company",
                        "year": 2023,
                        "month": month,
                        "oil_bbl": 3215 - month * 50,  # Declining production
                        "gas_mcf": 4407,
                        "water_bbl": 5130,
                        "days_produced": 30,
                    },
                    {
                        "api": "42423000020002",
                        "operator": "Occidental Petroleum Corporation",
                        "year": 2023,
                        "month": month,
                        "oil_bbl": 4500 - month * 30,
                        "gas_mcf": 5000,
                        "water_bbl": 2000,
                        "days_produced": 30,
                    },
                ]
            )
        return pd.DataFrame(data)

    def test_clean_wells_removes_invalid_coordinates(self, processor, sample_wells_df):
        """Test that wells with invalid Texas coordinates are removed."""
        cleaned = processor.clean_wells(sample_wells_df)

        # Should remove the well with latitude 50.0
        assert len(cleaned) == 2
        assert all(cleaned["latitude"] >= 25.8)
        assert all(cleaned["latitude"] <= 36.5)
        assert all(cleaned["longitude"] >= -106.6)
        assert all(cleaned["longitude"] <= -93.5)

    def test_clean_wells_filters_by_status(self, processor, sample_wells_df):
        """Test that only active wells are kept."""
        # Add an inactive well
        inactive_well = sample_wells_df.iloc[0].copy()
        inactive_well["api"] = "42423000040002"
        inactive_well["status"] = "Inactive"
        df_with_inactive = pd.concat(
            [sample_wells_df, pd.DataFrame([inactive_well])], ignore_index=True
        )

        cleaned = processor.clean_wells(df_with_inactive)

        assert all(cleaned["status"] == "Active")

    def test_clean_wells_filters_by_well_type(self, processor, sample_wells_df):
        """Test that only oil wells are kept."""
        # Add a gas well
        gas_well = sample_wells_df.iloc[0].copy()
        gas_well["api"] = "42423000040002"
        gas_well["well_type"] = "Gas"
        df_with_gas = pd.concat(
            [sample_wells_df, pd.DataFrame([gas_well])], ignore_index=True
        )

        cleaned = processor.clean_wells(df_with_gas)

        assert all(cleaned["well_type"] == "Oil")

    def test_clean_production_calculates_daily_rates(
        self, processor, sample_production_df
    ):
        """Test that daily production rates are calculated correctly."""
        cleaned = processor.clean_production(sample_production_df)

        assert "oil_bbl_day" in cleaned.columns
        assert "gas_mcf_day" in cleaned.columns

        # Check calculation for first row: (3215 - 1*50) / 30 = 3165 / 30
        first_row = cleaned.iloc[0]
        expected_oil = (3215 - 1 * 50) / 30
        assert abs(first_row["oil_bbl_day"] - expected_oil) < 0.01

    def test_clean_production_removes_negative_values(
        self, processor, sample_production_df
    ):
        """Test that negative production values are removed."""
        # Add row with negative production
        bad_row = sample_production_df.iloc[0].copy()
        bad_row["oil_bbl"] = -100
        df_with_bad = pd.concat(
            [sample_production_df, pd.DataFrame([bad_row])], ignore_index=True
        )

        cleaned = processor.clean_production(df_with_bad)

        assert all(cleaned["oil_bbl"] >= 0)

    def test_join_production_history(
        self, processor, sample_wells_df, sample_production_df
    ):
        """Test that production history is joined correctly."""
        wells_clean = processor.clean_wells(sample_wells_df)
        production_clean = processor.clean_production(sample_production_df)

        joined = processor.join_production_history(wells_clean, production_clean)

        # Should have production_history column
        assert "production_history" in joined.columns

        # Should have at least one well (6+ months required)
        assert len(joined) >= 1

        # First well should have 12 months of production
        first_well = joined.iloc[0]
        history = first_well["production_history"]
        assert len(history) == 12

    def test_calculate_cumulative_production(
        self, processor, sample_wells_df, sample_production_df
    ):
        """Test cumulative production calculation."""
        wells_clean = processor.clean_wells(sample_wells_df)
        production_clean = processor.clean_production(sample_production_df)

        joined = processor.join_production_history(wells_clean, production_clean)

        # Should have cumulative_oil_bbl column
        assert "cumulative_oil_bbl" in joined.columns

        # Check cumulative production is calculated
        first_well = joined[joined["api"] == "42423000010002"].iloc[0]
        assert first_well["cumulative_oil_bbl"] > 0

    def test_select_diverse_wells(self, processor):
        """Test that well selection creates geographic diversity."""
        # Create wells from different counties with production history
        wells = pd.DataFrame(
            [
                {
                    "api": f"4242300000{i}",
                    "county": county,
                    "current_oil_bbl_day": rate,
                    "latitude": 32.0 + i * 0.1,
                    "longitude": -95.0 - i * 0.1,
                    "status": "Active",
                    "well_type": "Oil",
                    "cumulative_oil_bbl": 100000,
                    "production_history": [
                        {
                            "year": 2023,
                            "month": m,
                            "oil_bbl": 1000,
                            "gas_mcf": 500,
                            "water_bbl": 200,
                            "days_produced": 30,
                        }
                        for m in range(1, 13)
                    ],
                }
                for i, (county, rate) in enumerate(
                    [
                        ("Smith", 100),
                        ("Webb", 200),
                        ("Midland", 150),
                        ("Smith", 80),
                        ("Webb", 250),
                        ("Midland", 120),
                    ]
                )
            ]
        )

        selected = processor.select_demo_wells(wells, target_count=4)

        # Should select from multiple counties
        counties = selected["county"].unique()
        assert len(counties) >= 2

    def test_save_wells_json_format(self, processor, tmp_path):
        """Test that output JSON has correct format."""
        # Create minimal valid DataFrame
        wells = pd.DataFrame(
            [
                {
                    "api": "42423000010002",
                    "well_name": "Test Well",
                    "well_id": 1,
                    "operator": "Test Operator",
                    "county": "Smith",
                    "field": "East Texas",
                    "latitude": 32.307503,
                    "longitude": -95.389988,
                    "depth_ft": 11912,
                    "completion_date": "2022-02-02",
                    "status": "Active",
                    "current_oil_bbl_day": 107.17,
                    "cumulative_oil_bbl": 5501,
                    "cumulative_gas_mcf": 10000,
                    "cumulative_water_bbl": 8000,
                    "decline_rate": 0.15,
                    "production_history": [
                        {
                            "year": 2023,
                            "month": 1,
                            "oil_bbl": 3215,
                            "gas_mcf": 4407,
                            "water_bbl": 1000,
                            "days_produced": 30,
                        },
                        {
                            "year": 2023,
                            "month": 2,
                            "oil_bbl": 2286,
                            "gas_mcf": 3268,
                            "water_bbl": 900,
                            "days_produced": 30,
                        },
                    ],
                }
            ]
        )

        processor.output_dir = tmp_path
        processor.save_wells_json(wells)

        # Check file exists
        output_file = tmp_path / "wells.json"
        assert output_file.exists()

        # Check JSON structure
        with open(output_file, "r") as f:
            data = json.load(f)

        assert isinstance(data, list)
        assert len(data) == 1

        well = data[0]
        assert "id" in well
        assert "name" in well
        assert "operator" in well
        assert "location" in well
        assert "status" in well
        assert "production" in well
        assert "production_history" in well

        # Check nested structure
        assert "latitude" in well["location"]
        assert "longitude" in well["location"]
        assert "county" in well["location"]

        assert "current_bbl_day" in well["production"]
        assert "cumulative_bbl" in well["production"]

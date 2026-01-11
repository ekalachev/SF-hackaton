#!/usr/bin/env python3
"""
Process and clean RRC well data.

This script loads raw RRC data, cleans it, selects demo wells,
and outputs to JSON format for the application.

Following TDD, SOLID, KISS, DRY, and YAGNI principles.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
import logging
from typing import List, Dict, Any
import argparse


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class RRCDataProcessor:
    """
    Process RRC well data following Single Responsibility Principle.
    Each method has one clear purpose.
    """

    # Texas coordinate bounds for validation
    TEXAS_LAT_MIN = 25.8
    TEXAS_LAT_MAX = 36.5
    TEXAS_LNG_MIN = -106.6
    TEXAS_LNG_MAX = -93.5

    def __init__(self, input_dir: Path, output_dir: Path):
        """
        Initialize data processor.

        Args:
            input_dir: Directory containing raw CSV files
            output_dir: Directory for processed output
        """
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True, parents=True)

    def process_all(self) -> None:
        """
        Main processing pipeline.
        Orchestrates all data processing steps.
        """
        logger.info("Starting RRC data processing...")

        # Load data
        logger.info("Loading data files...")
        wells = self.load_wells()
        production = self.load_production()
        logger.info(
            f"Loaded {len(wells)} wells and {len(production)} production records"
        )

        # Clean data
        logger.info("Cleaning data...")
        wells_clean = self.clean_wells(wells)
        production_clean = self.clean_production(production)
        logger.info(
            f"After cleaning: {len(wells_clean)} wells, {len(production_clean)} production records"
        )

        # Join production history
        logger.info("Joining production history...")
        wells_with_history = self.join_production_history(wells_clean, production_clean)
        logger.info(f"Wells with production history: {len(wells_with_history)}")

        # Select demo wells
        logger.info("Selecting demo wells...")
        demo_wells = self.select_demo_wells(wells_with_history, target_count=25)
        logger.info(f"Selected {len(demo_wells)} demo wells")

        # Save output
        logger.info("Saving output...")
        self.save_wells_json(demo_wells)
        logger.info(
            f"Saved {len(demo_wells)} wells to {self.output_dir / 'wells.json'}"
        )

        logger.info("Processing complete!")

    def load_wells(self) -> pd.DataFrame:
        """
        Load wells CSV file.

        Returns:
            DataFrame with well data
        """
        file_path = self.input_dir / "wells.csv"
        if not file_path.exists():
            raise FileNotFoundError(f"Wells file not found: {file_path}")

        df = pd.read_csv(file_path)
        logger.debug(f"Loaded {len(df)} wells from {file_path}")
        return df

    def load_production(self) -> pd.DataFrame:
        """
        Load and combine production CSV files for 2023 and 2024.

        Returns:
            Combined DataFrame with production data
        """
        dfs = []

        for year in [2023, 2024]:
            file_path = self.input_dir / f"production_{year}.csv"
            if file_path.exists():
                df = pd.read_csv(file_path)
                logger.debug(f"Loaded {len(df)} production records from {file_path}")
                dfs.append(df)
            else:
                logger.warning(f"Production file not found: {file_path}")

        if not dfs:
            raise FileNotFoundError("No production files found")

        combined = pd.concat(dfs, ignore_index=True)
        logger.debug(f"Combined {len(combined)} total production records")
        return combined

    def clean_wells(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and filter wells data.

        Filters:
        - Active status only
        - Oil wells only
        - Valid Texas coordinates
        - Non-null coordinates

        Args:
            df: Raw wells DataFrame

        Returns:
            Cleaned DataFrame
        """
        original_count = len(df)

        # Filter by status
        df = df[df["status"] == "Active"].copy()
        logger.debug(
            f"After status filter: {len(df)} wells (removed {original_count - len(df)})"
        )

        # Filter by well type
        df = df[df["well_type"] == "Oil"].copy()
        logger.debug(f"After well_type filter: {len(df)} wells")

        # Remove wells without coordinates
        df = df.dropna(subset=["latitude", "longitude"]).copy()
        logger.debug(f"After removing nulls: {len(df)} wells")

        # Validate coordinates (Texas bounds)
        df = df[
            (df["latitude"] >= self.TEXAS_LAT_MIN)
            & (df["latitude"] <= self.TEXAS_LAT_MAX)
            & (df["longitude"] >= self.TEXAS_LNG_MIN)
            & (df["longitude"] <= self.TEXAS_LNG_MAX)
        ].copy()
        logger.debug(f"After coordinate validation: {len(df)} wells")

        return df

    def clean_production(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and enhance production data.

        - Remove negative production values
        - Remove zero days_produced
        - Calculate daily rates

        Args:
            df: Raw production DataFrame

        Returns:
            Cleaned DataFrame with daily rates
        """
        original_count = len(df)

        # Remove invalid production
        df = df[df["oil_bbl"] >= 0].copy()
        df = df[df["days_produced"] > 0].copy()
        logger.debug(
            f"After removing invalid production: {len(df)} records (removed {original_count - len(df)})"
        )

        # Calculate daily rates
        df["oil_bbl_day"] = df["oil_bbl"] / df["days_produced"]
        df["gas_mcf_day"] = df["gas_mcf"] / df["days_produced"]
        df["water_bbl_day"] = df["water_bbl"] / df["days_produced"]

        return df

    def join_production_history(
        self, wells: pd.DataFrame, production: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Join production history to wells.

        Creates:
        - cumulative_oil_bbl: Total oil produced
        - current_oil_bbl_day: Most recent daily rate
        - production_history: Array of last 24 months (or available months)

        Args:
            wells: Cleaned wells DataFrame
            production: Cleaned production DataFrame

        Returns:
            Wells DataFrame with production data
        """
        # Calculate aggregates per well
        prod_agg = (
            production.groupby("api")
            .agg(
                {
                    "oil_bbl": "sum",
                    "oil_bbl_day": "last",
                    "gas_mcf": "sum",
                    "water_bbl": "sum",
                }
            )
            .rename(
                columns={
                    "oil_bbl": "cumulative_oil_bbl",
                    "oil_bbl_day": "current_oil_bbl_day",
                    "gas_mcf": "cumulative_gas_mcf",
                    "water_bbl": "cumulative_water_bbl",
                }
            )
            .reset_index()
        )

        # Join aggregates
        wells_with_prod = wells.merge(prod_agg, on="api", how="inner")
        logger.debug(f"After join: {len(wells_with_prod)} wells have production data")

        # Add production history as nested list
        def get_history(api: str) -> List[Dict[str, Any]]:
            """Get last 24 months of production for a well."""
            well_prod = production[production["api"] == api].copy()

            # Sort by year and month descending
            well_prod = well_prod.sort_values(["year", "month"], ascending=False)

            # Take last 24 months
            well_prod = well_prod.head(24)

            # Convert to list of dicts
            history = well_prod[
                ["year", "month", "oil_bbl", "gas_mcf", "water_bbl", "days_produced"]
            ].to_dict("records")
            return history

        wells_with_prod["production_history"] = wells_with_prod["api"].apply(get_history)

        # Filter out wells with insufficient production data
        min_months = 6
        wells_with_prod = wells_with_prod[
            wells_with_prod["production_history"].apply(len) >= min_months
        ].copy()
        logger.debug(
            f"After filtering for {min_months}+ months: {len(wells_with_prod)} wells"
        )

        return wells_with_prod

    def select_demo_wells(
        self, wells: pd.DataFrame, target_count: int = 25
    ) -> pd.DataFrame:
        """
        Select diverse demo wells for the application.

        Selection criteria:
        - Geographic diversity (all counties represented)
        - Production variety (high, medium, low)
        - Range of decline rates (varied production patterns)

        Args:
            wells: Wells with production data
            target_count: Number of wells to select (20-30)

        Returns:
            Selected wells DataFrame
        """
        if len(wells) <= target_count:
            logger.info(
                f"All {len(wells)} wells selected (less than target {target_count})"
            )
            return wells

        # Calculate production percentiles for stratification
        wells = wells.copy()
        wells["prod_percentile"] = pd.qcut(
            wells["current_oil_bbl_day"],
            q=3,
            labels=["low", "medium", "high"],
            duplicates="drop",
        )

        # Calculate decline rate (simple approximation)
        def calc_decline_rate(history: List[Dict]) -> float:
            """Estimate decline rate from production history."""
            if len(history) < 6:
                return 0.0

            # Sort by year/month
            sorted_history = sorted(history, key=lambda x: (x["year"], x["month"]))

            # Compare first 3 months avg to last 3 months avg
            first_avg = np.mean(
                [h["oil_bbl"] / h["days_produced"] for h in sorted_history[:3]]
            )
            last_avg = np.mean(
                [h["oil_bbl"] / h["days_produced"] for h in sorted_history[-3:]]
            )

            if first_avg == 0:
                return 0.0

            decline = (first_avg - last_avg) / first_avg
            return decline

        wells["decline_rate"] = wells["production_history"].apply(calc_decline_rate)

        # Select wells ensuring diversity
        selected = []

        # Get counties and ensure representation
        counties = wells["county"].unique()
        wells_per_county = max(3, target_count // len(counties))

        for county in counties:
            county_wells = wells[wells["county"] == county]

            # Select mix of production levels
            for prod_level in ["low", "medium", "high"]:
                level_wells = county_wells[
                    county_wells["prod_percentile"] == prod_level
                ]

                if len(level_wells) > 0:
                    # Sample based on availability
                    n_samples = min(wells_per_county // 3, len(level_wells))
                    if n_samples > 0:
                        samples = level_wells.sample(n=n_samples, random_state=42)
                        selected.append(samples)

        # Combine selections
        if selected:
            demo_wells = pd.concat(selected, ignore_index=True)
        else:
            # Fallback: random sample
            demo_wells = wells.sample(n=min(target_count, len(wells)), random_state=42)

        # Ensure we hit target count (or close to it)
        if len(demo_wells) < target_count and len(demo_wells) < len(wells):
            # Add more wells randomly
            remaining = wells[~wells["api"].isin(demo_wells["api"])]
            n_more = min(target_count - len(demo_wells), len(remaining))
            more_wells = remaining.sample(n=n_more, random_state=42)
            demo_wells = pd.concat([demo_wells, more_wells], ignore_index=True)

        # Trim if too many
        if len(demo_wells) > target_count:
            demo_wells = demo_wells.sample(n=target_count, random_state=42)

        logger.info(f"Selected {len(demo_wells)} wells from {len(counties)} counties")
        prod_min = demo_wells["current_oil_bbl_day"].min()
        prod_max = demo_wells["current_oil_bbl_day"].max()
        logger.info(f"Production range: {prod_min:.1f} - {prod_max:.1f} bbl/day")
        logger.info(f"Counties: {sorted(demo_wells['county'].unique())}")

        return demo_wells

    def save_wells_json(self, wells: pd.DataFrame) -> None:
        """
        Save wells to JSON format matching MVP schema.

        Schema per MVP_SCOPE.md lines 181-217:
        - id, name, operator, location, status, production, production_history

        Args:
            wells: Wells DataFrame to save
        """
        wells_json = []

        for idx, well in wells.iterrows():
            well_dict = {
                "id": f"TX-{well['well_id']:04d}",
                "name": well["well_name"],
                "operator": well["operator"],
                "location": {
                    "latitude": float(well["latitude"]),
                    "longitude": float(well["longitude"]),
                    "county": well["county"],
                    "state": "TX",
                    "field": well["field"],
                },
                "status": well["status"].lower(),
                "attributes": {
                    "completion_date": str(well["completion_date"]),
                    "depth_ft": (int(well["depth_ft"]) if pd.notna(well["depth_ft"]) else None),
                    "api_number": well["api"],
                },
                "production": {
                    "current_bbl_day": float(well["current_oil_bbl_day"]),
                    "cumulative_bbl": float(well["cumulative_oil_bbl"]),
                    "cumulative_gas_mcf": float(well["cumulative_gas_mcf"]),
                    "cumulative_water_bbl": float(well["cumulative_water_bbl"]),
                    "decline_rate": (
                        float(well["decline_rate"])
                        if pd.notna(well["decline_rate"])
                        else 0.0
                    ),
                },
                "production_history": [
                    {
                        "date": f"{h['year']}-{h['month']:02d}",
                        "oil_bbl": float(h["oil_bbl"]),
                        "gas_mcf": float(h["gas_mcf"]),
                        "water_bbl": float(h["water_bbl"]),
                        "days_produced": int(h["days_produced"]),
                    }
                    for h in well["production_history"]
                ],
                "valuation": None,  # Will be added in Task 103
            }

            wells_json.append(well_dict)

        # Save to file
        output_file = self.output_dir / "wells.json"
        with open(output_file, "w") as f:
            json.dump(wells_json, f, indent=2)

        logger.info(f"Saved {len(wells_json)} wells to {output_file}")


def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(description="Process RRC well data")
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("data/raw"),
        help="Input directory with raw CSV files",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/processed"),
        help="Output directory for processed JSON",
    )
    parser.add_argument(
        "--target-wells",
        type=int,
        default=25,
        help="Target number of wells to select (20-30)",
    )

    args = parser.parse_args()

    # Validate target count
    if not 20 <= args.target_wells <= 30:
        logger.warning(
            f"Target wells {args.target_wells} outside recommended range 20-30"
        )

    # Process data
    processor = RRCDataProcessor(args.input_dir, args.output_dir)
    processor.process_all()


if __name__ == "__main__":
    main()

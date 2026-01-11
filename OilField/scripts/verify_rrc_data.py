#!/usr/bin/env python3
"""
Verify the quality and structure of generated Texas RRC data.

This script validates:
- File existence and structure
- Data integrity and consistency
- Schema compliance
- Production data patterns
- Geographic distribution
"""

import csv
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import sys

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "raw"

# Expected schemas
WELLS_SCHEMA = [
    "api", "well_name", "operator", "county", "field", "latitude",
    "longitude", "depth_ft", "completion_date", "status", "well_type", "well_id"
]

PRODUCTION_SCHEMA = [
    "api", "operator", "year", "month", "oil_bbl", "gas_mcf",
    "water_bbl", "days_produced"
]

OPERATORS_SCHEMA = [
    "operator_number", "operator_name", "address", "city", "state",
    "zip", "contact_phone", "status"
]

TARGET_COUNTIES = ["Smith", "Midland", "Webb", "Karnes", "Reeves"]


def read_csv(filepath: Path) -> list:
    """Read CSV file and return data as list of dictionaries."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def validate_file_exists(filename: str) -> bool:
    """Check if required file exists."""
    filepath = DATA_DIR / filename
    exists = filepath.exists()
    size_mb = filepath.stat().st_size / (1024 * 1024) if exists else 0

    status = "✓" if exists else "✗"
    print(f"  {status} {filename}: {size_mb:.2f} MB" if exists else f"  {status} {filename}: NOT FOUND")

    return exists


def validate_schema(data: list, expected_schema: list, filename: str) -> bool:
    """Validate that CSV has expected columns."""
    if not data:
        print(f"  ✗ {filename}: Empty file")
        return False

    actual_schema = list(data[0].keys())

    if actual_schema != expected_schema:
        print(f"  ✗ {filename}: Schema mismatch")
        print(f"    Expected: {expected_schema}")
        print(f"    Got: {actual_schema}")
        return False

    print(f"  ✓ {filename}: Schema valid ({len(data):,} records)")
    return True


def validate_wells_data(wells: list) -> dict:
    """Validate wells data and return statistics."""
    stats = {
        "total_wells": len(wells),
        "counties": defaultdict(int),
        "operators": set(),
        "statuses": defaultdict(int),
        "coord_errors": 0,
        "depth_errors": 0
    }

    for well in wells:
        # Count by county
        stats["counties"][well["county"]] += 1

        # Track operators
        stats["operators"].add(well["operator"])

        # Count by status
        stats["statuses"][well["status"]] += 1

        # Validate coordinates
        try:
            lat = float(well["latitude"])
            lng = float(well["longitude"])
            if not (25 <= lat <= 37) or not (-107 <= lng <= -93):
                stats["coord_errors"] += 1
        except (ValueError, KeyError):
            stats["coord_errors"] += 1

        # Validate depth
        try:
            depth = int(well["depth_ft"])
            if depth < 0 or depth > 30000:
                stats["depth_errors"] += 1
        except (ValueError, KeyError):
            stats["depth_errors"] += 1

    return stats


def validate_production_data(production: list, wells: list, year: int) -> dict:
    """Validate production data and return statistics."""
    stats = {
        "total_records": len(production),
        "wells_with_production": set(),
        "total_oil_bbl": 0,
        "total_gas_mcf": 0,
        "months_coverage": defaultdict(int),
        "negative_values": 0,
        "missing_api": 0
    }

    # Create API lookup
    valid_apis = {w["api"] for w in wells}

    for record in production:
        # Check API exists
        api = record.get("api", "")
        if api not in valid_apis:
            stats["missing_api"] += 1
            continue

        stats["wells_with_production"].add(api)

        # Validate year/month
        try:
            rec_year = int(record["year"])
            month = int(record["month"])
            if rec_year != year:
                print(f"  ⚠ Wrong year in production_{year}.csv: {rec_year}")
            stats["months_coverage"][month] += 1
        except (ValueError, KeyError):
            pass

        # Sum production
        try:
            oil = int(record["oil_bbl"])
            gas = int(record["gas_mcf"])

            if oil < 0 or gas < 0:
                stats["negative_values"] += 1
            else:
                stats["total_oil_bbl"] += oil
                stats["total_gas_mcf"] += gas
        except (ValueError, KeyError):
            stats["negative_values"] += 1

    return stats


def validate_operators_data(operators: list, wells: list) -> dict:
    """Validate operators data."""
    stats = {
        "total_operators": len(operators),
        "operators_with_wells": 0,
        "missing_fields": 0
    }

    operator_names = {op["operator_name"] for op in operators}
    well_operators = {well["operator"] for well in wells}

    # Check how many well operators are in the operators list
    stats["operators_with_wells"] = len(operator_names.intersection(well_operators))

    # Check for missing fields
    for op in operators:
        if not all(op.get(field) for field in OPERATORS_SCHEMA):
            stats["missing_fields"] += 1

    return stats


def print_section(title: str):
    """Print formatted section header."""
    print(f"\n{'=' * 60}")
    print(f"{title}")
    print(f"{'=' * 60}")


def main():
    """Main verification function."""
    print_section("Texas RRC Data Verification")

    all_valid = True

    # Check file existence
    print("\n📁 File Existence Check:")
    files_exist = {
        "wells.csv": validate_file_exists("wells.csv"),
        "production_2023.csv": validate_file_exists("production_2023.csv"),
        "production_2024.csv": validate_file_exists("production_2024.csv"),
        "operators.csv": validate_file_exists("operators.csv")
    }

    if not all(files_exist.values()):
        print("\n❌ FAILED: Missing required files")
        return 1

    # Load data
    print("\n📊 Loading data...")
    wells = read_csv(DATA_DIR / "wells.csv")
    production_2023 = read_csv(DATA_DIR / "production_2023.csv")
    production_2024 = read_csv(DATA_DIR / "production_2024.csv")
    operators = read_csv(DATA_DIR / "operators.csv")

    # Validate schemas
    print("\n🔍 Schema Validation:")
    schema_valid = all([
        validate_schema(wells, WELLS_SCHEMA, "wells.csv"),
        validate_schema(production_2023, PRODUCTION_SCHEMA, "production_2023.csv"),
        validate_schema(production_2024, PRODUCTION_SCHEMA, "production_2024.csv"),
        validate_schema(operators, OPERATORS_SCHEMA, "operators.csv")
    ])

    if not schema_valid:
        all_valid = False

    # Validate wells data
    print("\n🎯 Wells Data Validation:")
    wells_stats = validate_wells_data(wells)

    print(f"  Total wells: {wells_stats['total_wells']}")
    print(f"  Unique operators: {len(wells_stats['operators'])}")

    print(f"\n  County breakdown:")
    for county in TARGET_COUNTIES:
        count = wells_stats['counties'][county]
        status = "✓" if count > 0 else "✗"
        print(f"    {status} {county}: {count} wells")

    print(f"\n  Status breakdown:")
    for status, count in wells_stats['statuses'].items():
        print(f"    - {status}: {count} wells")

    if wells_stats['coord_errors'] > 0:
        print(f"  ⚠ Coordinate errors: {wells_stats['coord_errors']}")
        all_valid = False

    if wells_stats['depth_errors'] > 0:
        print(f"  ⚠ Depth errors: {wells_stats['depth_errors']}")
        all_valid = False

    # Validate production data
    print("\n📈 Production Data Validation (2023):")
    prod_2023_stats = validate_production_data(production_2023, wells, 2023)

    print(f"  Total records: {prod_2023_stats['total_records']:,}")
    print(f"  Wells with production: {len(prod_2023_stats['wells_with_production'])}")
    print(f"  Total oil produced: {prod_2023_stats['total_oil_bbl']:,.0f} BBL")
    print(f"  Total gas produced: {prod_2023_stats['total_gas_mcf']:,.0f} MCF")

    print(f"\n  Month coverage:")
    for month in sorted(prod_2023_stats['months_coverage'].keys()):
        count = prod_2023_stats['months_coverage'][month]
        print(f"    - Month {month}: {count} records")

    if prod_2023_stats['negative_values'] > 0:
        print(f"  ⚠ Negative values: {prod_2023_stats['negative_values']}")
        all_valid = False

    if prod_2023_stats['missing_api'] > 0:
        print(f"  ⚠ Missing/invalid APIs: {prod_2023_stats['missing_api']}")
        all_valid = False

    print("\n📈 Production Data Validation (2024):")
    prod_2024_stats = validate_production_data(production_2024, wells, 2024)

    print(f"  Total records: {prod_2024_stats['total_records']:,}")
    print(f"  Wells with production: {len(prod_2024_stats['wells_with_production'])}")
    print(f"  Total oil produced: {prod_2024_stats['total_oil_bbl']:,.0f} BBL")
    print(f"  Total gas produced: {prod_2024_stats['total_gas_mcf']:,.0f} MCF")

    print(f"\n  Month coverage:")
    for month in sorted(prod_2024_stats['months_coverage'].keys()):
        count = prod_2024_stats['months_coverage'][month]
        print(f"    - Month {month}: {count} records")

    if prod_2024_stats['negative_values'] > 0:
        print(f"  ⚠ Negative values: {prod_2024_stats['negative_values']}")
        all_valid = False

    if prod_2024_stats['missing_api'] > 0:
        print(f"  ⚠ Missing/invalid APIs: {prod_2024_stats['missing_api']}")
        all_valid = False

    # Validate operators
    print("\n🏢 Operators Data Validation:")
    op_stats = validate_operators_data(operators, wells)

    print(f"  Total operators: {op_stats['total_operators']}")
    print(f"  Operators with wells: {op_stats['operators_with_wells']}")

    if op_stats['missing_fields'] > 0:
        print(f"  ⚠ Operators with missing fields: {op_stats['missing_fields']}")
        all_valid = False

    # Final summary
    print_section("Summary")

    total_size_mb = sum(f.stat().st_size for f in DATA_DIR.glob("*.csv")) / (1024 * 1024)

    checks = [
        ("Well count in range (200-500)", 200 <= wells_stats['total_wells'] <= 500),
        ("All target counties present", all(wells_stats['counties'][c] > 0 for c in TARGET_COUNTIES)),
        ("Total size ≤ 500 MB", total_size_mb <= 500),
        ("Schema compliance", schema_valid),
        ("No data integrity issues", all_valid),
        ("24 months coverage", len(prod_2023_stats['months_coverage']) == 12)
    ]

    print()
    for check_name, passed in checks:
        status = "✓" if passed else "✗"
        print(f"{status} {check_name}")

    print(f"\nTotal data size: {total_size_mb:.2f} MB")

    if all(passed for _, passed in checks):
        print("\n✅ All validations passed!")
        return 0
    else:
        print("\n⚠️  Some validations failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())

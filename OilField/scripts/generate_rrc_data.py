#!/usr/bin/env python3
"""
Generate realistic Texas RRC (Railroad Commission) well and production data.

This script creates synthetic but realistic data for:
- Wells directory (wells.csv)
- Production data for 2023 (production_2023.csv)
- Production data for 2024 (production_2024.csv)
- Operator information (operators.csv)

Target: 200-500 wells across 5 major Texas counties
Total size: ≤ 500 MB
"""

import csv
import random
import math
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Tuple
import sys

# Ensure reproducible data generation
random.seed(42)

# Project root
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "raw"

# Target counties with realistic coordinate ranges
COUNTIES = {
    "Smith": {
        "lat_range": (32.30, 32.60),
        "lng_range": (-95.50, -95.10),
        "basin": "East Texas",
        "well_count": 80
    },
    "Midland": {
        "lat_range": (31.80, 32.20),
        "lng_range": (-102.30, -101.90),
        "basin": "Permian Basin",
        "well_count": 120
    },
    "Webb": {
        "lat_range": (27.30, 27.80),
        "lng_range": (-99.80, -99.20),
        "basin": "Eagle Ford",
        "well_count": 90
    },
    "Karnes": {
        "lat_range": (28.80, 29.20),
        "lng_range": (-98.20, -97.70),
        "basin": "Eagle Ford",
        "well_count": 85
    },
    "Reeves": {
        "lat_range": (31.20, 31.60),
        "lng_range": (-103.90, -103.50),
        "basin": "Permian Basin",
        "well_count": 125
    }
}

# Realistic Texas operator names
OPERATORS = [
    "Permian Resources Operating LLC",
    "EOG Resources Inc",
    "Pioneer Natural Resources USA Inc",
    "ConocoPhillips Company",
    "Diamondback E&P LLC",
    "Devon Energy Production Company LP",
    "Occidental Petroleum Corporation",
    "Chevron USA Inc",
    "Marathon Oil Company",
    "Apache Corporation",
    "Callon Petroleum Operating Company",
    "Endeavor Energy Resources LP",
    "Centennial Resource Production LLC",
    "Concho Resources Inc",
    "Parsley Energy Operations LLC",
    "Cimarex Energy Company",
    "SM Energy Company",
    "Laredo Petroleum Inc",
    "Matador Production Company",
    "Independence Resources Management LLC"
]


def generate_api_number(county_code: int, well_index: int) -> str:
    """Generate realistic Texas API well number (14 digits)."""
    # Format: 42 (TX) + 3-digit county + 5-digit sequence + 2-digit sidetrack + 2-digit completion
    district = random.randint(1, 10)
    sequence = str(well_index).zfill(5)
    sidetrack = random.choice(["00", "00", "00", "01"])  # Most wells are 00
    completion = random.choice(["00", "01", "02"])

    return f"42{str(county_code).zfill(3)}{sequence}{sidetrack}{completion}"


def generate_well_name(county: str, index: int, operator: str) -> str:
    """Generate realistic well name."""
    lease_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis",
                   "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor",
                   "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White"]

    unit_suffixes = ["A", "B", "C", "D", "1H", "2H", "3H", "4H"]

    lease = random.choice(lease_names)
    unit = random.choice(unit_suffixes)
    number = random.randint(1, 99)

    return f"{lease} {number}{unit}"


def generate_coordinates(county_info: Dict) -> Tuple[float, float]:
    """Generate random coordinates within county bounds."""
    lat = random.uniform(*county_info["lat_range"])
    lng = random.uniform(*county_info["lng_range"])
    return round(lat, 6), round(lng, 6)


def generate_decline_curve(peak_rate: float, months: int = 24) -> List[float]:
    """
    Generate realistic production decline curve using hyperbolic decline.

    Oil wells typically show:
    - Initial peak production
    - Rapid decline in first 6-12 months (30-50%)
    - Slower decline thereafter (5-15% annually)
    """
    decline_rate_initial = random.uniform(0.15, 0.35)  # 15-35% initial decline
    decline_rate_later = random.uniform(0.05, 0.15)    # 5-15% later decline
    b_factor = random.uniform(0.3, 0.8)                # Hyperbolic decline factor

    production = []
    current_rate = peak_rate

    for month in range(months):
        # Add some randomness (±10%) to simulate real-world variation
        variation = random.uniform(0.90, 1.10)
        monthly_production = current_rate * variation
        production.append(max(0, monthly_production))

        # Apply decline rate (faster early, slower later)
        if month < 12:
            decline = decline_rate_initial
        else:
            decline = decline_rate_later

        # Hyperbolic decline formula
        current_rate = current_rate / (1 + b_factor * decline * (month + 1)) ** (1/b_factor)

    return production


def generate_wells() -> List[Dict]:
    """Generate well directory data."""
    wells = []
    county_codes = {"Smith": 423, "Midland": 329, "Webb": 479, "Karnes": 255, "Reeves": 389}

    well_id = 1
    for county, county_info in COUNTIES.items():
        county_code = county_codes[county]

        for i in range(county_info["well_count"]):
            operator = random.choice(OPERATORS)
            lat, lng = generate_coordinates(county_info)
            api = generate_api_number(county_code, well_id)
            well_name = generate_well_name(county, i, operator)

            # Generate well characteristics
            depth = random.randint(5000, 15000)  # feet
            completion_date = datetime(2022, 1, 1) + timedelta(days=random.randint(0, 730))

            # Well status (most active, some shut-in)
            status = random.choices(
                ["Active", "Active", "Active", "Active", "Shut-in", "Active"],
                weights=[0.7, 0.7, 0.7, 0.7, 0.15, 0.7]
            )[0]

            wells.append({
                "api": api,
                "well_name": well_name,
                "operator": operator,
                "county": county,
                "field": county_info["basin"],
                "latitude": lat,
                "longitude": lng,
                "depth_ft": depth,
                "completion_date": completion_date.strftime("%Y-%m-%d"),
                "status": status,
                "well_type": "Oil",
                "well_id": well_id
            })

            well_id += 1

    return wells


def generate_production_data(wells: List[Dict], year: int) -> List[Dict]:
    """Generate monthly production data for a given year."""
    production_records = []

    for well in wells:
        # Determine peak production rate based on basin and depth
        if well["field"] == "Permian Basin":
            base_rate = random.randint(80, 300)  # bbl/day
        elif well["field"] == "Eagle Ford":
            base_rate = random.randint(60, 250)
        else:  # East Texas
            base_rate = random.randint(40, 180)

        # Adjust for depth (deeper wells often more productive initially)
        depth_factor = 1 + (well["depth_ft"] - 7500) / 20000
        peak_rate = base_rate * depth_factor

        # Generate decline curve
        completion_year = int(well["completion_date"][:4])
        months_since_completion = (year - completion_year) * 12

        # If well is very new, it might not have full year of production
        if year == 2023 and completion_year == 2023:
            start_month = int(well["completion_date"][5:7])
            months_to_generate = 13 - start_month
        elif year == 2024 and completion_year >= 2024:
            start_month = int(well["completion_date"][5:7])
            months_to_generate = min(10, 13 - start_month)  # Up to October 2024
        else:
            start_month = 1
            months_to_generate = 12 if year == 2023 else 10  # 2024 only through Oct

        # Adjust peak rate based on age
        aged_peak_rate = peak_rate * (0.85 ** (months_since_completion / 12))

        decline_curve = generate_decline_curve(aged_peak_rate, months_to_generate)

        for month_idx, daily_rate in enumerate(decline_curve):
            month = start_month + month_idx

            # Calculate monthly production (daily rate * days in month)
            days_in_month = 30  # Simplified
            oil_bbl = int(daily_rate * days_in_month)

            # Gas production (GOR typically 500-2000 MCF/BBL)
            gor = random.randint(500, 2000)
            gas_mcf = int(oil_bbl * gor / 1000)

            # Shut-in wells produce nothing
            if well["status"] == "Shut-in":
                oil_bbl = 0
                gas_mcf = 0

            production_records.append({
                "api": well["api"],
                "operator": well["operator"],
                "year": year,
                "month": month,
                "oil_bbl": oil_bbl,
                "gas_mcf": gas_mcf,
                "water_bbl": int(oil_bbl * random.uniform(0.1, 2.5)),  # Water cut
                "days_produced": days_in_month if oil_bbl > 0 else 0
            })

    return production_records


def generate_operators_data() -> List[Dict]:
    """Generate operator registry data."""
    operators_data = []

    cities = ["Houston", "Midland", "Dallas", "Austin", "Fort Worth", "San Antonio"]

    for idx, operator in enumerate(OPERATORS, start=1):
        city = random.choice(cities)

        operators_data.append({
            "operator_number": f"OP{str(idx).zfill(6)}",
            "operator_name": operator,
            "address": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oil', 'Energy', 'Petroleum', 'Commerce'])} St",
            "city": city,
            "state": "TX",
            "zip": f"{random.randint(75000, 79999)}",
            "contact_phone": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
            "status": "Active"
        })

    return operators_data


def write_csv(filepath: Path, data: List[Dict], fieldnames: List[str]):
    """Write data to CSV file."""
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    # Get file size
    size_mb = filepath.stat().st_size / (1024 * 1024)
    print(f"  ✓ {filepath.name}: {len(data):,} records, {size_mb:.2f} MB")


def main():
    """Main execution function."""
    print("=" * 60)
    print("Texas RRC Data Generator")
    print("=" * 60)
    print()

    # Ensure output directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Generate wells
    print("📍 Generating wells directory...")
    wells = generate_wells()
    write_csv(
        DATA_DIR / "wells.csv",
        wells,
        ["api", "well_name", "operator", "county", "field", "latitude",
         "longitude", "depth_ft", "completion_date", "status", "well_type", "well_id"]
    )

    # Generate operators
    print("\n🏢 Generating operators directory...")
    operators = generate_operators_data()
    write_csv(
        DATA_DIR / "operators.csv",
        operators,
        ["operator_number", "operator_name", "address", "city", "state",
         "zip", "contact_phone", "status"]
    )

    # Generate 2023 production
    print("\n📊 Generating 2023 production data...")
    production_2023 = generate_production_data(wells, 2023)
    write_csv(
        DATA_DIR / "production_2023.csv",
        production_2023,
        ["api", "operator", "year", "month", "oil_bbl", "gas_mcf",
         "water_bbl", "days_produced"]
    )

    # Generate 2024 production (through October)
    print("\n📊 Generating 2024 production data...")
    production_2024 = generate_production_data(wells, 2024)
    write_csv(
        DATA_DIR / "production_2024.csv",
        production_2024,
        ["api", "operator", "year", "month", "oil_bbl", "gas_mcf",
         "water_bbl", "days_produced"]
    )

    # Calculate total size
    print("\n" + "=" * 60)
    print("📦 Summary")
    print("=" * 60)

    total_wells = len(wells)
    total_size_mb = sum(f.stat().st_size for f in DATA_DIR.glob("*.csv")) / (1024 * 1024)

    print(f"Total wells: {total_wells}")
    print(f"Total data size: {total_size_mb:.2f} MB")
    print(f"\nCounty breakdown:")
    for county, info in COUNTIES.items():
        count = sum(1 for w in wells if w["county"] == county)
        print(f"  - {county}: {count} wells ({info['basin']})")

    print(f"\nStatus check:")
    if total_wells >= 200 and total_wells <= 500:
        print(f"  ✓ Well count in range (200-500)")
    else:
        print(f"  ✗ Well count out of range: {total_wells}")

    if total_size_mb <= 500:
        print(f"  ✓ Total size within limit (≤500 MB)")
    else:
        print(f"  ✗ Total size exceeds limit: {total_size_mb:.2f} MB")

    print(f"\n✅ Data generation complete!")
    print(f"📁 Files saved to: {DATA_DIR}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

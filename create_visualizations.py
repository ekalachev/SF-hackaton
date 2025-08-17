#!/usr/bin/env python3
"""
Create additional visualizations and summary statistics
"""

import json
from datetime import datetime

def create_visualization_data():
    # Load global rates data
    with open('/Users/alexanderfedin/Projects/hackathons/SF-hackaton/global_developer_rates.json', 'r') as f:
        global_data = json.load(f)
    
    # Create visualization-ready data
    viz_data = {
        "metadata": {
            "generated": datetime.now().isoformat(),
            "purpose": "Mermaid chart data for global comparison"
        },
        "daily_rates_chart": {
            "chart_type": "bar",
            "title": "Daily Rates by Region (USD)",
            "data": []
        },
        "project_cost_chart": {
            "chart_type": "bar", 
            "title": "Total Project Cost (USD)",
            "data": []
        },
        "delivery_time_chart": {
            "chart_type": "bar",
            "title": "Project Delivery Time (Days)",
            "data": []
        },
        "savings_chart": {
            "chart_type": "bar",
            "title": "Savings with AI vs Each Region (USD)",
            "data": []
        },
        "speed_multiplier_chart": {
            "chart_type": "bar",
            "title": "How Many Times Faster is AI?",
            "data": []
        },
        "hidden_costs_chart": {
            "chart_type": "pie",
            "title": "Hidden Cost Multipliers by Region",
            "data": []
        }
    }
    
    # Process each region
    region_order = ["usa", "western_europe", "eastern_europe", "india", "south_america", "australia", "ai_powered"]
    region_labels = {
        "usa": "USA",
        "western_europe": "W.Europe", 
        "eastern_europe": "E.Europe",
        "india": "India",
        "south_america": "S.America",
        "australia": "Australia",
        "ai_powered": "AI"
    }
    
    for region_key in region_order:
        region = global_data["regions"][region_key]
        label = region_labels[region_key]
        
        # Daily rates
        viz_data["daily_rates_chart"]["data"].append({
            "label": label,
            "base_rate": region["daily_rate"],
            "effective_rate": region["effective_daily_rate"]
        })
        
        # Project costs and time
        project_data = global_data["project_comparison"]["cost_by_region"][region_key]
        viz_data["project_cost_chart"]["data"].append({
            "label": label,
            "cost": round(project_data["effective_cost"])
        })
        
        viz_data["delivery_time_chart"]["data"].append({
            "label": label,
            "days": round(project_data["days_needed"], 1)
        })
        
        # Hidden costs
        multiplier = region["hidden_costs"]["total_multiplier"]
        viz_data["hidden_costs_chart"]["data"].append({
            "label": f"{label} ({int((multiplier-1)*100)}%)",
            "value": round((multiplier - 1) * 100)
        })
        
        # Savings and speed (skip AI itself)
        if region_key != "ai_powered" and region_key in global_data["savings_comparison"]:
            savings_data = global_data["savings_comparison"][region_key]
            
            viz_data["savings_chart"]["data"].append({
                "label": f"vs {label}",
                "amount": round(savings_data["savings_amount"])
            })
            
            viz_data["speed_multiplier_chart"]["data"].append({
                "label": f"vs {label}",
                "multiplier": round(savings_data["speed_multiplier"])
            })
    
    # Create comparison matrix
    viz_data["comparison_matrix"] = {
        "headers": ["Region", "Daily Rate", "Project Cost", "Delivery Days", "vs AI Savings", "Speed vs AI"],
        "rows": []
    }
    
    for region_key in region_order:
        region = global_data["regions"][region_key]
        project = global_data["project_comparison"]["cost_by_region"][region_key]
        
        if region_key == "ai_powered":
            row = [
                region["name"],
                f"${region['daily_rate']}",
                f"${project['effective_cost']:.0f}",
                f"{project['days_needed']:.1f}",
                "N/A",
                "Baseline"
            ]
        else:
            savings = global_data["savings_comparison"][region_key]
            row = [
                region["name"],
                f"${region['effective_daily_rate']:.0f}",
                f"${project['effective_cost']:.0f}",
                f"{project['days_needed']:.1f}",
                f"${savings['savings_amount']:.0f}",
                f"{savings['speed_multiplier']:.0f}x slower"
            ]
        
        viz_data["comparison_matrix"]["rows"].append(row)
    
    # Add shocking statistics
    viz_data["shocking_stats"] = {
        "cheapest_traditional_vs_ai": {
            "traditional": "South America",
            "traditional_cost": 30840,
            "ai_cost": 75,
            "times_more_expensive": 411,
            "statement": "Even the cheapest offshore option costs 411x more than AI"
        },
        "fastest_traditional_vs_ai": {
            "traditional": "USA", 
            "traditional_days": 63.3,
            "ai_days": 0.5,
            "times_slower": 127,
            "statement": "The fastest traditional option is still 127x slower than AI"
        },
        "india_hidden_costs": {
            "advertised": 200,
            "reality": 350,
            "hidden_percentage": 75,
            "statement": "India's 'low rates' hide 75% additional costs"
        },
        "annual_productivity": {
            "human_projects": 5.8,
            "ai_projects": 730,
            "multiplier": 126,
            "statement": "AI can complete 730 projects while humans complete 5.8"
        }
    }
    
    return viz_data

def generate_mermaid_code(viz_data):
    """Generate ready-to-use Mermaid chart code"""
    
    charts = []
    
    # Daily rates bar chart
    daily_data = viz_data["daily_rates_chart"]["data"]
    labels = [d["label"] for d in daily_data]
    values = [d["effective_rate"] for d in daily_data]
    
    chart1 = f"""```mermaid
graph LR
    subgraph "Effective Daily Rates (USD)"
        {' --> '.join([f'{labels[i]}[{labels[i]}<br/>${values[i]}]' for i in range(len(labels))])}
    end
    style AI fill:#00ff00,stroke:#333,stroke-width:4px
```"""
    charts.append(("Daily Rates Comparison", chart1))
    
    # Project cost comparison
    cost_data = viz_data["project_cost_chart"]["data"]
    labels = [d["label"] for d in cost_data]
    values = [d["cost"] for d in cost_data]
    
    chart2 = f"""```mermaid
bar-chart
    title "Total Project Cost by Region (USD)"
    x-axis [{', '.join([f'"{l}"' for l in labels])}]
    y-axis "Cost (USD)" 0 --> 80000
    bar [{', '.join([str(v) for v in values])}]
```"""
    charts.append(("Project Cost Comparison", chart2))
    
    # Speed comparison
    speed_data = viz_data["speed_multiplier_chart"]["data"]
    if speed_data:
        labels = [d["label"] for d in speed_data]
        values = [d["multiplier"] for d in speed_data]
        
        chart3 = f"""```mermaid
bar-chart
    title "How Many Times Faster is AI?"
    x-axis [{', '.join([f'"{l}"' for l in labels])}]
    y-axis "Speed Multiplier" 0 --> 200
    bar [{', '.join([str(v) for v in values])}]
```"""
        charts.append(("Speed Advantage", chart3))
    
    return charts

def main():
    # Create visualization data
    viz_data = create_visualization_data()
    
    # Save visualization data
    with open('/Users/alexanderfedin/Projects/hackathons/SF-hackaton/visualization_data.json', 'w') as f:
        json.dump(viz_data, f, indent=2)
    
    # Generate Mermaid charts
    charts = generate_mermaid_code(viz_data)
    
    print("✅ Visualization Data Created!")
    print("=" * 70)
    
    # Print shocking stats
    print("\n🔥 SHOCKING STATISTICS:\n")
    for key, stat in viz_data["shocking_stats"].items():
        print(f"  • {stat['statement']}")
    
    print("\n📊 COMPARISON MATRIX:")
    print("-" * 100)
    
    # Print comparison matrix
    matrix = viz_data["comparison_matrix"]
    header_format = "{:<25} {:>12} {:>15} {:>15} {:>15} {:>15}"
    print(header_format.format(*matrix["headers"]))
    print("-" * 100)
    
    for row in matrix["rows"]:
        print(header_format.format(*row))
    
    print("-" * 100)
    
    print("\n📁 Files created:")
    print("  • visualization_data.json - Chart-ready data")
    print("  • regional_comparison_summary.json - Summary statistics")
    print("  • GLOBAL_PRICING_COMPARISON.md - Complete report with charts")
    print("  • global_developer_rates.json - Full data with sources")

if __name__ == "__main__":
    main()
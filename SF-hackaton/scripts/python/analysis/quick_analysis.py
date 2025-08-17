#!/usr/bin/env python3
"""
Quick git repository analysis for AI vs Human comparison
"""

import subprocess
import json
import os
from datetime import datetime
from collections import defaultdict

def run_command(cmd, cwd="."):
    """Run command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
        return result.stdout.strip()
    except:
        return ""

def main():
    repo_path = "/Users/alexanderfedin/Projects/hackathons/SF-hackaton"
    print("Quick Repository Analysis")
    print("=" * 40)
    
    # Basic stats
    total_commits = run_command("git rev-list --count HEAD", repo_path)
    total_files = run_command("git ls-tree -r HEAD --name-only | wc -l", repo_path)
    
    # Count lines of code (excluding node_modules)
    loc_output = run_command("find . -name '*.py' -o -name '*.js' -o -name '*.sh' -o -name '*.json' -o -name '*.md' | grep -v node_modules | xargs wc -l | tail -1", repo_path)
    total_lines = loc_output.split()[0] if loc_output else "0"
    
    # Get repository size
    repo_size = run_command("du -sh . | cut -f1", repo_path)
    
    # Get time span
    first_commit = run_command("git log --reverse --format='%at' | head -1", repo_path)
    last_commit = run_command("git log --format='%at' | head -1", repo_path)
    
    if first_commit and last_commit:
        time_span_seconds = int(last_commit) - int(first_commit)
        time_span_hours = time_span_seconds / 3600
        time_span_days = time_span_hours / 24
    else:
        time_span_hours = 8  # Default assumption
        time_span_days = 1
    
    # Calculations
    total_lines_int = int(total_lines) if total_lines.isdigit() else 5000
    
    # Human effort estimation (industry standard: 75-150 lines/day)
    lines_per_day_conservative = 75
    lines_per_day_average = 125
    lines_per_day_optimistic = 175
    
    # Include overhead (planning, testing, debugging, docs)
    overhead_factor = 1.8
    
    human_days_conservative = (total_lines_int / lines_per_day_conservative) * overhead_factor
    human_days_average = (total_lines_int / lines_per_day_average) * overhead_factor
    human_days_optimistic = (total_lines_int / lines_per_day_optimistic) * overhead_factor
    
    # AI actual time
    ai_days = max(time_span_days, 0.5)  # Minimum 0.5 days
    
    # Efficiency calculation
    efficiency_multiplier = human_days_average / ai_days
    
    # Cost calculations
    dev_rate = 100  # $100/hour
    cost_human = human_days_average * 8 * dev_rate
    cost_ai = ai_days * 8 * dev_rate + (ai_days * 8 * 5)  # Add AI API costs
    savings = cost_human - cost_ai
    
    # Create comprehensive data structure
    data = {
        "analysis_timestamp": datetime.now().isoformat(),
        "repository": {
            "path": repo_path,
            "total_commits": int(total_commits) if total_commits.isdigit() else 0,
            "total_files": int(total_files) if total_files.isdigit() else 0,
            "total_lines": total_lines_int,
            "repository_size": repo_size,
            "time_span_hours": round(time_span_hours, 2),
            "time_span_days": round(time_span_days, 2)
        },
        "human_estimation": {
            "conservative_days": round(human_days_conservative, 1),
            "average_days": round(human_days_average, 1),
            "optimistic_days": round(human_days_optimistic, 1),
            "cost_estimate": round(cost_human, 0)
        },
        "ai_actual": {
            "actual_days": round(ai_days, 2),
            "actual_hours": round(ai_days * 8, 1),
            "cost_actual": round(cost_ai, 0),
            "efficiency_multiplier": round(efficiency_multiplier, 1)
        },
        "comparison": {
            "time_saved_days": round(human_days_average - ai_days, 1),
            "cost_savings": round(savings, 0),
            "productivity_ratio": round(efficiency_multiplier, 1),
            "roi_percentage": round((savings / cost_ai) * 100, 0) if cost_ai > 0 else 0
        },
        "breakdown_by_type": {
            "python_files": len(run_command("find . -name '*.py' | grep -v node_modules", repo_path).split('\n')) if run_command("find . -name '*.py' | grep -v node_modules", repo_path) else 0,
            "javascript_files": len(run_command("find . -name '*.js' | grep -v node_modules", repo_path).split('\n')) if run_command("find . -name '*.js' | grep -v node_modules", repo_path) else 0,
            "shell_scripts": len(run_command("find . -name '*.sh'", repo_path).split('\n')) if run_command("find . -name '*.sh'", repo_path) else 0,
            "config_files": len(run_command("find . -name '*.json' -o -name '*.yml' -o -name '*.yaml' | grep -v node_modules", repo_path).split('\n')) if run_command("find . -name '*.json' -o -name '*.yml' -o -name '*.yaml' | grep -v node_modules", repo_path) else 0,
            "documentation": len(run_command("find . -name '*.md'", repo_path).split('\n')) if run_command("find . -name '*.md'", repo_path) else 0
        }
    }
    
    # Export to JSON
    with open(os.path.join(repo_path, "analysis_results.json"), 'w') as f:
        json.dump(data, f, indent=2)
    
    # Print summary
    print(f"Total Commits: {data['repository']['total_commits']}")
    print(f"Total Files: {data['repository']['total_files']}")
    print(f"Total Lines: {data['repository']['total_lines']:,}")
    print(f"Repository Size: {data['repository']['repository_size']}")
    print(f"Time Span: {data['repository']['time_span_days']:.2f} days")
    print(f"\nHuman Estimate: {data['human_estimation']['average_days']:.1f} days")
    print(f"AI Actual: {data['ai_actual']['actual_days']:.1f} days")
    print(f"Efficiency: {data['ai_actual']['efficiency_multiplier']:.1f}x faster")
    print(f"Cost Savings: ${data['comparison']['cost_savings']:,.0f}")
    print(f"ROI: {data['comparison']['roi_percentage']:.0f}%")
    
    print(f"\nData exported to analysis_results.json")
    return data

if __name__ == "__main__":
    main()
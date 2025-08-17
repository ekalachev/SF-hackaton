#!/usr/bin/env python3
"""
Fixed analysis - excluding node_modules
"""

import subprocess
import json
import os
from datetime import datetime

def run_command(cmd, cwd="."):
    """Run command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
        return result.stdout.strip()
    except:
        return ""

def main():
    repo_path = "/Users/alexanderfedin/Projects/hackathons/SF-hackaton"
    print("Fixed Repository Analysis (excluding node_modules)")
    print("=" * 50)
    
    # Get ACTUAL project files (excluding node_modules)
    total_commits = run_command("git rev-list --count HEAD", repo_path)
    
    # Count actual project files (excluding node_modules)
    actual_files = run_command("find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -name '.DS_Store' | wc -l", repo_path)
    
    # Count lines of code (excluding node_modules)
    loc_output = run_command("find . -type f \\( -name '*.py' -o -name '*.js' -o -name '*.sh' -o -name '*.json' -o -name '*.md' \\) -not -path './node_modules/*' | xargs wc -l | tail -1", repo_path)
    total_lines = loc_output.split()[0] if loc_output else "0"
    
    # Get repository size (excluding node_modules)
    repo_size_with_node = run_command("du -sh . | cut -f1", repo_path)
    node_modules_size = run_command("du -sh ./node_modules 2>/dev/null | cut -f1", repo_path)
    
    # Get time span
    first_commit = run_command("git log --reverse --format='%at' | head -1", repo_path)
    last_commit = run_command("git log --format='%at' | head -1", repo_path)
    
    if first_commit and last_commit:
        time_span_seconds = int(last_commit) - int(first_commit)
        time_span_hours = time_span_seconds / 3600
        time_span_days = time_span_hours / 24
    else:
        time_span_hours = 8
        time_span_days = 1
    
    # Count different file types (excluding node_modules)
    py_files = run_command("find . -name '*.py' -not -path './node_modules/*' | wc -l", repo_path)
    js_files = run_command("find . -name '*.js' -not -path './node_modules/*' | wc -l", repo_path)
    sh_files = run_command("find . -name '*.sh' -not -path './node_modules/*' | wc -l", repo_path)
    json_files = run_command("find . -name '*.json' -not -path './node_modules/*' | wc -l", repo_path)
    md_files = run_command("find . -name '*.md' -not -path './node_modules/*' | wc -l", repo_path)
    
    # Calculations
    total_lines_int = int(total_lines) if total_lines.isdigit() else 5000
    actual_files_int = int(actual_files) if actual_files.isdigit() else 50
    
    # Human effort estimation (industry standard)
    lines_per_day_average = 125
    overhead_factor = 1.8  # planning, testing, debugging, docs
    
    human_days = (total_lines_int / lines_per_day_average) * overhead_factor
    
    # AI actual time
    ai_days = max(time_span_days, 0.5)
    
    # Efficiency calculation
    efficiency_multiplier = human_days / ai_days if ai_days > 0 else 1
    
    # Cost calculations
    dev_rate = 100  # $100/hour
    cost_human = human_days * 8 * dev_rate
    cost_ai = ai_days * 8 * dev_rate + (ai_days * 8 * 5)  # Add AI API costs
    savings = cost_human - cost_ai
    
    # Create corrected data
    data = {
        "analysis_timestamp": datetime.now().isoformat(),
        "repository": {
            "path": repo_path,
            "total_commits": int(total_commits) if total_commits.isdigit() else 0,
            "actual_project_files": actual_files_int,
            "total_lines": total_lines_int,
            "repository_size": repo_size_with_node,
            "node_modules_size": node_modules_size,
            "time_span_hours": round(time_span_hours, 2),
            "time_span_days": round(time_span_days, 2)
        },
        "human_estimation": {
            "average_days": round(human_days, 1),
            "cost_estimate": round(cost_human, 0)
        },
        "ai_actual": {
            "actual_days": round(ai_days, 2),
            "actual_hours": round(ai_days * 8, 1),
            "cost_actual": round(cost_ai, 0),
            "efficiency_multiplier": round(efficiency_multiplier, 1)
        },
        "comparison": {
            "time_saved_days": round(human_days - ai_days, 1),
            "cost_savings": round(savings, 0),
            "productivity_ratio": round(efficiency_multiplier, 1),
            "roi_percentage": round((savings / cost_ai) * 100, 0) if cost_ai > 0 else 0
        },
        "file_breakdown": {
            "python_scripts": int(py_files) if py_files.isdigit() else 0,
            "javascript_files": int(js_files) if js_files.isdigit() else 0,
            "shell_scripts": int(sh_files) if sh_files.isdigit() else 0,
            "config_json": int(json_files) if json_files.isdigit() else 0,
            "documentation_md": int(md_files) if md_files.isdigit() else 0,
            "total_actual_files": actual_files_int
        }
    }
    
    # Export corrected data
    with open(os.path.join(repo_path, "analysis_results_corrected.json"), 'w') as f:
        json.dump(data, f, indent=2)
    
    # Print corrected summary
    print(f"✅ ACTUAL Project Files: {actual_files_int} (excluding node_modules)")
    print(f"📝 Total Lines of Code: {total_lines_int:,}")
    print(f"📦 Total Commits: {data['repository']['total_commits']}")
    print(f"💾 Repository Size: {repo_size_with_node} (node_modules: {node_modules_size})")
    print(f"⏱️ Time Span: {data['repository']['time_span_days']:.2f} days")
    print()
    print(f"👨‍💻 Human Estimate: {human_days:.1f} days")
    print(f"🤖 AI Actual: {ai_days:.1f} days")
    print(f"🚀 Efficiency: {efficiency_multiplier:.1f}x faster")
    print(f"💰 Cost Savings: ${savings:,.0f}")
    print(f"📈 ROI: {data['comparison']['roi_percentage']:.0f}%")
    print()
    print("File Breakdown:")
    print(f"  Python: {data['file_breakdown']['python_scripts']}")
    print(f"  JavaScript: {data['file_breakdown']['javascript_files']}")
    print(f"  Shell Scripts: {data['file_breakdown']['shell_scripts']}")
    print(f"  JSON Configs: {data['file_breakdown']['config_json']}")
    print(f"  Documentation: {data['file_breakdown']['documentation_md']}")
    
    return data

if __name__ == "__main__":
    main()
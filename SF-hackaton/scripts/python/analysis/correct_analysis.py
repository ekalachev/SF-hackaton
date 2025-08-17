#!/usr/bin/env python3
"""
Correct analysis - ONLY counting core project files in SF-hackaton
Directories: agents/, config/, docs/, and root files
Excluding: node_modules/, logs/, all Python analysis scripts
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
    print("CORRECT Repository Analysis - Core Project Files Only")
    print("=" * 60)
    
    # Count ONLY core project files
    print("Counting core project files...")
    
    # Count files in agents directory
    agents_files = run_command("find agents -type f -name '*.sh' 2>/dev/null | wc -l", repo_path)
    agents_lines = run_command("find agents -type f -name '*.sh' 2>/dev/null | xargs wc -l | tail -1 | awk '{print $1}'", repo_path)
    
    # Count files in config directory  
    config_files = run_command("find config -type f \\( -name '*.json' -o -name '*.sh' \\) 2>/dev/null | wc -l", repo_path)
    config_lines = run_command("find config -type f \\( -name '*.json' -o -name '*.sh' \\) 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'", repo_path)
    
    # Count files in docs directory
    docs_files = run_command("find docs -type f -name '*.md' 2>/dev/null | wc -l", repo_path)
    docs_lines = run_command("find docs -type f -name '*.md' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'", repo_path)
    
    # Count root level project files (excluding analysis scripts and reports)
    root_sh_files = run_command("ls *.sh 2>/dev/null | grep -v 'test_' | wc -l", repo_path)
    root_sh_lines = run_command("ls *.sh 2>/dev/null | grep -v 'test_' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'", repo_path)
    
    # Count specific project files (demo.sh, setup scripts, etc)
    project_files = [
        "demo.sh",
        "verify_setup.sh", 
        "claude_with_mcp.sh",
        "start_claude_with_mcp.sh",
        "automated_demo.sh",
        "visual_demo.sh",
        "mock_demo.sh"
    ]
    
    # Count JavaScript demo files
    js_files = run_command("ls *.js 2>/dev/null | grep -E '(demo|visual)' | wc -l", repo_path)
    js_lines = run_command("ls *.js 2>/dev/null | grep -E '(demo|visual)' | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'", repo_path)
    
    # Count key config files in root
    root_configs = [".mcp.json", "mcp_config.json", "package.json"]
    config_count = 0
    config_lines_total = 0
    for cfg in root_configs:
        if os.path.exists(os.path.join(repo_path, cfg)):
            config_count += 1
            lines = run_command(f"wc -l {cfg} | awk '{{print $1}}'", repo_path)
            if lines.isdigit():
                config_lines_total += int(lines)
    
    # Count README and documentation
    readme_files = run_command("ls *.md 2>/dev/null | wc -l", repo_path)
    readme_lines = run_command("ls *.md 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'", repo_path)
    
    # Calculate totals
    total_agents = int(agents_files) if agents_files.isdigit() else 0
    total_config = int(config_files) if config_files.isdigit() else 0
    total_config += config_count  # Add root configs
    total_docs = int(docs_files) if docs_files.isdigit() else 0
    total_docs += int(readme_files) if readme_files.isdigit() else 0
    total_scripts = int(root_sh_files) if root_sh_files.isdigit() else 0
    total_js = int(js_files) if js_files.isdigit() else 0
    
    total_files = total_agents + total_config + total_docs + total_scripts + total_js
    
    # Calculate total lines
    lines_agents = int(agents_lines) if agents_lines and agents_lines.isdigit() else 0
    lines_config = int(config_lines) if config_lines and config_lines.isdigit() else 0
    lines_config += config_lines_total
    lines_docs = int(docs_lines) if docs_lines and docs_lines.isdigit() else 0
    lines_docs += int(readme_lines) if readme_lines and readme_lines.isdigit() else 0
    lines_scripts = int(root_sh_lines) if root_sh_lines and root_sh_lines.isdigit() else 0
    lines_js = int(js_lines) if js_lines and js_lines.isdigit() else 0
    
    total_lines = lines_agents + lines_config + lines_docs + lines_scripts + lines_js
    
    # Get git stats
    total_commits = run_command("git rev-list --count HEAD", repo_path)
    first_commit = run_command("git log --reverse --format='%at' | head -1", repo_path)
    last_commit = run_command("git log --format='%at' | head -1", repo_path)
    
    if first_commit and last_commit:
        time_span_seconds = int(last_commit) - int(first_commit)
        time_span_hours = time_span_seconds / 3600
        time_span_days = time_span_hours / 24
    else:
        time_span_hours = 8
        time_span_days = 1
    
    # Human effort estimation
    lines_per_day_average = 125
    overhead_factor = 1.8
    human_days = (total_lines / lines_per_day_average) * overhead_factor if total_lines > 0 else 1
    
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
            "actual_project_files": total_files,
            "total_lines": total_lines,
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
            "ai_agents": total_agents,
            "ai_agents_lines": lines_agents,
            "config_files": total_config,
            "config_lines": lines_config,
            "documentation": total_docs,
            "documentation_lines": lines_docs,
            "shell_scripts": total_scripts,
            "shell_lines": lines_scripts,
            "javascript_demos": total_js,
            "javascript_lines": lines_js,
            "total_files": total_files,
            "total_lines": total_lines
        }
    }
    
    # Export
    with open(os.path.join(repo_path, "analysis_core_only.json"), 'w') as f:
        json.dump(data, f, indent=2)
    
    # Print summary
    print(f"✅ CORE PROJECT FILES ONLY")
    print(f"──────────────────────────")
    print(f"📁 AI Agents (agents/): {total_agents} files, {lines_agents} lines")
    print(f"⚙️  Config Files: {total_config} files, {lines_config} lines")
    print(f"📚 Documentation: {total_docs} files, {lines_docs} lines")
    print(f"🔧 Shell Scripts: {total_scripts} files, {lines_scripts} lines")
    print(f"🌐 JavaScript: {total_js} files, {lines_js} lines")
    print(f"──────────────────────────")
    print(f"📊 TOTAL: {total_files} files, {total_lines:,} lines")
    print()
    print(f"⏱️  Time Span: {data['repository']['time_span_days']:.2f} days")
    print(f"📦 Commits: {data['repository']['total_commits']}")
    print()
    print(f"👨‍💻 Human Estimate: {human_days:.1f} days (${cost_human:,.0f})")
    print(f"🤖 AI Actual: {ai_days:.1f} days (${cost_ai:,.0f})")
    print(f"🚀 Efficiency: {efficiency_multiplier:.1f}x faster")
    print(f"💰 Cost Savings: ${savings:,.0f}")
    print(f"📈 ROI: {data['comparison']['roi_percentage']:.0f}%")
    
    return data

if __name__ == "__main__":
    main()
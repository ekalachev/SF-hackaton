#!/usr/bin/env python3
"""
Git Repository Analysis Tool
Analyzes commits, file changes, and estimates development effort
"""

import subprocess
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import re

class GitRepoAnalyzer:
    def __init__(self, repo_path="."):
        self.repo_path = repo_path
        self.data = {
            "commits": [],
            "files": {},
            "statistics": {},
            "time_analysis": {},
            "effort_estimation": {}
        }
        
    def run_git_command(self, cmd):
        """Execute git command and return output"""
        try:
            result = subprocess.run(
                cmd, 
                shell=True, 
                capture_output=True, 
                text=True, 
                cwd=self.repo_path
            )
            return result.stdout.strip()
        except Exception as e:
            print(f"Error running command: {cmd}")
            print(e)
            return ""
    
    def analyze_commits(self):
        """Analyze all commits in the repository"""
        print("Analyzing commits...")
        
        # Get all commits with details
        commit_format = "%H|%an|%ae|%at|%s"
        commits_raw = self.run_git_command(f'git log --format="{commit_format}"')
        
        for line in commits_raw.split('\n'):
            if not line:
                continue
                
            parts = line.split('|')
            if len(parts) >= 5:
                commit_hash = parts[0]
                author = parts[1]
                email = parts[2]
                timestamp = int(parts[3])
                message = '|'.join(parts[4:])
                
                # Get commit stats
                stats = self.get_commit_stats(commit_hash)
                
                commit_data = {
                    "hash": commit_hash,
                    "author": author,
                    "email": email,
                    "timestamp": timestamp,
                    "date": datetime.fromtimestamp(timestamp).isoformat(),
                    "message": message,
                    "stats": stats
                }
                
                self.data["commits"].append(commit_data)
        
        print(f"Found {len(self.data['commits'])} commits")
    
    def get_commit_stats(self, commit_hash):
        """Get detailed statistics for a commit"""
        stats = {
            "files_changed": 0,
            "insertions": 0,
            "deletions": 0,
            "files": []
        }
        
        # Get commit diff stats
        diff_stat = self.run_git_command(f"git show --stat {commit_hash}")
        
        # Parse the stats line (e.g., "5 files changed, 123 insertions(+), 45 deletions(-)")
        stats_match = re.search(r'(\d+) file[s]? changed(?:, (\d+) insertion[s]?\(\+\))?(?:, (\d+) deletion[s]?\(-\))?', diff_stat)
        if stats_match:
            stats["files_changed"] = int(stats_match.group(1))
            stats["insertions"] = int(stats_match.group(2)) if stats_match.group(2) else 0
            stats["deletions"] = int(stats_match.group(3)) if stats_match.group(3) else 0
        
        # Get list of changed files with their stats
        numstat = self.run_git_command(f"git show --numstat {commit_hash}")
        for line in numstat.split('\n'):
            if '\t' in line:
                parts = line.split('\t')
                if len(parts) >= 3:
                    try:
                        insertions = int(parts[0]) if parts[0] != '-' else 0
                        deletions = int(parts[1]) if parts[1] != '-' else 0
                        filename = parts[2]
                        stats["files"].append({
                            "name": filename,
                            "insertions": insertions,
                            "deletions": deletions
                        })
                    except:
                        pass
        
        return stats
    
    def analyze_files(self):
        """Analyze all files in the repository"""
        print("Analyzing files...")
        
        # Get all files in current state
        files = self.run_git_command("git ls-tree -r HEAD --name-only")
        
        for filename in files.split('\n'):
            if not filename:
                continue
            
            file_info = self.get_file_info(filename)
            self.data["files"][filename] = file_info
        
        print(f"Analyzed {len(self.data['files'])} files")
    
    def get_file_info(self, filename):
        """Get detailed information about a file"""
        info = {
            "name": filename,
            "size": 0,
            "lines": 0,
            "extension": os.path.splitext(filename)[1],
            "first_commit": None,
            "last_commit": None,
            "commit_count": 0,
            "authors": []
        }
        
        # Get file size
        try:
            file_path = os.path.join(self.repo_path, filename)
            if os.path.exists(file_path):
                info["size"] = os.path.getsize(file_path)
                
                # Count lines for text files
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        info["lines"] = sum(1 for _ in f)
                except:
                    pass
        except:
            pass
        
        # Get file history
        log = self.run_git_command(f'git log --format="%H|%at|%an" -- "{filename}"')
        commits = []
        authors = set()
        
        for line in log.split('\n'):
            if '|' in line:
                parts = line.split('|')
                if len(parts) >= 3:
                    commits.append({
                        "hash": parts[0],
                        "timestamp": int(parts[1]),
                        "author": parts[2]
                    })
                    authors.add(parts[2])
        
        if commits:
            info["first_commit"] = commits[-1]["hash"]
            info["last_commit"] = commits[0]["hash"]
            info["commit_count"] = len(commits)
            info["authors"] = list(authors)
        
        return info
    
    def calculate_statistics(self):
        """Calculate overall repository statistics"""
        print("Calculating statistics...")
        
        total_lines = sum(f["lines"] for f in self.data["files"].values())
        total_size = sum(f["size"] for f in self.data["files"].values())
        total_files = len(self.data["files"])
        
        # Language breakdown
        language_stats = defaultdict(lambda: {"files": 0, "lines": 0, "size": 0})
        for file_info in self.data["files"].values():
            ext = file_info["extension"]
            language_stats[ext]["files"] += 1
            language_stats[ext]["lines"] += file_info["lines"]
            language_stats[ext]["size"] += file_info["size"]
        
        # Commit statistics
        if self.data["commits"]:
            total_insertions = sum(c["stats"]["insertions"] for c in self.data["commits"])
            total_deletions = sum(c["stats"]["deletions"] for c in self.data["commits"])
            
            # Time span
            timestamps = [c["timestamp"] for c in self.data["commits"]]
            first_commit_time = min(timestamps)
            last_commit_time = max(timestamps)
            time_span_seconds = last_commit_time - first_commit_time
            time_span_hours = time_span_seconds / 3600
            time_span_days = time_span_seconds / 86400
        else:
            total_insertions = 0
            total_deletions = 0
            time_span_hours = 0
            time_span_days = 0
        
        self.data["statistics"] = {
            "total_commits": len(self.data["commits"]),
            "total_files": total_files,
            "total_lines": total_lines,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / 1024 / 1024, 2),
            "total_insertions": total_insertions,
            "total_deletions": total_deletions,
            "net_lines": total_insertions - total_deletions,
            "languages": dict(language_stats),
            "time_span_hours": round(time_span_hours, 2),
            "time_span_days": round(time_span_days, 2)
        }
    
    def estimate_human_effort(self):
        """Estimate human effort required for the work"""
        print("Estimating human effort...")
        
        # Industry standards for lines of code per day
        # Conservative: 50-100 lines/day for production code
        # Average: 100-150 lines/day
        # Optimistic: 150-200 lines/day
        
        total_lines = self.data["statistics"]["total_lines"]
        total_files = self.data["statistics"]["total_files"]
        
        # Different types of files require different effort
        script_files = sum(1 for f in self.data["files"].values() 
                          if f["extension"] in ['.sh', '.py', '.js', '.ts'])
        config_files = sum(1 for f in self.data["files"].values() 
                          if f["extension"] in ['.json', '.yml', '.yaml', '.md'])
        
        # Estimation factors
        lines_per_day_conservative = 75  # For complex logic
        lines_per_day_average = 125      # For standard code
        lines_per_day_optimistic = 175   # For simple code
        
        # Time per file (includes planning, testing, debugging)
        hours_per_script_file = 4  # Complex scripts
        hours_per_config_file = 1  # Configuration files
        hours_per_other_file = 2   # Other files
        
        # Calculate based on lines
        days_by_lines_conservative = total_lines / lines_per_day_conservative
        days_by_lines_average = total_lines / lines_per_day_average
        days_by_lines_optimistic = total_lines / lines_per_day_optimistic
        
        # Calculate based on files
        hours_by_files = (
            script_files * hours_per_script_file +
            config_files * hours_per_config_file +
            (total_files - script_files - config_files) * hours_per_other_file
        )
        days_by_files = hours_by_files / 8  # 8 hours per day
        
        # Include additional time for:
        # - Planning and architecture: 20%
        # - Testing and debugging: 30%
        # - Documentation: 15%
        # - Code review and refactoring: 15%
        overhead_factor = 1.8  # 80% overhead
        
        self.data["effort_estimation"] = {
            "human_effort": {
                "by_lines": {
                    "conservative_days": round(days_by_lines_conservative * overhead_factor, 1),
                    "average_days": round(days_by_lines_average * overhead_factor, 1),
                    "optimistic_days": round(days_by_lines_optimistic * overhead_factor, 1)
                },
                "by_files": {
                    "total_days": round(days_by_files * overhead_factor, 1),
                    "total_hours": round(hours_by_files * overhead_factor, 1)
                },
                "breakdown": {
                    "script_files": script_files,
                    "config_files": config_files,
                    "other_files": total_files - script_files - config_files,
                    "development_hours": round(hours_by_files, 1),
                    "planning_hours": round(hours_by_files * 0.2, 1),
                    "testing_hours": round(hours_by_files * 0.3, 1),
                    "documentation_hours": round(hours_by_files * 0.15, 1),
                    "review_hours": round(hours_by_files * 0.15, 1)
                }
            },
            "ai_assisted_effort": {
                "actual_hours": round(self.data["statistics"]["time_span_hours"], 1),
                "actual_days": round(self.data["statistics"]["time_span_days"], 2),
                "efficiency_multiplier": None  # Will be calculated
            }
        }
        
        # Calculate efficiency multiplier
        avg_human_days = self.data["effort_estimation"]["human_effort"]["by_lines"]["average_days"]
        ai_days = self.data["effort_estimation"]["ai_assisted_effort"]["actual_days"]
        
        if ai_days > 0:
            efficiency_multiplier = round(avg_human_days / ai_days, 1)
            self.data["effort_estimation"]["ai_assisted_effort"]["efficiency_multiplier"] = efficiency_multiplier
    
    def analyze_time_distribution(self):
        """Analyze how work was distributed over time"""
        print("Analyzing time distribution...")
        
        if not self.data["commits"]:
            return
        
        # Group commits by hour and day
        commits_by_hour = defaultdict(int)
        commits_by_day = defaultdict(int)
        work_sessions = []
        
        # Sort commits by timestamp
        sorted_commits = sorted(self.data["commits"], key=lambda x: x["timestamp"])
        
        # Identify work sessions (commits within 2 hours of each other)
        session_threshold = 2 * 3600  # 2 hours in seconds
        current_session = {"start": None, "end": None, "commits": 0}
        
        for commit in sorted_commits:
            timestamp = commit["timestamp"]
            dt = datetime.fromtimestamp(timestamp)
            
            # Count by hour and day
            commits_by_hour[dt.hour] += 1
            commits_by_day[dt.strftime("%Y-%m-%d")] += 1
            
            # Track work sessions
            if current_session["start"] is None:
                current_session["start"] = timestamp
                current_session["end"] = timestamp
                current_session["commits"] = 1
            elif timestamp - current_session["end"] <= session_threshold:
                current_session["end"] = timestamp
                current_session["commits"] += 1
            else:
                # Save current session and start new one
                work_sessions.append(current_session.copy())
                current_session = {"start": timestamp, "end": timestamp, "commits": 1}
        
        # Don't forget the last session
        if current_session["start"] is not None:
            work_sessions.append(current_session)
        
        # Calculate session statistics
        session_durations = [(s["end"] - s["start"]) / 3600 for s in work_sessions]
        
        self.data["time_analysis"] = {
            "commits_by_hour": dict(commits_by_hour),
            "commits_by_day": dict(commits_by_day),
            "work_sessions": len(work_sessions),
            "average_session_hours": round(sum(session_durations) / len(session_durations), 2) if session_durations else 0,
            "total_active_hours": round(sum(session_durations), 2)
        }
    
    def export_to_json(self, filename="repo_analysis.json"):
        """Export all data to JSON file"""
        output_path = os.path.join(self.repo_path, filename)
        with open(output_path, 'w') as f:
            json.dump(self.data, f, indent=2, default=str)
        print(f"Data exported to {filename}")
        return output_path
    
    def analyze(self):
        """Run complete analysis"""
        print("Starting repository analysis...")
        self.analyze_commits()
        self.analyze_files()
        self.calculate_statistics()
        self.analyze_time_distribution()
        self.estimate_human_effort()
        print("Analysis complete!")
        return self.data

if __name__ == "__main__":
    analyzer = GitRepoAnalyzer("/Users/alexanderfedin/Projects/hackathons/SF-hackaton")
    data = analyzer.analyze()
    analyzer.export_to_json()
    
    # Print summary
    print("\n" + "="*60)
    print("REPOSITORY ANALYSIS SUMMARY")
    print("="*60)
    print(f"Total Commits: {data['statistics']['total_commits']}")
    print(f"Total Files: {data['statistics']['total_files']}")
    print(f"Total Lines of Code: {data['statistics']['total_lines']}")
    print(f"Repository Size: {data['statistics']['total_size_mb']} MB")
    print(f"\nTime Span: {data['statistics']['time_span_days']:.2f} days")
    print(f"Work Sessions: {data['time_analysis']['work_sessions']}")
    print(f"\nEstimated Human Effort: {data['effort_estimation']['human_effort']['by_lines']['average_days']} days")
    print(f"Actual AI-Assisted Time: {data['effort_estimation']['ai_assisted_effort']['actual_days']:.2f} days")
    print(f"Efficiency Multiplier: {data['effort_estimation']['ai_assisted_effort']['efficiency_multiplier']}x")
#!/usr/bin/env python3
"""
Generate visualizations for repository analysis
Creates charts comparing human vs AI development efficiency
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime
import numpy as np
import os

class VisualizationGenerator:
    def __init__(self, data_file="repo_analysis.json"):
        with open(data_file, 'r') as f:
            self.data = json.load(f)
        
        # Set style for professional looking charts
        plt.style.use('seaborn-v0_8-darkgrid')
        self.colors = {
            'human': '#FF6B6B',
            'ai': '#4ECDC4',
            'accent': '#45B7D1',
            'secondary': '#96CEB4',
            'dark': '#2C3E50'
        }
    
    def create_effort_comparison_chart(self):
        """Create bar chart comparing human vs AI effort"""
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        
        human_days = self.data['effort_estimation']['human_effort']['by_lines']['average_days']
        ai_days = self.data['effort_estimation']['ai_assisted_effort']['actual_days']
        
        categories = ['Human Developer', 'AI-Assisted']
        values = [human_days, ai_days]
        colors = [self.colors['human'], self.colors['ai']]
        
        bars = ax.bar(categories, values, color=colors, width=0.6, edgecolor='black', linewidth=2)
        
        # Add value labels on bars
        for bar, value in zip(bars, values):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{value:.1f} days',
                   ha='center', va='bottom', fontsize=14, fontweight='bold')
        
        # Add efficiency multiplier annotation
        efficiency = self.data['effort_estimation']['ai_assisted_effort']['efficiency_multiplier']
        ax.annotate(f'{efficiency}x faster!',
                   xy=(1, ai_days), xytext=(1, human_days/2),
                   arrowprops=dict(arrowstyle='->', color=self.colors['accent'], lw=2),
                   fontsize=16, fontweight='bold', color=self.colors['accent'],
                   ha='center')
        
        ax.set_ylabel('Development Time (Days)', fontsize=14)
        ax.set_title('Development Time Comparison: Human vs AI-Assisted', fontsize=18, fontweight='bold')
        ax.set_ylim(0, max(values) * 1.2)
        ax.grid(True, alpha=0.3)
        
        # Add statistics box
        stats_text = f"Total Files: {self.data['statistics']['total_files']}\n"
        stats_text += f"Total Lines: {self.data['statistics']['total_lines']:,}\n"
        stats_text += f"Total Commits: {self.data['statistics']['total_commits']}"
        
        props = dict(boxstyle='round', facecolor='wheat', alpha=0.8)
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=12,
               verticalalignment='top', bbox=props)
        
        plt.tight_layout()
        plt.savefig('effort_comparison.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("Created: effort_comparison.png")
    
    def create_productivity_timeline(self):
        """Create timeline showing commits over time"""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))
        
        # Parse commit timestamps
        commits_by_day = self.data['time_analysis']['commits_by_day']
        
        if commits_by_day:
            dates = sorted(commits_by_day.keys())
            counts = [commits_by_day[d] for d in dates]
            
            # Convert dates to datetime objects for better plotting
            date_objects = [datetime.strptime(d, '%Y-%m-%d') for d in dates]
            
            # Plot commits per day
            ax1.bar(range(len(dates)), counts, color=self.colors['ai'], edgecolor='black', linewidth=1)
            ax1.set_xlabel('Date', fontsize=12)
            ax1.set_ylabel('Number of Commits', fontsize=12)
            ax1.set_title('Development Activity Timeline', fontsize=16, fontweight='bold')
            ax1.set_xticks(range(len(dates)))
            ax1.set_xticklabels([d.split('-')[2] for d in dates], rotation=45)
            ax1.grid(True, alpha=0.3)
            
            # Add cumulative line
            cumulative = np.cumsum(counts)
            ax1_twin = ax1.twinx()
            ax1_twin.plot(range(len(dates)), cumulative, color=self.colors['accent'], 
                         linewidth=3, marker='o', markersize=8, label='Cumulative Commits')
            ax1_twin.set_ylabel('Cumulative Commits', fontsize=12, color=self.colors['accent'])
            ax1_twin.tick_params(axis='y', labelcolor=self.colors['accent'])
            ax1_twin.legend(loc='upper left')
        
        # Commits by hour of day
        commits_by_hour = self.data['time_analysis']['commits_by_hour']
        
        if commits_by_hour:
            hours = list(range(24))
            hour_counts = [commits_by_hour.get(str(h), 0) for h in hours]
            
            ax2.bar(hours, hour_counts, color=self.colors['secondary'], edgecolor='black', linewidth=1)
            ax2.set_xlabel('Hour of Day', fontsize=12)
            ax2.set_ylabel('Number of Commits', fontsize=12)
            ax2.set_title('Work Pattern: Commits by Hour of Day', fontsize=16, fontweight='bold')
            ax2.set_xticks(hours)
            ax2.set_xticklabels([f'{h:02d}:00' for h in hours], rotation=45)
            ax2.grid(True, alpha=0.3)
            
            # Highlight peak hours
            peak_hour = max(commits_by_hour.items(), key=lambda x: x[1])[0]
            ax2.axvline(x=int(peak_hour), color='red', linestyle='--', linewidth=2, alpha=0.7)
            ax2.text(int(peak_hour), max(hour_counts) * 0.9, f'Peak Hour', 
                    rotation=90, va='top', ha='right', fontweight='bold', color='red')
        
        plt.tight_layout()
        plt.savefig('productivity_timeline.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("Created: productivity_timeline.png")
    
    def create_code_breakdown_pie(self):
        """Create pie chart showing code breakdown by file type"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
        
        # Language breakdown
        languages = self.data['statistics']['languages']
        
        # Group small categories
        threshold = 0.02  # 2% threshold
        total_lines = self.data['statistics']['total_lines']
        
        language_data = []
        other_lines = 0
        
        for ext, stats in languages.items():
            if stats['lines'] / total_lines >= threshold and ext:
                label = self.get_language_label(ext)
                language_data.append((label, stats['lines']))
            else:
                other_lines += stats['lines']
        
        if other_lines > 0:
            language_data.append(('Other', other_lines))
        
        # Sort by size
        language_data.sort(key=lambda x: x[1], reverse=True)
        
        if language_data:
            labels1, sizes1 = zip(*language_data)
            colors1 = plt.cm.Set3(np.linspace(0, 1, len(labels1)))
            
            # Create pie chart for languages
            wedges1, texts1, autotexts1 = ax1.pie(sizes1, labels=labels1, colors=colors1,
                                                   autopct=lambda pct: f'{pct:.1f}%\n({int(pct * total_lines / 100):,} lines)',
                                                   startangle=90, textprops={'fontsize': 10})
            ax1.set_title('Code Distribution by Language', fontsize=16, fontweight='bold')
        
        # Effort breakdown
        breakdown = self.data['effort_estimation']['human_effort']['breakdown']
        
        effort_categories = [
            ('Development', breakdown['development_hours']),
            ('Testing', breakdown['testing_hours']),
            ('Planning', breakdown['planning_hours']),
            ('Documentation', breakdown['documentation_hours']),
            ('Review', breakdown['review_hours'])
        ]
        
        labels2, sizes2 = zip(*effort_categories)
        colors2 = [self.colors['ai'], self.colors['human'], self.colors['accent'], 
                  self.colors['secondary'], self.colors['dark']]
        
        # Create pie chart for effort
        wedges2, texts2, autotexts2 = ax2.pie(sizes2, labels=labels2, colors=colors2,
                                               autopct=lambda pct: f'{pct:.1f}%\n({int(pct * sum(sizes2) / 100):.0f} hrs)',
                                               startangle=45, textprops={'fontsize': 10})
        ax2.set_title('Estimated Human Effort Distribution', fontsize=16, fontweight='bold')
        
        # Make percentage text bold
        for autotext in autotexts1 + autotexts2:
            autotext.set_fontweight('bold')
            autotext.set_color('white')
        
        plt.tight_layout()
        plt.savefig('code_breakdown.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("Created: code_breakdown.png")
    
    def create_efficiency_metrics(self):
        """Create comprehensive efficiency metrics visualization"""
        fig = plt.figure(figsize=(16, 10))
        
        # Create grid for subplots
        gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
        
        # Metric cards
        metrics = [
            ('Total Files', self.data['statistics']['total_files'], 'files'),
            ('Lines of Code', f"{self.data['statistics']['total_lines']:,}", 'lines'),
            ('Repository Size', f"{self.data['statistics']['total_size_mb']:.1f}", 'MB'),
            ('Total Commits', self.data['statistics']['total_commits'], 'commits'),
            ('Work Sessions', self.data['time_analysis']['work_sessions'], 'sessions'),
            ('Efficiency Gain', f"{self.data['effort_estimation']['ai_assisted_effort']['efficiency_multiplier']}x", 'faster')
        ]
        
        for i, (label, value, unit) in enumerate(metrics[:6]):
            ax = fig.add_subplot(gs[i // 3, i % 3])
            ax.axis('off')
            
            # Create metric card
            rect = mpatches.FancyBboxPatch((0.1, 0.2), 0.8, 0.6,
                                          boxstyle="round,pad=0.1",
                                          facecolor=self.colors['ai'] if i == 5 else self.colors['secondary'],
                                          edgecolor='black', linewidth=2)
            ax.add_patch(rect)
            
            # Add text
            ax.text(0.5, 0.65, str(value), fontsize=28, fontweight='bold',
                   ha='center', va='center', color='white')
            ax.text(0.5, 0.35, unit, fontsize=14, ha='center', va='center', color='white')
            ax.text(0.5, 0.9, label, fontsize=12, fontweight='bold',
                   ha='center', va='center')
            
            ax.set_xlim(0, 1)
            ax.set_ylim(0, 1)
        
        # Add comparison bar at bottom
        ax_bottom = fig.add_subplot(gs[2, :])
        
        # Productivity comparison
        categories = ['Planning', 'Development', 'Testing', 'Documentation', 'Total']
        human_hours = [
            self.data['effort_estimation']['human_effort']['breakdown']['planning_hours'],
            self.data['effort_estimation']['human_effort']['breakdown']['development_hours'],
            self.data['effort_estimation']['human_effort']['breakdown']['testing_hours'],
            self.data['effort_estimation']['human_effort']['breakdown']['documentation_hours'],
            self.data['effort_estimation']['human_effort']['by_files']['total_hours']
        ]
        
        # AI hours (proportionally reduced based on efficiency multiplier)
        multiplier = self.data['effort_estimation']['ai_assisted_effort']['efficiency_multiplier']
        ai_hours = [h / multiplier for h in human_hours]
        
        x = np.arange(len(categories))
        width = 0.35
        
        bars1 = ax_bottom.bar(x - width/2, human_hours, width, label='Human Developer',
                              color=self.colors['human'], edgecolor='black', linewidth=1)
        bars2 = ax_bottom.bar(x + width/2, ai_hours, width, label='AI-Assisted',
                              color=self.colors['ai'], edgecolor='black', linewidth=1)
        
        ax_bottom.set_xlabel('Development Phase', fontsize=12)
        ax_bottom.set_ylabel('Hours', fontsize=12)
        ax_bottom.set_title('Effort Comparison by Development Phase', fontsize=14, fontweight='bold')
        ax_bottom.set_xticks(x)
        ax_bottom.set_xticklabels(categories)
        ax_bottom.legend()
        ax_bottom.grid(True, alpha=0.3)
        
        # Add value labels on bars
        for bars in [bars1, bars2]:
            for bar in bars:
                height = bar.get_height()
                ax_bottom.text(bar.get_x() + bar.get_width()/2., height,
                             f'{height:.0f}',
                             ha='center', va='bottom', fontsize=9)
        
        plt.suptitle('AI Development Efficiency Metrics Dashboard', fontsize=20, fontweight='bold', y=0.98)
        plt.savefig('efficiency_metrics.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("Created: efficiency_metrics.png")
    
    def get_language_label(self, extension):
        """Map file extensions to language labels"""
        mapping = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.sh': 'Shell Script',
            '.json': 'JSON',
            '.md': 'Markdown',
            '.yml': 'YAML',
            '.yaml': 'YAML',
            '.html': 'HTML',
            '.css': 'CSS',
            '.jsx': 'React',
            '.tsx': 'React TS',
            '.vue': 'Vue',
            '.c': 'C',
            '.cpp': 'C++',
            '.h': 'Header',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.sql': 'SQL'
        }
        return mapping.get(extension, extension.replace('.', '').upper() if extension else 'Other')
    
    def generate_all(self):
        """Generate all visualizations"""
        print("Generating visualizations...")
        self.create_effort_comparison_chart()
        self.create_productivity_timeline()
        self.create_code_breakdown_pie()
        self.create_efficiency_metrics()
        print("All visualizations created!")

if __name__ == "__main__":
    # Check if matplotlib is available
    try:
        import matplotlib
        print(f"Using matplotlib {matplotlib.__version__}")
    except ImportError:
        print("Installing matplotlib...")
        os.system("pip install matplotlib")
    
    generator = VisualizationGenerator("/Users/alexanderfedin/Projects/hackathons/SF-hackaton/repo_analysis.json")
    generator.generate_all()
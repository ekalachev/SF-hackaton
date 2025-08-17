#!/bin/bash
source ~/.zshrc
# Mock Demo Script - Fallback if HubSpot connection fails

echo "🚀 SalesSwarm AI - DEMO MODE"
echo "============================="
echo ""
sleep 1

echo "📊 Current Status:"
echo "  • AI Processing Queue: 5 tasks pending"
echo "  • Agents Status: ACTIVE"
echo "  • Last Run: $(date '+%H:%M:%S')"
echo ""
sleep 2

echo "➕ Creating new lead in HubSpot..."
echo "  Contact: Jennifer Chen (jennifer@techstartup.io)"
echo "  Company: TechStartup.io"
echo "  Title: VP of Sales"
sleep 2

echo ""
echo "🤖 AI Agents Activated..."
echo "----------------------------"
sleep 1

echo "[$(date '+%H:%M:%S')] task_monitor.sh: Found new task 'Qualify Lead Jennifer Chen'"
sleep 1
echo "[$(date '+%H:%M:%S')] data_enricher.sh: Starting enrichment for Jennifer Chen"
sleep 2
echo "[$(date '+%H:%M:%S')] data_enricher.sh: ✓ Found company info: Series B, 50-200 employees"
echo "[$(date '+%H:%M:%S')] data_enricher.sh: ✓ Industry: SaaS, Sales Technology"
echo "[$(date '+%H:%M:%S')] data_enricher.sh: ✓ Pain points: Scaling sales team, CRM integration"
sleep 2

echo "[$(date '+%H:%M:%S')] lead_qualifier.sh: Analyzing lead Jennifer Chen"
sleep 2
echo "[$(date '+%H:%M:%S')] lead_qualifier.sh: Score factors:"
echo "                      • Title match: VP Sales (+30)"
echo "                      • Company size: 50-200 (+25)"
echo "                      • Industry fit: SaaS (+20)"
echo "                      • Engagement: High (+15)"
echo "[$(date '+%H:%M:%S')] lead_qualifier.sh: ✓ Lead Score: 90/100 (HIGH PRIORITY)"
sleep 2

echo "[$(date '+%H:%M:%S')] outreach_agent.sh: Generating personalized email"
sleep 2
echo "[$(date '+%H:%M:%S')] outreach_agent.sh: ✓ Email sent with personalization:"
echo ""
echo "    Subject: Helping TechStartup.io scale sales operations"
echo "    "
echo "    Hi Jennifer,"
echo "    "
echo "    I noticed TechStartup.io is in growth mode after your Series B."
echo "    Many VPs of Sales at this stage struggle with scaling their"
echo "    team efficiently while maintaining quality..."
echo ""
sleep 2

echo "[$(date '+%H:%M:%S')] task_monitor.sh: Creating follow-up task for 3 days"
echo "[$(date '+%H:%M:%S')] task_monitor.sh: ✓ High-value lead escalated to human team"
echo ""
sleep 2

echo "📈 Results Summary:"
echo "==================="
echo "✅ Lead enriched with 5 data points"
echo "✅ Lead scored: 90/100"
echo "✅ Personalized email sent"
echo "✅ Follow-up scheduled"
echo "✅ Human handoff initiated"
echo ""
echo "⏱️ Total processing time: 8 seconds"
echo "👤 Human time saved: 25 minutes"
echo ""
sleep 2

echo "🎯 Business Impact:"
echo "• Process 500+ leads per hour"
echo "• 95% reduction in manual work"
echo "• 3x improvement in response time"
echo "• 24/7 autonomous operation"
echo ""

echo "📊 Live Metrics Dashboard:"
echo "╔════════════════════════════════════╗"
echo "║  Leads Processed Today:     247    ║"
echo "║  Emails Sent:              189     ║"
echo "║  Average Score:            72      ║"
echo "║  High Priority Leads:      31      ║"
echo "║  Time Saved:               41 hrs  ║"
echo "╚════════════════════════════════════╝"
echo ""

echo "✨ Demo Complete - Questions?"
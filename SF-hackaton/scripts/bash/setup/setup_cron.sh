#!/bin/bash
source ~/.zshrc

# Setup cron job for task monitor
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CRON_CMD="* * * * * $SCRIPT_DIR/agents/task_monitor.sh >> $SCRIPT_DIR/logs/cron.log 2>&1"

echo "Setting up cron job for task monitor..."

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "task_monitor.sh"; then
    echo "Cron job already exists. Removing old version..."
    crontab -l | grep -v "task_monitor.sh" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "Cron job installed successfully!"
echo "Task monitor will run every minute."
echo ""
echo "To view cron jobs: crontab -l"
echo "To remove cron job: crontab -l | grep -v 'task_monitor.sh' | crontab -"
echo "To view logs: tail -f $SCRIPT_DIR/logs/task_monitor.log"
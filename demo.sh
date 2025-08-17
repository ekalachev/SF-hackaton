#!/bin/bash

# HubSpot Demo using Apple Automation

echo "🎯 HUBSPOT AI DEMO"
echo "=================="
echo ""
echo "Starting HubSpot demo with Safari..."
echo ""

# Run the simple AppleScript version
osascript simple-demo.applescript

# Check if it succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Demo completed successfully!"
    echo "Safari is open with HubSpot - please log in if needed."
else
    echo ""
    echo "❌ Demo failed or was cancelled."
fi
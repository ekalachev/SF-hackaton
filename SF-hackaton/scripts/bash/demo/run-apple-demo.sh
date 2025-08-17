#!/bin/bash

# HubSpot Demo Runner using Apple Automation

echo "═══════════════════════════════════════════════════════════"
echo "🍎 HUBSPOT DEMO - APPLE AUTOMATION"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This will open Safari and automate HubSpot login."
echo ""
echo "Choose which script to run:"
echo "1. AppleScript version"
echo "2. JavaScript for Automation (JXA) version"
echo "3. Exit"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Running AppleScript demo..."
        osascript hubspot-demo.applescript
        ;;
    2)
        echo ""
        echo "Running JXA demo..."
        osascript -l JavaScript hubspot-demo.jxa.js
        ;;
    3)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run again and select 1, 2, or 3."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Demo completed successfully!"
else
    echo ""
    echo "❌ Demo encountered an error."
    echo ""
    echo "Troubleshooting:"
    echo "1. Grant Terminal accessibility permissions in System Preferences"
    echo "2. Make sure Safari is installed"
    echo "3. Check your internet connection"
fi
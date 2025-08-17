#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "🔧 SAFARI AUTOMATION SETUP"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "To run the HubSpot demo, you need to enable Safari automation:"
echo ""
echo "1. Open Safari"
echo "2. Safari menu → Settings (or Preferences)"
echo "3. Click on 'Advanced' tab"
echo "4. Check '✓ Show Develop menu in menu bar'"
echo "5. Close Settings"
echo "6. In menu bar: Develop → Allow JavaScript from Apple Events"
echo "   (Make sure it's checked ✓)"
echo ""
echo "Press ENTER after you've enabled these settings..."
read

echo ""
echo "Great! Now running the demo..."
echo ""

# Run the demo
/Users/alexanderfedin/Projects/hackathons/demo.sh
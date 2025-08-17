#!/usr/bin/osascript

-- Simple HubSpot Demo for Safari

on run
	-- Show introduction
	display dialog "🎯 HUBSPOT DEMO" & return & return & ¬
		"This will open HubSpot in Safari." & return & return & ¬
		"You'll need to log in manually if not already logged in." & return & return & ¬
		"Click OK to continue" buttons {"Cancel", "OK"} default button "OK" with title "HubSpot Demo"
	
	-- Open Safari with HubSpot
	tell application "Safari"
		activate
		
		-- Open new window with HubSpot
		open location "https://app.hubspot.com"
		
		delay 2
		
		display notification "HubSpot opened in Safari" with title "Demo"
	end tell
	
	-- Wait a moment
	delay 3
	
	-- Show next steps
	display dialog "✅ Safari is now open with HubSpot!" & return & return & ¬
		"Next steps:" & return & ¬
		"1. Log in if needed (use your credentials)" & return & ¬
		"2. Navigate to Contacts" & return & ¬
		"3. Explore the CRM features" & return & return & ¬
		"The browser will remain open." buttons {"OK"} default button "OK" with title "Demo Ready"
	
end run
#!/usr/bin/osascript

-- HubSpot Demo using Apple Automation
-- This script automates HubSpot login and navigation using Safari

on run
	-- Configuration
	set hubspotEmail to "af@o2.services"
	set hubspotPassword to "Vilisaped1!"
	set delayTime to 2
	
	-- Display demo introduction
	display dialog "🎯 HUBSPOT AI DEMO" & return & return & ¬
		"This demo will:" & return & ¬
		"1. Open HubSpot in Safari" & return & ¬
		"2. Log in automatically" & return & ¬
		"3. Navigate to Contacts" & return & ¬
		"4. Show AI agent capabilities" & return & return & ¬
		"Click OK to start the demo" buttons {"Cancel", "OK"} default button "OK" with title "HubSpot Demo"
	
	-- Open Safari and navigate to HubSpot
	tell application "Safari"
		activate
		
		-- Create new window if needed
		if (count of windows) = 0 then
			make new document
		end if
		
		-- Navigate to HubSpot login
		set URL of document 1 to "https://app.hubspot.com/login"
		
		-- Wait for page to load
		delay delayTime
		repeat until (do JavaScript "document.readyState" in current tab of window 1) is "complete"
			delay 0.5
		end repeat
		
		-- Additional wait for dynamic content
		delay delayTime
		
		try
			-- Check if we need to login
			set needsLogin to do JavaScript "document.querySelector('input[type=\"email\"]') !== null" in current tab of window 1
			
			if needsLogin then
				-- Fill in email
				do JavaScript "
					var emailInput = document.querySelector('input[type=\"email\"]');
					if (emailInput) {
						emailInput.value = '" & hubspotEmail & "';
						emailInput.dispatchEvent(new Event('input', { bubbles: true }));
						emailInput.dispatchEvent(new Event('change', { bubbles: true }));
					}
				" in current tab of window 1
				
				delay 1
				
				-- Click next/continue button
				do JavaScript "
					var buttons = Array.from(document.querySelectorAll('button'));
					var nextButton = buttons.find(btn => 
						btn.textContent.toLowerCase().includes('next') || 
						btn.textContent.toLowerCase().includes('continue') ||
						btn.textContent.toLowerCase().includes('log in')
					);
					if (nextButton) nextButton.click();
				" in current tab of window 1
				
				delay delayTime
				
				-- Fill in password
				do JavaScript "
					var passwordInput = document.querySelector('input[type=\"password\"]');
					if (passwordInput) {
						passwordInput.value = '" & hubspotPassword & "';
						passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
						passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
					}
				" in current tab of window 1
				
				delay 1
				
				-- Click login button
				do JavaScript "
					var buttons = Array.from(document.querySelectorAll('button'));
					var loginButton = buttons.find(btn => 
						btn.textContent.toLowerCase().includes('log in') || 
						btn.textContent.toLowerCase().includes('sign in') ||
						btn.textContent.toLowerCase().includes('next')
					);
					if (loginButton) loginButton.click();
				" in current tab of window 1
				
				-- Wait for login to complete
				delay 5
				
				display notification "Successfully logged into HubSpot" with title "Demo Progress"
			else
				display notification "Already logged into HubSpot" with title "Demo Progress"
			end if
			
			-- Wait for dashboard to load
			delay 3
			
			-- Navigate to Contacts
			display notification "Navigating to Contacts..." with title "Demo Progress"
			set URL of document 1 to "https://app.hubspot.com/contacts"
			
			-- Wait for contacts page to load
			delay delayTime
			repeat until (do JavaScript "document.readyState" in current tab of window 1) is "complete"
				delay 0.5
			end repeat
			
			delay 3
			
			-- Show completion dialog
			display dialog "✅ Demo Complete!" & return & return & ¬
				"HubSpot is now open with the Contacts page." & return & return & ¬
				"You can now:" & return & ¬
				"• Browse contacts" & return & ¬
				"• Create tasks" & return & ¬
				"• Explore HubSpot features" & return & return & ¬
				"The browser will remain open for exploration." buttons {"OK"} default button "OK" with title "Demo Complete"
			
		on error errMsg
			display dialog "Error during demo: " & errMsg buttons {"OK"} default button "OK" with icon stop
		end try
		
	end tell
	
end run
#!/usr/bin/env osascript -l JavaScript

// HubSpot Demo using JavaScript for Automation (JXA)
// Run with: osascript -l JavaScript hubspot-demo.jxa.js

function run() {
    // Configuration
    const hubspotEmail = "af@o2.services";
    const hubspotPassword = "Vilisaped1!";
    const delaySeconds = 2;
    
    // Get Safari application
    const Safari = Application("Safari");
    const SystemEvents = Application("System Events");
    
    Safari.includeStandardAdditions = true;
    SystemEvents.includeStandardAdditions = true;
    
    // Show introduction dialog
    const app = Application.currentApplication();
    app.includeStandardAdditions = true;
    
    const result = app.displayDialog(
        "🎯 HUBSPOT AI DEMO\n\n" +
        "This demo will:\n" +
        "1. Open HubSpot in Safari\n" +
        "2. Log in automatically\n" +
        "3. Navigate to Contacts\n" +
        "4. Show AI agent capabilities\n\n" +
        "Click OK to start the demo",
        {
            buttons: ["Cancel", "OK"],
            defaultButton: "OK",
            withTitle: "HubSpot Demo"
        }
    );
    
    if (result.buttonReturned === "Cancel") {
        return;
    }
    
    // Activate Safari
    Safari.activate();
    delay(1);
    
    // Create new window if needed
    if (Safari.windows.length === 0) {
        Safari.Document().make();
    }
    
    // Get the front window
    const window = Safari.windows[0];
    
    // Navigate to HubSpot
    window.currentTab.url = "https://app.hubspot.com/login";
    
    // Wait for page load
    delay(delaySeconds);
    
    // Wait for document ready
    while (true) {
        try {
            const state = Safari.doJavaScript("document.readyState", { in: window.currentTab });
            if (state === "complete") break;
        } catch (e) {
            // Page still loading
        }
        delay(0.5);
    }
    
    delay(delaySeconds);
    
    try {
        // Check if login is needed
        const needsLogin = Safari.doJavaScript(
            "document.querySelector('input[type=\"email\"]') !== null",
            { in: window.currentTab }
        );
        
        if (needsLogin) {
            // Fill email field
            Safari.doJavaScript(`
                var emailInput = document.querySelector('input[type="email"]');
                if (emailInput) {
                    emailInput.value = '${hubspotEmail}';
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            `, { in: window.currentTab });
            
            delay(1);
            
            // Click next button
            Safari.doJavaScript(`
                var buttons = Array.from(document.querySelectorAll('button'));
                var nextButton = buttons.find(btn => 
                    btn.textContent.toLowerCase().includes('next') || 
                    btn.textContent.toLowerCase().includes('continue') ||
                    btn.textContent.toLowerCase().includes('log in')
                );
                if (nextButton) nextButton.click();
            `, { in: window.currentTab });
            
            delay(delaySeconds);
            
            // Fill password field
            Safari.doJavaScript(`
                var passwordInput = document.querySelector('input[type="password"]');
                if (passwordInput) {
                    passwordInput.value = '${hubspotPassword}';
                    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            `, { in: window.currentTab });
            
            delay(1);
            
            // Click login button
            Safari.doJavaScript(`
                var buttons = Array.from(document.querySelectorAll('button'));
                var loginButton = buttons.find(btn => 
                    btn.textContent.toLowerCase().includes('log in') || 
                    btn.textContent.toLowerCase().includes('sign in') ||
                    btn.textContent.toLowerCase().includes('next')
                );
                if (loginButton) loginButton.click();
            `, { in: window.currentTab });
            
            // Wait for login
            delay(5);
            
            app.displayNotification("Successfully logged into HubSpot", {
                withTitle: "Demo Progress"
            });
        } else {
            app.displayNotification("Already logged into HubSpot", {
                withTitle: "Demo Progress"
            });
        }
        
        // Wait for dashboard
        delay(3);
        
        // Navigate to Contacts
        app.displayNotification("Navigating to Contacts...", {
            withTitle: "Demo Progress"
        });
        
        window.currentTab.url = "https://app.hubspot.com/contacts";
        
        // Wait for contacts page
        delay(delaySeconds);
        
        while (true) {
            try {
                const state = Safari.doJavaScript("document.readyState", { in: window.currentTab });
                if (state === "complete") break;
            } catch (e) {
                // Page still loading
            }
            delay(0.5);
        }
        
        delay(3);
        
        // Show completion
        app.displayDialog(
            "✅ Demo Complete!\n\n" +
            "HubSpot is now open with the Contacts page.\n\n" +
            "You can now:\n" +
            "• Browse contacts\n" +
            "• Create tasks\n" +
            "• Explore HubSpot features\n\n" +
            "The browser will remain open for exploration.",
            {
                buttons: ["OK"],
                defaultButton: "OK",
                withTitle: "Demo Complete"
            }
        );
        
    } catch (error) {
        app.displayDialog("Error during demo: " + error.toString(), {
            buttons: ["OK"],
            defaultButton: "OK",
            withIcon: "stop"
        });
    }
}

// Run the demo
run();
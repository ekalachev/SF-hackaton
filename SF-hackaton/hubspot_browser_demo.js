const puppeteer = require('puppeteer');
const path = require('path');

async function openHubSpotBrowser() {
    try {
        console.log('Launching browser...');
        
        // Launch browser with specified options
        const browser = await puppeteer.launch({
            headless: false,  // Visible browser
            defaultViewport: null,  // Use default viewport
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: [
                '--window-size=1920,1080',
                '--window-position=100,50'
            ]
        });

        const page = await browser.newPage();
        
        console.log('Navigating to HubSpot...');
        
        // Navigate to HubSpot
        await page.goto('https://app-na2.hubspot.com', {
            waitUntil: 'networkidle0'
        });
        
        console.log('Waiting 3 seconds for page to load...');
        
        // Wait 3 seconds for the page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('Taking screenshot...');
        
        // Take a screenshot named 'hubspot_home'
        const screenshotPath = path.join(__dirname, 'hubspot_home.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        
        console.log(`Screenshot saved to: ${screenshotPath}`);
        console.log('Browser opened with HubSpot');
        
        // Keep the browser open (don't close automatically)
        // await browser.close();
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the function
openHubSpotBrowser();
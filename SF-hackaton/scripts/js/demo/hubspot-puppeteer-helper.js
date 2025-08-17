const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;
const path = require('path');

const COOKIES_PATH = path.join(__dirname, 'hubspot-cookies.json');

async function autoLoginToHubSpot() {
  const email = 'af@o2.services';
  const password = 'Vilisaped1!';
  
  // First navigate to HubSpot
  await mcp__puppeteer__puppeteer_navigate({ 
    url: 'https://app.hubspot.com',
    launchOptions: {
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });
  
  // Wait a moment to see if we're redirected to login
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if we're on login page
  const currentUrl = await mcp__puppeteer__puppeteer_evaluate({ 
    script: 'window.location.href' 
  });
  
  if (currentUrl.includes('/login')) {
    console.log('Need to login, performing auto-login...');
    
    // Fill in email
    await mcp__puppeteer__puppeteer_fill({
      selector: 'input[id="username"]',
      value: email
    });
    
    // Fill in password
    await mcp__puppeteer__puppeteer_fill({
      selector: 'input[id="password"]',
      value: password
    });
    
    // Click login button
    await mcp__puppeteer__puppeteer_click({
      selector: 'button[id="loginBtn"]'
    });
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Login completed!');
  } else {
    console.log('Already logged in!');
  }
}

// Export for use in other scripts
module.exports = { autoLoginToHubSpot };

// CLI usage
if (require.main === module) {
  console.log(`
To use this with MCP Puppeteer:

1. First navigate to HubSpot:
   await mcp__puppeteer__puppeteer_navigate({ url: 'https://app.hubspot.com' });

2. Check if login is needed and auto-fill:
   // If redirected to login page, use:
   await mcp__puppeteer__puppeteer_fill({ selector: 'input[id="username"]', value: 'af@o2.services' });
   await mcp__puppeteer__puppeteer_fill({ selector: 'input[id="password"]', value: 'Vilisaped1!' });
   await mcp__puppeteer__puppeteer_click({ selector: 'button[id="loginBtn"]' });
  `);
}
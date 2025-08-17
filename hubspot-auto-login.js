const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;
const path = require('path');

const COOKIES_PATH = path.join(__dirname, 'hubspot-cookies.json');
const USER_DATA_DIR = path.join(__dirname, 'hubspot-user-data');

async function loginToHubSpot(page, email, password) {
  console.log('Performing HubSpot login...');
  
  // Type email - look for the email input field
  await new Promise(resolve => setTimeout(resolve, 2000));
  const emailInput = await page.$('input[type="email"]') || 
                     await page.$('input[name="email"]') || 
                     await page.$('input[id="username"]');
  
  if (emailInput) {
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email);
    console.log('Entered email');
    
    // Click Next button
    await new Promise(resolve => setTimeout(resolve, 1000));
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('next')) {
        await button.click();
        console.log('Clicked Next button');
        break;
      }
    }
    
    // Wait for password field
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Type password
    const passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(password);
    console.log('Entered password');
    
    // Click login button - usually it's the same Next button or a Log in button
    await new Promise(resolve => setTimeout(resolve, 1000));
    const loginButtons = await page.$$('button');
    for (const button of loginButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && (text.toLowerCase().includes('log in') || text.toLowerCase().includes('next') || text.toLowerCase().includes('sign in'))) {
        await button.click();
        console.log('Clicked login button');
        break;
      }
    }
  } else {
    console.log('Could not find email input field');
  }
  
  try {
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    console.log('Login successful!');
    
    const cookies = await page.cookies();
    await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved for future sessions');
    
  } catch (error) {
    console.log('Waiting for authentication to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function loadCookies(page) {
  try {
    const cookiesString = await fs.readFile(COOKIES_PATH, 'utf8');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    console.log('Loaded saved cookies');
    return true;
  } catch (error) {
    console.log('No saved cookies found');
    return false;
  }
}

async function openHubSpotWithAuth(email = 'af@o2.services', password = 'Vilisaped1!') {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    userDataDir: USER_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  const hasExistingSession = await loadCookies(page);
  
  await page.goto('https://app.hubspot.com', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  // Wait a bit to see if we're redirected
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const currentUrl = await page.url();
  console.log('Current URL:', currentUrl);
  
  // Check if we're on the login page or if email input exists
  const needsLogin = currentUrl.includes('/login') || 
                     await page.$('input[type="email"]') !== null ||
                     await page.$('input[name="email"]') !== null;
  
  if (needsLogin) {
    console.log('Login required, performing authentication...');
    await loginToHubSpot(page, email, password);
  } else {
    console.log('Already logged in!');
  }
  
  return { browser, page };
}

async function main() {
  try {
    const { browser, page } = await openHubSpotWithAuth();
    console.log('HubSpot is now open with authentication');
    
    // Keep the browser open
    console.log('Browser will remain open. Press Ctrl+C to exit.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { openHubSpotWithAuth, loginToHubSpot, loadCookies };
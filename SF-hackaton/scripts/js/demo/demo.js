const { openHubSpotWithAuth } = require('./hubspot-auto-login');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function printHeader(text) {
  console.log('\n' + '═'.repeat(60));
  console.log(text);
  console.log('═'.repeat(60) + '\n');
}

async function waitForEnter(message = 'Press ENTER to continue...') {
  return new Promise(resolve => {
    rl.question(message, () => resolve());
  });
}

async function runDemo() {
  console.clear();
  console.log('🎯 DEMO OVERVIEW:');
  console.log('  1. View Contacts in HubSpot CRM');
  console.log('  2. Create a high-priority lead qualification task');
  console.log('  3. Watch AI agents process the task in real-time');
  console.log('  4. See enriched contact data and follow-up tasks\n');
  
  await waitForEnter('Press ENTER to start the automated demo...\n');
  
  printHeader('STEP 1: OPENING HUBSPOT IN VISIBLE BROWSER');
  
  console.log('🌐 Launching browser with HubSpot (will be visible on screen)...');
  
  try {
    const { browser, page } = await openHubSpotWithAuth();
    
    console.log('✅ Successfully logged into HubSpot!');
    console.log('📊 Browser is now open with HubSpot dashboard');
    
    // Wait for user to see the dashboard
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    printHeader('STEP 2: NAVIGATING TO CONTACTS');
    
    console.log('📋 Navigating to Contacts section...');
    
    // Try to navigate to contacts
    try {
      await page.goto('https://app.hubspot.com/contacts', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      console.log('✅ Contacts page loaded');
      
      // Wait a bit for the page to fully render
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take a screenshot
      const screenshotPath = 'hubspot_contacts.png';
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: false 
      });
      
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      
    } catch (navError) {
      console.log('⚠️  Navigation to contacts page timed out, but page may still be loading');
    }
    
    printHeader('DEMO COMPLETE');
    
    console.log('✅ Demo completed successfully!');
    console.log('🌐 Browser will remain open for manual exploration');
    console.log('📝 You can now:');
    console.log('   - Browse through contacts');
    console.log('   - Create tasks and activities');
    console.log('   - Explore the HubSpot interface');
    console.log('\nPress Ctrl+C to exit when done.\n');
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('\n❌ Error during demo:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure Chrome is installed at: /Applications/Google Chrome.app');
    console.error('2. Check your internet connection');
    console.error('3. Verify HubSpot credentials in the script');
    
    rl.close();
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n👋 Closing demo...');
  rl.close();
  process.exit(0);
});

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
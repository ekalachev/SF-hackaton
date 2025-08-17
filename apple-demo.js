#!/usr/bin/env node

const { exec } = require('child_process');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function printHeader(text) {
  console.log('\n' + '═'.repeat(60));
  console.log(text);
  console.log('═'.repeat(60) + '\n');
}

async function runAppleScript(scriptPath) {
  return new Promise((resolve, reject) => {
    exec(`osascript "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        // Check if user cancelled
        if (stderr.includes('User canceled') || stderr.includes('-128')) {
          reject(new Error('User cancelled the demo'));
        } else {
          reject(error);
        }
      } else {
        resolve(stdout);
      }
    });
  });
}

async function runJXAScript(scriptPath) {
  return new Promise((resolve, reject) => {
    exec(`osascript -l JavaScript "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        // Check if user cancelled
        if (stderr.includes('User canceled') || stderr.includes('-128')) {
          reject(new Error('User cancelled the demo'));
        } else {
          reject(error);
        }
      } else {
        resolve(stdout);
      }
    });
  });
}

async function waitForEnter(message = 'Press ENTER to continue...') {
  return new Promise(resolve => {
    rl.question(message, () => resolve());
  });
}

async function main() {
  console.clear();
  
  printHeader('🍎 HUBSPOT DEMO - APPLE AUTOMATION');
  
  console.log('This demo uses native macOS automation to control Safari.');
  console.log('No additional browser drivers or dependencies required!\n');
  
  console.log('Choose automation type:');
  console.log('1. AppleScript (Traditional)');
  console.log('2. JavaScript for Automation (JXA)');
  console.log('3. Exit\n');
  
  const choice = await new Promise(resolve => {
    rl.question('Enter your choice (1-3): ', answer => resolve(answer));
  });
  
  let scriptPath;
  let scriptType;
  
  switch (choice) {
    case '1':
      scriptPath = path.join(__dirname, 'hubspot-demo.applescript');
      scriptType = 'AppleScript';
      break;
    case '2':
      scriptPath = path.join(__dirname, 'hubspot-demo.jxa.js');
      scriptType = 'JXA';
      break;
    case '3':
      console.log('\n👋 Goodbye!');
      rl.close();
      process.exit(0);
    default:
      console.log('\n❌ Invalid choice. Please run again and select 1, 2, or 3.');
      rl.close();
      process.exit(1);
  }
  
  printHeader(`RUNNING ${scriptType} DEMO`);
  
  console.log(`📜 Executing ${scriptType} automation...`);
  console.log('⚠️  You may need to grant Terminal/VS Code accessibility permissions');
  console.log('   in System Preferences > Security & Privacy > Privacy > Accessibility\n');
  
  try {
    if (scriptType === 'AppleScript') {
      await runAppleScript(scriptPath);
    } else {
      await runJXAScript(scriptPath);
    }
    
    console.log('\n✅ Demo completed successfully!');
    console.log('🌐 Safari remains open with HubSpot for your exploration.');
    
  } catch (error) {
    if (error.message === 'User cancelled the demo') {
      console.log('\n⚠️  Demo cancelled by user.');
    } else {
      console.error('\n❌ Error running demo:', error.message);
      console.error('\nTroubleshooting:');
      console.error('1. Grant accessibility permissions to Terminal/VS Code');
      console.error('2. Make sure Safari is installed');
      console.error('3. Check your internet connection');
      console.error('4. Try running with: osascript hubspot-demo.applescript');
    }
  }
  
  rl.close();
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n👋 Closing demo...');
  rl.close();
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
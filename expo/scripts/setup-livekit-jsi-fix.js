#!/usr/bin/env node

/**
 * Manual setup script for LiveKit JSI fix
 * Run this after npx expo prebuild if the config plugin doesn't work
 * 
 * Usage: node scripts/setup-livekit-jsi-fix.js
 */

const fs = require('fs');
const path = require('path');

const iosPath = path.join(process.cwd(), 'ios');

if (!fs.existsSync(iosPath)) {
  console.log('❌ iOS directory not found. Run "npx expo prebuild" first.');
  process.exit(1);
}

const podfilePath = path.join(iosPath, 'Podfile');
const appDelegateSwiftPath = path.join(iosPath, 'UniPilot', 'AppDelegate.swift');
const appDelegateObjCPath = path.join(iosPath, 'UniPilot', 'AppDelegate.m');

let changesMade = false;

// 1. Update Podfile
if (fs.existsSync(podfilePath)) {
  let podfileContent = fs.readFileSync(podfilePath, 'utf8');
  
  if (!podfileContent.includes('HERMES_ENABLE_DEBUG=1')) {
    // Find post_install block and add the setting
    const postInstallPattern = /(post_install do \|installer\|[\s\S]*?installer\.pods_project\.targets\.each do \|target\|[\s\S]*?target\.build_configurations\.each do \|config\|[\s\S]*?)(config\.build_settings)/;
    
    if (postInstallPattern.test(podfileContent)) {
      podfileContent = podfileContent.replace(
        /(config\.build_settings\['GCC_PREPROCESSOR_DEFINITIONS'\])/,
        "config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']\n        $1"
      );
      
      // If the above didn't match, try adding it before config.build_settings
      if (!podfileContent.includes('HERMES_ENABLE_DEBUG=1')) {
        podfileContent = podfileContent.replace(
          /(target\.build_configurations\.each do \|config\|[\s\S]*?)(config\.build_settings)/,
          "$1        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']\n        $2"
        );
      }
      
      fs.writeFileSync(podfilePath, podfileContent, 'utf8');
      console.log('✅ Added HERMES_ENABLE_DEBUG to Podfile');
      changesMade = true;
    } else {
      console.log('⚠️  Could not find post_install block in Podfile. Please add manually:');
      console.log("   config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']");
    }
  } else {
    console.log('✓ HERMES_ENABLE_DEBUG already in Podfile');
  }
} else {
  console.log('⚠️  Podfile not found at:', podfilePath);
}

// 2. Update AppDelegate
let appDelegatePath = null;
if (fs.existsSync(appDelegateSwiftPath)) {
  appDelegatePath = appDelegateSwiftPath;
} else if (fs.existsSync(appDelegateObjCPath)) {
  appDelegatePath = appDelegateObjCPath;
}

if (appDelegatePath) {
  let appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');
  const isSwift = appDelegatePath.endsWith('.swift');
  
  if (!appDelegateContent.includes('LiveKitClient.setOptions') && !appDelegateContent.includes('hermesDebug')) {
    if (isSwift) {
      // Add import
      if (!appDelegateContent.includes('import LiveKit')) {
        appDelegateContent = appDelegateContent.replace(
          /(import.*\n)/,
          "$1import LiveKit\n"
        );
      }
      
      // Add setOptions in didFinishLaunchingWithOptions
      const didFinishPattern = /(func application\(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: \[UIApplication\.LaunchOptionsKey: Any\]\? = nil\) -> Bool \{[\s\S]*?)(return true)/;
      
      if (didFinishPattern.test(appDelegateContent)) {
        appDelegateContent = appDelegateContent.replace(
          didFinishPattern,
          "$1    // Fix for LiveKit New Architecture JSI use-after-free crash\n    LiveKitClient.setOptions(.init(hermesDebug: true))\n    $2"
        );
      } else {
        // Try to add in init
        appDelegateContent = appDelegateContent.replace(
          /(override init\(\) \{[\s\S]*?)(super\.init\(\))/,
          "$1$2\n        // Fix for LiveKit New Architecture JSI use-after-free crash\n        LiveKitClient.setOptions(.init(hermesDebug: true))"
        );
      }
    } else {
      // Objective-C
      if (!appDelegateContent.includes('#import <LiveKit')) {
        appDelegateContent = appDelegateContent.replace(
          /(#import.*\n)/,
          "$1#import <LiveKit/LiveKit-Swift.h>\n"
        );
      }
      
      appDelegateContent = appDelegateContent.replace(
        /(- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions \{[\s\S]*?)(return YES)/,
        "$1    // Fix for LiveKit New Architecture JSI use-after-free crash\n    [LiveKitClient setOptionsWithOptions:[[LKClientOptions alloc] initWithHermesDebug:YES]];\n    $2"
      );
    }
    
    fs.writeFileSync(appDelegatePath, appDelegateContent, 'utf8');
    console.log('✅ Added LiveKitClient.setOptions to AppDelegate');
    changesMade = true;
  } else {
    console.log('✓ LiveKitClient.setOptions already in AppDelegate');
  }
} else {
  console.log('⚠️  AppDelegate not found. Expected at:');
  console.log('   ', appDelegateSwiftPath);
  console.log('   or');
  console.log('   ', appDelegateObjCPath);
}

if (changesMade) {
  console.log('\n✅ Setup complete! Next steps:');
  console.log('   1. cd ios && pod install && cd ..');
  console.log('   2. Rebuild your app');
} else {
  console.log('\n✓ All changes already applied');
}


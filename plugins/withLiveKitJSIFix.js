const fs = require('fs');
const path = require('path');

// Try to require @expo/config-plugins, fallback if not available
let withDangerousMod;
try {
  withDangerousMod = require('@expo/config-plugins').withDangerousMod;
} catch (e) {
  console.warn('@expo/config-plugins not found, plugin will be skipped. Install it or apply changes manually.');
  // Return a no-op plugin
  module.exports = (config) => config;
}

/**
 * Expo config plugin to fix LiveKit JSI use-after-free crashes in New Architecture
 * 
 * This plugin:
 * 1. Adds HERMES_ENABLE_DEBUG to Podfile post_install
 * 2. Adds LiveKitClient.setOptions with hermesDebug to AppDelegate
 */
const withLiveKitJSIFix = (config) => {
  if (!withDangerousMod) {
    return config;
  }
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosPath = config.modRequest.platformProjectRoot;
      const podfilePath = path.join(iosPath, 'Podfile');
      const appDelegatePath = path.join(iosPath, 'UniPilot', 'AppDelegate.swift');
      const appDelegateObjCPath = path.join(iosPath, 'UniPilot', 'AppDelegate.m');

      // 1. Update Podfile
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Check if HERMES_ENABLE_DEBUG is already added
        if (!podfileContent.includes('HERMES_ENABLE_DEBUG=1')) {
          // Find the post_install block and add the setting
          const postInstallRegex = /(post_install do \|installer\|[\s\S]*?config\.build_settings\['GCC_PREPROCESSOR_DEFINITIONS'\])/;
          const postInstallWithExisting = /(post_install do \|installer\|[\s\S]*?)(installer\.pods_project\.targets\.each do \|target\|)/;
          
          if (postInstallRegex.test(podfileContent)) {
            // Add to existing GCC_PREPROCESSOR_DEFINITIONS
            podfileContent = podfileContent.replace(
              /(config\.build_settings\['GCC_PREPROCESSOR_DEFINITIONS'\])/,
              "$1 ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']"
            );
          } else if (postInstallWithExisting.test(podfileContent)) {
            // Add new line before installer.pods_project
            podfileContent = podfileContent.replace(
              postInstallWithExisting,
              `$1    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']\n    $2`
            );
          } else {
            // Add to end of post_install block
            podfileContent = podfileContent.replace(
              /(post_install do \|installer\|[\s\S]*?)(end)/,
              `$1    config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)', 'HERMES_ENABLE_DEBUG=1']\n  $2`
            );
          }
          
          fs.writeFileSync(podfilePath, podfileContent, 'utf8');
          console.log('✅ Added HERMES_ENABLE_DEBUG to Podfile');
        }
      }

      // 2. Update AppDelegate.swift or AppDelegate.m
      let appDelegatePathToUse = null;
      if (fs.existsSync(appDelegatePath)) {
        appDelegatePathToUse = appDelegatePath;
      } else if (fs.existsSync(appDelegateObjCPath)) {
        appDelegatePathToUse = appDelegateObjCPath;
      }

      if (appDelegatePathToUse) {
        let appDelegateContent = fs.readFileSync(appDelegatePathToUse, 'utf8');
        
        // Check if LiveKitClient.setOptions is already added
        if (!appDelegateContent.includes('LiveKitClient.setOptions') && !appDelegateContent.includes('hermesDebug')) {
          const isSwift = appDelegatePathToUse.endsWith('.swift');
          
          if (isSwift) {
            // For Swift AppDelegate
            // Find didFinishLaunchingWithOptions or application:didFinishLaunchingWithOptions
            const swiftImportRegex = /(import.*LiveKit.*\n)/;
            const swiftDidFinishRegex = /(func application\(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: \[UIApplication\.LaunchOptionsKey: Any\]\? = nil\) -> Bool \{[\s\S]*?)(return true)/;
            
            // Add import if not present
            if (!appDelegateContent.includes('import LiveKit')) {
              appDelegateContent = appDelegateContent.replace(
                /(import.*\n)/,
                "$1import LiveKit\n"
              );
            }
            
            // Add setOptions call
            if (swiftDidFinishRegex.test(appDelegateContent)) {
              appDelegateContent = appDelegateContent.replace(
                swiftDidFinishRegex,
                `$1    // Fix for LiveKit New Architecture JSI use-after-free crash\n    LiveKitClient.setOptions(.init(hermesDebug: true))\n    $2`
              );
            } else {
              // Add at the beginning of the class
              appDelegateContent = appDelegateContent.replace(
                /(class.*AppDelegate.*\{[\s\S]*?)(func application)/,
                `$1    override init() {\n        super.init()\n        // Fix for LiveKit New Architecture JSI use-after-free crash\n        LiveKitClient.setOptions(.init(hermesDebug: true))\n    }\n    \n    $2`
              );
            }
          } else {
            // For Objective-C AppDelegate
            const objcImportRegex = /(#import.*LiveKit.*\n)/;
            const objcDidFinishRegex = /(- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions \{[\s\S]*?)(return YES)/;
            
            // Add import if not present
            if (!appDelegateContent.includes('#import <LiveKit')) {
              appDelegateContent = appDelegateContent.replace(
                /(#import.*\n)/,
                "$1#import <LiveKit/LiveKit-Swift.h>\n"
              );
            }
            
            // Add setOptions call
            if (objcDidFinishRegex.test(appDelegateContent)) {
              appDelegateContent = appDelegateContent.replace(
                objcDidFinishRegex,
                `$1    // Fix for LiveKit New Architecture JSI use-after-free crash\n    [LiveKitClient setOptionsWithOptions:[[LKClientOptions alloc] initWithHermesDebug:YES]];\n    $2`
              );
            }
          }
          
          fs.writeFileSync(appDelegatePathToUse, appDelegateContent, 'utf8');
          console.log('✅ Added LiveKitClient.setOptions to AppDelegate');
        }
      }

      return config;
    },
  ]);
};

module.exports = withLiveKitJSIFix;


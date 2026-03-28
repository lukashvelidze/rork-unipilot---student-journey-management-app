const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Expo config plugin to forcefully disable React Native New Architecture
 * by setting RCT_NEW_ARCH_ENABLED=0 in Xcode build settings.
 * 
 * This ensures that even if Expo generates some New Architecture code,
 * it will be disabled at compile time, preventing folly/coro errors.
 */
module.exports = function withDisableNewArch(config) {
  return withXcodeProject(config, (cfg) => {
    const xcodeProject = cfg.modResults;

    // Helper function to safely update GCC_PREPROCESSOR_DEFINITIONS
    const updateDefinitions = (configName) => {
      // Get existing definitions
      let existingDefs = xcodeProject.getBuildProperty('GCC_PREPROCESSOR_DEFINITIONS', configName);
      
      // Normalize to array format
      let defsArray = [];
      if (existingDefs) {
        if (typeof existingDefs === 'string') {
          // Split by space and filter empty strings
          defsArray = existingDefs.split(/\s+/).filter(d => d.length > 0);
        } else if (Array.isArray(existingDefs)) {
          defsArray = [...existingDefs];
        }
      }
      
      // Check if RCT_NEW_ARCH_ENABLED is already present
      const hasNewArchFlag = defsArray.some(def => 
        def.includes('RCT_NEW_ARCH_ENABLED')
      );
      
      // Add the flag if not present
      if (!hasNewArchFlag) {
        defsArray.push('RCT_NEW_ARCH_ENABLED=0');
      } else {
        // Replace existing RCT_NEW_ARCH_ENABLED with =0
        defsArray = defsArray.map(def => 
          def.includes('RCT_NEW_ARCH_ENABLED') ? 'RCT_NEW_ARCH_ENABLED=0' : def
        );
      }
      
      // Set the updated definitions (Xcode expects space-separated string)
      xcodeProject.addBuildProperty(
        'GCC_PREPROCESSOR_DEFINITIONS',
        defsArray.join(' '),
        configName
      );
    };

    // Update for both Debug and Release configurations
    updateDefinitions('Debug');
    updateDefinitions('Release');

    return cfg;
  });
};

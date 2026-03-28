#!/bin/bash

# Script to clean all entitlements files and force Expo to regenerate them
# Run this before npx expo prebuild --clean

echo "🧹 Cleaning entitlements files..."

# Find and delete all entitlements files
find ios -name "*.entitlements" -type f -delete 2>/dev/null || true

# Also clean any malformed Info.plist files if they exist
# (Uncomment if needed)
# find ios -name "Info.plist" -type f -delete 2>/dev/null || true

echo "✅ Entitlements files cleaned"
echo "📦 Run: npx expo prebuild --clean"


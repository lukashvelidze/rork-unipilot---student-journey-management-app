# PowerShell script to clean all entitlements files and force Expo to regenerate them
# Run this before npx expo prebuild --clean

Write-Host "🧹 Cleaning entitlements files..." -ForegroundColor Cyan

# Find and delete all entitlements files
Get-ChildItem -Path ios -Filter "*.entitlements" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Also clean any malformed Info.plist files if they exist
# (Uncomment if needed)
# Get-ChildItem -Path ios -Filter "Info.plist" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "✅ Entitlements files cleaned" -ForegroundColor Green
Write-Host "📦 Run: npx expo prebuild --clean" -ForegroundColor Yellow


# Build Guide

This comprehensive guide covers building UniPilot for production deployment on iOS, Android, and Web platforms, including store submission requirements and best practices.

## 🏗️ Build Overview

UniPilot uses Expo's build system for creating production-ready applications. The build process varies by platform but follows consistent patterns for configuration and deployment.

## 📋 Pre-Build Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests passing (unit and integration)
- [ ] Performance optimizations applied
- [ ] Security audit completed

### Configuration
- [ ] Environment variables configured for production
- [ ] App version updated in `app.json`
- [ ] Build profiles configured in `eas.json`
- [ ] Assets optimized (images, icons, splash screens)
- [ ] Permissions properly configured

### Testing
- [ ] Tested on physical devices
- [ ] Cross-platform compatibility verified
- [ ] Payment flow tested with Paddle
- [ ] Offline functionality verified
- [ ] Performance benchmarks met

## 📱 iOS Build Process

### Prerequisites

1. **Apple Developer Account**: Active Apple Developer Program membership
2. **Certificates**: iOS Distribution Certificate
3. **Provisioning Profiles**: App Store provisioning profile
4. **App Store Connect**: App created in App Store Connect

### Build Configuration

#### 1. Update app.json

```json
{
  "expo": {
    "name": "UniPilot - Student Journey Management App",
    "slug": "unipilot-student-journey-management-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "app.rork.unipilot-student-journey-management-app",
      "buildNumber": "1",
      "supportsTablet": true,
      "requireFullScreen": false,
      "userInterfaceStyle": "automatic",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses camera to scan documents",
        "NSPhotoLibraryUsageDescription": "This app accesses photo library to upload documents",
        "NSLocationWhenInUseUsageDescription": "This app uses location to find nearby services"
      }
    }
  }
}
```

#### 2. Configure EAS Build (eas.json)

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium",
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium",
        "autoIncrement": "buildNumber"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

### Build Commands

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS App Store
eas build --platform ios --profile production

# Build for TestFlight (internal testing)
eas build --platform ios --profile preview
```

### iOS App Store Submission

#### 1. App Store Connect Setup

1. **Create App**: Set up app in App Store Connect
2. **App Information**: Fill in app details, categories, keywords
3. **Pricing**: Set pricing tier (free with in-app purchases)
4. **App Review Information**: Provide review notes and demo account

#### 2. App Store Metadata

```
App Name: UniPilot - Study Abroad Guide
Subtitle: Your AI-powered study abroad companion
Keywords: study abroad, university, student, education, visa, international
Category: Education
Age Rating: 4+ (suitable for all ages)

Description:
UniPilot is the ultimate companion for international students pursuing their dreams of studying abroad. From university research to visa applications, we guide you through every step of your journey.

🎓 FEATURES:
• University research and comparison tools
• Step-by-step application guidance
• Visa and travel planning assistance
• AI-powered personal assistant
• Community support from fellow students
• Document management and tracking

🌟 PREMIUM FEATURES:
• Advanced journey stages (post-acceptance)
• Unlimited AI assistance
• Priority expert support
• Exclusive resources and guides

Whether you're just starting your research or preparing for departure, UniPilot provides the tools, guidance, and community support you need to succeed.

Download UniPilot today and turn your study abroad dreams into reality!
```

#### 3. Screenshots and Assets

**Required Screenshots (per device type):**
- iPhone 6.7": 1290 x 2796 pixels (3 screenshots minimum)
- iPhone 6.5": 1242 x 2688 pixels
- iPhone 5.5": 1242 x 2208 pixels
- iPad Pro (6th gen): 2048 x 2732 pixels
- iPad Pro (2nd gen): 2048 x 2732 pixels

**App Icon:**
- 1024 x 1024 pixels (PNG, no transparency)

#### 4. Submission Process

```bash
# Submit to App Store
eas submit --platform ios --profile production

# Or manual upload via Xcode/Transporter
# Download .ipa file and upload via Application Loader
```

## 🤖 Android Build Process

### Prerequisites

1. **Google Play Console Account**: Developer account with $25 registration fee
2. **Keystore**: Android signing keystore
3. **App Bundle**: Configured for Google Play

### Build Configuration

#### 1. Update app.json

```json
{
  "expo": {
    "android": {
      "package": "app.rork.unipilot-student-journey-management-app",
      "versionCode": 1,
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "playStoreUrl": "https://play.google.com/store/apps/details?id=app.rork.unipilot-student-journey-management-app"
    }
  }
}
```

#### 2. Generate Keystore

```bash
# Generate keystore (one-time setup)
keytool -genkey -v -keystore unipilot-release-key.keystore -alias unipilot-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Store keystore securely and configure in EAS
```

#### 3. EAS Configuration for Android

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production-aab": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Build Commands

```bash
# Build APK for testing
eas build --platform android --profile production

# Build AAB for Google Play Store
eas build --platform android --profile production-aab
```

### Google Play Store Submission

#### 1. Play Console Setup

1. **Create App**: Set up app in Google Play Console
2. **Store Listing**: Complete store listing information
3. **Content Rating**: Complete content rating questionnaire
4. **App Content**: Declare app content and target audience

#### 2. Store Listing Content

```
App Name: UniPilot - Study Abroad Guide
Short Description: Your AI-powered companion for studying abroad
Full Description:
UniPilot transforms the complex journey of studying abroad into a manageable, step-by-step process. Whether you're researching universities, preparing applications, or planning your move, UniPilot provides the guidance and tools you need.

🎓 KEY FEATURES:
• Comprehensive university database and comparison tools
• Step-by-step application process guidance
• Visa application and travel planning assistance
• AI-powered personal assistant for 24/7 support
• Vibrant community of international students
• Secure document storage and management

🌟 PREMIUM BENEFITS:
• Advanced post-acceptance planning stages
• Unlimited AI assistant interactions
• Priority access to education experts
• Exclusive guides and resources
• Advanced progress analytics

Join thousands of students who have successfully navigated their study abroad journey with UniPilot. Download now and take the first step toward your international education goals!

Category: Education
Tags: study abroad, university, student, education, visa, international, AI assistant
```

#### 3. Required Assets

**Screenshots:**
- Phone: 1080 x 1920 pixels (minimum 2, maximum 8)
- 7-inch tablet: 1024 x 1600 pixels
- 10-inch tablet: 1280 x 1920 pixels

**Feature Graphic:**
- 1024 x 500 pixels (PNG or JPEG)

**App Icon:**
- 512 x 512 pixels (PNG, 32-bit with alpha)

#### 4. Submission Process

```bash
# Submit to Google Play
eas submit --platform android --profile production

# Or upload manually via Play Console
```

## 🌐 Web Build Process

### Build Configuration

#### 1. Web-Specific Settings

```json
{
  "expo": {
    "web": {
      "favicon": "./assets/images/favicon.png",
      "name": "UniPilot - Study Abroad Guide",
      "shortName": "UniPilot",
      "lang": "en",
      "scope": "/",
      "themeColor": "#FF6B6B",
      "backgroundColor": "#ffffff",
      "startUrl": "/",
      "display": "standalone",
      "orientation": "portrait"
    }
  }
}
```

#### 2. Build Commands

```bash
# Build for web
npx expo export:web

# Build with optimization
npx expo export:web --optimize

# Serve locally for testing
npx serve web-build
```

### Web Deployment Options

#### 1. Static Hosting (Recommended)

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Netlify Deployment:**
```bash
# Build
npm run build:web

# Deploy via Netlify CLI or drag-and-drop
```

#### 2. CDN Configuration

```javascript
// next.config.js (if using Next.js)
module.exports = {
  assetPrefix: 'https://cdn.unipilot.com',
  images: {
    domains: ['cdn.unipilot.com'],
  },
};
```

## 🔧 Build Optimization

### Performance Optimization

#### 1. Bundle Analysis

```bash
# Analyze bundle size
npx expo export:web --analyze

# Use webpack-bundle-analyzer
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer web-build/static/js/*.js
```

#### 2. Code Splitting

```typescript
// Lazy load heavy components
const PremiumFeatures = React.lazy(() => import('./PremiumFeatures'));
const AIAssistant = React.lazy(() => import('./AIAssistant'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <PremiumFeatures />
</Suspense>
```

#### 3. Asset Optimization

```bash
# Optimize images
npx expo optimize

# Compress assets
npm install -g imagemin-cli
imagemin assets/images/* --out-dir=assets/images/optimized
```

### Security Hardening

#### 1. Environment Variables

```bash
# Production environment check
if (process.env.NODE_ENV === 'production') {
  // Remove debug code
  console.log = () => {};
  console.warn = () => {};
}
```

#### 2. Code Obfuscation

```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      mangle: {
        keep_fnames: true,
      },
    },
  },
};
```

## 📊 Build Monitoring

### Build Analytics

```bash
# Build size tracking
echo "Build size: $(du -sh web-build | cut -f1)"

# Performance metrics
lighthouse https://unipilot.com --output json --output-path ./lighthouse-report.json
```

### Automated Testing

```yaml
# .github/workflows/build-test.yml
name: Build Test
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:web
      - run: npm run test
```

## 🚀 Release Process

### Version Management

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.1 -> 1.1.0
npm version major  # 1.1.0 -> 2.0.0

# Update app.json version automatically
```

### Release Checklist

- [ ] Version bumped in `app.json` and `package.json`
- [ ] Changelog updated with new features and fixes
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Store metadata updated
- [ ] Screenshots updated (if UI changed)
- [ ] Release notes prepared

### Deployment Pipeline

```bash
# 1. Build all platforms
eas build --platform all --profile production

# 2. Test builds on devices
# Download and test .ipa and .apk files

# 3. Submit to stores
eas submit --platform all --profile production

# 4. Deploy web version
vercel --prod

# 5. Monitor deployment
# Check error tracking and analytics
```

## 🔍 Post-Build Verification

### Testing Checklist

- [ ] App launches successfully
- [ ] All core features functional
- [ ] Payment flow works correctly
- [ ] Push notifications working
- [ ] Offline functionality verified
- [ ] Performance meets standards
- [ ] No memory leaks detected

### Store Review Preparation

#### App Store Review Guidelines
- Ensure app follows Apple's Human Interface Guidelines
- Test all features thoroughly
- Provide clear app description and screenshots
- Include demo account credentials if needed

#### Google Play Review Guidelines
- Follow Material Design principles
- Test on various Android devices and versions
- Ensure proper permissions usage
- Provide accurate content rating

## 🚨 Troubleshooting

### Common Build Issues

1. **Certificate Errors (iOS)**
   ```bash
   # Clear certificates and regenerate
   eas credentials --platform ios --clear
   ```

2. **Keystore Issues (Android)**
   ```bash
   # Verify keystore
   keytool -list -v -keystore unipilot-release-key.keystore
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

4. **Build Timeouts**
   ```bash
   # Use larger resource class
   # Update eas.json with "resourceClass": "large"
   ```

### Support Resources

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [React Native Performance](https://reactnative.dev/docs/performance)

This build guide ensures consistent, reliable builds across all platforms while maintaining high quality standards for store submission and user experience.
# Setup Guide

This guide will help you set up the UniPilot development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **bun**
- **Git**
- **Expo CLI** (optional, but recommended)

### For Mobile Development
- **iOS**: Xcode (macOS only) and iOS Simulator
- **Android**: Android Studio and Android SDK

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd unipilot-app
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using bun (recommended)
bun install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_RORK_API_BASE_URL=your_api_base_url

# Paddle Configuration (for payments)
EXPO_PUBLIC_PADDLE_TOKEN=your_paddle_token
EXPO_PUBLIC_PADDLE_ENVIRONMENT=sandbox # or production
EXPO_PUBLIC_PADDLE_PRICE_ID=your_price_id

# Database (if using local backend)
DATABASE_URL=your_database_url

# Other configurations
EXPO_PUBLIC_APP_ENV=development
```

### 4. Start Development Server

```bash
# Start Expo development server
npm run start

# Start web version
npm run start-web

# Start with debugging (web)
npm run start-web-dev
```

## Platform-Specific Setup

### iOS Development

1. **Install Xcode** from the Mac App Store
2. **Install iOS Simulator**:
   ```bash
   xcode-select --install
   ```
3. **Run on iOS**:
   ```bash
   npx expo run:ios
   ```

### Android Development

1. **Install Android Studio**
2. **Configure Android SDK**:
   - Open Android Studio
   - Go to SDK Manager
   - Install Android SDK Platform-Tools
   - Install Android SDK Build-Tools
   - Install Android Emulator

3. **Set Environment Variables**:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Run on Android**:
   ```bash
   npx expo run:android
   ```

### Web Development

The app runs on web out of the box with React Native Web:

```bash
npm run start-web
```

Access the app at `http://localhost:8081` (or the port shown in terminal).

## Backend Setup

The app includes a built-in backend using Hono and tRPC:

### 1. Database Setup

If using a database, configure your connection string in `.env.local`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/unipilot
```

### 2. Backend Development

The backend runs automatically with the Expo development server. API endpoints are available at:

```
http://localhost:3000/api/trpc/
```

### 3. Adding New API Routes

1. Create a new route file in `backend/trpc/routes/`
2. Export your procedure from the route file
3. Import and add to `backend/trpc/app-router.ts`

Example:
```typescript
// backend/trpc/routes/example/hello/route.ts
import { publicProcedure } from "../../create-context";

export const helloProcedure = publicProcedure.query(() => {
  return { message: "Hello World!" };
});
```

## Development Workflow

### 1. File Structure

```
app/                 # Expo Router pages
├── (tabs)/         # Tab navigation pages
├── community/      # Community features
├── documents/      # Document management
├── journey/        # Journey tracking
├── premium/        # Premium features
└── profile/        # User profile

components/         # Reusable UI components
backend/           # Backend API (Hono + tRPC)
store/             # Zustand state management
constants/         # App constants and themes
hooks/             # Custom React hooks
lib/               # Utility libraries
types/             # TypeScript type definitions
```

### 2. Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 3. Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **iOS Simulator not opening**:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

3. **Android emulator issues**:
   ```bash
   cd $ANDROID_HOME/emulator
   ./emulator -list-avds
   ./emulator -avd <avd-name>
   ```

4. **Web build issues**:
   ```bash
   rm -rf node_modules
   npm install
   npm run start-web
   ```

### Getting Help

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review [Expo Documentation](https://docs.expo.dev/)
- Join our development Discord (link in contributing guide)

## Next Steps

Once you have the app running:

1. Review the [Tech Stack](./tech-stack.md) to understand our architecture
2. Check out [Features](./features.md) to understand app functionality
3. Read [Contributing Guidelines](./contributing.md) to start contributing
4. Explore [Components](./components.md) to understand our UI system

Happy coding! 🚀
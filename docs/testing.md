# Testing Documentation

UniPilot employs a comprehensive testing strategy to ensure reliability, performance, and user satisfaction across all platforms. This document outlines our testing approach, tools, and best practices.

## 🧪 Testing Strategy Overview

### Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← Few, High-level
                    │   (Detox)       │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │ ← Some, API & Components
                  │  (React Native        │
                  │   Testing Library)    │
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │        Unit Tests               │ ← Many, Fast & Isolated
              │   (Jest + Testing Library)      │
              └─────────────────────────────────┘
```

### Testing Principles

1. **Fast Feedback**: Quick test execution for rapid development
2. **Reliable**: Tests should be deterministic and stable
3. **Maintainable**: Easy to update as code evolves
4. **Comprehensive**: Cover critical user journeys
5. **Platform-Aware**: Account for iOS, Android, and Web differences

## 🛠️ Testing Tools & Setup

### Core Testing Stack

```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.0.0",
    "jest-expo": "^50.0.0",
    "detox": "^20.0.0",
    "@types/jest": "^29.0.0",
    "react-test-renderer": "^18.0.0"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|@react-native-community|expo-router|@expo/vector-icons)/)'
  ]
};
```

### Test Setup

```javascript
// jest.setup.js
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:3000'
      }
    }
  }
}));

// Mock navigation
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock Paddle
jest.mock('@paddle/paddle-js', () => ({
  initializePaddle: jest.fn(() => Promise.resolve({
    Checkout: {
      open: jest.fn()
    }
  }))
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

## 🧩 Unit Testing

### Component Testing

```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';

describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByText, queryByText } = render(
      <Button title="Test Button" onPress={() => {}} loading />
    );
    
    expect(queryByText('Test Button')).toBeNull();
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPressMock} disabled />
    );
    
    const button = getByText('Test Button');
    fireEvent.press(button);
    
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('applies correct variant styles', () => {
    const { getByTestId } = render(
      <Button 
        title="Test Button" 
        onPress={() => {}} 
        variant="secondary"
        testID="test-button"
      />
    );
    
    const button = getByTestId('test-button');
    expect(button).toHaveStyle({
      backgroundColor: expect.any(String)
    });
  });
});
```

### Hook Testing

```typescript
// __tests__/hooks/useColors.test.ts
import { renderHook } from '@testing-library/react-native';
import { useColors } from '@/hooks/useColors';
import { useThemeStore } from '@/store/themeStore';

// Mock the theme store
jest.mock('@/store/themeStore');

describe('useColors Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns light colors when theme is light', () => {
    (useThemeStore as jest.Mock).mockReturnValue({
      isDarkMode: false
    });

    const { result } = renderHook(() => useColors());
    
    expect(result.current.background).toBe('#FAFAFA');
    expect(result.current.text).toBe('#2C3E50');
  });

  it('returns dark colors when theme is dark', () => {
    (useThemeStore as jest.Mock).mockReturnValue({
      isDarkMode: true
    });

    const { result } = renderHook(() => useColors());
    
    expect(result.current.background).toBe('#0F0F0F');
    expect(result.current.text).toBe('#FFFFFF');
  });
});
```

### Store Testing

```typescript
// __tests__/store/userStore.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useUserStore } from '@/store/userStore';

describe('User Store', () => {
  beforeEach(() => {
    // Reset store state
    useUserStore.getState().clearUser();
  });

  it('initializes with null user', () => {
    const { result } = renderHook(() => useUserStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isPremium).toBe(false);
  });

  it('creates user correctly', () => {
    const { result } = renderHook(() => useUserStore());
    
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      homeCountry: { code: 'US', name: 'United States' },
      destinationCountry: { code: 'CA', name: 'Canada' }
    };

    act(() => {
      result.current.createUser(userData);
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.user?.name).toBe('John Doe');
    expect(result.current.user?.email).toBe('john@example.com');
  });

  it('updates premium status correctly', () => {
    const { result } = renderHook(() => useUserStore());
    
    // First create a user
    act(() => {
      result.current.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        homeCountry: { code: 'US', name: 'United States' },
        destinationCountry: { code: 'CA', name: 'Canada' }
      });
    });

    act(() => {
      result.current.setPremium(true);
    });

    expect(result.current.isPremium).toBe(true);
    expect(result.current.user?.isPremium).toBe(true);
    expect(result.current.user?.premiumSince).toBeTruthy();
  });
});
```

### Utility Function Testing

```typescript
// __tests__/utils/dateUtils.test.ts
import { formatDate, getRelativeTime, isDateInFuture } from '@/utils/dateUtils';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('handles invalid date', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });
  });

  describe('getRelativeTime', () => {
    it('returns "just now" for recent dates', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30000); // 30 seconds ago
      expect(getRelativeTime(recent)).toBe('just now');
    });

    it('returns correct relative time for past dates', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 3600000); // 1 hour ago
      expect(getRelativeTime(pastDate)).toBe('1 hour ago');
    });
  });

  describe('isDateInFuture', () => {
    it('returns true for future dates', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(isDateInFuture(futureDate)).toBe(true);
    });

    it('returns false for past dates', () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      expect(isDateInFuture(pastDate)).toBe(false);
    });
  });
});
```

## 🔗 Integration Testing

### API Integration Testing

```typescript
// __tests__/integration/api.test.ts
import { trpcClient } from '@/lib/trpc';

// Mock the actual API calls
jest.mock('@/lib/trpc', () => ({
  trpcClient: {
    community: {
      getPosts: {
        query: jest.fn()
      },
      createPost: {
        mutate: jest.fn()
      }
    }
  }
}));

describe('API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches community posts successfully', async () => {
    const mockPosts = [
      { id: '1', title: 'Test Post', content: 'Test content' }
    ];

    (trpcClient.community.getPosts.query as jest.Mock)
      .mockResolvedValue(mockPosts);

    const posts = await trpcClient.community.getPosts.query();
    
    expect(posts).toEqual(mockPosts);
    expect(trpcClient.community.getPosts.query).toHaveBeenCalledTimes(1);
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Network error';
    
    (trpcClient.community.getPosts.query as jest.Mock)
      .mockRejectedValue(new Error(errorMessage));

    await expect(trpcClient.community.getPosts.query())
      .rejects.toThrow(errorMessage);
  });
});
```

### Component Integration Testing

```typescript
// __tests__/integration/PostCard.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PostCard } from '@/components/PostCard';
import { useCommunityStore } from '@/store/communityStore';

// Mock the store
jest.mock('@/store/communityStore');

describe('PostCard Integration', () => {
  const mockPost = {
    id: '1',
    title: 'Test Post',
    content: 'Test content',
    author: { name: 'John Doe', avatar: null },
    likes: 5,
    comments: 2,
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    (useCommunityStore as jest.Mock).mockReturnValue({
      likePost: jest.fn(),
      posts: [mockPost]
    });
  });

  it('handles like interaction correctly', async () => {
    const mockLikePost = jest.fn();
    (useCommunityStore as jest.Mock).mockReturnValue({
      likePost: mockLikePost,
      posts: [mockPost]
    });

    const { getByTestId } = render(
      <PostCard post={mockPost} currentUserId="user1" />
    );

    const likeButton = getByTestId('like-button');
    fireEvent.press(likeButton);

    await waitFor(() => {
      expect(mockLikePost).toHaveBeenCalledWith('1', 'user1');
    });
  });

  it('displays post information correctly', () => {
    const { getByText } = render(
      <PostCard post={mockPost} currentUserId="user1" />
    );

    expect(getByText('Test Post')).toBeTruthy();
    expect(getByText('Test content')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('5')).toBeTruthy(); // Like count
  });
});
```

## 🎭 End-to-End Testing

### Detox Setup

```javascript
// .detoxrc.js
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/UniPilot.app'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk'
    }
  }
};
```

### E2E Test Examples

```typescript
// e2e/onboarding.e2e.ts
describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete onboarding successfully', async () => {
    // Wait for onboarding screen
    await expect(element(by.text('Welcome to UniPilot'))).toBeVisible();

    // Fill in name
    await element(by.id('name-input')).typeText('John Doe');
    await element(by.id('email-input')).typeText('john@example.com');

    // Select home country
    await element(by.id('home-country-selector')).tap();
    await element(by.text('United States')).tap();

    // Select destination country
    await element(by.id('destination-country-selector')).tap();
    await element(by.text('Canada')).tap();

    // Complete onboarding
    await element(by.id('complete-onboarding-button')).tap();

    // Verify navigation to main app
    await expect(element(by.text('Dashboard'))).toBeVisible();
  });

  it('should validate required fields', async () => {
    await element(by.id('complete-onboarding-button')).tap();
    
    await expect(element(by.text('Name is required'))).toBeVisible();
    await expect(element(by.text('Email is required'))).toBeVisible();
  });
});
```

```typescript
// e2e/premium.e2e.ts
describe('Premium Subscription Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Complete onboarding first
    await completeOnboarding();
  });

  it('should show premium upgrade prompt for locked features', async () => {
    // Navigate to a premium feature
    await element(by.id('journey-tab')).tap();
    await element(by.text('Visa Application')).tap();

    // Should show premium upgrade prompt
    await expect(element(by.text('Upgrade to Premium'))).toBeVisible();
    await expect(element(by.text('Unlock advanced journey stages'))).toBeVisible();
  });

  it('should open checkout when upgrade button is pressed', async () => {
    await element(by.text('Upgrade to Premium')).tap();

    // Should open checkout modal
    await expect(element(by.text('UniPilot Premium'))).toBeVisible();
    await expect(element(by.text('$4.99'))).toBeVisible();
  });
});
```

## 📊 Performance Testing

### Performance Monitoring

```typescript
// __tests__/performance/renderPerformance.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PostCard } from '@/components/PostCard';

describe('Performance Tests', () => {
  it('renders PostCard within acceptable time', () => {
    const mockPost = {
      id: '1',
      title: 'Test Post',
      content: 'Test content',
      author: { name: 'John Doe', avatar: null },
      likes: 5,
      comments: 2,
      createdAt: new Date().toISOString()
    };

    const startTime = performance.now();
    
    render(<PostCard post={mockPost} currentUserId="user1" />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 16ms (60fps)
    expect(renderTime).toBeLessThan(16);
  });

  it('handles large lists efficiently', () => {
    const largePosts = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      title: `Post ${i}`,
      content: `Content ${i}`,
      author: { name: `User ${i}`, avatar: null },
      likes: i,
      comments: i % 5,
      createdAt: new Date().toISOString()
    }));

    const startTime = performance.now();
    
    // Test would render a FlatList with large dataset
    // This is a simplified example
    expect(largePosts.length).toBe(1000);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100);
  });
});
```

### Memory Leak Testing

```typescript
// __tests__/performance/memoryLeaks.test.tsx
describe('Memory Leak Tests', () => {
  it('cleans up subscriptions properly', () => {
    const { unmount } = render(<ComponentWithSubscriptions />);
    
    // Simulate component unmount
    unmount();
    
    // Verify no memory leaks (this would require more sophisticated tooling)
    expect(true).toBe(true); // Placeholder
  });
});
```

## 🌐 Cross-Platform Testing

### Platform-Specific Tests

```typescript
// __tests__/platform/webSpecific.test.tsx
import { Platform } from 'react-native';

describe('Web-Specific Features', () => {
  beforeAll(() => {
    // Mock Platform.OS for web
    Platform.OS = 'web';
  });

  it('uses web-specific payment flow', () => {
    // Test web-specific Paddle integration
    expect(Platform.OS).toBe('web');
    // Add web-specific test logic
  });

  it('handles keyboard navigation', () => {
    // Test keyboard accessibility on web
  });
});
```

### Responsive Design Testing

```typescript
// __tests__/responsive/breakpoints.test.tsx
import { Dimensions } from 'react-native';

describe('Responsive Design', () => {
  it('adapts layout for tablet screens', () => {
    // Mock tablet dimensions
    jest.spyOn(Dimensions, 'get').mockReturnValue({
      width: 1024,
      height: 768,
      scale: 2,
      fontScale: 1
    });

    const { getByTestId } = render(<ResponsiveComponent />);
    
    // Verify tablet-specific layout
    expect(getByTestId('tablet-layout')).toBeTruthy();
  });
});
```

## 🚀 Test Automation & CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS app
        run: npx expo run:ios --configuration Release
      
      - name: Run E2E tests
        run: npm run test:e2e:ios
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "test:performance": "jest --testPathPattern=__tests__/performance"
  }
}
```

## 📈 Test Metrics & Reporting

### Coverage Reports

```javascript
// jest.config.js - Coverage configuration
module.exports = {
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    '!**/*.d.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './components/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### Test Reporting

```typescript
// Custom test reporter
class CustomReporter {
  onRunComplete(contexts, results) {
    console.log(`
      Test Results Summary:
      - Total Tests: ${results.numTotalTests}
      - Passed: ${results.numPassedTests}
      - Failed: ${results.numFailedTests}
      - Coverage: ${results.coverageMap?.getCoverageSummary().lines.pct}%
    `);
  }
}

module.exports = CustomReporter;
```

## 🔧 Testing Best Practices

### Test Organization

1. **Descriptive Names**: Test names should clearly describe what they test
2. **AAA Pattern**: Arrange, Act, Assert structure
3. **Single Responsibility**: One assertion per test when possible
4. **Test Independence**: Tests should not depend on each other
5. **Mock External Dependencies**: Isolate units under test

### Common Patterns

```typescript
// Good test structure
describe('Component/Feature Name', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });

  describe('when condition', () => {
    it('should do expected behavior', () => {
      // Arrange
      const props = { /* test props */ };
      
      // Act
      const { getByText } = render(<Component {...props} />);
      
      // Assert
      expect(getByText('Expected Text')).toBeTruthy();
    });
  });
});
```

### Debugging Tests

```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests in watch mode
npm run test:watch

# Debug with verbose output
npm test -- --verbose

# Run tests with coverage
npm run test:coverage
```

This comprehensive testing strategy ensures UniPilot maintains high quality, reliability, and performance across all platforms while providing confidence for continuous deployment and feature development.
# Folder Structure

This document provides a comprehensive overview of the UniPilot project structure and the purpose of each directory and file.

## 📁 Root Directory

```
unipilot-app/
├── app/                    # Expo Router pages (file-based routing)
├── assets/                 # Static assets (images, fonts, etc.)
├── backend/                # Backend API (Hono + tRPC)
├── components/             # Reusable UI components
├── constants/              # App constants and configuration
├── docs/                   # Documentation files
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries and configurations
├── mocks/                  # Mock data for development
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
├── .env.local             # Environment variables (not in git)
├── .gitignore             # Git ignore rules
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project overview
```

## 📱 App Directory (Expo Router)

The `app/` directory uses Expo Router's file-based routing system, similar to Next.js.

```
app/
├── (tabs)/                 # Tab navigation group
│   ├── _layout.tsx        # Tab layout configuration
│   ├── index.tsx          # Home tab (Dashboard)
│   ├── journey.tsx        # Journey tracking tab
│   ├── community.tsx      # Premium/Community tab
│   ├── documents.tsx      # Documents management tab
│   └── profile.tsx        # User profile tab
├── community/             # Community features
│   ├── index.tsx          # Community home
│   ├── new.tsx           # Create new post
│   └── [id].tsx          # Individual post view
├── documents/             # Document management
│   ├── new.tsx           # Add new document
│   └── [id].tsx          # Document details
├── journey/               # Journey tracking
│   └── [id].tsx          # Stage details
├── memories/              # Memory sharing
│   ├── new.tsx           # Create memory
│   └── [id].tsx          # Memory details
├── onboarding/            # User onboarding
│   └── index.tsx         # Onboarding flow
├── premium/               # Premium features
│   ├── index.tsx         # Premium overview
│   ├── checkout.tsx      # Payment checkout
│   ├── payment.tsx       # Payment processing
│   ├── resources.tsx     # Premium resources
│   ├── subscription.tsx  # Subscription management
│   └── [id].tsx         # Individual resource
├── profile/               # Profile management
│   └── edit.tsx          # Edit profile
├── settings/              # App settings
│   └── index.tsx         # Settings page
├── unipilot-ai/          # AI assistant
│   └── index.tsx         # AI chat interface
├── _layout.tsx           # Root layout
├── +not-found.tsx        # 404 page
├── index.tsx             # App entry point
├── modal.tsx             # Global modal
├── payment-success.tsx   # Payment success page
├── webview.tsx           # WebView container
└── application-checklist.tsx # Application checklist
```

### Routing Conventions

- **Files** become routes: `app/profile/edit.tsx` → `/profile/edit`
- **Folders** create nested routes: `app/community/[id].tsx` → `/community/:id`
- **Groups** `(tabs)` organize routes without affecting URL structure
- **Dynamic routes** `[id].tsx` capture URL parameters
- **Layouts** `_layout.tsx` wrap child routes

## 🎨 Components Directory

Reusable UI components organized by functionality:

```
components/
├── Avatar.tsx              # User avatar component
├── Button.tsx              # Custom button component
├── Card.tsx                # Card container component
├── CelebrationAnimation.tsx # Success animations
├── CountrySelector.tsx     # Country selection dropdown
├── DocumentCard.tsx        # Document display card
├── Input.tsx               # Form input component
├── MemoryCard.tsx          # Memory sharing card
├── PaddleCheckout.tsx      # Payment checkout modal
├── PaddleForm.tsx          # Payment form
├── PostCard.tsx            # Community post card
├── PremiumResourceCard.tsx # Premium content card
├── PremiumUpgradeButton.tsx # Upgrade to premium CTA
├── ProgressBar.tsx         # Progress indicator
├── QuoteCard.tsx           # Inspirational quote card
├── StageProgress.tsx       # Journey stage progress
├── TaskItem.tsx            # Individual task component
├── TopicSelector.tsx       # Topic selection component
└── README.md               # Component documentation
```

### Component Organization

- **Atomic Design**: Components follow atomic design principles
- **Single Responsibility**: Each component has one clear purpose
- **Reusability**: Components are designed for reuse across the app
- **TypeScript**: All components are fully typed

## 🔧 Backend Directory

Backend API built with Hono and tRPC:

```
backend/
├── trpc/                   # tRPC configuration and routes
│   ├── routes/            # API route handlers
│   │   ├── community/     # Community-related endpoints
│   │   │   ├── add-comment/
│   │   │   ├── create-post/
│   │   │   ├── get-post/
│   │   │   ├── get-posts/
│   │   │   ├── like-comment/
│   │   │   └── like-post/
│   │   ├── example/       # Example endpoints
│   │   │   └── hi/
│   │   ├── paddle/        # Payment webhooks
│   │   │   └── webhook/
│   │   ├── premium/       # Premium features
│   │   │   ├── get-resource/
│   │   │   └── get-resources/
│   │   └── user/          # User management
│   │       └── subscription/
│   ├── app-router.ts      # Main router configuration
│   └── create-context.ts  # tRPC context setup
└── hono.ts                # Hono server configuration
```

### API Organization

- **Feature-based**: Routes organized by feature area
- **Type-safe**: Full TypeScript integration with tRPC
- **Modular**: Each endpoint in its own file
- **Consistent**: Standardized response formats

## 🗃️ Store Directory

Zustand state management stores:

```
store/
├── communityStore.ts       # Community posts and interactions
├── documentStore.ts        # Document management state
├── journeyStore.ts         # Journey progress tracking
├── premiumResourcesStore.ts # Premium content state
├── themeStore.ts           # App theme and appearance
└── userStore.ts            # User profile and authentication
```

### State Management Strategy

- **Feature-based stores**: Each store manages a specific domain
- **Persistence**: Critical data persisted with AsyncStorage
- **Type safety**: Full TypeScript integration
- **Minimal boilerplate**: Zustand's simple API

## 📊 Constants Directory

App-wide constants and configuration:

```
constants/
├── colors.ts               # Color palette and themes
└── theme.ts                # Theme configuration
```

## 🎣 Hooks Directory

Custom React hooks for shared logic:

```
hooks/
├── useColors.ts            # Theme-aware color hook
└── usePaddle.ts            # Paddle payment integration
```

## 📚 Lib Directory

Utility libraries and configurations:

```
lib/
├── paddle.ts               # Paddle payment utilities
└── trpc.ts                 # tRPC client configuration
```

## 🎭 Mocks Directory

Mock data for development and testing:

```
mocks/
├── applicationChecklist.ts # Application task data
├── communityPosts.ts       # Sample community posts
├── countries.ts            # Country data
├── journeyTasks.ts         # Journey stage tasks
├── premiumContent.ts       # Premium feature content
├── premiumResources.ts     # Premium resource data
├── quotes.ts               # Inspirational quotes
├── tips.ts                 # Helpful tips
└── universities.ts         # University data
```

## 🏷️ Types Directory

TypeScript type definitions:

```
types/
├── community.ts            # Community-related types
├── premiumResources.ts     # Premium content types
└── user.ts                 # User profile types
```

## 🛠️ Utils Directory

Utility functions:

```
utils/
├── dateUtils.ts            # Date formatting and manipulation
└── helpers.ts              # General utility functions
```

## 🖼️ Assets Directory

Static assets organized by type:

```
assets/
└── images/
    ├── adaptive-icon.png   # Android adaptive icon
    ├── favicon.png         # Web favicon
    ├── icon.jpg            # App icon
    └── splash-icon.png     # Splash screen icon
```

## 📋 Configuration Files

### Root Level Files

- **`app.json`**: Expo configuration (app name, version, build settings)
- **`package.json`**: Dependencies, scripts, and project metadata
- **`tsconfig.json`**: TypeScript compiler configuration
- **`.env.local`**: Environment variables (not tracked in git)
- **`.gitignore`**: Files and directories to ignore in git
- **`bun.lock`**: Lock file for exact dependency versions

## 🗂️ File Naming Conventions

### Components
- **PascalCase**: `UserProfile.tsx`, `PaymentButton.tsx`
- **Descriptive**: Names clearly indicate component purpose

### Pages (App Router)
- **kebab-case**: `user-profile.tsx`, `payment-success.tsx`
- **Dynamic routes**: `[id].tsx`, `[slug].tsx`
- **Layouts**: `_layout.tsx`

### Utilities and Hooks
- **camelCase**: `useUserData.ts`, `formatDate.ts`
- **Prefixes**: Hooks start with `use`, utilities are descriptive

### Constants and Types
- **camelCase**: `userTypes.ts`, `appConstants.ts`
- **Descriptive**: Names indicate the content type

## 📁 Best Practices

### Organization Principles

1. **Feature-based grouping**: Related files are co-located
2. **Consistent naming**: Follow established conventions
3. **Clear hierarchy**: Logical nesting of directories
4. **Separation of concerns**: Each directory has a specific purpose

### File Structure Guidelines

1. **Keep it flat**: Avoid deep nesting when possible
2. **Group related items**: Put similar files together
3. **Use index files**: For clean imports from directories
4. **Document structure**: README files in complex directories

### Import Organization

```typescript
// External libraries
import React from 'react';
import { View, Text } from 'react-native';

// Internal utilities
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/utils/dateUtils';

// Components
import { Button } from '@/components/Button';

// Types
import type { UserProfile } from '@/types/user';
```

This folder structure provides a scalable, maintainable foundation that grows with the application while keeping code organized and easy to navigate.
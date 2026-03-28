# Environment Configuration

This document outlines all environment variables and configuration settings required for UniPilot development and deployment.

## 📋 Environment Variables Overview

UniPilot uses environment variables for configuration management across different environments (development, staging, production). All environment variables should be defined in `.env.local` for local development.

## 🔧 Required Environment Variables

### API Configuration

```env
# Base API URL for the backend
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-api-domain.com

# Alternative for local development
# EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000
```

**Description**: Base URL for the backend API. Used by tRPC client to make API calls.

**Values**:
- Development: `http://localhost:3000`
- Staging: `https://staging-api.unipilot.com`
- Production: `https://api.unipilot.com`

### Paddle Payment Configuration

```env
# Paddle API Token (Sandbox)
EXPO_PUBLIC_PADDLE_TOKEN=test_c25cc3df5ddfcd6b3b2a8420700

# Paddle Environment
EXPO_PUBLIC_PADDLE_ENVIRONMENT=sandbox

# Paddle Price ID for Premium Subscription
EXPO_PUBLIC_PADDLE_PRICE_ID=pri_01jyk3h7eec66x5m7h31p66r8w
```

**Paddle Configuration Details**:

- **Token**: Authentication token for Paddle API
  - Sandbox: `test_c25cc3df5ddfcd6b3b2a8420700`
  - Production: `live_your_production_token`

- **Environment**: Paddle environment setting
  - Development/Staging: `sandbox`
  - Production: `production`

- **Price ID**: Paddle price identifier for premium subscription
  - Current: `pri_01jyk3h7eec66x5m7h31p66r8w` ($4.99/month)

### Application Environment

```env
# Application environment
EXPO_PUBLIC_APP_ENV=development

# Debug mode
EXPO_PUBLIC_DEBUG=true

# Feature flags
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_COMMUNITY=true
EXPO_PUBLIC_ENABLE_PREMIUM=true
```

## 🗄️ Database Configuration (Backend)

```env
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/unipilot

# Redis for caching (optional)
REDIS_URL=redis://localhost:6379

# Database pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
```

## 🔐 Authentication & Security

```env
# JWT Secret for token signing
JWT_SECRET=your-super-secret-jwt-key-here

# Session configuration
SESSION_SECRET=your-session-secret-here
SESSION_TIMEOUT=86400

# Encryption keys
ENCRYPTION_KEY=your-32-character-encryption-key

# CORS origins
CORS_ORIGINS=http://localhost:8081,https://unipilot.com
```

## 📧 External Services

### Email Service (Optional)

```env
# Email service configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SendGrid alternative
SENDGRID_API_KEY=your-sendgrid-api-key
```

### File Storage (Optional)

```env
# AWS S3 for file storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=unipilot-documents

# Cloudinary alternative
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Analytics (Optional)

```env
# Google Analytics
GA_TRACKING_ID=GA-XXXXXXXXX

# Mixpanel
MIXPANEL_TOKEN=your-mixpanel-token

# Sentry for error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 🌍 Environment-Specific Configurations

### Development (.env.local)

```env
# Development environment
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_DEBUG=true
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000

# Paddle sandbox
EXPO_PUBLIC_PADDLE_TOKEN=test_c25cc3df5ddfcd6b3b2a8420700
EXPO_PUBLIC_PADDLE_ENVIRONMENT=sandbox
EXPO_PUBLIC_PADDLE_PRICE_ID=pri_01jyk3h7eec66x5m7h31p66r8w

# Local database
DATABASE_URL=postgresql://postgres:password@localhost:5432/unipilot_dev

# Feature flags (all enabled for development)
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_COMMUNITY=true
EXPO_PUBLIC_ENABLE_PREMIUM=true
EXPO_PUBLIC_ENABLE_DEBUG_MENU=true
```

### Staging (.env.staging)

```env
# Staging environment
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_RORK_API_BASE_URL=https://staging-api.unipilot.com

# Paddle sandbox (still testing)
EXPO_PUBLIC_PADDLE_TOKEN=test_c25cc3df5ddfcd6b3b2a8420700
EXPO_PUBLIC_PADDLE_ENVIRONMENT=sandbox
EXPO_PUBLIC_PADDLE_PRICE_ID=pri_01jyk3h7eec66x5m7h31p66r8w

# Staging database
DATABASE_URL=postgresql://user:pass@staging-db.unipilot.com:5432/unipilot_staging

# Feature flags (testing new features)
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_COMMUNITY=true
EXPO_PUBLIC_ENABLE_PREMIUM=true
EXPO_PUBLIC_ENABLE_DEBUG_MENU=false
```

### Production (.env.production)

```env
# Production environment
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_RORK_API_BASE_URL=https://api.unipilot.com

# Paddle production
EXPO_PUBLIC_PADDLE_TOKEN=live_your_production_token_here
EXPO_PUBLIC_PADDLE_ENVIRONMENT=production
EXPO_PUBLIC_PADDLE_PRICE_ID=pri_production_price_id

# Production database
DATABASE_URL=postgresql://user:pass@prod-db.unipilot.com:5432/unipilot_prod

# Feature flags (stable features only)
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_COMMUNITY=true
EXPO_PUBLIC_ENABLE_PREMIUM=true
EXPO_PUBLIC_ENABLE_DEBUG_MENU=false

# Security
JWT_SECRET=your-super-secure-production-jwt-secret
ENCRYPTION_KEY=your-32-char-production-encryption-key
```

## 🔒 Security Best Practices

### Environment Variable Security

1. **Never commit `.env` files**: Add to `.gitignore`
2. **Use different keys per environment**: Don't reuse secrets
3. **Rotate secrets regularly**: Update tokens and keys periodically
4. **Limit access**: Only necessary team members should have access
5. **Use secure storage**: Store production secrets in secure vaults

### Sensitive Data Handling

```env
# ❌ Don't expose sensitive data to client
DATABASE_URL=postgresql://...
JWT_SECRET=secret-key

# ✅ Only expose public configuration to client
EXPO_PUBLIC_API_URL=https://api.unipilot.com
EXPO_PUBLIC_APP_VERSION=1.0.0
```

**Important**: Only variables prefixed with `EXPO_PUBLIC_` are available in the client-side code. Backend-only secrets should not have this prefix.

## 📱 Platform-Specific Configuration

### iOS Configuration

```env
# iOS Bundle Identifier
IOS_BUNDLE_ID=app.rork.unipilot-student-journey-management-app

# iOS App Store Connect
IOS_APP_STORE_CONNECT_API_KEY=your-api-key
IOS_APP_STORE_CONNECT_ISSUER_ID=your-issuer-id
```

### Apple In-App Purchases

```env
# Shared secret for auto-renewable subscription receipt validation
APP_STORE_CONNECT_SHARED_SECRET=1ecd7d83522e4f8bb06a4f6bed760234

# Product identifiers (must match App Store Connect)
APP_STORE_PRODUCT_ID_BASIC=unipilot_basic_monthly
APP_STORE_PRODUCT_ID_STANDARD=unipilot_standard_monthly
APP_STORE_PRODUCT_ID_PRO=unipilot_premium_monthly
```

**Notes**:
- These values are mirrored in `app.json` under `expo.extra.appStore` so the client can request products and validate receipts.
- For production, prefer injecting the secret via environment-specific config and keep backend receipt validation in place.

### Android Configuration

```env
# Android Package Name
ANDROID_PACKAGE=app.rork.unipilot-student-journey-management-app

# Google Play Console
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=path/to/service-account.json
```

### Web Configuration

```env
# Web domain
WEB_DOMAIN=unipilot.com

# CDN configuration
CDN_URL=https://cdn.unipilot.com

# Web analytics
WEB_ANALYTICS_ID=your-analytics-id
```

## 🛠️ Development Tools Configuration

### Expo Configuration

```env
# Expo project ID
EXPO_PROJECT_ID=your-expo-project-id

# EAS Build configuration
EAS_BUILD_PROFILE=development
EAS_UPDATE_CHANNEL=development
```

### Debugging Configuration

```env
# Debug settings
EXPO_PUBLIC_ENABLE_FLIPPER=true
EXPO_PUBLIC_ENABLE_REACTOTRON=true
EXPO_PUBLIC_LOG_LEVEL=debug

# Performance monitoring
EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

## 📋 Environment Validation

### Runtime Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_RORK_API_BASE_URL: z.string().url(),
  EXPO_PUBLIC_PADDLE_TOKEN: z.string().min(1),
  EXPO_PUBLIC_PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']),
  EXPO_PUBLIC_PADDLE_PRICE_ID: z.string().min(1),
  EXPO_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
});

export const env = envSchema.parse(process.env);
```

### Startup Checks

```typescript
// app/_layout.tsx
useEffect(() => {
  // Validate required environment variables
  const requiredVars = [
    'EXPO_PUBLIC_RORK_API_BASE_URL',
    'EXPO_PUBLIC_PADDLE_TOKEN',
  ];

  const missing = requiredVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    // Handle missing configuration
  }
}, []);
```

## 🔄 Environment Management Workflow

### Local Development Setup

1. **Copy template**: `cp .env.example .env.local`
2. **Fill in values**: Add your specific configuration
3. **Validate**: Run validation checks
4. **Test**: Ensure all features work correctly

### Deployment Process

1. **Environment-specific files**: Create `.env.staging`, `.env.production`
2. **Secure storage**: Store production secrets securely
3. **Deployment scripts**: Automate environment variable injection
4. **Validation**: Verify configuration in each environment

### Configuration Updates

1. **Version control**: Track configuration changes
2. **Team communication**: Notify team of required updates
3. **Documentation**: Update this document with new variables
4. **Testing**: Test configuration changes thoroughly

## 🚨 Troubleshooting

### Common Issues

1. **Missing variables**: Check `.env.local` exists and has required variables
2. **Wrong API URL**: Verify `EXPO_PUBLIC_RORK_API_BASE_URL` is correct
3. **Paddle errors**: Confirm Paddle token and environment match
4. **CORS issues**: Check API CORS configuration allows your domain

### Debug Commands

```bash
# Check environment variables
npx expo config --type public

# Validate configuration
npm run validate-env

# Test API connection
curl $EXPO_PUBLIC_RORK_API_BASE_URL/health
```

This environment configuration ensures secure, scalable, and maintainable deployment across all environments while providing clear guidance for developers and DevOps teams.

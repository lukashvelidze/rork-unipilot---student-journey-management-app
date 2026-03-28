# Tech Stack

UniPilot is built with modern, production-ready technologies chosen for scalability, developer experience, and cross-platform compatibility.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   Web Client    │    │   Backend API   │
│  (iOS/Android)  │    │  (React Native  │    │  (Hono + tRPC)  │
│                 │◄──►│      Web)       │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Paddle API    │
                    │   (Payments)    │
                    └─────────────────┘
```

## 📱 Frontend Stack

### Core Framework
- **React Native (0.79.1)**: Cross-platform mobile development
- **Expo (v53)**: Development platform and build tools
- **React (19.0.0)**: UI library with latest features
- **TypeScript (5.8.3)**: Type safety and developer experience

### Navigation & Routing
- **Expo Router (5.0.3)**: File-based routing system
- **React Navigation**: Native navigation components
- **Typed Routes**: Full TypeScript support for navigation

### State Management
- **Zustand (5.0.5)**: Lightweight state management
- **AsyncStorage**: Persistent storage for user data
- **React Query (@tanstack/react-query)**: Server state management

### UI & Styling
- **React Native StyleSheet**: Native styling approach
- **Expo Linear Gradient**: Beautiful gradient effects
- **Lucide React Native**: Consistent icon system
- **Custom Design System**: Inspired by iOS, Instagram, Linear

### Platform-Specific Features
- **Expo Image**: Optimized image handling
- **Expo Haptics**: Tactile feedback (mobile only)
- **Expo Web Browser**: In-app browser functionality
- **React Native WebView**: Embedded web content

## 🔧 Backend Stack

### Core Framework
- **Hono (4.8.2)**: Fast, lightweight web framework
- **tRPC (11.4.2)**: End-to-end typesafe APIs
- **SuperJSON**: Enhanced JSON serialization
- **Zod (3.25.67)**: Runtime type validation

### API Architecture
```typescript
// Type-safe API calls
const posts = await trpc.community.getPosts.useQuery();
const createPost = trpc.community.createPost.useMutation();
```

### Data Layer
- **File-based routing**: Organized API endpoints
- **Middleware support**: Authentication, validation, logging
- **Error handling**: Consistent error responses

## 💳 Payment Integration

### Paddle Billing
- **@paddle/paddle-js (1.4.2)**: Official Paddle SDK
- **Subscription Management**: Automated billing cycles
- **Cross-platform**: Web checkout + mobile WebView
- **Webhook Integration**: Real-time payment events

### Implementation
```typescript
// Web checkout
await paddle.Checkout.open({
  items: [{ priceId: 'pri_xxx', quantity: 1 }]
});

// Mobile WebView checkout
<WebView source={{ uri: checkoutUrl }} />
```

## 🎨 Design System

### Color Palette
- **Primary**: Coral red (#FF6B6B) - warm and energetic
- **Secondary**: Teal (#4ECDC4) - calming and fresh
- **Accent**: Warm yellow (#FFD93D) - optimistic
- **Premium**: Warm gold (#F39C12) - exclusive features

### Typography
- **System fonts**: Platform-native typography
- **Font weights**: 400, 500, 600, 700, 800
- **Responsive sizing**: Scales across devices

### Components
- **Modular design**: Reusable UI components
- **Consistent spacing**: 4px grid system
- **Accessibility**: WCAG compliant contrast ratios

## 📦 Development Tools

### Build & Development
- **Bun**: Fast package manager and runtime
- **Expo CLI**: Development server and build tools
- **Metro**: JavaScript bundler
- **Flipper**: Debugging and inspection

### Code Quality
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for quality gates

### Testing
- **Jest**: Unit testing framework
- **React Native Testing Library**: Component testing
- **Detox**: End-to-end testing (planned)

## 🌐 Cross-Platform Strategy

### Web Compatibility
```typescript
// Platform-specific code
if (Platform.OS === 'web') {
  // Web-specific implementation
} else {
  // Mobile implementation
}
```

### Feature Parity
- **Core features**: Available on all platforms
- **Platform-specific**: Graceful degradation
- **Progressive enhancement**: Web features when available

## 🔒 Security & Privacy

### Data Protection
- **Local storage**: Sensitive data stays on device
- **Encrypted storage**: Secure user preferences
- **HTTPS only**: All network communication

### Authentication
- **JWT tokens**: Secure API authentication
- **Biometric auth**: Platform-native security
- **Session management**: Automatic token refresh

## 📊 Performance Optimization

### Bundle Optimization
- **Code splitting**: Lazy loading of features
- **Tree shaking**: Remove unused code
- **Asset optimization**: Compressed images and fonts

### Runtime Performance
- **Memoization**: React.memo and useMemo
- **Virtualization**: Large list performance
- **Image caching**: Expo Image optimization

### Monitoring
- **Error tracking**: Crash reporting
- **Performance metrics**: App performance monitoring
- **User analytics**: Usage patterns and insights

## 🚀 Deployment Strategy

### Mobile Apps
- **Expo Application Services (EAS)**: Build and deployment
- **Over-the-air updates**: Instant feature deployment
- **App Store optimization**: ASO best practices

### Web Deployment
- **Static site generation**: Fast loading times
- **CDN distribution**: Global content delivery
- **Progressive Web App**: Offline functionality

## 🔄 CI/CD Pipeline

### Automated Workflows
```yaml
# Example GitHub Actions workflow
- Build and test
- Type checking
- Linting and formatting
- Security scanning
- Deployment to staging
- Production deployment
```

### Quality Gates
- **All tests pass**: Unit and integration tests
- **Type safety**: No TypeScript errors
- **Code quality**: ESLint and Prettier checks
- **Security**: Dependency vulnerability scanning

## 📈 Scalability Considerations

### Backend Scaling
- **Serverless architecture**: Auto-scaling API endpoints
- **Database optimization**: Efficient queries and indexing
- **Caching strategy**: Redis for frequently accessed data

### Frontend Scaling
- **Component library**: Reusable UI components
- **State management**: Efficient data flow
- **Code organization**: Modular architecture

## 🔮 Future Technology Roadmap

### Planned Additions
- **React Native New Architecture**: Fabric and TurboModules
- **AI Integration**: Enhanced AI features with local models
- **Real-time Features**: WebSocket integration
- **Offline Support**: Enhanced offline functionality

### Experimental Features
- **AR/VR Integration**: Campus virtual tours
- **Voice Interface**: Voice-controlled navigation
- **Machine Learning**: Personalized recommendations

---

This tech stack provides a solid foundation for building a scalable, maintainable, and user-friendly application that serves international students worldwide.
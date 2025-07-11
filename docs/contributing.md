# Contributing Guide

Welcome to the UniPilot development community! We're excited to have you contribute to making international education more accessible. This guide will help you get started with contributing to the project.

## 🌟 Ways to Contribute

### Code Contributions
- **Bug fixes**: Help resolve issues and improve stability
- **Feature development**: Build new features and enhancements
- **Performance improvements**: Optimize app performance
- **Testing**: Write and improve test coverage
- **Documentation**: Improve code documentation and guides

### Non-Code Contributions
- **UI/UX Design**: Create mockups and design improvements
- **Content Creation**: Write guides, tips, and educational content
- **Translation**: Help localize the app for different languages
- **User Testing**: Test features and provide feedback
- **Community Support**: Help other users in discussions

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js (v18 or higher)
- Git
- Code editor (VS Code recommended)
- Basic knowledge of React Native and TypeScript

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/unipilot-app.git
   cd unipilot-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

4. **Start Development Server**
   ```bash
   npm run start
   ```

5. **Verify Setup**
   - App should launch successfully
   - All core features should work
   - Tests should pass: `npm test`

## 🔄 Development Workflow

### Branch Naming Convention

```
feature/description-of-feature
bugfix/description-of-bug
hotfix/critical-issue-description
docs/documentation-update
refactor/code-improvement
```

**Examples:**
- `feature/ai-assistant-improvements`
- `bugfix/payment-flow-error`
- `docs/update-setup-guide`

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add biometric authentication support

fix(payment): resolve Paddle checkout modal not closing

docs(api): update tRPC endpoint documentation

test(components): add unit tests for Button component
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, well-documented code
   - Follow existing code style and patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run all tests
   npm test
   
   # Run linting
   npm run lint
   
   # Test on multiple platforms
   npm run start:ios
   npm run start:android
   npm run start:web
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(feature): add new functionality"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub and create a PR from your fork
   - Fill out the PR template completely
   - Link any related issues
   - Request review from maintainers

## 📋 Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on Web
- [ ] Manual testing completed

## Screenshots/Videos
If applicable, add screenshots or videos demonstrating the changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
Closes #(issue number)
```

## 🎨 Code Style Guidelines

### TypeScript Standards

```typescript
// ✅ Good: Explicit types and clear naming
interface UserProfileProps {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  isLoading?: boolean;
}

const UserProfileComponent: React.FC<UserProfileProps> = ({
  user,
  onUpdate,
  isLoading = false,
}) => {
  // Component implementation
};

// ❌ Avoid: Implicit types and unclear naming
const Component = ({ u, fn, loading }) => {
  // Implementation
};
```

### React Native Patterns

```typescript
// ✅ Good: Proper component structure
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  title: string;
  onPress: () => void;
}

export const CustomButton: React.FC<Props> = ({ title, onPress }) => {
  const Colors = useColors();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    setIsPressed(true);
    onPress();
    setTimeout(() => setIsPressed(false), 150);
  }, [onPress]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      <Text style={[styles.text, { color: Colors.white }]}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### File Organization

```
components/
├── Button/
│   ├── index.tsx          # Main component
│   ├── Button.test.tsx    # Tests
│   ├── Button.styles.ts   # Styles (if complex)
│   └── types.ts           # Component-specific types
```

### Import Organization

```typescript
// 1. React and React Native imports
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';

// 3. Internal imports (using @ alias)
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/Button';
import { UserProfile } from '@/types/user';

// 4. Relative imports
import './Component.styles';
```

## 🧪 Testing Requirements

### Test Coverage Expectations

- **Components**: 90% coverage minimum
- **Utilities**: 95% coverage minimum
- **Hooks**: 90% coverage minimum
- **Stores**: 85% coverage minimum

### Writing Tests

```typescript
// Component test example
describe('Button Component', () => {
  it('should render with correct title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx
```

## 🔍 Code Review Process

### Review Criteria

**Functionality**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance is acceptable

**Code Quality**
- [ ] Code is readable and well-structured
- [ ] Follows project conventions
- [ ] No code duplication
- [ ] Proper error handling

**Testing**
- [ ] Adequate test coverage
- [ ] Tests are meaningful
- [ ] Tests pass consistently
- [ ] Manual testing completed

**Documentation**
- [ ] Code is self-documenting
- [ ] Complex logic is commented
- [ ] README updated if needed
- [ ] API documentation updated

### Review Timeline

- **Initial Review**: Within 2 business days
- **Follow-up Reviews**: Within 1 business day
- **Final Approval**: After all feedback addressed

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- Device: [e.g. iPhone 12, Pixel 5]
- OS: [e.g. iOS 15.0, Android 12]
- App Version: [e.g. 1.2.0]

**Additional Context**
Add any other context about the problem here.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.

**User Story**
As a [type of user], I want [goal] so that [benefit].
```

## 🏆 Recognition

### Contributor Levels

**First-time Contributors**
- Welcome package and onboarding
- Mentorship from experienced contributors
- Recognition in release notes

**Regular Contributors**
- Direct commit access (after proven track record)
- Participation in planning discussions
- Special contributor badge

**Core Contributors**
- Code review responsibilities
- Architecture decision participation
- Release management involvement

### Hall of Fame

Outstanding contributors are recognized in:
- Project README
- Release announcements
- Annual contributor awards
- Conference speaking opportunities

## 📞 Getting Help

### Communication Channels

**GitHub Issues**
- Bug reports and feature requests
- Technical discussions
- Project planning

**Discord Community** (Coming Soon)
- Real-time chat with contributors
- Help with development setup
- General discussions

**Email Support**
- Private security issues
- Sensitive topics
- Direct maintainer contact

### Mentorship Program

New contributors can request mentorship:
1. Comment on a "good first issue"
2. Tag `@mentorship-team`
3. Get paired with an experienced contributor
4. Receive guidance through your first PR

## 📚 Resources

### Learning Materials

**React Native**
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)

**TypeScript**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

**Testing**
- [Testing Library Documentation](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Project-Specific Guides

- [Setup Guide](./setup.md)
- [Architecture Overview](./tech-stack.md)
- [Component Guidelines](./components.md)
- [Testing Strategy](./testing.md)

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead:
1. Email security@unipilot.com
2. Include detailed description
3. Provide steps to reproduce
4. Allow 90 days for fix before disclosure

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP mobile security guidelines
- Keep dependencies updated

## 📄 License

By contributing to UniPilot, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Thank You

Thank you for contributing to UniPilot! Your efforts help make international education more accessible to students worldwide. Every contribution, no matter how small, makes a difference.

---

**Questions?** Don't hesitate to ask! Create an issue with the `question` label or reach out to the maintainers directly.

Happy coding! 🚀
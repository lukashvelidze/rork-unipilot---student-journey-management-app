# Components Documentation

UniPilot uses a modular component architecture inspired by atomic design principles. This document outlines our component system, design patterns, and usage guidelines.

## 🏗️ Component Architecture

### Design System Hierarchy

```
Atoms (Basic Elements)
├── Button
├── Input
├── Avatar
└── ProgressBar

Molecules (Simple Combinations)
├── Card
├── TaskItem
├── CountrySelector
└── TopicSelector

Organisms (Complex Components)
├── PostCard
├── DocumentCard
├── MemoryCard
├── PremiumResourceCard
└── PaddleCheckout

Templates (Page Layouts)
├── TabLayout
├── StackLayout
└── ModalLayout
```

## 🎨 Design Principles

### Consistency
- **Unified spacing**: 4px grid system (4, 8, 12, 16, 20, 24, 32, 40px)
- **Color palette**: Consistent use of theme colors
- **Typography**: Standardized font sizes and weights
- **Border radius**: Consistent corner radius (8, 12, 16, 20px)

### Accessibility
- **Color contrast**: WCAG AA compliant contrast ratios
- **Touch targets**: Minimum 44px touch targets
- **Screen readers**: Proper accessibility labels
- **Keyboard navigation**: Full keyboard support

### Performance
- **Memoization**: React.memo for expensive components
- **Lazy loading**: Dynamic imports for heavy components
- **Optimized renders**: Minimal re-renders
- **Image optimization**: Proper image sizing and caching

## 🧱 Atomic Components

### Button Component

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
```

**Usage:**
```tsx
<Button 
  title="Get Started" 
  variant="primary" 
  size="large"
  onPress={handlePress}
  icon={<ArrowRight size={16} />}
/>
```

**Variants:**
- **Primary**: Main call-to-action buttons
- **Secondary**: Secondary actions
- **Outline**: Subtle actions with border
- **Ghost**: Minimal styling for subtle actions

### Input Component

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Features:**
- **Validation states**: Error, success, and default states
- **Icon support**: Left and right icon placement
- **Accessibility**: Proper labeling and error announcements
- **Platform consistency**: Native feel on each platform

### Avatar Component

```typescript
interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  onPress?: () => void;
}
```

**Features:**
- **Fallback initials**: Shows initials when no image
- **Customizable size**: Any size with consistent styling
- **Press handling**: Optional onPress for interactive avatars
- **Accessibility**: Proper image descriptions

### ProgressBar Component

```typescript
interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
  showPercentage?: boolean;
}
```

**Features:**
- **Smooth animations**: Animated progress changes
- **Customizable styling**: Colors and dimensions
- **Accessibility**: Progress announcements
- **Performance**: Optimized for frequent updates

## 🔗 Molecular Components

### Card Component

```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  borderRadius?: number;
  shadow?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}
```

**Usage:**
```tsx
<Card shadow onPress={handlePress}>
  <Text>Card content</Text>
</Card>
```

**Features:**
- **Flexible container**: Wraps any content
- **Interactive**: Optional press handling
- **Consistent styling**: Unified card appearance
- **Shadow support**: Platform-appropriate shadows

### TaskItem Component

```typescript
interface TaskItemProps {
  title: string;
  description?: string;
  completed: boolean;
  onToggle: () => void;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  locked?: boolean;
}
```

**Features:**
- **Completion states**: Visual feedback for completed tasks
- **Priority indicators**: Color-coded priority levels
- **Due date display**: Formatted date with urgency indicators
- **Lock state**: Visual indication for premium-only tasks

### CountrySelector Component

```typescript
interface CountrySelectorProps {
  selectedCountry?: Country;
  onSelect: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  countries?: Country[];
}
```

**Features:**
- **Search functionality**: Filter countries by name
- **Flag display**: Country flags for visual identification
- **Keyboard navigation**: Full keyboard support
- **Customizable list**: Filter available countries

## 🏢 Organism Components

### PostCard Component

```typescript
interface PostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  currentUserId?: string;
}
```

**Features:**
- **Rich content**: Text, images, and media support
- **Interaction buttons**: Like, comment, and share
- **User information**: Author details and timestamps
- **Responsive design**: Adapts to different screen sizes

### DocumentCard Component

```typescript
interface DocumentCardProps {
  document: Document;
  onView: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  showActions?: boolean;
}
```

**Features:**
- **File type icons**: Visual indicators for different file types
- **Action menu**: View, download, and delete options
- **Upload progress**: Progress indicator for uploading files
- **Thumbnail preview**: Image thumbnails when available

### PaddleCheckout Component

```typescript
interface PaddleCheckoutProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCancel: () => void;
  customerEmail?: string;
  userId?: string;
  priceId?: string;
}
```

**Features:**
- **Cross-platform**: Web and mobile implementations
- **Secure payment**: Paddle integration for payments
- **Loading states**: Visual feedback during payment processing
- **Error handling**: Graceful error handling and recovery

## 🎨 Styling System

### Theme Integration

```typescript
// Using theme colors
const Colors = useColors();

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  text: {
    color: Colors.text,
  },
});
```

### Responsive Design

```typescript
// Responsive utilities
const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const isLandscape = width > height;

const styles = StyleSheet.create({
  container: {
    padding: isTablet ? 24 : 16,
    flexDirection: isLandscape ? 'row' : 'column',
  },
});
```

### Platform-Specific Styling

```typescript
const styles = StyleSheet.create({
  button: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
      },
    }),
  },
});
```

## 🔄 State Management in Components

### Local State

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Optimistic updates
const handleLike = async () => {
  setIsLiked(!isLiked); // Immediate UI update
  try {
    await likePost(postId);
  } catch (error) {
    setIsLiked(isLiked); // Revert on error
    setError('Failed to like post');
  }
};
```

### Global State Integration

```typescript
// Using Zustand store
const { user, updateUser } = useUserStore();
const { posts, addPost } = useCommunityStore();

// Reactive updates
useEffect(() => {
  if (user?.isPremium) {
    // Show premium features
  }
}, [user?.isPremium]);
```

## 🧪 Component Testing

### Unit Testing

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { getByText } = render(
      <Button title="Test" onPress={() => {}} loading />
    );
    
    expect(getByText('Loading...')).toBeTruthy();
  });
});
```

### Integration Testing

```typescript
describe('PostCard Integration', () => {
  it('handles like interaction', async () => {
    const mockPost = { id: '1', title: 'Test Post', likes: 0 };
    const { getByTestId } = render(
      <PostCard post={mockPost} onLike={mockLike} />
    );
    
    fireEvent.press(getByTestId('like-button'));
    await waitFor(() => {
      expect(mockLike).toHaveBeenCalledWith('1');
    });
  });
});
```

## 📱 Platform Considerations

### iOS Specific
- **Native feel**: iOS-style navigation and interactions
- **Safe areas**: Proper safe area handling
- **Haptic feedback**: Tactile feedback for interactions
- **Accessibility**: VoiceOver support

### Android Specific
- **Material Design**: Android design language
- **Back button**: Hardware back button handling
- **Permissions**: Runtime permission requests
- **Accessibility**: TalkBack support

### Web Specific
- **Responsive design**: Breakpoint-based layouts
- **Keyboard navigation**: Tab order and focus management
- **SEO**: Semantic HTML structure
- **Performance**: Code splitting and lazy loading

## 🚀 Performance Optimization

### Memoization

```typescript
const ExpensiveComponent = React.memo(({ data, onPress }) => {
  const processedData = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);

  return (
    <View>
      {processedData.map(item => (
        <ItemComponent key={item.id} item={item} onPress={onPress} />
      ))}
    </View>
  );
});
```

### Virtualization

```typescript
import { FlatList } from 'react-native';

const LargeList = ({ data }) => {
  const renderItem = useCallback(({ item }) => (
    <ItemComponent item={item} />
  ), []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};
```

## 📋 Component Guidelines

### Development Best Practices

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition to build complex components
3. **Props Interface**: Always define TypeScript interfaces for props
4. **Default Props**: Provide sensible defaults for optional props
5. **Error Boundaries**: Wrap components that might fail

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `PaymentButton`)
- **Props**: camelCase (`onPress`, `isLoading`, `backgroundColor`)
- **Files**: Match component name (`UserProfile.tsx`)
- **Directories**: kebab-case for multi-word (`user-profile/`)

### Documentation

```typescript
/**
 * Button component with multiple variants and states
 * 
 * @param title - Button text
 * @param onPress - Function called when button is pressed
 * @param variant - Visual style variant
 * @param disabled - Whether button is disabled
 * 
 * @example
 * <Button 
 *   title="Save Changes" 
 *   variant="primary" 
 *   onPress={handleSave}
 * />
 */
```

This component system provides a solid foundation for building consistent, accessible, and performant user interfaces across all platforms while maintaining code reusability and developer productivity.
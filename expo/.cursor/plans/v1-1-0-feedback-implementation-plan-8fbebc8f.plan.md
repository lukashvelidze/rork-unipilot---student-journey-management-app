<!-- 8fbebc8f-1a39-45f2-abb6-c7b74bf4fec3 66ac8317-5b7b-4bde-a591-54c13e89d29a -->
# UniPilot v1.1.0 Feedback Implementation Plan

## Overview

This plan addresses 27 user feedback items from v1.0.0, organized by implementation priority and launch timeline. Items are categorized into Critical Bugs, Essential Features (pre-February launch), and Major Features (post-launch).

---

## CRITICAL BUGS (Must Fix Before Launch)

### 1. Fix Blank Resource Pages

**Files**: `app/premium/[id].tsx`, `app/premium/resources.tsx`

- **Issue**: Some resource detail pages show blank content
- **Solution**: 
- Add error handling for missing resource content
- Validate resource IDs exist in `resourcesContent` object
- Add fallback UI when resource not found
- Ensure all resources in list have corresponding detail content

### 2. Fix Logo Issue (Rork → UniPilot)

**Files**: `app.json`, `app/_layout.tsx`, `app/index.tsx`, splash screen assets

- **Issue**: Rork logo appears briefly during login
- **Solution**:
- Update splash screen image (`assets/images/splash-icon.png`) with UniPilot logo
- Update app icon (`assets/images/icon.png`)
- Verify no "rork" references in branding
- Test splash screen display during app initialization

### 3. Fix Navigation - Remove "(tabs)" in Back Button

**Files**: `app/_layout.tsx`, all tab screen headers

- **Issue**: Back button shows "<(tabs)" instead of "Back"
- **Solution**:
- Configure proper header labels in Stack.Screen options
- Use `headerBackTitle: "Back"` on iOS
- Set `headerBackTitleVisible: false` or customize back button

### 4. Fix Duplicate Home Pages in Nav

**Files**: `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/home.tsx`

- **Issue**: Two home pages appear in navigation
- **Solution**:
- Remove duplicate tab entry (likely `index.tsx` or `home.tsx`)
- Consolidate to single home screen
- Update routing if both files serve different purposes

---

## ESSENTIAL FEATURES (Pre-February Launch)

### 5. Customize Document Upload Fields by Type

**Files**: `app/documents/new.tsx`, `types/user.ts`

- **Current**: All documents use same fields (name, expiry date, reminder date)
- **Solution**:
- Create document type schemas with type-specific fields:
- **Passport**: passport number, expiry date, issue date, country
- **Diploma**: school name, issue date, degree type, GPA
- **Visa**: visa number, issue date, expiry date, country
- **Transcript**: school name, issue date, GPA, credits
- **Other types**: Add appropriate fields per type
- Update Document type interface to support dynamic fields
- Create conditional field rendering based on selected type
- Update document store to handle varied field structures

### 6. Capitalize Document Categories

**Files**: `app/documents/new.tsx`, `app/(tabs)/documents.tsx`

- **Solution**: Format document type labels with proper capitalization
- "passport" → "Passport"
- "letter_of_recommendation" → "Letter of Recommendation"
- Update display labels in type selector and document cards

### 7. Display Only Name in "Welcome Back" Message

**Files**: `app/(tabs)/index.tsx` (line 148)

- **Current**: Shows "Welcome back, [Name]!"
- **Solution**: Change to display only user name without "Welcome back" prefix
- Update greeting text to: `{user.name}`

### 8. Prevent Marking Next Steps Before Completing Previous

**Files**: `store/journeyStore.ts`, `app/journey/[id].tsx`, `app/(tabs)/journey.tsx`

- **Issue**: Users can mark tasks/stages complete without completing prerequisites
- **Solution**:
- Add `prerequisites` field to Task interface (array of task IDs)
- Check prerequisites before allowing task completion
- Disable task checkboxes if prerequisites incomplete
- Show tooltip/alert explaining why task is locked
- Update `updateTaskCompletion` to validate prerequisites

### 9. Organize Premium Resources Page

**Files**: `app/premium/resources.tsx`, `store/premiumResourcesStore.ts`

- **Issue**: Resources page needs better organization
- **Solution**:
- Add sorting options (by popularity, date, category, difficulty)
- Implement search functionality (already in store, needs UI)
- Add filter chips for categories
- Group resources by category with expandable sections
- Add "Recently Viewed" section
- Implement pagination or virtual scrolling for large lists

### 10. Fix Picture Uploads for Memories

**Files**: `app/memories/new.tsx`

- **Current**: Camera/Gallery show "coming soon" alerts
- **Solution**:
- Integrate `expo-image-picker` (already in dependencies)
- Add camera capture functionality
- Add gallery picker functionality
- Handle image permissions (NSCameraUsageDescription already set)
- Upload images to backend/storage (or use local URI initially)
- Update memory card display to show uploaded images

### 11. Generate Instagram-Shareable Story Cards for Memories

**Files**: `app/memories/[id].tsx`, new component for story generation

- **Solution**:
- Create `components/MemoryStoryCard.tsx` component
- Use `expo-image-manipulator` or `react-native-view-shot` to generate story-sized images
- Add share functionality using `expo-sharing`
- Template design: memory image + title + quote/stats
- Export as 1080x1920 image (Instagram story size)
- Add "Share to Instagram" button in memory detail view

---

## MAJOR FEATURES (Post-February Launch / v1.2.0+)

### 12. Database Migration & Backend Architecture

**Scope**: Complete architectural overhaul

- **Current**: Local storage (AsyncStorage) with minimal backend
- **Solution**:
- **Database Choice**: Recommend PostgreSQL + Prisma ORM
- **Backend Framework**: Already using Hono + tRPC (good setup)
- **Migration Strategy**:

1. Set up database schema for users, documents, journey progress, memories, subscriptions
2. Create tRPC routes for all data operations
3. Migrate from AsyncStorage to API calls gradually
4. Add sync mechanism for offline support

- **Security**:
- Implement JWT authentication
- Add role-based access control (RBAC)
- Secure API endpoints with middleware
- Encrypt sensitive data (payment info, documents)
- **Subscription Control**:
- Store subscription status in database
- Add subscription tier enum (free, premium)
- Create middleware to check subscription on protected routes
- Integrate with Paddle webhooks for subscription events

### 13. Multi-Country Profile System

**Scope**: Major feature requiring database

- **Solution**:
- **Schema Design**:
- User has one home country (unchanged)
- User can have multiple destination country profiles
- Each profile has: country, journey progress, documents, checklist, timeline
- **UI/UX**:
- Add country switcher in profile/settings
- Show current active country in header/badge
- Allow creating new country profile
- Quick switch between profiles
- Merge shared data (user info) but separate journey progress
- **Backend**:
- `UserCountryProfile` table with foreign key to User
- Separate journey progress per country profile
- Documents can be tagged with country or shared

### 14. Country-Specific Checklist Customization

**Files**: `mocks/journeyTasks.ts`, `mocks/applicationChecklist.ts`

- **Current**: Generic checklists, some country-specific but not comprehensive
- **Solution**:
- **Only Allow Countries with Complete Checklists**:
- Create checklist configuration per country
- Validate checklist completeness before allowing country selection
- Show "Coming Soon" for incomplete countries
- **Admin Control**:
- Build admin dashboard/API for checklist management
- Allow adding/editing checklist items per country
- Version control for checklist changes
- **Checklist Customization Logic**:
- Store country-specific tasks in database
- Tasks have country filter field
- Generate journey progress from country-specific template

### 15. Document Scanner Integration

**Files**: `app/documents/new.tsx`

- **Solution**:
- Integrate `expo-document-scanner` or `react-native-vision-camera` with document detection
- Add scan button in document upload flow
- Use OCR (Tesseract.js or cloud service) to extract document info
- Auto-populate fields based on scanned content
- Allow manual correction of OCR results

### 16. Visa Interview AI Assistant (Premium Feature)

**Files**: `app/unipilot-ai/index.tsx`, new route `app/premium/visa-interview.tsx`

- **Solution**:
- Extend existing AI assistant with visa interview mode
- Create conversation flow for practice interviews
- Provide country-specific interview questions
- Give feedback on answers
- Track practice sessions
- Include tips for common visa interview scenarios
- Lock behind premium subscription check

### 17. Tweak Personal AI Assistant

**Files**: `app/unipilot-ai/index.tsx`

- **Solution**:
- Improve prompt engineering for more personalized responses
- Add context awareness (current journey stage, country, goals)
- Add conversation history
- Provide more actionable advice
- Add quick action suggestions based on user progress

---

## IMPLEMENTATION PRIORITIES

### Phase 1: Critical Bugs (Week 1)

- Fix blank resource pages
- Fix logo/branding
- Fix navigation issues
- Remove duplicate home page

### Phase 2: Essential UI/UX (Weeks 2-3)

- Customize document fields
- Capitalize categories
- Fix welcome message
- Organize premium resources
- Fix memory image uploads
- Generate story cards

### Phase 3: Journey Logic (Week 4)

- Implement prerequisite checking for tasks
- Prevent skipping stages

### Phase 4: Database & Backend (Weeks 5-8)

- Set up database schema
- Create tRPC routes
- Migrate local storage to API
- Implement subscription control
- Set up authentication

### Phase 5: Multi-Country (Weeks 9-12)

- Design multi-country schema
- Build UI for country switching
- Implement country-specific data separation
- Test migration of existing users

### Phase 6: Advanced Features (Post-Launch)

- Document scanner
- Visa interview AI assistant
- Checklist admin system
- Enhanced AI assistant

---

## TECHNICAL DECISIONS

### Database & Backend

- **Database**: PostgreSQL (via Supabase, Railway, or self-hosted)
- **ORM**: Prisma (already good TypeScript support)
- **Backend**: Continue with Hono + tRPC (already in place)
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 or Cloudflare R2 for documents/images

### Subscription Management

- **Payment**: Paddle (already integrated per `PADDLE_EMBEDDED_CHECKOUT.md`)
- **Subscription Tiers**: Store in database, check via middleware
- **Feature Gating**: Middleware function `requirePremium()` for protected routes

### Multi-Country Architecture

- User table: basic info (shared across countries)
- CountryProfile table: separate journey, documents, timeline per country
- Default active country stored in user preferences
- Quick switch updates active context

### Checklist System

- ChecklistItems table with country filter
- Admin API to manage checklists
- Versioning system for checklist changes
- Validation before allowing country selection

### To-dos

- [ ] Fix blank resource pages - add error handling and validate resource IDs exist in resourcesContent
- [ ] Replace Rork logo with UniPilot logo in splash screen and app icons (assets/images/splash-icon.png, icon.png)
- [ ] Fix back button showing '<(tabs)' - configure proper headerBackTitle in Stack.Screen options
- [ ] Remove duplicate home page from navigation - consolidate index.tsx and home.tsx
- [ ] Create type-specific document fields (passport: number/expiry, diploma: school/issue date, etc.)
- [ ] Capitalize document category labels in UI (Passport, Letter of Recommendation, etc.)
- [ ] Update home screen to show only user name, remove 'Welcome back' text
- [ ] Add prerequisite checking to journey tasks - disable tasks until prerequisites completed
- [ ] Add sorting, filtering, and better organization to premium resources page
- [ ] Implement expo-image-picker for camera and gallery photo uploads in memories
- [ ] Create Instagram-shareable story card generator for memories (1080x1920 template)
- [ ] Set up PostgreSQL database with Prisma schema for users, documents, journey progress, subscriptions
- [ ] Create tRPC routes for all data operations and migrate from AsyncStorage to API calls
- [ ] Implement subscription tier checking middleware and Paddle webhook integration
- [ ] Design database schema for multi-country profiles (UserCountryProfile table)
- [ ] Build UI for country switching and managing multiple destination country profiles
- [ ] Create country-specific checklist system with admin control and validation for incomplete countries
- [ ] Integrate document scanner with OCR for auto-filling document fields
- [ ] Build visa interview AI assistant premium feature with practice mode and feedback
- [ ] Improve personal AI assistant with better context awareness and actionable advice
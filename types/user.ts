export interface Country {
  code: string;
  name: string;
  flag: string;
  isPopularDestination?: boolean;
}

export type DocumentType = "passport" | "visa" | "transcript" | "diploma" | "letter_of_recommendation" | "statement_of_purpose" | "financial_statement" | "health_certificate" | "insurance" | "other";

export type EducationLevel = "high_school" | "bachelors" | "masters" | "phd" | "other";

export type JourneyStage = "research" | "application" | "visa" | "pre_departure" | "arrival" | "academic" | "career";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
  dueDate?: string;
  isAcceptanceTask?: boolean; // Marks tasks that unlock after acceptance
  requiresAcceptance?: boolean; // Tasks that need acceptance to be unlocked
}

export interface JourneyProgress {
  stage: JourneyStage;
  progress: number; // 0-100
  completed: boolean;
  completedDate?: string;
  tasks: Task[];
  hasAcceptance?: boolean; // Tracks if user has been accepted
}

export interface TestScore {
  id: string;
  type: "IELTS" | "TOEFL" | "GRE" | "GMAT" | "SAT" | "ACT" | "Other";
  score: string;
  maxScore?: string;
  date: string;
  expiryDate?: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  program: string;
  status: "researching" | "applied" | "accepted" | "rejected" | "waitlisted";
  applicationDate?: string;
  decisionDate?: string;
  notes?: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  title?: string;
  status: "valid" | "expiring_soon" | "expired" | "pending";
  expiryDate?: string;
  reminderDate?: string;
  uploadDate: string;
  notes?: string;
}

export type MemoryMood = "excited" | "nervous" | "happy" | "proud" | "grateful" | "accomplished" | "hopeful" | "determined";

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  stage: JourneyStage;
  imageUrl?: string;
  tags?: string[];
  mood?: MemoryMood;
}

export interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
  completed: boolean;
  icon: any; // LucideIcon type
  progress?: number;
}

export interface EducationBackground {
  level: EducationLevel;
  institution?: string;
  field?: string;
  gpa?: string;
  graduationDate?: string;
}

export type SubscriptionTier = "free" | "basic" | "standard" | "premium" | "pro";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  careerGoal?: string;
  homeCountry: Country;
  destinationCountry: Country;
  educationBackground: EducationBackground;
  testScores: TestScore[];
  universities: University[];
  documents: Document[];
  journeyProgress: JourneyProgress[];
  memories: Memory[];
  onboardingCompleted: boolean;
  onboardingStep: number;
  isPremium: boolean;
  premiumSince?: string | null;
  subscriptionTier?: SubscriptionTier | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  notifications: {
    push: boolean;
    email: boolean;
    community: boolean;
    journey: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showProgress: boolean;
  };
}

// Country-specific information interfaces
export interface CountryVisaInfo {
  name: string;
  processingTime: string;
  fee: string;
  requirements: string[];
}

export interface CountryCostInfo {
  currency: string;
  monthlyLiving: string;
  tuition: string;
  accommodation: string;
}

export interface CountryLanguageInfo {
  language: string;
  tests: string[];
  minimumScore: string;
}

// Extended country interface with additional study abroad information
export interface StudyDestination extends Country {
  visaInfo?: CountryVisaInfo;
  costInfo?: CountryCostInfo;
  languageInfo?: CountryLanguageInfo;
  popularUniversities?: string[];
  bestTimeToApply?: string;
  academicYear?: string;
  workRights?: string;
  postStudyWork?: string;
}

export type JourneyStage = 'research' | 'application' | 'visa' | 'pre_departure' | 'arrival' | 'academic' | 'career';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface EducationBackground {
  level: 'high_school' | 'bachelors' | 'masters' | 'phd' | 'other';
  field?: string;
  institution?: string;
  graduationYear?: number;
}

export interface TestScore {
  id: string;
  type: 'ielts' | 'toefl' | 'gre' | 'gmat' | 'sat' | 'other';
  score: string;
  date: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  program: string;
  status: 'researching' | 'applying' | 'applied' | 'accepted' | 'rejected' | 'waitlisted' | 'enrolled';
  deadline?: string;
  notes?: string;
}

export interface Document {
  id: string;
  name: string; // Added name property
  title: string;
  type: 'passport' | 'transcript' | 'recommendation' | 'statement' | 'cv' | 'financial' | 'other';
  status: 'needed' | 'in_progress' | 'completed' | 'submitted' | 'valid' | 'expiring_soon' | 'expired' | 'pending'; // Added additional status values
  deadline?: string;
  notes?: string;
  fileUrl?: string;
  expiryDate?: string; // Added expiryDate property
  reminderDate?: string; // Added reminderDate property
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface JourneyProgress {
  stage: JourneyStage;
  progress: number;
  completed: boolean;
  tasks: Task[];
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  imageUrl?: string;
  tags?: string[];
  stageId?: JourneyStage;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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
}
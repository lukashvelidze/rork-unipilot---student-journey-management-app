export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface TestScore {
  type: "IELTS" | "TOEFL" | "GRE" | "GMAT" | "SAT" | "ACT";
  score: string;
  date: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  ranking?: number;
  applicationStatus: "not_started" | "in_progress" | "submitted" | "accepted" | "rejected";
  applicationDeadline?: string;
  notes?: string;
}

export interface Document {
  id: string;
  name: string;
  type: "transcript" | "recommendation" | "essay" | "certificate" | "passport" | "visa" | "other";
  status: "missing" | "in_progress" | "completed";
  uploadDate?: string;
  expiryDate?: string;
  notes?: string;
  fileUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  category?: string;
}

export type JourneyStage = 
  | "research"
  | "application"
  | "visa"
  | "pre_departure"
  | "arrival"
  | "academic"
  | "career";

export interface JourneyProgress {
  stage: JourneyStage;
  progress: number;
  completed: boolean;
  tasks: Task[];
  startDate?: string;
  completedDate?: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  stage: JourneyStage;
  imageUrl?: string;
  tags: string[];
  mood: "excited" | "nervous" | "confident" | "overwhelmed" | "happy" | "proud";
}

export interface EducationBackground {
  level: "high_school" | "bachelors" | "masters" | "phd";
  institution?: string;
  major?: string;
  gpa?: string;
  graduationYear?: string;
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
  isPremium?: boolean;
  premiumSince?: string | null;
}
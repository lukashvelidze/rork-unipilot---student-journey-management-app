export type Country = {
  code: string;
  name: string;
  flag: string;
};

export type EducationLevel = "high_school" | "bachelors" | "masters" | "phd" | "other";

export type TestScore = {
  type: "GRE" | "TOEFL" | "IELTS" | "GMAT" | "SAT" | "ACT" | "Other";
  score: string;
  date: string;
};

export type University = {
  id: string;
  name: string;
  country: Country;
  status: "researching" | "applied" | "accepted" | "rejected" | "waitlisted" | "enrolled";
  program?: string;
  applicationDeadline?: string;
};

export type DocumentType = 
  | "passport" 
  | "visa" 
  | "i20" 
  | "admission_letter" 
  | "financial_documents" 
  | "transcripts" 
  | "test_scores" 
  | "health_insurance" 
  | "other";

export type Document = {
  id: string;
  type: DocumentType;
  name: string;
  expiryDate?: string;
  reminderDate?: string;
  status: "valid" | "expiring_soon" | "expired" | "pending";
  fileUri?: string;
};

export type JourneyStage = 
  | "research" 
  | "application" 
  | "visa" 
  | "pre_departure" 
  | "arrival" 
  | "academic" 
  | "career";

export type JourneyProgress = {
  stage: JourneyStage;
  progress: number; // 0-100
  completed: boolean;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
  }[];
};

export type Memory = {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUri?: string;
  feeling: "excited" | "happy" | "nervous" | "proud" | "sad" | "other";
  stage: JourneyStage;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  homeCountry: Country;
  destinationCountry: Country;
  educationBackground: {
    level: EducationLevel;
    institution?: string;
    gpa?: string;
    major?: string;
    graduationDate?: string;
  };
  testScores: TestScore[];
  universities: University[];
  documents: Document[];
  journeyProgress: JourneyProgress[];
  memories: Memory[];
  budget?: {
    currency: string;
    amount: number;
  };
  timeline?: {
    targetDepartureDate?: string;
    targetGraduationDate?: string;
  };
  careerGoals?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
};
export type JourneyStage = 
  | "research" 
  | "application" 
  | "visa" 
  | "pre_departure" 
  | "arrival" 
  | "academic" 
  | "career";

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
}

export interface JourneyProgress {
  stage: JourneyStage;
  progress: number;
  completed: boolean;
  tasks: Task[];
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface University {
  id: string;
  name: string;
  country: Country;
  logo?: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  images?: string[];
  location?: string;
  tags?: string[];
  mood?: "happy" | "excited" | "neutral" | "anxious" | "sad";
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  homeCountry: Country;
  destinationCountry: Country;
  university?: University;
  program?: string;
  startDate?: string;
  endDate?: string;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
}
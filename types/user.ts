export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  country?: string;
  targetCountry?: string;
  studyLevel?: "undergraduate" | "graduate" | "phd";
  fieldOfStudy?: string;
  isPremium?: boolean;
  createdAt: string;
  updatedAt: string;
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
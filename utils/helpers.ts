import { JourneyProgress } from "@/types/user";
import { Topic } from "@/types/community";
import Colors from "@/constants/colors";

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const calculateOverallProgress = (journeyProgress: JourneyProgress[]): number => {
  if (journeyProgress.length === 0) return 0;
  
  const totalProgress = journeyProgress.reduce((sum, stage) => sum + stage.progress, 0);
  return Math.round(totalProgress / journeyProgress.length);
};

export const getRandomTip = (tips: string[]): string => {
  const randomIndex = Math.floor(Math.random() * tips.length);
  return tips[randomIndex];
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return dateObj.toLocaleDateString('en-US', options);
};

export const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Check if a value is a milestone (25%, 50%, 75%, 100%)
export const isMilestone = (value: number): boolean => {
  return value === 25 || value === 50 || value === 75 || value === 100;
};

// Get a celebratory message based on progress
export const getCelebrationMessage = (progress: number): string => {
  if (progress === 100) {
    return "Amazing! You've completed this stage!";
  } else if (progress === 75) {
    return "Great progress! You're 75% of the way there!";
  } else if (progress === 50) {
    return "Halfway there! Keep going!";
  } else if (progress === 25) {
    return "You're making great progress!";
  } else {
    return "Keep up the good work!";
  }
};

// Map topic to a color
export const getTopicColor = (topic: Topic): string => {
  switch (topic) {
    case "visa":
      return Colors.success; // Green
    case "university":
      return Colors.primary; // Blue
    case "accommodation":
      return Colors.secondary; // Green
    case "finances":
      return Colors.warning; // Yellow
    case "culture":
      return "#9C27B0"; // Purple
    case "academics":
      return Colors.academic; // Indigo
    case "career":
      return Colors.career; // Teal
    case "general":
    default:
      return Colors.info; // Info blue
  }
};

// Get document status color
export const getDocumentStatusColor = (status: string): string => {
  switch (status) {
    case "valid":
      return Colors.success;
    case "expiring_soon":
      return Colors.warning;
    case "expired":
      return Colors.error;
    case "pending":
      return Colors.lightText;
    default:
      return Colors.text;
  }
};

// Get initials from a name
export const getInitials = (name: string): string => {
  if (!name) return "?";
  
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2); // Limit to 2 characters
};

// Check if a date is expired
export const isDateExpired = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

// Check if a date is expiring soon (within 30 days)
export const isDateExpiringSoon = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  return date > now && date <= thirtyDaysFromNow;
};
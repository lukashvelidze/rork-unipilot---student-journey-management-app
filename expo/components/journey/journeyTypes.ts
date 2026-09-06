export type MilestoneStatus = "completed" | "current" | "locked";

export type JourneyIcon =
  | "research"
  | "application"
  | "visa"
  | "pre_departure"
  | "arrival"
  | "academic"
  | "career";

export interface JourneyMilestone {
  id: string;
  title: string;
  subtitle: string;
  icon: JourneyIcon;
  status: MilestoneStatus;
  progress: number;
  completedTasks: number;
  totalTasks: number;
}

export interface JourneyPoint {
  x: number;
  y: number;
  angle: number;
}

export interface JourneyGeometry {
  path: string;
  pathLength: number;
  height: number;
  samples: JourneyPoint[];
}

export const JOURNEY_COLORS = {
  blue: "#3478F6",
  coral: "#FF6B66",
  upcoming: "#D9E2EC",
  ink: "#172033",
  muted: "#7B879B",
  surface: "#FFFFFF",
} as const;

import type { JourneyProgress as StoredJourneyProgress } from "@/types/user";
import type {
  JourneyIcon,
  JourneyMilestone,
  MilestoneStatus,
} from "./journeyTypes";

export const getJourneyProgress = (journey: StoredJourneyProgress[]) => {
  if (journey.length === 0) return 0;
  const totalProgress = journey.reduce(
    (total, checklist) => total + checklist.progress,
    0,
  );
  return totalProgress / journey.length / 100;
};

export const getCompletedCount = (journey: StoredJourneyProgress[]) =>
  journey.filter((checklist) => checklist.completed).length;

export const toJourneyMilestones = (
  journey: StoredJourneyProgress[],
): JourneyMilestone[] => {
  const currentIndex = journey.findIndex(
    (checklist) => !checklist.completed,
  );

  return journey.map((checklist, index) => {
    const completedTasks = checklist.tasks.filter(
      (task) => task.completed,
    ).length;
    let status: MilestoneStatus = "locked";
    if (checklist.completed) status = "completed";
    else if (index === currentIndex) status = "current";

    return {
      id: checklist.id,
      title: checklist.title,
      subtitle:
        checklist.description ||
        `${completedTasks} of ${checklist.tasks.length} tasks complete`,
      icon: checklist.stage as JourneyIcon,
      status,
      progress: checklist.progress,
      completedTasks,
      totalTasks: checklist.tasks.length,
    };
  });
};

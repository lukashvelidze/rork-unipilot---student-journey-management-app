import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { JourneyProgress, JourneyStage } from "@/types/user";

interface Milestone {
  type: "stage_complete" | "progress_milestone" | "confetti";
  stage?: JourneyStage;
  progress?: number;
  timestamp: number;
}

interface JourneyState {
  journeyProgress: JourneyProgress[];
  recentMilestone: Milestone | null;
  setJourneyProgress: (progress: JourneyProgress[]) => void;
  updateTaskCompletion: (stageId: JourneyStage, taskId: string, completed: boolean) => void;
  addRecentMilestone: (milestone: Milestone) => void;
  clearRecentMilestone: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      journeyProgress: [],
      recentMilestone: null,
      
      setJourneyProgress: (progress) => set({ journeyProgress: progress }),
      
      updateTaskCompletion: (stageId, taskId, completed) => {
        set((state) => {
          const updatedProgress = state.journeyProgress.map((stage) => {
            if (stage.stage === stageId) {
              const updatedTasks = stage.tasks.map((task) =>
                task.id === taskId ? { ...task, completed } : task
              );
              
              const completedTasks = updatedTasks.filter((task) => task.completed).length;
              const totalTasks = updatedTasks.length;
              const progress = Math.round((completedTasks / totalTasks) * 100);
              const stageCompleted = progress === 100;
              
              return {
                ...stage,
                tasks: updatedTasks,
                progress,
                completed: stageCompleted,
                completedDate: stageCompleted && !stage.completed ? new Date().toISOString() : stage.completedDate,
              };
            }
            return stage;
          });
          
          return { journeyProgress: updatedProgress };
        });
      },
      
      addRecentMilestone: (milestone) => set({ recentMilestone: milestone }),
      
      clearRecentMilestone: () => set({ recentMilestone: null }),
    }),
    {
      name: "journey-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
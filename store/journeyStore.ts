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
  getOverallProgress: () => number;
  getTotalCompletedTasks: () => number;
  getTotalTasks: () => number;
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
      
      getOverallProgress: () => {
        const state = get();
        if (state.journeyProgress.length === 0) return 0;
        
        const totalTasks = state.journeyProgress.reduce((sum, stage) => sum + stage.tasks.length, 0);
        const completedTasks = state.journeyProgress.reduce((sum, stage) => 
          sum + stage.tasks.filter(task => task.completed).length, 0
        );
        
        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      },
      
      getTotalCompletedTasks: () => {
        const state = get();
        return state.journeyProgress.reduce((sum, stage) => 
          sum + stage.tasks.filter(task => task.completed).length, 0
        );
      },
      
      getTotalTasks: () => {
        const state = get();
        return state.journeyProgress.reduce((sum, stage) => sum + stage.tasks.length, 0);
      },
    }),
    {
      name: "journey-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
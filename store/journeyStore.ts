import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { JourneyProgress, JourneyStage, Memory } from "@/types/user";

export type MilestoneType = "confetti" | "achievement" | "milestone";

export interface Milestone {
  id: string;
  stageId: JourneyStage;
  type: MilestoneType;
  message: string;
  timestamp: number;
}

interface JourneyState {
  journeyProgress: JourneyProgress[];
  memories: Memory[];
  isLoading: boolean;
  error: string | null;
  recentMilestone: Milestone | null;
  setJourneyProgress: (progress: JourneyProgress[]) => void;
  updateStageProgress: (stage: JourneyStage, progress: number) => void;
  completeStage: (stage: JourneyStage) => void;
  updateTask: (stageId: JourneyStage, taskId: string, completed: boolean) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (memoryId: string, memoryData: Partial<Memory>) => void;
  deleteMemory: (memoryId: string) => void;
  clearRecentMilestone: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      journeyProgress: [],
      memories: [],
      isLoading: false,
      error: null,
      recentMilestone: null,
      setJourneyProgress: (progress) => set({ journeyProgress: progress }),
      updateStageProgress: (stage, progress) => 
        set((state) => ({
          journeyProgress: state.journeyProgress.map((item) => 
            item.stage === stage ? { ...item, progress } : item
          ),
        })),
      completeStage: (stage) => 
        set((state) => ({
          journeyProgress: state.journeyProgress.map((item) => 
            item.stage === stage ? { ...item, completed: true, progress: 100 } : item
          ),
          recentMilestone: {
            id: `milestone-${Date.now()}`,
            stageId: stage,
            type: "achievement",
            message: "Stage completed!",
            timestamp: Date.now(),
          }
        })),
      updateTask: (stageId, taskId, completed) => {
        const state = get();
        const stage = state.journeyProgress.find(s => s.stage === stageId);
        
        if (!stage) return;
        
        // Get current completed tasks count
        const currentCompletedCount = stage.tasks.filter(t => t.completed).length;
        
        // Update tasks and calculate new progress
        const updatedTasks = stage.tasks.map(task => 
          task.id === taskId ? { ...task, completed } : task
        );
        
        const newCompletedCount = updatedTasks.filter(t => t.completed).length;
        const newProgress = calculateProgress(updatedTasks);
        
        // Check if this update completes the stage
        const isStageCompleted = newProgress === 100 && stage.progress !== 100;
        
        // Check if this is a milestone (25%, 50%, 75%, 100%)
        const isMilestone = checkForMilestone(stage.progress, newProgress);
        
        // Create milestone if needed
        let milestone: Milestone | null = null;
        
        if (isStageCompleted) {
          milestone = {
            id: `stage-complete-${Date.now()}`,
            stageId,
            type: "achievement",
            message: "Stage completed!",
            timestamp: Date.now(),
          };
        } else if (isMilestone && completed) {
          milestone = {
            id: `milestone-${Date.now()}`,
            stageId,
            type: "milestone",
            message: `${newProgress}% of tasks completed!`,
            timestamp: Date.now(),
          };
        } else if (newCompletedCount > currentCompletedCount) {
          // Task completion celebration (smaller)
          milestone = {
            id: `task-complete-${Date.now()}`,
            stageId,
            type: "confetti",
            message: "Task completed!",
            timestamp: Date.now(),
          };
        }
        
        set((state) => ({
          journeyProgress: state.journeyProgress.map((stage) => 
            stage.stage === stageId 
              ? {
                  ...stage,
                  tasks: updatedTasks,
                  progress: newProgress,
                  completed: newProgress === 100,
                }
              : stage
          ),
          recentMilestone: milestone,
        }));
      },
      addMemory: (memory) => 
        set((state) => ({
          memories: [...state.memories, memory],
        })),
      updateMemory: (memoryId, memoryData) => 
        set((state) => ({
          memories: state.memories.map((memory) => 
            memory.id === memoryId ? { ...memory, ...memoryData } : memory
          ),
        })),
      deleteMemory: (memoryId) => 
        set((state) => ({
          memories: state.memories.filter((memory) => memory.id !== memoryId),
        })),
      clearRecentMilestone: () => set({ recentMilestone: null }),
    }),
    {
      name: "journey-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to calculate progress based on completed tasks
const calculateProgress = (tasks: { completed: boolean }[]): number => {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter((task) => task.completed).length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// Helper function to check if a progress change crosses a milestone threshold
const checkForMilestone = (oldProgress: number, newProgress: number): boolean => {
  const milestones = [25, 50, 75, 100];
  
  for (const milestone of milestones) {
    // Check if we've crossed this milestone
    if (oldProgress < milestone && newProgress >= milestone) {
      return true;
    }
  }
  
  return false;
};
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { JourneyProgress, JourneyStage, Memory } from "@/types/user";

interface JourneyState {
  journeyProgress: JourneyProgress[];
  memories: Memory[];
  isLoading: boolean;
  error: string | null;
  setJourneyProgress: (progress: JourneyProgress[]) => void;
  updateStageProgress: (stage: JourneyStage, progress: number) => void;
  completeStage: (stage: JourneyStage) => void;
  updateTask: (stageId: JourneyStage, taskId: string, completed: boolean) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (memoryId: string, memoryData: Partial<Memory>) => void;
  deleteMemory: (memoryId: string) => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set) => ({
      journeyProgress: [],
      memories: [],
      isLoading: false,
      error: null,
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
        })),
      updateTask: (stageId, taskId, completed) => 
        set((state) => ({
          journeyProgress: state.journeyProgress.map((stage) => 
            stage.stage === stageId 
              ? {
                  ...stage,
                  tasks: stage.tasks.map((task) => 
                    task.id === taskId ? { ...task, completed } : task
                  ),
                  progress: calculateProgress(
                    stage.tasks.map((task) => 
                      task.id === taskId ? { ...task, completed } : task
                    )
                  ),
                }
              : stage
          ),
        })),
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
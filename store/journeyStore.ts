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

interface FlightSearchResult {
  id: string;
  airline: string;
  price: number;
  currency: string;
  duration: string;
  stops: number;
  departure: {
    time: string;
    airport: string;
    city: string;
  };
  arrival: {
    time: string;
    airport: string;
    city: string;
  };
  bookingUrl: string;
  priceChange?: "up" | "down" | "same";
  deal?: boolean;
}

interface FlightSearchParams {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  class: "economy" | "business" | "first";
}

interface JourneyState {
  journeyProgress: JourneyProgress[];
  recentMilestone: Milestone | null;
  lastUpdated: number;
  flightSearchResults: FlightSearchResult[];
  flightSearchLoading: boolean;
  flightSearchParams: FlightSearchParams | null;
  setJourneyProgress: (progress: JourneyProgress[]) => void;
  updateTaskCompletion: (stageId: JourneyStage, taskId: string, completed: boolean) => void;
  addRecentMilestone: (milestone: Milestone) => void;
  clearRecentMilestone: () => void;
  getOverallProgress: () => number;
  getTotalCompletedTasks: () => number;
  getTotalTasks: () => number;
  refreshJourney: () => void;
  getStageById: (stageId: JourneyStage) => JourneyProgress | undefined;
  searchFlights: (params: FlightSearchParams) => Promise<void>;
  clearFlightResults: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      journeyProgress: [],
      recentMilestone: null,
      lastUpdated: Date.now(),
      flightSearchResults: [],
      flightSearchLoading: false,
      flightSearchParams: null,
      
      setJourneyProgress: (progress) => {
        console.log("Setting new journey progress with", progress.length, "stages");
        set({ 
          journeyProgress: progress,
          lastUpdated: Date.now()
        });
      },
      
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
          
          return { 
            journeyProgress: updatedProgress,
            lastUpdated: Date.now()
          };
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
      
      refreshJourney: () => {
        set((state) => ({
          ...state,
          lastUpdated: Date.now()
        }));
      },
      
      getStageById: (stageId) => {
        const state = get();
        return state.journeyProgress.find(stage => stage.stage === stageId);
      },
      
      searchFlights: async (params) => {
        set({ flightSearchLoading: true, flightSearchParams: params });
        
        try {
          // Simulate API call with realistic flight data
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const mockResults: FlightSearchResult[] = [
            {
              id: "1",
              airline: "Emirates",
              price: 1250,
              currency: "USD",
              duration: "14h 30m",
              stops: 1,
              departure: { time: "10:30", airport: "JFK", city: "New York" },
              arrival: { time: "18:45+1", airport: "LHR", city: "London" },
              bookingUrl: "https://www.emirates.com/booking",
              deal: true,
              priceChange: "down"
            },
            {
              id: "2",
              airline: "British Airways",
              price: 1180,
              currency: "USD",
              duration: "7h 15m",
              stops: 0,
              departure: { time: "22:15", airport: "JFK", city: "New York" },
              arrival: { time: "09:30+1", airport: "LHR", city: "London" },
              bookingUrl: "https://www.britishairways.com/booking",
              priceChange: "same"
            },
            {
              id: "3",
              airline: "Virgin Atlantic",
              price: 1320,
              currency: "USD",
              duration: "7h 45m",
              stops: 0,
              departure: { time: "12:00", airport: "JFK", city: "New York" },
              arrival: { time: "23:45", airport: "LHR", city: "London" },
              bookingUrl: "https://www.virginatlantic.com/booking",
              priceChange: "up"
            },
            {
              id: "4",
              airline: "Lufthansa",
              price: 1095,
              currency: "USD",
              duration: "12h 20m",
              stops: 1,
              departure: { time: "16:45", airport: "JFK", city: "New York" },
              arrival: { time: "14:05+1", airport: "LHR", city: "London" },
              bookingUrl: "https://www.lufthansa.com/booking",
              deal: true,
              priceChange: "down"
            },
            {
              id: "5",
              airline: "Air France",
              price: 1275,
              currency: "USD",
              duration: "11h 55m",
              stops: 1,
              departure: { time: "19:30", airport: "JFK", city: "New York" },
              arrival: { time: "16:25+1", airport: "LHR", city: "London" },
              bookingUrl: "https://www.airfrance.com/booking",
              priceChange: "same"
            }
          ];
          
          set({ 
            flightSearchResults: mockResults,
            flightSearchLoading: false 
          });
        } catch (error) {
          console.error("Flight search error:", error);
          set({ 
            flightSearchResults: [],
            flightSearchLoading: false 
          });
        }
      },
      
      clearFlightResults: () => {
        set({ 
          flightSearchResults: [],
          flightSearchParams: null 
        });
      },
    }),
    {
      name: "journey-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
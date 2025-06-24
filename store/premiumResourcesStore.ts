import { create } from "zustand";
import { ResourcePreview, ResourceCategory, ResourceType } from "@/types/premiumResources";

interface PremiumResourcesState {
  resources: ResourcePreview[];
  filteredResources: ResourcePreview[];
  selectedCategory: ResourceCategory | "All";
  selectedType: ResourceType | "All";
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  setResources: (resources: ResourcePreview[]) => void;
  filterByCategory: (category: ResourceCategory | "All") => void;
  filterByType: (type: ResourceType | "All") => void;
  searchResources: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearFilters: () => void;
}

export const usePremiumResourcesStore = create<PremiumResourcesState>()((set, get) => ({
  resources: [],
  filteredResources: [],
  selectedCategory: "All",
  selectedType: "All",
  searchQuery: "",
  isLoading: false,
  error: null,
  
  setResources: (resources) => {
    const state = get();
    let filtered = resources;
    
    // Apply category filter
    if (state.selectedCategory !== "All") {
      filtered = filtered.filter(r => r.category === state.selectedCategory);
    }
    
    // Apply type filter
    if (state.selectedType !== "All") {
      filtered = filtered.filter(r => r.type === state.selectedType);
    }
    
    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    }
    
    set({ resources, filteredResources: filtered });
  },
  
  filterByCategory: (category) => {
    const state = get();
    set({ selectedCategory: category });
    
    let filtered = state.resources;
    if (category !== "All") {
      filtered = filtered.filter(r => r.category === category);
    }
    
    // Apply other filters
    if (state.selectedType !== "All") {
      filtered = filtered.filter(r => r.type === state.selectedType);
    }
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    }
    
    set({ filteredResources: filtered });
  },
  
  filterByType: (type) => {
    const state = get();
    set({ selectedType: type });
    
    let filtered = state.resources;
    if (type !== "All") {
      filtered = filtered.filter(r => r.type === type);
    }
    
    // Apply other filters
    if (state.selectedCategory !== "All") {
      filtered = filtered.filter(r => r.category === state.selectedCategory);
    }
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    }
    
    set({ filteredResources: filtered });
  },
  
  searchResources: (query) => {
    const state = get();
    set({ searchQuery: query });
    
    let filtered = state.resources;
    
    // Apply category filter
    if (state.selectedCategory !== "All") {
      filtered = filtered.filter(r => r.category === state.selectedCategory);
    }
    
    // Apply type filter
    if (state.selectedType !== "All") {
      filtered = filtered.filter(r => r.type === state.selectedType);
    }
    
    // Apply search filter
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(lowercaseQuery) || 
        r.description.toLowerCase().includes(lowercaseQuery) ||
        r.author.toLowerCase().includes(lowercaseQuery) ||
        r.category.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    set({ filteredResources: filtered });
  },
  
  clearFilters: () => {
    const state = get();
    set({ 
      selectedCategory: "All", 
      selectedType: "All", 
      searchQuery: "", 
      filteredResources: state.resources 
    });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
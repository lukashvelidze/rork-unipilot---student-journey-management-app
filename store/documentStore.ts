import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Document } from "@/types/user";

// Error-safe AsyncStorage wrapper
const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`AsyncStorage getItem error for key "${key}":`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`AsyncStorage setItem error for key "${key}":`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`AsyncStorage removeItem error for key "${key}":`, error);
    }
  },
};

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  addDocument: (document: Document) => void;
  updateDocument: (documentId: string, documentData: Partial<Document>) => void;
  deleteDocument: (documentId: string) => void;
  getDocumentsByType: (type: string) => Document[];
  getExpiringDocuments: () => Document[];
  getTotalDocuments: () => number;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      isLoading: false,
      error: null,
      addDocument: (document) => 
        set((state) => ({
          documents: [...state.documents, document],
        })),
      updateDocument: (documentId, documentData) => 
        set((state) => ({
          documents: state.documents.map((doc) => 
            doc.id === documentId ? { ...doc, ...documentData } : doc
          ),
        })),
      deleteDocument: (documentId) => 
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== documentId),
        })),
      getDocumentsByType: (type) => {
        return get().documents.filter((doc) => doc.type === type);
      },
      getExpiringDocuments: () => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        return get().documents.filter((doc) => {
          if (!doc.expiryDate) return false;
          const expiryDate = new Date(doc.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
        });
      },
      getTotalDocuments: () => {
        return get().documents.length;
      },
    }),
    {
      name: "document-storage",
      storage: createJSONStorage(() => safeAsyncStorage),
    }
  )
);
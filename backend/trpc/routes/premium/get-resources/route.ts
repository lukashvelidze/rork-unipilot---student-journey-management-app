import { publicProcedure } from "../../../create-context";
import { z } from "zod";

// Mock premium resources data
const mockPremiumResources = [
  {
    id: "1",
    title: "Personal Statement Masterclass",
    description: "Complete guide to writing compelling personal statements that get you accepted",
    excerpt: "Learn the secrets to crafting personal statements that stand out",
    type: "guide" as const,
    category: "Application Materials" as const,
    difficulty: "Intermediate" as const,
    estimatedTime: "45 min",
    author: "Dr. Sarah Johnson",
    publishedDate: "2024-01-15T00:00:00Z",
    heroImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
    rating: 4.8,
    completions: 1247,
    isNew: true,
    isFeatured: true,
    tags: ["personal statement", "application", "writing"],
    previewContent: {
      introduction: "Your personal statement is your opportunity to tell your unique story and convince admissions committees why you're the perfect fit for their program.",
      sectionTitles: ["Understanding the Purpose", "Structure and Format", "Common Mistakes to Avoid"],
      keyTakeaways: ["Be authentic and genuine", "Show, don't just tell", "Connect experiences to goals"],
    },
  },
  {
    id: "2",
    title: "University Research Strategy",
    description: "Systematic approach to researching and selecting the perfect universities",
    excerpt: "Master the art of university research and selection",
    type: "guide" as const,
    category: "Research" as const,
    difficulty: "Beginner" as const,
    estimatedTime: "30 min",
    author: "Prof. Michael Chen",
    publishedDate: "2024-01-20T00:00:00Z",
    heroImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop",
    rating: 4.9,
    completions: 2156,
    isNew: false,
    isFeatured: false,
    tags: ["research", "university selection", "planning"],
    previewContent: {
      introduction: "Choosing the right university is one of the most important decisions in your academic journey.",
      sectionTitles: ["Defining Your Criteria", "Research Methods", "Evaluation Framework"],
      keyTakeaways: ["Define clear criteria", "Use multiple sources", "Compare systematically"],
    },
  },
];

export const getResourcesProcedure = publicProcedure
  .input(z.object({
    category: z.string().optional(),
    type: z.string().optional(),
    search: z.string().optional(),
  }))
  .query(({ input }: { input: { category?: string; type?: string; search?: string } }) => {
    try {
      let filteredResources = [...mockPremiumResources];
      
      // Filter by category if provided
      if (input.category && input.category !== "All") {
        filteredResources = filteredResources.filter(resource => resource.category === input.category);
      }
      
      // Filter by type if provided
      if (input.type && input.type !== "All") {
        filteredResources = filteredResources.filter(resource => resource.type === input.type);
      }
      
      // Filter by search query if provided
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredResources = filteredResources.filter(resource => 
          resource.title.toLowerCase().includes(searchLower) ||
          resource.description.toLowerCase().includes(searchLower) ||
          resource.author.toLowerCase().includes(searchLower) ||
          resource.category.toLowerCase().includes(searchLower) ||
          resource.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return filteredResources;
    } catch (error) {
      console.error("Error in getResourcesProcedure:", error);
      throw new Error("Failed to fetch premium resources");
    }
  });
import { publicProcedure } from "../../../create-context";
import { z } from "zod";

// Mock detailed resource content
const mockResourceContent: Record<string, any> = {
  "1": {
    id: "1",
    title: "Personal Statement Masterclass",
    description: "Complete guide to writing compelling personal statements that get you accepted",
    category: "Application Materials",
    estimatedTime: "45 min",
    difficulty: "Intermediate",
    author: "Dr. Sarah Johnson",
    publishedDate: "2024-01-15T00:00:00Z",
    heroImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop",
    content: {
      introduction: "Your personal statement is your opportunity to tell your unique story and convince admissions committees why you're the perfect fit for their program. This comprehensive guide will walk you through creating a compelling personal statement that stands out.",
      sections: [
        {
          title: "Understanding the Purpose",
          content: "A personal statement serves multiple purposes: it showcases your personality, demonstrates your writing skills, explains your motivation, and highlights your unique experiences.",
          tips: [
            "Be authentic and genuine in your writing",
            "Show, don't just tell your experiences",
            "Connect your past experiences to future goals",
            "Demonstrate growth and self-reflection"
          ]
        },
        {
          title: "Structure and Format",
          content: "A well-structured personal statement typically follows a clear format: engaging opening, body paragraphs that tell your story, and a strong conclusion.",
          examples: [
            "Hook: Start with a compelling anecdote or question",
            "Body: 2-3 main themes or experiences",
            "Conclusion: Future goals and program fit"
          ]
        }
      ],
      conclusion: "Remember, your personal statement is your chance to show who you are beyond grades and test scores.",
      actionItems: [
        "Brainstorm key experiences and themes",
        "Create an outline with main points",
        "Write your first draft",
        "Get feedback from mentors or advisors",
        "Revise and polish your statement",
        "Proofread for grammar and spelling"
      ]
    },
    relatedResources: ["2", "4", "8"]
  },
  "2": {
    id: "2",
    title: "University Research Strategy",
    description: "Systematic approach to researching and selecting the perfect universities",
    category: "Research",
    estimatedTime: "30 min",
    difficulty: "Beginner",
    author: "Prof. Michael Chen",
    publishedDate: "2024-01-20T00:00:00Z",
    heroImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=400&fit=crop",
    content: {
      introduction: "Choosing the right university is one of the most important decisions in your academic journey. This comprehensive guide will help you research and evaluate universities systematically.",
      sections: [
        {
          title: "Defining Your Criteria",
          content: "Before diving into research, it's crucial to understand what you're looking for in a university.",
          tips: [
            "List your must-haves vs. nice-to-haves",
            "Consider your learning style and preferences",
            "Think about career goals and industry connections",
            "Evaluate financial constraints realistically"
          ]
        }
      ],
      conclusion: "Thorough university research takes time, but it's an investment in your future.",
      actionItems: [
        "Create a list of evaluation criteria",
        "Research 10-15 potential universities",
        "Create a comparison spreadsheet",
        "Attend virtual information sessions"
      ]
    },
    relatedResources: ["1", "3", "5"]
  }
};

export const getResourceProcedure = publicProcedure
  .input(z.object({
    id: z.string(),
  }))
  .query(({ input }: { input: { id: string } }) => {
    try {
      const resource = mockResourceContent[input.id];
      
      if (!resource) {
        throw new Error("Resource not found");
      }
      
      return resource;
    } catch (error) {
      console.error("Error in getResourceProcedure:", error);
      throw new Error("Failed to fetch resource details");
    }
  });
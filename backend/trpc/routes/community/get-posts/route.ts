import { publicProcedure } from "../../../create-context";
import { z } from "zod";

// Mock data for now - in a real app this would come from a database
const mockPosts = [
  {
    id: "1",
    userId: "user1",
    userName: "Sarah Chen",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    title: "Visa application timeline for UK universities",
    content: "I just got my UK student visa approved! The whole process took about 3 weeks from submission. Here are some tips that helped me speed up the process...",
    topic: "visa" as const,
    createdAt: "2024-01-15T10:30:00Z",
    likes: 24,
    isLiked: false,
    isPremium: true,
    comments: [
      {
        id: "c1",
        userId: "user2",
        userName: "Alex Johnson",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        content: "Congratulations! How long did the biometrics appointment take?",
        createdAt: "2024-01-15T11:00:00Z",
        likes: 3,
        isLiked: false,
        isPremium: false,
      },
    ],
  },
  {
    id: "2",
    userId: "user3",
    userName: "Maria Rodriguez",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    title: "Best student accommodation in London?",
    content: "I am starting at UCL in September and looking for accommodation recommendations. What are your experiences with university halls vs private housing?",
    topic: "accommodation" as const,
    createdAt: "2024-01-14T15:45:00Z",
    likes: 18,
    isLiked: false,
    isPremium: false,
    comments: [
      {
        id: "c2",
        userId: "user4",
        userName: "James Wilson",
        userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        content: "I stayed in university halls for my first year and it was great for meeting people!",
        createdAt: "2024-01-14T16:00:00Z",
        likes: 5,
        isLiked: false,
        isPremium: false,
      },
    ],
  },
];

export const getPostsProcedure = publicProcedure
  .input(
    z.object({
      topic: z.string().optional(),
      search: z.string().optional(),
    }).optional()
  )
  .query(({ input }: { input?: { topic?: string; search?: string } }) => {
    let filteredPosts = [...mockPosts];
    
    if (input?.topic && input.topic !== "all") {
      filteredPosts = filteredPosts.filter(post => post.topic === input.topic);
    }
    
    if (input?.search) {
      const searchLower = input.search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }
    
    return filteredPosts;
  });
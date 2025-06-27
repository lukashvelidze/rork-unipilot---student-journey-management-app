import { CommunityPost } from "@/types/community";

export const mockPosts: CommunityPost[] = [
  {
    id: "1",
    title: "Just got accepted to MIT! 🎉",
    content: "After months of preparation and stress, I finally received my acceptance letter from MIT! The journey was tough but worth every moment. Special thanks to this amazing community for all the support and advice. For those still waiting, do not give up - your time will come! Happy to answer any questions about the application process.",
    author: {
      id: "user1",
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      country: "Singapore",
      university: "MIT",
    },
    topic: "university",
    likes: 234,
    comments: 45,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    tags: ["MIT", "acceptance", "engineering", "success"],
    isLiked: false,
    isPinned: true,
  },
  {
    id: "2",
    title: "Visa interview tips that actually work",
    content: "Just had my F-1 visa interview at the US Embassy and it went smoothly! Here are the key tips that helped me: 1. Be confident but not arrogant 2. Have all documents organized and ready 3. Practice common questions beforehand 4. Dress professionally 5. Be honest about your intentions. The interview lasted only 3 minutes and I got approved on the spot. Remember, they want to approve you - just give them a reason to say yes!",
    author: {
      id: "user2",
      name: "Ahmed Hassan",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      country: "Egypt",
      university: "Stanford University",
    },
    topic: "visa",
    likes: 189,
    comments: 32,
    createdAt: "2024-01-14T14:20:00Z",
    updatedAt: "2024-01-14T14:20:00Z",
    tags: ["visa", "F1", "interview", "tips", "USA"],
    isLiked: true,
    isPinned: false,
  },
];

export const getPostById = (id: string): CommunityPost | undefined => {
  return mockPosts.find(post => post.id === id);
};

export const getPostsByTopic = (topic: string): CommunityPost[] => {
  if (topic === "all") return mockPosts;
  return mockPosts.filter(post => post.topic === topic);
};

export const getPostsByUser = (userId: string): CommunityPost[] => {
  return mockPosts.filter(post => post.author.id === userId);
};
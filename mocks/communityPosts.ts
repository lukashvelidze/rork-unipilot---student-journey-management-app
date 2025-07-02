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

// Premium features content for the premium features page
export interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  benefits: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

export const premiumFeatures: PremiumFeature[] = [
  {
    id: "mentor",
    title: "Personal Mentor Access",
    description: "Get 1-on-1 guidance from university admission experts and successful alumni",
    icon: "UserCheck",
    category: "Mentoring",
    benefits: ["Weekly 1-on-1 sessions", "Expert consultations", "Mock interviews", "Application review", "Career guidance"],
    isPopular: true,
  },
  {
    id: "resources",
    title: "Premium Resource Library",
    description: "Access exclusive templates, guides, and application materials from top universities",
    icon: "BookOpen",
    category: "Resources",
    benefits: ["50+ premium guides", "Application templates", "Essay examples", "Scholarship database", "Country-specific guides"],
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Detailed progress tracking, success predictions, and performance insights",
    icon: "BarChart3",
    category: "Analytics",
    benefits: ["Progress analytics", "Success probability", "Benchmark comparison", "Goal tracking", "Performance insights"],
    isNew: true,
  },
  {
    id: "webinars",
    title: "Exclusive Webinars",
    description: "Live sessions with admission experts, successful students, and industry leaders",
    icon: "Video",
    category: "Community",
    benefits: ["Weekly live sessions", "Expert Q&A", "Networking events", "Recorded access", "Industry insights"],
  },
];

export const getFeatureById = (id: string): PremiumFeature | undefined => {
  return premiumFeatures.find(feature => feature.id === id);
};

export const getFeaturesByCategory = (category: string): PremiumFeature[] => {
  if (category === "all") return premiumFeatures;
  return premiumFeatures.filter(feature => feature.category === category);
};
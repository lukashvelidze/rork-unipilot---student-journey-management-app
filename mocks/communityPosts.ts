import { Post } from "@/types/community";

export const mockCommunityPosts: Post[] = [
  {
    id: "1",
    title: "Just got accepted to MIT! 🎉",
    content: "After months of preparation and sleepless nights, I finally received my acceptance letter from MIT! The journey was tough but worth every moment. Special thanks to this amazing community for all the support and guidance.",
    author: {
      id: "user1",
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      country: "🇨🇦 Canada",
      university: "MIT"
    },
    topic: "university",
    likes: 234,
    comments: 45,
    createdAt: "2024-01-15T10:30:00Z",
    tags: ["MIT", "acceptance", "engineering", "success-story"],
    isPinned: true,
    isLiked: false
  },
  {
    id: "2", 
    title: "Visa interview tips that actually work",
    content: "Just had my F-1 visa interview and it went amazing! Here are the key tips that helped me: 1) Practice your answers but don't memorize them 2) Bring organized documents 3) Be confident but not arrogant 4) Know your program details inside out. Happy to answer any questions!",
    author: {
      id: "user2",
      name: "Priya Sharma",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      country: "🇮🇳 India",
      university: "Stanford University"
    },
    topic: "visa",
    likes: 189,
    comments: 67,
    createdAt: "2024-01-14T15:45:00Z",
    tags: ["visa", "interview", "tips", "F1"],
    isPinned: false,
    isLiked: true
  },
  {
    id: "3",
    title: "Finding affordable housing near campus",
    content: "Housing costs are crazy expensive! After weeks of searching, I found some great resources for affordable student housing. Check out university housing boards, Facebook groups, and don't forget to negotiate rent. Also consider living slightly further from campus - public transport can save you thousands!",
    author: {
      id: "user3", 
      name: "Marcus Johnson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      country: "🇳🇬 Nigeria",
      university: "UC Berkeley"
    },
    topic: "accommodation",
    likes: 156,
    comments: 32,
    createdAt: "2024-01-13T09:20:00Z",
    tags: ["housing", "budget", "accommodation", "tips"],
    isPinned: false,
    isLiked: false
  },
  {
    id: "4",
    title: "Scholarship success - $50k awarded! 💰",
    content: "I'm thrilled to share that I received a full scholarship covering tuition and living expenses! The key was applying early, writing compelling essays, and highlighting my unique background. Don't give up on scholarships - they're out there waiting for you!",
    author: {
      id: "user4",
      name: "Sofia Rodriguez", 
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      country: "🇲🇽 Mexico",
      university: "Harvard University"
    },
    topic: "finances",
    likes: 312,
    comments: 89,
    createdAt: "2024-01-12T14:10:00Z",
    tags: ["scholarship", "financial-aid", "success", "harvard"],
    isPinned: true,
    isLiked: true
  },
  {
    id: "5",
    title: "Cultural shock and how to overcome it",
    content: "Moving to a new country is exciting but challenging. I experienced major culture shock in my first month. What helped me: joining international student groups, trying local food, learning basic phrases, and being patient with myself. Remember, it's normal to feel overwhelmed at first!",
    author: {
      id: "user5",
      name: "Yuki Tanaka",
      avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face", 
      country: "🇯🇵 Japan",
      university: "Oxford University"
    },
    topic: "culture",
    likes: 203,
    comments: 54,
    createdAt: "2024-01-11T11:30:00Z",
    tags: ["culture-shock", "adaptation", "international-students", "mental-health"],
    isPinned: false,
    isLiked: false
  },
  {
    id: "6",
    title: "First semester grades are in! 📚",
    content: "Just finished my first semester and I'm proud to say I maintained a 3.8 GPA! The academic system here is different from back home, but with proper time management and utilizing office hours, it's definitely manageable. Study groups were a game changer for me.",
    author: {
      id: "user6",
      name: "Ahmed Hassan",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      country: "🇪🇬 Egypt", 
      university: "University of Toronto"
    },
    topic: "academics",
    likes: 167,
    comments: 28,
    createdAt: "2024-01-10T16:45:00Z",
    tags: ["grades", "academics", "first-semester", "study-tips"],
    isPinned: false,
    isLiked: true
  },
  {
    id: "7",
    title: "Internship hunting as an international student",
    content: "Landing an internship as an international student requires extra effort, but it's absolutely possible! I just secured a summer internship at a tech company. Key strategies: network early, understand visa requirements (CPT/OPT), leverage career services, and don't be afraid to reach out to alumni.",
    author: {
      id: "user7",
      name: "Elena Petrov",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face",
      country: "🇷🇺 Russia",
      university: "Carnegie Mellon"
    },
    topic: "career",
    likes: 245,
    comments: 73,
    createdAt: "2024-01-09T13:15:00Z", 
    tags: ["internship", "career", "networking", "international-students"],
    isPinned: false,
    isLiked: false
  },
  {
    id: "8",
    title: "IELTS 8.5 - My preparation strategy",
    content: "Finally achieved my target IELTS score of 8.5! Here's what worked for me: daily practice for 2 months, focusing on weak areas, using official Cambridge materials, and taking mock tests weekly. The speaking section improved dramatically once I started recording myself practicing.",
    author: {
      id: "user8",
      name: "Raj Patel",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
      country: "🇮🇳 India",
      university: "University of Melbourne"
    },
    topic: "general",
    likes: 198,
    comments: 41,
    createdAt: "2024-01-08T08:30:00Z",
    tags: ["IELTS", "test-prep", "english", "study-strategy"],
    isPinned: false,
    isLiked: true
  }
];
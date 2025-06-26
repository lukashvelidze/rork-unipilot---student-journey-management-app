import { CommunityPost } from "@/types/community";

export const mockPosts: CommunityPost[] = [
  {
    id: "1",
    title: "Just got accepted to MIT! 🎉",
    content: "After months of preparation and stress, I finally received my acceptance letter from MIT! The journey was tough but worth every moment. Special thanks to this amazing community for all the support and advice. For those still waiting, don't give up - your time will come! 

Happy to answer any questions about the application process.",
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
    content: "Just had my F-1 visa interview at the US Embassy and it went smoothly! Here are the key tips that helped me:

1. Be confident but not arrogant
2. Have all documents organized and ready
3. Practice common questions beforehand
4. Dress professionally
5. Be honest about your intentions

The interview lasted only 3 minutes and I got approved on the spot. Remember, they want to approve you - just give them a reason to say yes!",
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
  {
    id: "3",
    title: "Scholarship success story - $50k awarded! 💰",
    content: "I'm thrilled to share that I've been awarded a full scholarship worth $50,000 for my Master's program at University of Toronto! 

The key was applying early and tailoring each application to the specific scholarship requirements. I applied to 15 different scholarships and got 3 offers. 

My advice: Start early, write compelling essays, and don't be afraid to apply to many scholarships. The effort pays off!",
    author: {
      id: "user3",
      name: "Maria Rodriguez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      country: "Mexico",
      university: "University of Toronto",
    },
    topic: "finances",
    likes: 156,
    comments: 28,
    createdAt: "2024-01-13T09:15:00Z",
    updatedAt: "2024-01-13T09:15:00Z",
    tags: ["scholarship", "funding", "success", "Canada", "masters"],
    isLiked: false,
    isPinned: false,
  },
  {
    id: "4",
    title: "Finding affordable accommodation in London",
    content: "Housing in London is expensive, but here are some strategies that helped me find affordable accommodation:

• Use university accommodation services first
• Consider shared flats in zones 2-3
• Check Facebook groups for student housing
• Look into private halls of residence
• Consider homestays for the first few months

I ended up finding a great shared flat in Zone 2 for £600/month including bills. It's a 30-minute commute to uni but totally worth the savings!",
    author: {
      id: "user4",
      name: "Raj Patel",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      country: "India",
      university: "Imperial College London",
    },
    topic: "accommodation",
    likes: 98,
    comments: 19,
    createdAt: "2024-01-12T16:45:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
    tags: ["accommodation", "London", "housing", "budget", "UK"],
    isLiked: false,
    isPinned: false,
  },
  {
    id: "5",
    title: "Cultural shock and how to overcome it",
    content: "Been in Germany for 3 months now and the cultural differences were more challenging than I expected. Here's what helped me adapt:

🔹 Join international student groups
🔹 Learn basic German phrases
🔹 Be patient with yourself
🔹 Try local food and customs
🔹 Make friends with both locals and internationals

It gets easier with time! Now I love the punctuality and directness of German culture. What seemed strange at first now feels normal.",
    author: {
      id: "user5",
      name: "Yuki Tanaka",
      avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face",
      country: "Japan",
      university: "Technical University of Munich",
    },
    topic: "culture",
    likes: 142,
    comments: 24,
    createdAt: "2024-01-11T11:30:00Z",
    updatedAt: "2024-01-11T11:30:00Z",
    tags: ["culture", "adaptation", "Germany", "international", "experience"],
    isLiked: true,
    isPinned: false,
  },
  {
    id: "6",
    title: "IELTS 8.5 in 2 months - My study plan",
    content: "Improved my IELTS score from 6.5 to 8.5 in just 2 months! Here's my detailed study plan:

📚 Week 1-2: Diagnostic tests and identifying weak areas
📚 Week 3-4: Intensive vocabulary building (50 words/day)
📚 Week 5-6: Practice tests every other day
📚 Week 7-8: Focus on speaking and writing with feedback

Key resources:
• Cambridge IELTS books 15-17
• IELTS Liz website
• Magoosh IELTS app
• Speaking practice with native speakers on HelloTalk

Consistency is key! 2 hours daily study made all the difference.",
    author: {
      id: "user6",
      name: "Priya Sharma",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      country: "India",
      university: "University of Melbourne",
    },
    topic: "academics",
    likes: 267,
    comments: 41,
    createdAt: "2024-01-10T08:20:00Z",
    updatedAt: "2024-01-10T08:20:00Z",
    tags: ["IELTS", "test prep", "study plan", "English", "score improvement"],
    isLiked: false,
    isPinned: false,
  },
  {
    id: "7",
    title: "Internship opportunities for international students",
    content: "Landed my first internship at Google! 🚀 Here's how international students can find great opportunities:

✅ Start networking early through LinkedIn
✅ Attend career fairs and company events
✅ Apply for diversity and inclusion programs
✅ Consider smaller companies and startups
✅ Leverage your university's career services
✅ Build a strong portfolio/GitHub profile

Don't let visa status discourage you. Many companies are willing to sponsor the right candidates. Focus on building skills and making connections!",
    author: {
      id: "user7",
      name: "David Kim",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      country: "South Korea",
      university: "UC Berkeley",
    },
    topic: "career",
    likes: 198,
    comments: 35,
    createdAt: "2024-01-09T13:10:00Z",
    updatedAt: "2024-01-09T13:10:00Z",
    tags: ["internship", "career", "Google", "networking", "international students"],
    isLiked: true,
    isPinned: false,
  },
  {
    id: "8",
    title: "Budget breakdown: Studying in Canada 🇨🇦",
    content: "Here's my actual monthly budget as an international student in Toronto:

💰 Tuition (monthly): $2,500
🏠 Rent (shared apartment): $800
🍕 Food: $400
🚇 Transportation: $150
📱 Phone: $50
🎬 Entertainment: $200
📚 Books/Supplies: $100
💊 Health insurance: $75

Total: ~$4,275 CAD/month

Tips to save money:
• Cook at home (saves $300+/month)
• Buy used textbooks
• Take advantage of student discounts
• Work part-time (20 hrs/week allowed)

It's expensive but manageable with proper planning!",
    author: {
      id: "user8",
      name: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
      country: "Australia",
      university: "University of Toronto",
    },
    topic: "finances",
    likes: 176,
    comments: 29,
    createdAt: "2024-01-08T15:40:00Z",
    updatedAt: "2024-01-08T15:40:00Z",
    tags: ["budget", "Canada", "Toronto", "cost of living", "finances"],
    isLiked: false,
    isPinned: false,
  },
  {
    id: "9",
    title: "Making friends as an international student",
    content: "Starting university in a new country can be lonely, but here's how I built an amazing social circle:

👥 Join clubs related to your interests
🌍 Attend international student orientation events
🏠 Be open with roommates and neighbors
☕ Study in common areas, not just your room
🎉 Say yes to social invitations (even when tired!)
🏃‍♀️ Join sports teams or fitness classes
🍕 Organize potluck dinners with classmates

My best friendships came from unexpected places - the library study group, intramural soccer, and even waiting in line at the cafeteria! Be patient and put yourself out there.",
    author: {
      id: "user9",
      name: "Carlos Mendoza",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      country: "Brazil",
      university: "University of British Columbia",
    },
    topic: "culture",
    likes: 134,
    comments: 22,
    createdAt: "2024-01-07T12:25:00Z",
    updatedAt: "2024-01-07T12:25:00Z",
    tags: ["friendship", "social life", "international students", "community", "tips"],
    isLiked: false,
    isPinned: false,
  },
  {
    id: "10",
    title: "PhD application timeline and tips",
    content: "Successfully got into 5 PhD programs! Here's my timeline and what worked:

📅 18 months before: Started researching programs and professors
📅 12 months before: Began reaching out to potential supervisors
📅 10 months before: Started working on research proposal
📅 8 months before: Took GRE and requested transcripts
📅 6 months before: Finalized personal statements
📅 4 months before: Submitted applications
📅 2 months before: Prepared for interviews

Key success factors:
• Strong research experience
• Publications (even conference papers help)
• Good fit with supervisor's research
• Clear research proposal
• Strong recommendation letters

Start early and be strategic about program selection!",
    author: {
      id: "user10",
      name: "Fatima Al-Zahra",
      avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
      country: "UAE",
      university: "Harvard University",
    },
    topic: "academics",
    likes: 203,
    comments: 38,
    createdAt: "2024-01-06T09:50:00Z",
    updatedAt: "2024-01-06T09:50:00Z",
    tags: ["PhD", "graduate school", "applications", "research", "timeline"],
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
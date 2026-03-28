export interface PremiumResource {
  id: string;
  title: string;
  description: string;
  category: "templates" | "guides" | "webinars" | "analytics" | "mentor" | "tools";
  type: "pdf" | "video" | "template" | "tool" | "session";
  duration?: string;
  downloadUrl?: string;
  featured?: boolean;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  rating: number;
  downloads: number;
}

export interface MentorSession {
  id: string;
  title: string;
  description: string;
  mentorName: string;
  mentorTitle: string;
  mentorImage: string;
  duration: string;
  price: string;
  rating: number;
  reviews: number;
  expertise: string[];
  nextAvailable: string;
}

export interface Webinar {
  id: string;
  title: string;
  description: string;
  presenter: string;
  presenterTitle: string;
  date: string;
  duration: string;
  attendees: number;
  recording?: boolean;
  topics: string[];
  level: "beginner" | "intermediate" | "advanced";
}

export const premiumResources: PremiumResource[] = [
  // Templates
  {
    id: "template-1",
    title: "Personal Statement Template Collection",
    description: "15+ proven personal statement templates for different programs and countries. Includes examples from successful applicants to top universities.",
    category: "templates",
    type: "pdf",
    downloadUrl: "https://example.com/personal-statement-templates.pdf",
    featured: true,
    tags: ["personal statement", "essays", "applications"],
    difficulty: "beginner",
    rating: 4.9,
    downloads: 2847,
  },
  {
    id: "template-2", 
    title: "CV/Resume Templates for International Students",
    description: "Professional CV templates optimized for international applications. Includes academic, professional, and scholarship-focused formats.",
    category: "templates",
    type: "template",
    downloadUrl: "https://example.com/cv-templates.zip",
    tags: ["cv", "resume", "applications"],
    difficulty: "beginner",
    rating: 4.8,
    downloads: 1923,
  },
  {
    id: "template-3",
    title: "Scholarship Application Templates",
    description: "Complete scholarship application package with essays, recommendation letter templates, and financial aid forms.",
    category: "templates", 
    type: "pdf",
    downloadUrl: "https://example.com/scholarship-templates.pdf",
    tags: ["scholarships", "financial aid", "essays"],
    difficulty: "intermediate",
    rating: 4.7,
    downloads: 1456,
  },
  {
    id: "template-4",
    title: "Email Templates for University Communication",
    description: "Professional email templates for contacting admissions, professors, and university departments.",
    category: "templates",
    type: "pdf",
    tags: ["communication", "emails", "networking"],
    difficulty: "beginner",
    rating: 4.6,
    downloads: 987,
  },

  // Guides
  {
    id: "guide-1",
    title: "Complete University Application Strategy Guide",
    description: "Step-by-step guide covering everything from university selection to application submission. Includes country-specific requirements and insider tips.",
    category: "guides",
    type: "pdf",
    downloadUrl: "https://example.com/application-strategy.pdf",
    featured: true,
    tags: ["applications", "strategy", "universities"],
    difficulty: "intermediate",
    rating: 4.9,
    downloads: 3421,
  },
  {
    id: "guide-2",
    title: "Visa Application Masterclass",
    description: "Comprehensive guide to student visa applications for all major destinations. Includes interview preparation and document checklists.",
    category: "guides",
    type: "pdf",
    downloadUrl: "https://example.com/visa-guide.pdf",
    tags: ["visa", "immigration", "interviews"],
    difficulty: "advanced",
    rating: 4.8,
    downloads: 2156,
  },
  {
    id: "guide-3",
    title: "Scholarship Hunting Secrets",
    description: "Insider strategies for finding and winning scholarships. Includes database of 500+ scholarships and application tips.",
    category: "guides",
    type: "pdf",
    downloadUrl: "https://example.com/scholarship-secrets.pdf",
    featured: true,
    tags: ["scholarships", "funding", "financial aid"],
    difficulty: "intermediate",
    rating: 4.9,
    downloads: 2789,
  },
  {
    id: "guide-4",
    title: "IELTS/TOEFL Preparation Roadmap",
    description: "Complete preparation guide with study schedules, practice tests, and score improvement strategies.",
    category: "guides",
    type: "pdf",
    tags: ["ielts", "toefl", "english tests"],
    difficulty: "intermediate",
    rating: 4.7,
    downloads: 1834,
  },
  {
    id: "guide-5",
    title: "Living Abroad Survival Guide",
    description: "Essential guide for international students covering accommodation, banking, healthcare, and cultural adaptation.",
    category: "guides",
    type: "pdf",
    tags: ["living abroad", "culture", "practical tips"],
    difficulty: "beginner",
    rating: 4.6,
    downloads: 1567,
  },

  // Tools
  {
    id: "tool-1",
    title: "University Comparison Matrix",
    description: "Interactive spreadsheet to compare universities across multiple criteria including rankings, costs, and program details.",
    category: "tools",
    type: "template",
    downloadUrl: "https://example.com/university-comparison.xlsx",
    tags: ["comparison", "universities", "decision making"],
    difficulty: "beginner",
    rating: 4.8,
    downloads: 1245,
  },
  {
    id: "tool-2",
    title: "Application Timeline Planner",
    description: "Comprehensive timeline planner with deadlines, reminders, and progress tracking for multiple university applications.",
    category: "tools",
    type: "template",
    downloadUrl: "https://example.com/timeline-planner.xlsx",
    tags: ["planning", "deadlines", "organization"],
    difficulty: "beginner",
    rating: 4.7,
    downloads: 1098,
  },
  {
    id: "tool-3",
    title: "Budget Calculator for International Students",
    description: "Detailed budget calculator covering tuition, living expenses, and hidden costs for studying abroad.",
    category: "tools",
    type: "tool",
    tags: ["budget", "finances", "planning"],
    difficulty: "intermediate",
    rating: 4.6,
    downloads: 876,
  },

  // Analytics
  {
    id: "analytics-1",
    title: "Application Success Predictor",
    description: "AI-powered tool that analyzes your profile and predicts admission chances at different universities.",
    category: "analytics",
    type: "tool",
    featured: true,
    tags: ["ai", "predictions", "admissions"],
    difficulty: "advanced",
    rating: 4.9,
    downloads: 1567,
  },
  {
    id: "analytics-2",
    title: "Profile Strength Analyzer",
    description: "Comprehensive analysis of your academic and extracurricular profile with improvement recommendations.",
    category: "analytics",
    type: "tool",
    tags: ["profile", "analysis", "improvement"],
    difficulty: "intermediate",
    rating: 4.7,
    downloads: 1234,
  },
];

export const mentorSessions: MentorSession[] = [
  {
    id: "mentor-1",
    title: "1-on-1 Application Review Session",
    description: "Comprehensive review of your university applications with personalized feedback and improvement suggestions.",
    mentorName: "Dr. Sarah Chen",
    mentorTitle: "Former MIT Admissions Officer",
    mentorImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    duration: "60 minutes",
    price: "Free with Premium",
    rating: 4.9,
    reviews: 127,
    expertise: ["MIT", "Harvard", "Stanford", "Engineering", "Computer Science"],
    nextAvailable: "Tomorrow at 2:00 PM",
  },
  {
    id: "mentor-2",
    title: "Personal Statement Masterclass",
    description: "One-on-one session to craft a compelling personal statement that stands out to admissions committees.",
    mentorName: "Prof. Michael Rodriguez",
    mentorTitle: "Oxford University Alumni & Consultant",
    mentorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    duration: "45 minutes",
    price: "Free with Premium",
    rating: 4.8,
    reviews: 89,
    expertise: ["Oxford", "Cambridge", "LSE", "Personal Statements", "UK Applications"],
    nextAvailable: "Today at 4:30 PM",
  },
  {
    id: "mentor-3",
    title: "Scholarship Strategy Session",
    description: "Expert guidance on finding and applying for scholarships with proven strategies from successful recipients.",
    mentorName: "Emma Thompson",
    mentorTitle: "Rhodes Scholar & Consultant",
    mentorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    duration: "50 minutes",
    price: "Free with Premium",
    rating: 4.9,
    reviews: 156,
    expertise: ["Rhodes Scholarship", "Fulbright", "Gates Cambridge", "Merit Scholarships"],
    nextAvailable: "Wednesday at 10:00 AM",
  },
  {
    id: "mentor-4",
    title: "Visa Interview Preparation",
    description: "Mock visa interview session with feedback and tips from immigration experts.",
    mentorName: "David Kim",
    mentorTitle: "Immigration Lawyer & Former Visa Officer",
    mentorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    duration: "40 minutes",
    price: "Free with Premium",
    rating: 4.7,
    reviews: 203,
    expertise: ["F-1 Visa", "Student Visa", "Interview Skills", "Immigration Law"],
    nextAvailable: "Friday at 1:00 PM",
  },
];

export const exclusiveWebinars: Webinar[] = [
  {
    id: "webinar-1",
    title: "Secrets to Getting Into Top Universities",
    description: "Learn insider strategies from former admissions officers at Harvard, MIT, and Stanford.",
    presenter: "Panel of Former Admissions Officers",
    presenterTitle: "Harvard, MIT, Stanford",
    date: "2024-12-15",
    duration: "90 minutes",
    attendees: 1247,
    topics: ["Admissions Strategy", "Application Tips", "What Admissions Officers Look For"],
    level: "intermediate",
  },
  {
    id: "webinar-2",
    title: "Scholarship Opportunities for International Students",
    description: "Comprehensive overview of available scholarships and how to maximize your chances of winning them.",
    presenter: "Dr. Lisa Wang",
    presenterTitle: "Scholarship Consultant",
    date: "2024-12-20",
    duration: "75 minutes",
    attendees: 892,
    topics: ["Merit Scholarships", "Need-based Aid", "Application Strategies"],
    level: "beginner",
  },
  {
    id: "webinar-3",
    title: "Mastering the Student Visa Process",
    description: "Step-by-step guide to student visa applications with country-specific requirements and interview tips.",
    presenter: "Immigration Expert Panel",
    presenterTitle: "Certified Immigration Consultants",
    date: "2024-12-25",
    duration: "60 minutes",
    attendees: 1156,
    topics: ["Visa Requirements", "Document Preparation", "Interview Success"],
    level: "intermediate",
  },
  {
    id: "webinar-4",
    title: "Building a Winning Personal Statement",
    description: "Workshop on crafting compelling personal statements that capture admissions officers' attention.",
    presenter: "Prof. James Miller",
    presenterTitle: "Writing Coach & Former Professor",
    date: "2024-12-30",
    duration: "120 minutes",
    attendees: 756,
    recording: true,
    topics: ["Personal Statements", "Essay Writing", "Storytelling"],
    level: "beginner",
  },
  {
    id: "webinar-5",
    title: "Career Planning for International Students",
    description: "Strategic career planning session covering internships, job search, and post-graduation opportunities.",
    presenter: "Career Services Panel",
    presenterTitle: "University Career Counselors",
    date: "2025-01-05",
    duration: "85 minutes",
    attendees: 634,
    topics: ["Career Planning", "Internships", "Job Search", "Work Visas"],
    level: "advanced",
  },
];

export const analyticsData = {
  applicationSuccess: {
    totalApplications: 12,
    acceptances: 8,
    rejections: 2,
    pending: 2,
    successRate: 67,
  },
  profileStrength: {
    academic: 85,
    extracurricular: 72,
    testScores: 90,
    essays: 78,
    recommendations: 88,
    overall: 83,
  },
  universityMatches: [
    { name: "MIT", match: 78, status: "reach" },
    { name: "Stanford", match: 72, status: "reach" },
    { name: "UC Berkeley", match: 85, status: "target" },
    { name: "University of Toronto", match: 92, status: "safety" },
    { name: "ETH Zurich", match: 88, status: "target" },
  ],
  timelineProgress: {
    research: 100,
    applications: 85,
    visa: 45,
    preparation: 20,
    departure: 0,
  },
};
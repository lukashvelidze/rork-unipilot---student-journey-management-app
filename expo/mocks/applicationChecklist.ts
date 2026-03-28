export interface ApplicationTask {
  id: string;
  title: string;
  description: string;
  category: "pre_application" | "application" | "post_application" | "acceptance";
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  deadline?: string;
  completed: boolean;
  tips: string[];
  resources?: string[];
  requiresAcceptance?: boolean;
}

export const universityApplicationChecklist: ApplicationTask[] = [
  // Pre-Application Phase
  {
    id: "research-universities",
    title: "Research Target Universities",
    description: "Create a comprehensive list of universities that match your academic goals, budget, and preferences.",
    category: "pre_application",
    priority: "high",
    estimatedTime: "2-3 weeks",
    completed: false,
    tips: [
      "Research at least 8-12 universities to have good options",
      "Consider factors beyond rankings: location, culture, career services",
      "Look at admission statistics and requirements",
      "Check application deadlines and requirements"
    ],
    resources: [
      "University ranking websites",
      "Official university websites",
      "Student forums and reviews",
      "Virtual campus tours"
    ]
  },
  {
    id: "standardized-tests",
    title: "Take Standardized Tests",
    description: "Complete required language and aptitude tests (IELTS/TOEFL, GRE/GMAT, SAT/ACT).",
    category: "pre_application",
    priority: "high",
    estimatedTime: "2-4 months",
    completed: false,
    tips: [
      "Book tests 2-3 months in advance",
      "Take practice tests to familiarize yourself",
      "You can retake tests if needed",
      "Some universities accept multiple test types"
    ],
    resources: [
      "Official test prep materials",
      "Practice test platforms",
      "Test center locations",
      "Score reporting services"
    ]
  },
  {
    id: "academic-transcripts",
    title: "Request Official Transcripts",
    description: "Obtain official transcripts from all educational institutions you've attended.",
    category: "pre_application",
    priority: "high",
    estimatedTime: "2-4 weeks",
    completed: false,
    tips: [
      "Request transcripts early as processing takes time",
      "You may need multiple copies for different universities",
      "Some universities require transcript evaluation services",
      "Keep digital and physical copies for your records"
    ],
    resources: [
      "University registrar offices",
      "Transcript evaluation services",
      "Digital transcript platforms"
    ]
  },
  {
    id: "recommendation-letters",
    title: "Request Recommendation Letters",
    description: "Ask professors, employers, or mentors for strong recommendation letters.",
    category: "pre_application",
    priority: "high",
    estimatedTime: "4-6 weeks",
    completed: false,
    tips: [
      "Ask recommenders at least 6 weeks before deadlines",
      "Provide your resume and draft personal statement",
      "Choose recommenders who know you well academically or professionally",
      "Follow up politely if needed"
    ],
    resources: [
      "Recommendation letter templates",
      "Guidelines for recommenders",
      "Thank you note templates"
    ]
  },
  {
    id: "personal-statement",
    title: "Write Personal Statement/Essays",
    description: "Craft compelling personal statements and supplemental essays for each university.",
    category: "application",
    priority: "high",
    estimatedTime: "4-8 weeks",
    completed: false,
    tips: [
      "Start with a strong hook and tell your unique story",
      "Be specific about why you chose this program and university",
      "Show, don't just tell - use concrete examples",
      "Get feedback from multiple people before submitting"
    ],
    resources: [
      "Essay writing guides",
      "Successful essay examples",
      "Writing workshops",
      "Professional editing services"
    ]
  },
  {
    id: "application-forms",
    title: "Complete Application Forms",
    description: "Fill out detailed application forms for each university, ensuring accuracy and completeness.",
    category: "application",
    priority: "high",
    estimatedTime: "2-3 weeks",
    completed: false,
    tips: [
      "Save drafts frequently to avoid losing work",
      "Double-check all information for accuracy",
      "Prepare all documents before starting the application",
      "Submit applications well before deadlines"
    ],
    resources: [
      "University application portals",
      "Common application platforms",
      "Application checklists"
    ]
  },
  {
    id: "application-fees",
    title: "Pay Application Fees",
    description: "Submit required application fees for each university (typically $50-$200 per application).",
    category: "application",
    priority: "medium",
    estimatedTime: "1 day",
    completed: false,
    tips: [
      "Keep receipts for all payments",
      "Some universities offer fee waivers for financial need",
      "Use secure payment methods",
      "Budget for multiple application fees"
    ],
    resources: [
      "University payment portals",
      "Fee waiver information",
      "Payment confirmation receipts"
    ]
  },
  {
    id: "portfolio-submission",
    title: "Submit Portfolio/Work Samples",
    description: "Prepare and submit portfolios or work samples if required by your program.",
    category: "application",
    priority: "medium",
    estimatedTime: "2-4 weeks",
    completed: false,
    tips: [
      "Follow specific format and size requirements",
      "Showcase your best and most relevant work",
      "Include a variety of projects if applicable",
      "Get feedback from professionals in your field"
    ],
    resources: [
      "Portfolio guidelines",
      "Digital portfolio platforms",
      "Professional portfolio examples"
    ]
  },
  {
    id: "scholarship-applications",
    title: "Apply for Scholarships",
    description: "Research and apply for merit-based and need-based scholarships.",
    category: "application",
    priority: "high",
    estimatedTime: "4-6 weeks",
    completed: false,
    tips: [
      "Start scholarship search early",
      "Apply for multiple scholarships to increase chances",
      "Tailor applications to each scholarship's criteria",
      "Meet all deadlines and requirements"
    ],
    resources: [
      "Scholarship databases",
      "University financial aid offices",
      "Government scholarship programs",
      "Private foundation scholarships"
    ]
  },
  {
    id: "interview-preparation",
    title: "Prepare for Interviews",
    description: "Practice for admission interviews if required by your target universities.",
    category: "post_application",
    priority: "medium",
    estimatedTime: "2-3 weeks",
    completed: false,
    tips: [
      "Research common interview questions",
      "Practice with mock interviews",
      "Prepare questions to ask the interviewer",
      "Dress professionally and arrive early"
    ],
    resources: [
      "Interview preparation guides",
      "Mock interview platforms",
      "Common interview questions",
      "Professional attire guidelines"
    ]
  },
  {
    id: "track-applications",
    title: "Track Application Status",
    description: "Monitor the status of all submitted applications and respond to any requests for additional information.",
    category: "post_application",
    priority: "medium",
    estimatedTime: "Ongoing",
    completed: false,
    tips: [
      "Check application portals regularly",
      "Respond quickly to requests for additional documents",
      "Keep a spreadsheet to track all applications",
      "Set up email notifications if available"
    ],
    resources: [
      "University application portals",
      "Application tracking spreadsheets",
      "Email notification systems"
    ]
  },
  // Acceptance Phase - Unlocked after acceptance
  {
    id: "receive-acceptance",
    title: "🎉 Receive Acceptance Letter",
    description: "Celebrate receiving your acceptance letter(s) from universities!",
    category: "acceptance",
    priority: "high",
    estimatedTime: "1 day",
    completed: false,
    requiresAcceptance: false,
    tips: [
      "Read the acceptance letter carefully",
      "Note any conditions or requirements",
      "Check deadlines for accepting the offer",
      "Celebrate this major milestone!"
    ],
    resources: [
      "Acceptance letter templates",
      "University enrollment guides"
    ]
  },
  {
    id: "compare-offers",
    title: "Compare University Offers",
    description: "Evaluate and compare offers from different universities, including financial aid packages.",
    category: "acceptance",
    priority: "high",
    estimatedTime: "1-2 weeks",
    completed: false,
    requiresAcceptance: true,
    tips: [
      "Create a comparison matrix with all factors",
      "Consider total cost, not just tuition",
      "Think about long-term career prospects",
      "Visit campuses if possible"
    ],
    resources: [
      "University comparison tools",
      "Financial aid calculators",
      "Career outcome statistics"
    ]
  },
  {
    id: "accept-offer",
    title: "Accept University Offer",
    description: "Formally accept your chosen university's offer and pay the enrollment deposit.",
    category: "acceptance",
    priority: "high",
    estimatedTime: "1 day",
    completed: false,
    requiresAcceptance: true,
    tips: [
      "Accept before the deadline",
      "Pay the enrollment deposit promptly",
      "Keep confirmation receipts",
      "Understand the deposit is usually non-refundable"
    ],
    resources: [
      "University enrollment portals",
      "Payment confirmation systems"
    ]
  },
  {
    id: "decline-offers",
    title: "Decline Other Offers",
    description: "Politely decline offers from universities you won't be attending.",
    category: "acceptance",
    priority: "medium",
    estimatedTime: "1 day",
    completed: false,
    requiresAcceptance: true,
    tips: [
      "Decline promptly to help other students on waitlists",
      "Be polite and professional in your communication",
      "Thank the university for the opportunity",
      "Keep doors open for potential future opportunities"
    ],
    resources: [
      "Decline letter templates",
      "Professional communication guides"
    ]
  },
  {
    id: "enrollment-documents",
    title: "Request Enrollment Documents",
    description: "Obtain official enrollment documents (I-20, CAS, etc.) needed for visa applications.",
    category: "acceptance",
    priority: "high",
    estimatedTime: "2-4 weeks",
    completed: false,
    requiresAcceptance: true,
    tips: [
      "Request documents immediately after accepting",
      "Provide all required financial documentation",
      "Keep multiple copies of all documents",
      "Verify all information is correct"
    ],
    resources: [
      "International student services",
      "Visa documentation guides",
      "Financial documentation requirements"
    ]
  },
  {
    id: "orientation-registration",
    title: "Register for Orientation",
    description: "Sign up for new student orientation programs and activities.",
    category: "acceptance",
    priority: "medium",
    estimatedTime: "1 week",
    completed: false,
    requiresAcceptance: true,
    tips: [
      "Register early as spots may be limited",
      "Attend both academic and social orientation events",
      "Prepare questions about campus life and academics",
      "Connect with other international students"
    ],
    resources: [
      "Orientation program schedules",
      "New student guides",
      "International student resources"
    ]
  },
  {
    id: "housing-application",
    title: "Apply for Housing",
    description: "Submit applications for on-campus housing or research off-campus options.",
    category: "acceptance",
    priority: "high",
    estimatedTime: "2-3 weeks",
    completed: false,
    requiresAcceptance: true,
    tips: [
      "Apply for housing as early as possible",
      "Consider location, cost, and amenities",
      "Research both on-campus and off-campus options",
      "Connect with potential roommates if needed"
    ],
    resources: [
      "University housing portals",
      "Off-campus housing websites",
      "Roommate matching services"
    ]
  },
  {
    id: "final-transcripts",
    title: "Submit Final Transcripts",
    description: "Send final official transcripts and graduation certificates to your chosen university.",
    category: "acceptance",
    priority: "high",
    estimatedTime: "2-3 weeks",
    completed: false,
    requiresAcceptance: true,
    tips: [
      "Submit transcripts immediately after graduation",
      "Ensure all degree requirements are met",
      "Send both official transcripts and degree certificates",
      "Keep copies for your records"
    ],
    resources: [
      "University registrar offices",
      "Transcript delivery services",
      "Degree verification services"
    ]
  }
];

export const getTasksByCategory = (category: ApplicationTask['category']) => {
  return universityApplicationChecklist.filter(task => task.category === category);
};

export const getTasksByPriority = (priority: ApplicationTask['priority']) => {
  return universityApplicationChecklist.filter(task => task.priority === priority);
};

export const getUnlockedTasks = (hasAcceptance: boolean) => {
  return universityApplicationChecklist.filter(task => 
    !task.requiresAcceptance || hasAcceptance
  );
};
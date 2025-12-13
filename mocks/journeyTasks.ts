import { JourneyProgress } from "@/types/user";
import { generateId } from "@/utils/helpers";

// Base tasks that apply to all destinations
const baseResearchTasks = [
  {
    id: generateId(),
    title: "Research potential universities",
    completed: false,
  },
  {
    id: generateId(),
    title: "Compare program offerings",
    completed: false,
  },
  {
    id: generateId(),
    title: "Check admission requirements",
    completed: false,
  },
  {
    id: generateId(),
    title: "Research scholarship opportunities",
    completed: false,
  },
  {
    id: generateId(),
    title: "Create a shortlist of universities",
    completed: false,
  },
];

const baseApplicationTasks = [
  // Pre-Application Phase
  {
    id: generateId(),
    title: "Research university admission requirements",
    completed: false,
  },
  {
    id: generateId(),
    title: "Take required standardized tests (IELTS/TOEFL/GRE/GMAT)",
    completed: false,
  },
  {
    id: generateId(),
    title: "Request official transcripts from all institutions",
    completed: false,
  },
  {
    id: generateId(),
    title: "Prepare academic CV/Resume",
    completed: false,
  },
  {
    id: generateId(),
    title: "Write compelling personal statement/statement of purpose",
    completed: false,
  },
  {
    id: generateId(),
    title: "Request 2-3 strong recommendation letters",
    completed: false,
  },
  {
    id: generateId(),
    title: "Prepare portfolio/work samples (if required)",
    completed: false,
  },
  {
    id: generateId(),
    title: "Research and apply for scholarships",
    completed: false,
  },
  {
    id: generateId(),
    title: "Complete online application forms",
    completed: false,
  },
  {
    id: generateId(),
    title: "Pay application fees ($50-$200 per university)",
    completed: false,
  },
  {
    id: generateId(),
    title: "Submit applications before deadlines",
    completed: false,
  },
  {
    id: generateId(),
    title: "Track application status regularly",
    completed: false,
  },
  // Post-Application Phase
  {
    id: generateId(),
    title: "Prepare for interviews (if required)",
    completed: false,
  },
  {
    id: generateId(),
    title: "Submit additional documents if requested",
    completed: false,
  },
  {
    id: generateId(),
    title: "Wait for admission decisions (2-6 months)",
    completed: false,
  },
  // Acceptance Phase - These unlock after marking acceptance
  {
    id: generateId(),
    title: "🎉 Receive acceptance letter(s)",
    completed: false,
  },
  {
    id: generateId(),
    title: "Compare offers and financial aid packages",
    completed: false,
  },
  {
    id: generateId(),
    title: "Accept offer and pay enrollment deposit",
    completed: false,
  },
  {
    id: generateId(),
    title: "Decline other offers politely",
    completed: false,
  },
  {
    id: generateId(),
    title: "Request official enrollment documents (I-20, CAS, etc.)",
    completed: false,
  },
  {
    id: generateId(),
    title: "Register for orientation programs",
    completed: false,
  },
  {
    id: generateId(),
    title: "Apply for on-campus housing",
    completed: false,
  },
  {
    id: generateId(),
    title: "Submit final transcripts and graduation certificates",
    completed: false,
  },
];

// Country-specific visa tasks
const getVisaTasks = (destinationCountry: string) => {
  const baseTasks = [
    {
      id: generateId(),
      title: "Receive acceptance letter",
      completed: false,
    },
  ];

  switch (destinationCountry) {
    case "US":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Receive I-20 form from university",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay SEVIS fee ($350)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Complete DS-160 form online",
          completed: false,
        },
        {
          id: generateId(),
          title: "Schedule F-1 visa interview",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prepare financial documents (bank statements, sponsor letters)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Attend visa interview at US Embassy/Consulate",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive F-1 student visa",
          completed: false,
        },
      ];

    case "UK":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Receive CAS (Confirmation of Acceptance for Studies)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Complete Student visa application online",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay visa application fee (£363)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay Immigration Health Surcharge",
          completed: false,
        },
        {
          id: generateId(),
          title: "Book biometric appointment",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prepare financial evidence (£1,334/month for living costs)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Attend biometric appointment",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive Student visa decision",
          completed: false,
        },
      ];

    case "CA":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Receive Letter of Acceptance from DLI",
          completed: false,
        },
        {
          id: generateId(),
          title: "Apply for study permit online",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay study permit fee ($150 CAD)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Provide biometrics",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prepare proof of funds ($10,000 CAD + tuition)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get medical exam (if required)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive study permit approval",
          completed: false,
        },
      ];

    case "AU":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Receive CoE (Confirmation of Enrolment)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Apply for Student visa (subclass 500) online",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay visa application fee ($650 AUD)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Arrange health insurance (OSHC)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prepare financial evidence ($21,041 AUD/year)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Complete health examinations",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive visa grant notification",
          completed: false,
        },
      ];

    case "DE":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Receive admission letter (Zulassungsbescheid)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Apply for student visa (if non-EU)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Open blocked account (€11,208 for 2024)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get health insurance coverage",
          completed: false,
        },
        {
          id: generateId(),
          title: "Schedule visa appointment at German consulate",
          completed: false,
        },
        {
          id: generateId(),
          title: "Attend visa interview",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive student visa",
          completed: false,
        },
      ];

    case "NL":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Receive admission letter from Dutch university",
          completed: false,
        },
        {
          id: generateId(),
          title: "Apply for residence permit (if non-EU)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay application fee (€174)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prove financial means (€13,800/year)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get health insurance",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive residence permit decision",
          completed: false,
        },
      ];

    case "FR":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Receive acceptance letter from French institution",
          completed: false,
        },
        {
          id: generateId(),
          title: "Apply for student visa (VLS-TS)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay visa fee (€99)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prove financial resources (€615/month)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Schedule visa appointment",
          completed: false,
        },
        {
          id: generateId(),
          title: "Attend visa interview",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive student visa",
          completed: false,
        },
      ];

    default:
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Research visa requirements for your destination",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prepare required documents",
          completed: false,
        },
        {
          id: generateId(),
          title: "Submit visa application",
          completed: false,
        },
        {
          id: generateId(),
          title: "Pay visa fees",
          completed: false,
        },
        {
          id: generateId(),
          title: "Attend interview (if required)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Receive visa decision",
          completed: false,
        },
      ];
  }
};

// Country-specific pre-departure tasks
const getPreDepartureTasks = (destinationCountry: string) => {
  const baseTasks = [
    {
      id: generateId(),
      title: "Book flight tickets",
      completed: false,
    },
    {
      id: generateId(),
      title: "Arrange accommodation",
      completed: false,
    },
    {
      id: generateId(),
      title: "Get health insurance",
      completed: false,
    },
    {
      id: generateId(),
      title: "Prepare necessary documents",
      completed: false,
    },
    {
      id: generateId(),
      title: "Exchange currency",
      completed: false,
    },
    {
      id: generateId(),
      title: "Pack essentials",
      completed: false,
    },
  ];

  switch (destinationCountry) {
    case "US":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Download CBP One app for entry",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research local transportation (Uber, public transit)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prepare for TSA security procedures",
          completed: false,
        },
      ];

    case "UK":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Download NHS app for health services",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research Oyster card for London transport",
          completed: false,
        },
        {
          id: generateId(),
          title: "Prepare for UK border control",
          completed: false,
        },
      ];

    case "DE":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Research German bureaucracy requirements",
          completed: false,
        },
        {
          id: generateId(),
          title: "Learn basic German phrases",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research local transport systems",
          completed: false,
        },
      ];

    default:
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Research local customs and culture",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research local transportation options",
          completed: false,
        },
      ];
  }
};

// Country-specific arrival tasks
const getArrivalTasks = (destinationCountry: string) => {
  const baseTasks = [
    {
      id: generateId(),
      title: "Clear immigration",
      completed: false,
    },
    {
      id: generateId(),
      title: "Reach accommodation",
      completed: false,
    },
    {
      id: generateId(),
      title: "Attend orientation",
      completed: false,
    },
    {
      id: generateId(),
      title: "Open bank account",
      completed: false,
    },
    {
      id: generateId(),
      title: "Get local phone/SIM card",
      completed: false,
    },
    {
      id: generateId(),
      title: "Explore campus",
      completed: false,
    },
    {
      id: generateId(),
      title: "Meet academic advisor",
      completed: false,
    },
  ];

  switch (destinationCountry) {
    case "US":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Get Social Security Number (if eligible)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Register with SEVIS",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get state ID/driver's license",
          completed: false,
        },
      ];

    case "UK":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Register with local GP",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get National Insurance Number",
          completed: false,
        },
        {
          id: generateId(),
          title: "Register with local council",
          completed: false,
        },
      ];

    case "DE":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Register address (Anmeldung)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get residence permit card",
          completed: false,
        },
        {
          id: generateId(),
          title: "Register with health insurance",
          completed: false,
        },
      ];

    case "CA":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Get SIN (Social Insurance Number)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Register with provincial health plan",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get provincial ID",
          completed: false,
        },
      ];

    case "AU":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Get Tax File Number (TFN)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Register with Medicare (if eligible)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Get local transport card",
          completed: false,
        },
      ];

    default:
      return baseTasks;
  }
};

// Country-specific career tasks
const getCareerTasks = (destinationCountry: string) => {
  const baseTasks = [
    {
      id: generateId(),
      title: "Update resume/CV",
      completed: false,
    },
    {
      id: generateId(),
      title: "Attend career fairs",
      completed: false,
    },
    {
      id: generateId(),
      title: "Network with professionals",
      completed: false,
    },
    {
      id: generateId(),
      title: "Apply for internships/jobs",
      completed: false,
    },
    {
      id: generateId(),
      title: "Attend interviews",
      completed: false,
    },
  ];

  switch (destinationCountry) {
    case "US":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Apply for OPT (Optional Practical Training)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research H-1B visa requirements",
          completed: false,
        },
        {
          id: generateId(),
          title: "Understand CPT vs OPT regulations",
          completed: false,
        },
      ];

    case "UK":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Apply for Graduate visa (2 years post-study)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research Skilled Worker visa pathway",
          completed: false,
        },
        {
          id: generateId(),
          title: "Understand right to work regulations",
          completed: false,
        },
      ];

    case "CA":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Apply for PGWP (Post-Graduation Work Permit)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research Express Entry system",
          completed: false,
        },
        {
          id: generateId(),
          title: "Understand Provincial Nominee Programs",
          completed: false,
        },
      ];

    case "AU":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Apply for Temporary Graduate visa (485)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research skilled migration pathways",
          completed: false,
        },
        {
          id: generateId(),
          title: "Understand points-based system",
          completed: false,
        },
      ];

    case "DE":
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Apply for job seeker visa (18 months)",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research EU Blue Card requirements",
          completed: false,
        },
        {
          id: generateId(),
          title: "Understand German work visa categories",
          completed: false,
        },
      ];

    default:
      return [
        ...baseTasks,
        {
          id: generateId(),
          title: "Research post-graduation work options",
          completed: false,
        },
        {
          id: generateId(),
          title: "Understand local work visa requirements",
          completed: false,
        },
      ];
  }
};

export const getJourneyProgressForCountry = (destinationCountry: string): JourneyProgress[] => {
  const stageTitles: Record<string, string> = {
    research: "Research Phase",
    application: "Application Process",
    visa: "Visa Preparation",
    pre_departure: "Pre-Departure Planning",
    arrival: "Arrival & Orientation",
    academic: "Academic Journey",
    career: "Career Development",
  };

  return [
    {
      id: generateId(),
      stage: "research",
      title: stageTitles.research,
      progress: 0,
      completed: false,
      tasks: baseResearchTasks,
    },
    {
      id: generateId(),
      stage: "application",
      title: stageTitles.application,
      progress: 0,
      completed: false,
      tasks: baseApplicationTasks,
    },
    {
      id: generateId(),
      stage: "visa",
      title: stageTitles.visa,
      progress: 0,
      completed: false,
      tasks: getVisaTasks(destinationCountry),
    },
    {
      id: generateId(),
      stage: "pre_departure",
      title: stageTitles.pre_departure,
      progress: 0,
      completed: false,
      tasks: getPreDepartureTasks(destinationCountry),
    },
    {
      id: generateId(),
      stage: "arrival",
      title: stageTitles.arrival,
      progress: 0,
      completed: false,
      tasks: getArrivalTasks(destinationCountry),
    },
    {
      id: generateId(),
      stage: "academic",
      title: stageTitles.academic,
      progress: 0,
      completed: false,
      tasks: [
        {
          id: generateId(),
          title: "Register for classes",
          completed: false,
        },
        {
          id: generateId(),
          title: "Purchase textbooks/materials",
          completed: false,
        },
        {
          id: generateId(),
          title: "Attend first classes",
          completed: false,
        },
        {
          id: generateId(),
          title: "Join student organizations",
          completed: false,
        },
        {
          id: generateId(),
          title: "Meet with professors",
          completed: false,
        },
        {
          id: generateId(),
          title: "Explore campus resources",
          completed: false,
        },
        {
          id: generateId(),
          title: "Research internship opportunities",
          completed: false,
        },
      ],
    },
    {
      id: generateId(),
      stage: "career",
      title: stageTitles.career,
      progress: 0,
      completed: false,
      tasks: getCareerTasks(destinationCountry),
    },
  ];
};

// Default journey progress (fallback)
export const initialJourneyProgress: JourneyProgress[] = getJourneyProgressForCountry("US");

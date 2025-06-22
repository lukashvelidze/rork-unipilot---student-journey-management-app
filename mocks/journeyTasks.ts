import { JourneyProgress } from "@/types/user";
import { generateId } from "@/utils/helpers";

export const initialJourneyProgress: JourneyProgress[] = [
  {
    stage: "research",
    progress: 0,
    completed: false,
    tasks: [
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
    ],
  },
  {
    stage: "application",
    progress: 0,
    completed: false,
    tasks: [
      {
        id: generateId(),
        title: "Prepare application documents",
        completed: false,
      },
      {
        id: generateId(),
        title: "Write personal statement/essay",
        completed: false,
      },
      {
        id: generateId(),
        title: "Request recommendation letters",
        completed: false,
      },
      {
        id: generateId(),
        title: "Submit applications",
        completed: false,
      },
      {
        id: generateId(),
        title: "Pay application fees",
        completed: false,
      },
      {
        id: generateId(),
        title: "Track application status",
        completed: false,
      },
    ],
  },
  {
    stage: "visa",
    progress: 0,
    completed: false,
    tasks: [
      {
        id: generateId(),
        title: "Receive acceptance letter",
        completed: false,
      },
      {
        id: generateId(),
        title: "Receive I-20/admission documents",
        completed: false,
      },
      {
        id: generateId(),
        title: "Pay SEVIS fee",
        completed: false,
      },
      {
        id: generateId(),
        title: "Complete DS-160 form",
        completed: false,
      },
      {
        id: generateId(),
        title: "Schedule visa interview",
        completed: false,
      },
      {
        id: generateId(),
        title: "Prepare financial documents",
        completed: false,
      },
      {
        id: generateId(),
        title: "Attend visa interview",
        completed: false,
      },
      {
        id: generateId(),
        title: "Receive visa",
        completed: false,
      },
    ],
  },
  {
    stage: "pre_departure",
    progress: 0,
    completed: false,
    tasks: [
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
      {
        id: generateId(),
        title: "Research local transportation",
        completed: false,
      },
    ],
  },
  {
    stage: "arrival",
    progress: 0,
    completed: false,
    tasks: [
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
    ],
  },
  {
    stage: "academic",
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
    stage: "career",
    progress: 0,
    completed: false,
    tasks: [
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
        title: "Prepare for OPT application",
        completed: false,
      },
      {
        id: generateId(),
        title: "Research visa options post-graduation",
        completed: false,
      },
      {
        id: generateId(),
        title: "Attend interviews",
        completed: false,
      },
    ],
  },
];
import { JourneyStage } from "@/types/user";

interface Quote {
  text: string;
  author: string;
}

export const generalQuotes: Quote[] = [
  {
    text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    author: "Malcolm X"
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "Your attitude, not your aptitude, will determine your altitude.",
    author: "Zig Ziglar"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela"
  },
  {
    text: "The best way to predict your future is to create it.",
    author: "Abraham Lincoln"
  }
];

// Define a type-safe record for stage-specific quotes
type StageQuotes = {
  [key in JourneyStage]: Quote[];
};

export const stageSpecificQuotes: StageQuotes = {
  research: [
    {
      text: "Research is creating new knowledge.",
      author: "Neil Armstrong"
    },
    {
      text: "The more you know, the more you realize you don't know.",
      author: "Aristotle"
    },
    {
      text: "The important thing is not to stop questioning.",
      author: "Albert Einstein"
    }
  ],
  application: [
    {
      text: "The secret of getting ahead is getting started.",
      author: "Mark Twain"
    },
    {
      text: "Your application is your first impression. Make it count.",
      author: "Anonymous"
    },
    {
      text: "The difference between ordinary and extraordinary is that little extra.",
      author: "Jimmy Johnson"
    }
  ],
  visa: [
    {
      text: "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.",
      author: "Joyce Meyer"
    },
    {
      text: "The visa is not just a document, it's your ticket to a new world.",
      author: "Anonymous"
    },
    {
      text: "Every accomplishment starts with the decision to try.",
      author: "Gail Devers"
    }
  ],
  pre_departure: [
    {
      text: "The world is a book and those who do not travel read only one page.",
      author: "Saint Augustine"
    },
    {
      text: "Travel far, travel wide, travel deep.",
      author: "Anonymous"
    },
    {
      text: "Life begins at the end of your comfort zone.",
      author: "Neale Donald Walsch"
    }
  ],
  arrival: [
    {
      text: "Every new beginning comes from some other beginning's end.",
      author: "Seneca"
    },
    {
      text: "The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.",
      author: "Marcel Proust"
    },
    {
      text: "A journey of a thousand miles begins with a single step.",
      author: "Lao Tzu"
    }
  ],
  academic: [
    {
      text: "The roots of education are bitter, but the fruit is sweet.",
      author: "Aristotle"
    },
    {
      text: "Education is not the filling of a pail, but the lighting of a fire.",
      author: "W.B. Yeats"
    },
    {
      text: "The mind is not a vessel to be filled, but a fire to be kindled.",
      author: "Plutarch"
    }
  ],
  career: [
    {
      text: "Choose a job you love, and you will never have to work a day in your life.",
      author: "Confucius"
    },
    {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs"
    },
    {
      text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
      author: "Steve Jobs"
    }
  ]
};

export const milestoneQuotes: Quote[] = [
  {
    text: "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.",
    author: "Albert Schweitzer"
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt"
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar"
  },
  {
    text: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
    author: "Christian D. Larson"
  },
  {
    text: "The harder the conflict, the greater the triumph.",
    author: "George Washington"
  }
];

export const getRandomQuote = (quotes: Quote[]): Quote => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

export const getStageQuote = (stage: JourneyStage): Quote => {
  const stageQuotes = stageSpecificQuotes[stage] || generalQuotes;
  return getRandomQuote(stageQuotes);
};
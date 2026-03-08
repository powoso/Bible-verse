// HelloAO Bible API translation IDs (bible.helloao.org)
// No API key needed, no usage limits, free for commercial use
export const TRANSLATIONS = [
  { id: "KJV", name: "KJV", label: "King James Version" },
  { id: "ASV", name: "ASV", label: "American Standard Version" },
  { id: "WEB", name: "WEB", label: "World English Bible" },
  { id: "BSB", name: "BSB", label: "Berean Standard Bible" },
] as const;

// These translations can be added manually by users (paste verse text)
export const CUSTOM_TRANSLATIONS = ["ESV", "NIV", "NASB", "NLT"] as const;

export const DRILL_MODES = [
  {
    id: "read",
    name: "Read",
    description: "Display verse, mark confidence 1-5",
    icon: "BookOpen",
    free: true,
  },
  {
    id: "fill_blank",
    name: "Fill in the Blank",
    description: "Fill in randomly blanked words",
    icon: "PenLine",
    free: true,
  },
  {
    id: "prompt",
    name: "Prompt",
    description: "See reference, type the verse",
    icon: "MessageSquare",
    free: false,
  },
  {
    id: "first_letters",
    name: "First Letters",
    description: "Only first letter of each word shown",
    icon: "Type",
    free: false,
  },
  {
    id: "recite",
    name: "Recite",
    description: "Blank canvas, type from memory",
    icon: "Brain",
    free: false,
  },
] as const;

export type DrillMode = (typeof DRILL_MODES)[number]["id"];

export const FREE_VERSE_LIMIT = 10;
export const FREE_COLLECTION_LIMIT = 1;

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "10 verses max",
      "1 collection",
      "Read & Fill-in-the-blank modes",
      "Basic progress tracking",
    ],
  },
  pro: {
    name: "Pro",
    price: 9,
    features: [
      "Unlimited verses",
      "Unlimited collections",
      "All 5 drill modes",
      "All AI features",
      "Detailed analytics",
    ],
  },
  church: {
    name: "Church",
    price: 49,
    features: [
      "Everything in Pro",
      "Shared collections",
      "Member leaderboard",
      "Pastor admin view",
      "Bulk verse import",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

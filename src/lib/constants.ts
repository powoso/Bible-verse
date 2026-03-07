export const TRANSLATIONS = [
  { id: "de4e12af7f28f599-02", name: "KJV", label: "King James Version" },
  { id: "06125adad2d5898a-01", name: "ASV", label: "American Standard Version" },
  { id: "9879dbb7cfe39e4d-04", name: "WEB", label: "World English Bible" },
] as const;

// For api.bible, ESV/NIV/NASB/NLT require commercial licenses.
// We include free translations and allow user to add custom text.
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

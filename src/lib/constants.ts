// StudyMate Constants

export const APP_NAME = 'StudyMate';
export const APP_TAGLINE = 'AI-Powered Study Companion';

// Feature Limits for Free Tier
export const FREE_TIER_LIMITS = {
  dailyAiMessages: 10,
  dailyNoteSummaries: 3,
  maxTasksPerDay: 20,
} as const;

// Study Session Defaults
export const STUDY_SESSION_DEFAULTS = {
  defaultDurationMinutes: 45,
  defaultBreakMinutes: 10,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  longBreakMinutes: 15,
} as const;

// Subject Categories
export const SUBJECT_CATEGORIES = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Literature',
  'Computer Science',
  'Economics',
  'Psychology',
  'Languages',
  'Art',
  'Music',
  'Other',
] as const;

// Academic Levels
export const ACADEMIC_LEVELS = [
  { value: 'high_school', label: 'High School' },
  { value: 'college', label: 'College/University' },
  { value: 'graduate', label: 'Graduate School' },
  { value: 'other', label: 'Other' },
] as const;

// Priority Levels
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'destructive' },
] as const;

// Routes
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Onboarding
  ONBOARDING_WELCOME: '/onboarding/welcome',
  ONBOARDING_PREFERENCES: '/onboarding/preferences',
  
  // Main App
  DASHBOARD: '/dashboard',
  TASKS: '/tasks',
  PLANNER: '/planner',
  PLANNER_CREATE: '/planner/create',
  CHAT: '/chat',
  NOTES: '/notes',
  
  // Settings & Profile
  PROFILE: '/profile',
  SUBSCRIPTION: '/subscription',
  ANALYTICS: '/analytics',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  theme: 'studymate-theme',
  onboardingComplete: 'studymate-onboarding-complete',
} as const;

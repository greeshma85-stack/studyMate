// StudyMate Type Definitions

// User & Auth Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  academicLevel?: 'high_school' | 'college' | 'graduate' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  subjects: string[];
  studyTimePreference: 'morning' | 'afternoon' | 'evening' | 'night';
  dailyStudyGoalMinutes: number;
  notificationsEnabled: boolean;
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  subject?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Study Planner Types
export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  studyMethod: 'review' | 'practice' | 'new_material';
  breakIntervalMinutes: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface ExamDeadline {
  id: string;
  userId: string;
  subject: string;
  examDate: Date;
  title: string;
  notes?: string;
  createdAt: Date;
}

// AI Chat Types
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  subject?: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  subject?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notes Types
export interface NoteSummary {
  id: string;
  userId: string;
  originalFileName: string;
  originalContent?: string;
  summary: string;
  keyPoints: string[];
  createdAt: Date;
}

// Subscription Types
export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Analytics Types
export interface StudyStats {
  userId: string;
  totalStudyTimeMinutes: number;
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  aiMessagesUsed: number;
  notesGenerated: number;
}

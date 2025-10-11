import type { AnalyzeDocumentOutput } from '@/ai/flows/restructure-messy-pdf';

export type CourseAnalysis = AnalyzeDocumentOutput;

// These types are now derived from the analysis output for consistency
// but represent the final, interactable course structure.
type SuggestedLesson = AnalyzeDocumentOutput['suggested_structure'][0]['lessons'][0];
type SuggestedSession = Omit<AnalyzeDocumentOutput['suggested_structure'][0], 'lessons'>;


// Augmented types with client-side IDs and more details for the interactive phase
export type Lesson = SuggestedLesson & { 
  id: string;
  content_summary: string;
  resources?: { title: string; type: string; url: string }[];
  quiz?: { question: string; answer: string; options?: string[] }[];
  timeEstimateMinutes?: number;
};
export type Session = SuggestedSession & { id: string; lessons: Lesson[]; estimated_time?: string; };

// This is the final course object used by the learning interface
export type Course = {
  course_title: string;
  description: string;
  sessions: Session[];
  checklist?: string[];
  total_estimated_time?: string;
};

// Extracted for convenience
export type Resource = NonNullable<Lesson['resources']>[0];
export type QuizQuestion = NonNullable<Lesson['quiz']>[0];

// Storage types
export type StoredCourse = {
  course: Course;
  progress: Record<string, 'completed'>; // Key is lesson.id
  createdAt: string;
};

export type StudySession = {
  title: string;
  lessons: Lesson[];
  sessionIndex: number;
  durationMinutes: number;
  totalStepsInCourse: number; // Note: "steps" are now "lessons"
  completedStepsInCourse: number;
};

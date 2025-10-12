
import type { AnalyzeDocumentOutput } from '@/ai/flows/schemas';

export type CourseAnalysis = AnalyzeDocumentOutput;

// These types are now derived from the analysis output for consistency
// but represent the final, interactable course structure.
type SuggestedLesson = AnalyzeDocumentOutput['suggested_structure'][0]['lessons'][0];

// Augmented types with client-side IDs and more details for the interactive phase
export type Lesson = SuggestedLesson & { 
  id: string;
  content_summary: string; // The full summary text for the lesson
  content_snippet: string; // A short snippet for previews
  resources?: { title: string; type: string; url: string }[];
  quiz?: { question: string; answer: string; explanation?: string; }[];
  timeEstimateMinutes?: number;
};
export type Session = { 
  id: string; 
  session_title: string; // Renamed from module_title
  lessons: Lesson[]; 
  estimated_time?: string; 
};

// This is the final course object used by the learning interface
export type Course = {
  course_title: string;
  description: string;
  sessions: Session[];
  checklist?: string[];
  total_estimated_time?: string;
  readiness_score: number;
  analysis_report: CourseAnalysis; // include the full analysis for potential detailed views
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

import type { RestructureMessyPdfOutput } from '@/ai/flows/restructure-messy-pdf';

// Raw types from the AI schema
type RawLesson = RestructureMessyPdfOutput['sessions'][0]['lessons'][0];
type RawSession = Omit<RestructureMessyPdfOutput['sessions'][0], 'lessons'>;

// Augmented types with client-side IDs
export type Lesson = RawLesson & { id: string };
export type Session = RawSession & { id: string; lessons: Lesson[]; };

// Main course type
export type Course = Omit<RestructureMessyPdfOutput, 'sessions'> & {
  sessions: Session[];
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

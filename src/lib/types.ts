import type { RestructureMessyPdfOutput } from '@/ai/flows/restructure-messy-pdf';

type AugmentedStep = RestructureMessyPdfOutput['sessions'][0]['steps'][0] & { id: string };
type AugmentedSession = Omit<RestructureMessyPdfOutput['sessions'][0], 'steps'> & {
  id: string;
  steps: AugmentedStep[];
};

export type Course = Omit<RestructureMessyPdfOutput, 'sessions'> & {
  sessions: AugmentedSession[];
};

export type Session = Course['sessions'][0];
export type Step = Session['steps'][0];
export type Resource = NonNullable<Step['resources']>[0];
export type QuizQuestion = NonNullable<Step['quizQuestions']>[0];

export type StoredCourse = {
  course: Course;
  progress: Record<string, 'completed'>; // Key is step.id
  createdAt: string;
};

export type StudySession = {
  title: string;
  steps: Step[];
  sessionIndex: number;
  durationMinutes: number;
  totalStepsInCourse: number;
  completedStepsInCourse: number;
};

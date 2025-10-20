// Quiz types matching backend models
export interface QuizQuestion {
  id: string
  type: 'multiple_choice' | 'short_answer' | 'practical'
  question: string
  options?: string[]  // for multiple choice
  answer?: string     // correct answer for multiple choice
  explanation?: string // explanation for multiple choice
  key_points?: string[] // for short answer
  task?: string       // for practical exercises
  success_criteria?: string[] // for practical exercises
}

export interface Assignment {
  title: string
  description: string
  requirements: string[]
  rubric: Record<string, string>
  submission_format?: string
}

export interface QuizBlock {
  questions: QuizQuestion[]
  assignment?: Assignment
}

// User answer types
export interface UserAnswer {
  questionId: string
  answer: string | string[] // string for MCQ/short answer, array for multi-select
  isCorrect?: boolean
  score?: number
  timestamp: string
}

export interface QuizProgress {
  quizId: string
  answers: Record<string, UserAnswer>
  totalQuestions: number
  answeredQuestions: number
  score: number
  maxScore: number
  percentageScore: number
  isCompleted: boolean
  timeSpent: number // in seconds
  startedAt: string
  completedAt?: string
}

// Component props types
export interface QuizComponentProps {
  quiz: QuizBlock
  onComplete: (progress: QuizProgress) => void
  onProgress?: (progress: QuizProgress) => void
  allowReview?: boolean
  showExplanations?: boolean
  timeLimit?: number // in minutes
  className?: string
}

export interface QuestionComponentProps {
  question: QuizQuestion
  userAnswer?: UserAnswer
  onAnswer: (answer: string | string[]) => void
  showFeedback?: boolean
  disabled?: boolean
  className?: string
}

// Validation types
export interface ValidationResult {
  isCorrect: boolean
  score: number
  feedback: string
  explanation?: string
}

export interface QuizValidation {
  validateAnswer: (question: QuizQuestion, userAnswer: string | string[]) => ValidationResult
  calculateScore: (answers: Record<string, UserAnswer>, questions: QuizQuestion[]) => number
}
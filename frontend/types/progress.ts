import { Course, Module, Progress } from './api'

// Dashboard-specific interfaces
export interface ModuleProgress {
  module: Module
  progress?: Progress
  isCompleted: boolean
  completionPercentage: number
  timeSpent: number // in minutes
  quizScore?: number
  lastAccessed?: string
}

export interface CourseProgressSummary {
  course: Course
  totalModules: number
  completedModules: number
  completionPercentage: number
  totalTimeSpent: number // in minutes
  averageQuizScore?: number
  estimatedTimeRemaining: number // in minutes
  lastActivity?: string
  modules: ModuleProgress[]
}

export interface DashboardStats {
  totalCourses: number
  activeCourses: number
  completedCourses: number
  totalTimeSpent: number
  averageCompletionRate: number
  streakDays: number
  lastActiveDate?: string
}

export interface ProgressUpdatePayload {
  courseId: string
  moduleId?: string
  completed?: boolean
  timeSpent?: number
  dayKey?: string
  actions?: string[]
  quizScore?: number
  notes?: string
}

export interface ProgressDashboardProps {
  courseId: string
  userId?: string
  onModuleSelect?: (module: Module) => void
  onQuizStart?: (module: Module) => void
  showDetailedView?: boolean
  allowToggleCompletion?: boolean
  className?: string
  initialData?: CourseProgressSummary
  demoMode?: boolean
}

export interface ModuleCardProps {
  moduleProgress: ModuleProgress
  onToggleCompletion: (moduleId: string, completed: boolean) => void
  onSelect?: (module: Module) => void
  onStartQuiz?: (module: Module) => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export interface ProgressSummaryProps {
  summary: CourseProgressSummary
  stats?: DashboardStats
  showTimeEstimates?: boolean
  className?: string
}

// Utility types for progress operations
export interface ProgressOperation {
  type: 'toggle_completion' | 'update_time' | 'update_quiz_score' | 'add_notes'
  moduleId: string
  payload: Partial<ProgressUpdatePayload>
}

export interface ProgressBatchUpdate {
  courseId: string
  operations: ProgressOperation[]
}

// Animation and visual states
export interface ProgressAnimationState {
  isUpdating: boolean
  completionAnimation: boolean
  errorState: boolean
  successMessage?: string
}

// API response types specific to dashboard
export interface DashboardDataResponse {
  course: Course
  modules: Module[]
  progress: Record<string, Progress>
  summary: {
    completion_percentage: number
    total_time_spent: number
    modules_completed: number
    average_quiz_score?: number
    estimated_time_remaining: number
  }
}

export interface ModuleToggleResponse {
  success: boolean
  module_id: string
  completed: boolean
  updated_progress: Progress
  summary_updates: {
    completion_percentage: number
    modules_completed: number
  }
}
import { courseApi, progressApi, ApiError, parseApiError } from './api'
import { 
  CourseProgressSummary, 
  ModuleProgress, 
  DashboardDataResponse, 
  ModuleToggleResponse,
  ProgressUpdatePayload 
} from '../types/progress'

// Enhanced progress API specifically for dashboard
export const dashboardApi = {
  /**
   * Get complete dashboard data including course, modules, and progress
   */
  getDashboardData: async (courseId: string): Promise<CourseProgressSummary> => {
    try {
      // Get course progress data
      const progressData = await courseApi.getProgress(courseId)
      
      // Get course details
      const courses = await courseApi.getAll()
      const course = courses.courses.find(c => c.id === courseId)
      
      if (!course) {
        throw new Error(`Course ${courseId} not found`)
      }

      // Process progress data into dashboard format
      const moduleProgressMap: Record<string, ModuleProgress> = {}
      
      // Create mock modules for demonstration (replace with real API when available)
      const mockModules = Array.from({ length: 6 }, (_, i) => ({
        id: `module_${i + 1}`,
        course_id: courseId,
        index: i + 1,
        title: `Module ${i + 1}: Learning Topic ${i + 1}`,
        start_date: undefined,
        end_date: undefined,
        objectives: [
          `Understand core concepts of topic ${i + 1}`,
          `Apply practical skills in real scenarios`,
          `Complete hands-on exercises`
        ],
        summary_notes: [`Summary for module ${i + 1}`],
        pitfalls: [`Common mistake in topic ${i + 1}`],
        resources: {
          videos: [],
          documents: [],
          exercises: []
        },
        daily_plan: {
          day_1: [{ action: 'read', time: '30min', url: '#' }]
        },
        quiz: {
          questions: [
            {
              id: `q${i + 1}_1`,
              type: 'multiple_choice',
              question: `Sample question for module ${i + 1}?`,
              options: ['Option A', 'Option B', 'Option C'],
              answer: 'Option A'
            }
          ]
        },
        assignment: undefined
      }))
      
      // Map progress data to modules
      mockModules.forEach(module => {
        const progress = progressData.progress[module.id]
        
        moduleProgressMap[module.id] = {
          module,
          progress,
          isCompleted: progress?.module_completed || false,
          completionPercentage: progress?.module_completed ? 100 : 
            (progress?.actions_completed?.length || 0) > 0 ? 50 : 0,
          timeSpent: progress?.minutes_spent || 0,
          quizScore: progress?.quiz_score,
          lastAccessed: progress?.last_accessed
        }
      })

      const modules = Object.values(moduleProgressMap)
      const completedModules = modules.filter(m => m.isCompleted).length
      const totalTimeSpent = modules.reduce((sum, m) => sum + m.timeSpent, 0)
      const quizScores = modules.filter(m => m.quizScore).map(m => m.quizScore!)
      const averageQuizScore = quizScores.length > 0 
        ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length 
        : undefined

      return {
        course,
        totalModules: modules.length,
        completedModules,
        completionPercentage: modules.length > 0 
          ? Math.round((completedModules / modules.length) * 100) 
          : 0,
        totalTimeSpent,
        averageQuizScore,
        estimatedTimeRemaining: Math.max(0, (modules.length - completedModules) * 120),
        lastActivity: modules
          .filter(m => m.lastAccessed)
          .sort((a, b) => new Date(b.lastAccessed!).getTime() - new Date(a.lastAccessed!).getTime())[0]?.lastAccessed,
        modules: modules.sort((a, b) => a.module.index - b.module.index)
      }
    } catch (error) {
      throw parseApiError(error)
    }
  },

  /**
   * Toggle module completion status
   */
  toggleModuleCompletion: async (
    courseId: string, 
    moduleId: string, 
    completed: boolean
  ): Promise<ModuleToggleResponse> => {
    try {
      const updateData = {
        course_id: courseId,
        module_index: parseInt(moduleId.split('_')[1]) || 1, // Extract index from moduleId
        completed,
        minutes: completed ? 60 : 0, // Add some time when completing
        actions_done: completed ? ['module_completed'] : [],
        quiz_score: completed ? 85 : undefined // Mock quiz score
      }

      const result = await progressApi.update(updateData)
      
      // Return structured response
      return {
        success: true,
        module_id: moduleId,
        completed,
        updated_progress: {
          id: `progress_${moduleId}`,
          course_id: courseId,
          module_id: moduleId,
          user_id: 'default_user',
          day_key: `day_${updateData.module_index}`,
          minutes_spent: updateData.minutes,
          actions_completed: updateData.actions_done,
          quiz_score: updateData.quiz_score,
          notes: '',
          module_completed: completed,
          last_accessed: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        summary_updates: {
          completion_percentage: 0, // Will be recalculated
          modules_completed: 0 // Will be recalculated
        }
      }
    } catch (error) {
      throw parseApiError(error)
    }
  },

  /**
   * Update module progress with time tracking
   */
  updateModuleProgress: async (
    courseId: string,
    moduleId: string,
    progressData: Partial<ProgressUpdatePayload>
  ) => {
    try {
      const updateData = {
        course_id: courseId,
        module_index: parseInt(moduleId.split('_')[1]) || 1,
        ...progressData
      }

      return await progressApi.update(updateData)
    } catch (error) {
      throw parseApiError(error)
    }
  },

  /**
   * Batch update multiple modules
   */
  batchUpdateModules: async (
    courseId: string,
    updates: Array<{ moduleId: string; completed: boolean }>
  ) => {
    try {
      const results = await Promise.allSettled(
        updates.map(update => 
          dashboardApi.toggleModuleCompletion(courseId, update.moduleId, update.completed)
        )
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      return {
        successful,
        failed,
        total: updates.length,
        results
      }
    } catch (error) {
      throw parseApiError(error)
    }
  },

  /**
   * Get course statistics
   */
  getCourseStatistics: async (courseId: string) => {
    try {
      const data = await dashboardApi.getDashboardData(courseId)
      
      return {
        totalModules: data.totalModules,
        completedModules: data.completedModules,
        completionRate: data.completionPercentage,
        totalTimeSpent: data.totalTimeSpent,
        averageTimePerModule: data.totalModules > 0 
          ? Math.round(data.totalTimeSpent / data.totalModules) 
          : 0,
        estimatedCompletion: data.estimatedTimeRemaining,
        quizPerformance: data.averageQuizScore || 0,
        lastActivity: data.lastActivity,
        learningStreak: 0 // Would need additional tracking
      }
    } catch (error) {
      throw parseApiError(error)
    }
  }
}

// Utility functions for progress calculations
export const progressUtils = {
  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage: (completed: number, total: number): number => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  },

  /**
   * Estimate time remaining
   */
  estimateTimeRemaining: (
    completedModules: number, 
    totalModules: number, 
    averageTimePerModule: number = 120
  ): number => {
    const remaining = Math.max(0, totalModules - completedModules)
    return remaining * averageTimePerModule
  },

  /**
   * Format time for display
   */
  formatTime: (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
  },

  /**
   * Get progress status message
   */
  getProgressMessage: (percentage: number): string => {
    if (percentage === 100) return "🎉 Course completed! Excellent work!"
    if (percentage >= 75) return "🚀 Almost there! You're doing great!"
    if (percentage >= 50) return "💪 Halfway through! Keep it up!"
    if (percentage >= 25) return "📚 Good progress! Stay focused!"
    if (percentage > 0) return "🌟 Great start! Every step counts!"
    return "🎯 Ready to begin your learning journey?"
  },

  /**
   * Determine next recommended action
   */
  getNextAction: (modules: ModuleProgress[]): string => {
    const nextModule = modules.find(m => !m.isCompleted)
    if (!nextModule) return "All modules completed!"
    
    if (nextModule.completionPercentage > 0) {
      return `Continue with ${nextModule.module.title}`
    }
    return `Start ${nextModule.module.title}`
  }
}
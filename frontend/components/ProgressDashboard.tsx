'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  BookOpen, Clock, Trophy, CheckCircle2, Circle, PlayCircle, 
  Target, TrendingUp, Calendar, Award, RefreshCw, AlertCircle 
} from 'lucide-react'
import { 
  ProgressDashboardProps, 
  CourseProgressSummary, 
  ModuleProgress, 
  ProgressUpdatePayload,
  ProgressAnimationState 
} from '../types/progress'
import { ModuleCard } from './ModuleCard'
import { ProgressSummary } from './ProgressSummary'
import { useProgress } from '../hooks/useProgress'
import { ErrorMessage, SuccessMessage } from './ErrorMessage'

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  courseId,
  userId = 'default_user',
  onModuleSelect,
  onQuizStart,
  showDetailedView = true,
  allowToggleCompletion = true,
  className = '',
  initialData,
  demoMode = false
}) => {
  const [summary, setSummary] = useState<CourseProgressSummary | null>(initialData || null)
  const [animationState, setAnimationState] = useState<ProgressAnimationState>({
    isUpdating: false,
    completionAnimation: false,
    errorState: false
  })
  const [refreshKey, setRefreshKey] = useState(0)

  // Use the existing useProgress hook only if not in demo mode
  const hookResult = useProgress(demoMode ? null : courseId)
  const {
    progressData,
    loading: hookLoading,
    error,
    updateProgress
  } = hookResult

  // For demo mode, use local state; otherwise use hook data
  const loading = demoMode ? false : hookLoading

  // Data is automatically loaded by useProgress hook (except in demo mode)
  useEffect(() => {
    if (error && !demoMode) {
      setAnimationState(prev => ({ ...prev, errorState: true }))
    }
  }, [error, demoMode])

  // Process progress data into dashboard format
  useEffect(() => {
    // In demo mode, use initialData directly
    if (demoMode && initialData) {
      setSummary(initialData)
      return
    }

    // In regular mode, process hook data
    if (progressData && !demoMode) {
      // For now, create mock data since the backend structure may differ
      // This will need to be updated when the actual course API is ready
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
        summary_notes: [],
        pitfalls: [],
        resources: {},
        daily_plan: {},
        quiz: { questions: [] },
        assignment: undefined
      }))

      const moduleProgressMap: Record<string, ModuleProgress> = {}
      
      // Create module progress entries
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

      setSummary({
        course: {
          id: courseId,
          title: 'AI Learning Course',
          duration: '8 weeks',
          level: 'Intermediate',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_filename: 'course-material.pdf',
          structured: true
        },
        totalModules: modules.length,
        completedModules,
        completionPercentage: modules.length > 0 
          ? Math.round((completedModules / modules.length) * 100) 
          : 0,
        totalTimeSpent,
        averageQuizScore,
        estimatedTimeRemaining: Math.max(0, (modules.length - completedModules) * 120), // 2 hours per module estimate
        lastActivity: modules
          .filter(m => m.lastAccessed)
          .sort((a, b) => new Date(b.lastAccessed!).getTime() - new Date(a.lastAccessed!).getTime())[0]?.lastAccessed,
        modules: modules.sort((a, b) => a.module.index - b.module.index)
      })
    }
  }, [progressData, courseId, demoMode, initialData])

  // Handle module completion toggle
  const handleToggleCompletion = useCallback(async (moduleId: string, completed: boolean) => {
    if (!allowToggleCompletion) return

    setAnimationState(prev => ({ ...prev, isUpdating: true }))

    try {
      if (demoMode) {
        // In demo mode, update local state only
        setSummary(prev => {
          if (!prev) return prev
          
          const updatedModules = prev.modules.map(m => 
            m.module.id === moduleId 
              ? { ...m, isCompleted: completed, completionPercentage: completed ? 100 : 25 }
              : m
          )
          
          const completedCount = updatedModules.filter(m => m.isCompleted).length
          
          return {
            ...prev,
            modules: updatedModules,
            completedModules: completedCount,
            completionPercentage: Math.round((completedCount / prev.totalModules) * 100)
          }
        })
      } else {
        // In regular mode, use the API
        const updatePayload = {
          course_id: courseId,
          module_index: summary?.modules.find(m => m.module.id === moduleId)?.module.index || 0,
          completed,
          // Add current timestamp when marking as completed
          ...(completed && { actions_done: ['module_completed'] })
        }

        await updateProgress(updatePayload)
      }
      
      // Trigger completion animation
      if (completed) {
        setAnimationState(prev => ({ 
          ...prev, 
          completionAnimation: true,
          successMessage: 'Module completed! 🎉'
        }))
        
        setTimeout(() => {
          setAnimationState(prev => ({ 
            ...prev, 
            completionAnimation: false,
            successMessage: undefined
          }))
        }, 2000)
      }

    } catch (err) {
      console.error('Failed to toggle completion:', err)
      setAnimationState(prev => ({ 
        ...prev, 
        errorState: true 
      }))
    } finally {
      setAnimationState(prev => ({ ...prev, isUpdating: false }))
    }
  }, [courseId, allowToggleCompletion, updateProgress, demoMode, summary])

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    setAnimationState({
      isUpdating: false,
      completionAnimation: false,
      errorState: false
    })
  }

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
  }

  if (loading && !summary) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <ErrorMessage 
          error={{ detail: error, status: 400 }} 
          variant="error"
          onDismiss={() => setAnimationState(prev => ({ ...prev, errorState: false }))}
        />
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          No course data found
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Success Message */}
      {animationState.successMessage && (
        <SuccessMessage 
          message={animationState.successMessage}
          onDismiss={() => setAnimationState(prev => ({ ...prev, successMessage: undefined }))}
        />
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          error={{ detail: error, status: 400 }} 
          variant="error"
          onDismiss={() => setAnimationState(prev => ({ ...prev, errorState: false }))}
        />
      )}

      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {summary.course.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>{summary.totalModules} modules</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(summary.totalTimeSpent)} spent</span>
              </span>
              {summary.averageQuizScore && (
                <span className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4" />
                  <span>{Math.round(summary.averageQuizScore)}% avg score</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Overall Progress Circle */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${summary.completionPercentage * 1.76} 176`}
                  className="text-blue-600 transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">
                  {summary.completionPercentage}%
                </span>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh progress"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Progress Summary Component */}
        {showDetailedView && (
          <ProgressSummary 
            summary={summary}
            showTimeEstimates={true}
            className="mt-6"
          />
        )}
      </div>

      {/* Module Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summary.modules.map((moduleProgress) => (
          <ModuleCard
            key={moduleProgress.module.id}
            moduleProgress={moduleProgress}
            onToggleCompletion={handleToggleCompletion}
            onSelect={onModuleSelect}
            onStartQuiz={onQuizStart}
            isLoading={animationState.isUpdating}
            disabled={!allowToggleCompletion}
            className={animationState.completionAnimation ? 'animate-pulse' : ''}
          />
        ))}
      </div>

      {/* Quick Actions */}
      {allowToggleCompletion && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                summary.modules
                  .filter(m => !m.isCompleted)
                  .slice(0, 3)
                  .forEach(m => handleToggleCompletion(m.module.id, true))
              }}
              disabled={animationState.isUpdating || summary.completedModules === summary.totalModules}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark Next 3 Complete</span>
            </button>
            
            <button
              onClick={() => {
                const incompleteModules = summary.modules.filter(m => !m.isCompleted)
                if (incompleteModules.length > 0 && onModuleSelect) {
                  onModuleSelect(incompleteModules[0].module)
                }
              }}
              disabled={summary.completedModules === summary.totalModules}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Continue Learning</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
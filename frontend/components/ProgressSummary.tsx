'use client'

import React from 'react'
import { 
  Clock, Trophy, Target, TrendingUp, Calendar, Award, 
  CheckCircle2, BookOpen, Zap, Timer 
} from 'lucide-react'
import { ProgressSummaryProps } from '../types/progress'

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  summary,
  stats,
  showTimeEstimates = true,
  className = ''
}) => {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-blue-600'
    if (percentage >= 25) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getProgressBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600'
    if (percentage >= 50) return 'bg-blue-600'
    if (percentage >= 25) return 'bg-yellow-600'
    return 'bg-gray-600'
  }

  const estimatedDailyTime = 60 // 1 hour per day estimate
  const daysToComplete = showTimeEstimates 
    ? Math.ceil(summary.estimatedTimeRemaining / estimatedDailyTime)
    : 0

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
        <div className="text-sm text-gray-500">
          Last activity: {formatDate(summary.lastActivity)}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Completion Rate */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${getProgressColor(summary.completionPercentage)}`}>
            {summary.completionPercentage}%
          </div>
          <div className="text-sm text-gray-600 mt-1">Complete</div>
          <div className="flex items-center justify-center mt-2">
            <CheckCircle2 className={`h-4 w-4 ${getProgressColor(summary.completionPercentage)}`} />
          </div>
        </div>

        {/* Modules Progress */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {summary.completedModules}/{summary.totalModules}
          </div>
          <div className="text-sm text-gray-600 mt-1">Modules</div>
          <div className="flex items-center justify-center mt-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        {/* Time Spent */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatTime(summary.totalTimeSpent)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Time Spent</div>
          <div className="flex items-center justify-center mt-2">
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
        </div>

        {/* Average Quiz Score */}
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {summary.averageQuizScore ? `${Math.round(summary.averageQuizScore)}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600 mt-1">Avg Score</div>
          <div className="flex items-center justify-center mt-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">{summary.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${getProgressBgColor(summary.completionPercentage)}`}
            style={{ width: `${summary.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Time Estimates */}
      {showTimeEstimates && summary.estimatedTimeRemaining > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Estimated Time Remaining</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatTime(summary.estimatedTimeRemaining)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Days to Complete</div>
                <div className="text-lg font-semibold text-gray-900">
                  {daysToComplete} {daysToComplete === 1 ? 'day' : 'days'}
                </div>
                <div className="text-xs text-gray-500">at 1h/day</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {summary.completionPercentage >= 25 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Target className="h-3 w-3 mr-1" />
            Quarter Complete
          </div>
        )}
        
        {summary.completionPercentage >= 50 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            Halfway There
          </div>
        )}
        
        {summary.completionPercentage >= 75 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Zap className="h-3 w-3 mr-1" />
            Almost Done
          </div>
        )}
        
        {summary.completionPercentage === 100 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Award className="h-3 w-3 mr-1" />
            Course Complete!
          </div>
        )}

        {summary.averageQuizScore && summary.averageQuizScore >= 90 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Trophy className="h-3 w-3 mr-1" />
            Quiz Master
          </div>
        )}

        {summary.totalTimeSpent >= 600 && ( // 10 hours
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Clock className="h-3 w-3 mr-1" />
            Dedicated Learner
          </div>
        )}
      </div>

      {/* Additional Stats from Global Dashboard */}
      {stats && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-3">Global Statistics</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{stats.activeCourses}</div>
              <div className="text-xs text-gray-600">Active Courses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{stats.streakDays}</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(stats.averageCompletionRate)}%
              </div>
              <div className="text-xs text-gray-600">Avg Completion</div>
            </div>
          </div>
        </div>
      )}

      {/* Motivational Message */}
      {summary.completionPercentage > 0 && summary.completionPercentage < 100 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            {summary.completionPercentage >= 75 
              ? "🎉 You're almost there! Just a few more modules to go!"
              : summary.completionPercentage >= 50
              ? "💪 Great progress! You're halfway through the course."
              : summary.completionPercentage >= 25
              ? "🚀 Good start! Keep up the momentum."
              : "📚 Every expert was once a beginner. You've got this!"
            }
          </div>
        </div>
      )}
    </div>
  )
}
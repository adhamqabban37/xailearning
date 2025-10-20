'use client'

import React from 'react'
import { 
  CheckCircle2, Circle, Clock, Trophy, PlayCircle, BookOpen, 
  Target, Calendar, Award, AlertTriangle 
} from 'lucide-react'
import { ModuleCardProps } from '../types/progress'

export const ModuleCard: React.FC<ModuleCardProps> = ({
  moduleProgress,
  onToggleCompletion,
  onSelect,
  onStartQuiz,
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const { module, isCompleted, completionPercentage, timeSpent, quizScore, lastAccessed } = moduleProgress

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled && !isLoading) {
      onToggleCompletion(module.id, !isCompleted)
    }
  }

  const handleCardClick = () => {
    if (onSelect && !isLoading) {
      onSelect(module)
    }
  }

  const handleQuizClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onStartQuiz && !isLoading) {
      onStartQuiz(module)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
  }

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600'
    if (completionPercentage > 0) return 'text-blue-600'
    return 'text-gray-400'
  }

  const getBackgroundClass = () => {
    if (isCompleted) return 'bg-green-50 border-green-200'
    if (completionPercentage > 0) return 'bg-blue-50 border-blue-200'
    return 'bg-white border-gray-200'
  }

  return (
    <div
      onClick={handleCardClick}
      className={`
        border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md
        ${getBackgroundClass()}
        ${isLoading ? 'opacity-75 pointer-events-none' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          {/* Completion Toggle */}
          <button
            onClick={handleToggleClick}
            disabled={disabled || isLoading}
            className={`
              flex-shrink-0 mt-0.5 transition-colors
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}
              ${getStatusColor()}
            `}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </button>

          {/* Module Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Module {module.index}
              </span>
              {isCompleted && (
                <Award className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <h3 className="font-semibold text-gray-900 leading-tight">
              {module.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {completionPercentage > 0 && !isCompleted && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {completionPercentage}% complete
          </div>
        </div>
      )}

      {/* Objectives Preview */}
      {module.objectives && module.objectives.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Objectives:</div>
          <div className="text-xs text-gray-500 space-y-1">
            {module.objectives.slice(0, 2).map((objective, index) => (
              <div key={index} className="flex items-start space-x-1">
                <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{objective}</span>
              </div>
            ))}
            {module.objectives.length > 2 && (
              <div className="text-xs text-gray-400">
                +{module.objectives.length - 2} more objectives
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-3">
          {timeSpent > 0 && (
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(timeSpent)}</span>
            </span>
          )}
          
          {quizScore !== undefined && (
            <span className="flex items-center space-x-1">
              <Trophy className="h-3 w-3" />
              <span>{Math.round(quizScore)}%</span>
            </span>
          )}

          {lastAccessed && (
            <span className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(lastAccessed).toLocaleDateString()}</span>
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {/* Module Status Indicator */}
          {isCompleted ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Completed
            </span>
          ) : completionPercentage > 0 ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              In Progress
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Not Started
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {module.quiz && (
            <button
              onClick={handleQuizClick}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-700 transition-colors p-1 rounded"
              title="Start Quiz"
            >
              <Trophy className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={handleCardClick}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded"
            title="View Module"
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Hover Effect for Incomplete Modules */}
      {!isCompleted && !isLoading && (
        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            Continue →
          </div>
        </div>
      )}
    </div>
  )
}
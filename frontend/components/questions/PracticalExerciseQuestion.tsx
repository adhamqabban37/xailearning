'use client'

import React, { useState, useEffect } from 'react'
import { Code, CheckSquare, ExternalLink, Clock, Target, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { QuestionComponentProps } from '../../types/quiz'

export const PracticalExerciseQuestion: React.FC<QuestionComponentProps> = ({
  question,
  userAnswer,
  onAnswer,
  showFeedback = false,
  disabled = false,
  className = ''
}) => {
  const [workDescription, setWorkDescription] = useState<string>(
    (userAnswer?.answer as string) || ''
  )
  const [isSubmitted, setIsSubmitted] = useState(!!userAnswer)
  const [checkedCriteria, setCheckedCriteria] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (userAnswer) {
      setWorkDescription(userAnswer.answer as string)
      setIsSubmitted(true)
    }
  }, [userAnswer])

  const handleSubmit = () => {
    if (!workDescription.trim() || disabled) return
    
    onAnswer(workDescription.trim())
    setIsSubmitted(true)
  }

  const toggleCriteria = (criteria: string) => {
    const newChecked = new Set(checkedCriteria)
    if (newChecked.has(criteria)) {
      newChecked.delete(criteria)
    } else {
      newChecked.add(criteria)
    }
    setCheckedCriteria(newChecked)
  }

  const getCompletionRate = () => {
    if (!question.success_criteria) return 0
    return Math.round((checkedCriteria.size / question.success_criteria.length) * 100)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <Code className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-600 uppercase tracking-wide">
            Practical Exercise
          </span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {question.question}
        </h3>
        {question.task && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Task:</h4>
            <p className="text-purple-800">{question.task}</p>
          </div>
        )}
      </div>

      {/* Success Criteria Checklist */}
      {question.success_criteria && question.success_criteria.length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Success Criteria</span>
            </h4>
            <div className="text-sm text-gray-600">
              {checkedCriteria.size} of {question.success_criteria.length} completed
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionRate()}%` }}
            />
          </div>

          <div className="space-y-2">
            {question.success_criteria.map((criteria, index) => (
              <label
                key={index}
                className="flex items-start space-x-3 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checkedCriteria.has(criteria)}
                  onChange={() => toggleCriteria(criteria)}
                  disabled={disabled}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className={`text-sm ${
                  checkedCriteria.has(criteria) 
                    ? 'text-green-700 line-through' 
                    : 'text-gray-700'
                }`}>
                  {criteria}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Work Documentation */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Document Your Work:
        </label>
        <p className="text-sm text-gray-600">
          Describe what you did, share links to your work, or explain your approach.
        </p>
        
        <textarea
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          disabled={disabled || isSubmitted}
          placeholder="Describe your implementation, share repository links, explain challenges you faced, or upload screenshots..."
          rows={8}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm resize-vertical
            focus:border-blue-500 focus:ring-blue-500
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${showFeedback && userAnswer 
              ? userAnswer.isCorrect 
                ? 'border-green-500 bg-green-50'
                : 'border-amber-500 bg-amber-50'
              : ''
            }
          `}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {workDescription.length} characters
            {workDescription.length < 50 && (
              <span className="text-amber-600 ml-2">
                Please provide more detail about your work
              </span>
            )}
          </div>
          
          {!isSubmitted && (
            <div className="flex space-x-2">
              <button
                type="button"
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Add file upload functionality"
              >
                <Upload className="h-4 w-4 inline mr-1" />
                Attach Files
              </button>
              <button
                onClick={handleSubmit}
                disabled={!workDescription.trim() || disabled}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Submit Work
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Tips */}
      {!isSubmitted && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Tips for Success:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include links to your code repository or live demo</li>
            <li>• Explain your thought process and decision-making</li>
            <li>• Share any challenges you encountered and how you solved them</li>
            <li>• Use screenshots or code snippets to illustrate key points</li>
          </ul>
        </div>
      )}

      {/* Feedback Section */}
      {showFeedback && userAnswer && (
        <div className="space-y-4">
          {/* Submission Status */}
          <div className={`
            p-4 rounded-lg border flex items-start space-x-3
            ${userAnswer.isCorrect 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
            }
          `}>
            {userAnswer.isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={`font-medium mb-2 ${
                userAnswer.isCorrect ? 'text-green-900' : 'text-amber-900'
              }`}>
                {userAnswer.isCorrect 
                  ? 'Excellent work! Your submission shows practical understanding.' 
                  : 'Work submitted for review. Continue practicing these concepts.'
                }
              </h4>
              
              <p className={`text-sm ${
                userAnswer.isCorrect ? 'text-green-700' : 'text-amber-700'
              }`}>
                Score: {userAnswer.score}/100 points
              </p>
            </div>
          </div>

          {/* Instructor Review Note */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">For Further Learning:</h4>
            <p className="text-sm text-gray-700">
              Practical exercises are reviewed individually. Continue working on similar projects 
              to strengthen your understanding. Consider joining study groups or online communities 
              to share your work and get feedback from peers.
            </p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {userAnswer && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <span>
            Work submitted • Score: {userAnswer.score}/100
          </span>
          <span>
            Submitted at {new Date(userAnswer.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  )
}
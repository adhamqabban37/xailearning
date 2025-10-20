'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { QuestionComponentProps } from '../../types/quiz'

export const MultipleChoiceQuestion: React.FC<QuestionComponentProps> = ({
  question,
  userAnswer,
  onAnswer,
  showFeedback = false,
  disabled = false,
  className = ''
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    (userAnswer?.answer as string) || ''
  )

  const handleOptionSelect = (option: string) => {
    if (disabled) return
    
    setSelectedOption(option)
    onAnswer(option)
  }

  const getOptionStyle = (option: string) => {
    const isSelected = selectedOption === option
    const isAnswered = !!userAnswer
    const isCorrect = question.answer === option
    
    if (!showFeedback || !isAnswered) {
      return isSelected
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300'
    }
    
    // Show feedback
    if (isSelected) {
      return userAnswer?.isCorrect
        ? 'border-green-500 bg-green-50'
        : 'border-red-500 bg-red-50'
    }
    
    // Highlight correct answer
    if (isCorrect) {
      return 'border-green-500 bg-green-50'
    }
    
    return 'border-gray-200'
  }

  const getOptionIcon = (option: string) => {
    const isSelected = selectedOption === option
    const isAnswered = !!userAnswer
    const isCorrect = question.answer === option
    
    if (!showFeedback || !isAnswered) {
      return null
    }
    
    if (isSelected) {
      return userAnswer?.isCorrect
        ? <CheckCircle className="h-5 w-5 text-green-500" />
        : <XCircle className="h-5 w-5 text-red-500" />
    }
    
    if (isCorrect) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {question.question}
        </h3>
        <p className="text-sm text-gray-600">
          Choose the best answer from the options below.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
          
          return (
            <button
              key={index}
              onClick={() => handleOptionSelect(option)}
              disabled={disabled}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                disabled:cursor-not-allowed disabled:opacity-60
                ${getOptionStyle(option)}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {optionLabel}
                  </span>
                  <span className="text-gray-900 leading-relaxed">
                    {option}
                  </span>
                </div>
                {getOptionIcon(option)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Feedback Section */}
      {showFeedback && userAnswer && (
        <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {userAnswer.isCorrect ? 'Correct!' : 'Incorrect'}
              </h4>
              {question.explanation && (
                <p className="text-gray-700 leading-relaxed">
                  {question.explanation}
                </p>
              )}
              {!userAnswer.isCorrect && question.answer && (
                <p className="text-gray-600 mt-2">
                  <span className="font-medium">Correct answer:</span> {question.answer}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {userAnswer && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <span>
            {userAnswer.isCorrect ? 'Correct' : 'Incorrect'} • 
            Score: {userAnswer.score}/100
          </span>
          <span>
            Answered at {new Date(userAnswer.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  )
}
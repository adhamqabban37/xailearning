'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle, XCircle, Info, Lightbulb } from 'lucide-react'
import { QuestionComponentProps } from '../../types/quiz'

export const ShortAnswerQuestion: React.FC<QuestionComponentProps> = ({
  question,
  userAnswer,
  onAnswer,
  showFeedback = false,
  disabled = false,
  className = ''
}) => {
  const [answer, setAnswer] = useState<string>(
    (userAnswer?.answer as string) || ''
  )
  const [isSubmitted, setIsSubmitted] = useState(!!userAnswer)

  useEffect(() => {
    if (userAnswer) {
      setAnswer(userAnswer.answer as string)
      setIsSubmitted(true)
    }
  }, [userAnswer])

  const handleSubmit = () => {
    if (!answer.trim() || disabled) return
    
    onAnswer(answer.trim())
    setIsSubmitted(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit()
    }
  }

  const getInputStyle = () => {
    if (!showFeedback || !userAnswer) {
      return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
    
    return userAnswer.isCorrect
      ? 'border-green-500 bg-green-50'
      : 'border-red-500 bg-red-50'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {question.question}
        </h3>
        <p className="text-sm text-gray-600">
          Provide a clear and concise answer in your own words.
        </p>
      </div>

      {/* Key Points Hint */}
      {question.key_points && question.key_points.length > 0 && !isSubmitted && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                Consider these key points in your answer:
              </h4>
              <ul className="space-y-1">
                {question.key_points.map((point, index) => (
                  <li key={index} className="text-blue-800 text-sm">
                    • {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Answer Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Your Answer:
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={disabled || isSubmitted}
          placeholder="Type your answer here... (Press Ctrl+Enter to submit)"
          rows={6}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm resize-vertical
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${getInputStyle()}
          `}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {answer.length} characters
            {answer.length < 10 && (
              <span className="text-amber-600 ml-2">
                Consider providing more detail
              </span>
            )}
          </div>
          
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || disabled}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Submit Answer
            </button>
          )}
        </div>
      </div>

      {/* Feedback Section */}
      {showFeedback && userAnswer && (
        <div className="space-y-4">
          {/* Answer Status */}
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
              <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={`font-medium mb-2 ${
                userAnswer.isCorrect ? 'text-green-900' : 'text-amber-900'
              }`}>
                {userAnswer.isCorrect 
                  ? 'Well done! Your answer demonstrates good understanding.' 
                  : 'Your answer has been recorded. Consider the key points below.'
                }
              </h4>
              
              {/* Score Display */}
              <p className={`text-sm ${
                userAnswer.isCorrect ? 'text-green-700' : 'text-amber-700'
              }`}>
                Score: {userAnswer.score}/100 points
              </p>
            </div>
          </div>

          {/* Key Points Review */}
          {question.key_points && question.key_points.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Key Points to Remember:
                  </h4>
                  <ul className="space-y-2">
                    {question.key_points.map((point, index) => (
                      <li key={index} className="text-gray-700 text-sm flex items-start space-x-2">
                        <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {userAnswer && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <span>
            Answer submitted • Score: {userAnswer.score}/100
          </span>
          <span>
            Submitted at {new Date(userAnswer.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  )
}
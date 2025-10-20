"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  QuizBlock,
  QuizProgress,
  UserAnswer,
  QuizComponentProps,
} from "@/types/quiz";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import { QuizValidation } from "@/utils/quizValidation";
import { ErrorMessage, SuccessMessage } from "@/components/ErrorMessage";

export const Quiz: React.FC<QuizComponentProps> = ({
  quiz,
  onComplete,
  onProgress,
  allowReview = true,
  showExplanations = true,
  timeLimit,
  className = "",
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(new Date().toISOString());
  const [timeSpent, setTimeSpent] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validator = new QuizValidation();
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  // Timer effect
  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted]);

  // Auto-complete when time limit reached
  useEffect(() => {
    if (timeLimit && timeSpent >= timeLimit * 60 && !isCompleted) {
      handleComplete();
    }
  }, [timeSpent, timeLimit, isCompleted]);

  // Calculate current progress
  const calculateProgress = useCallback((): QuizProgress => {
    const answeredQuestions = Object.keys(answers).length;
    const score = validator.calculateScore(answers, quiz.questions);
    const maxScore = quiz.questions.length * 100;

    return {
      quizId: `quiz_${Date.now()}`,
      answers,
      totalQuestions,
      answeredQuestions,
      score,
      maxScore,
      percentageScore: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      isCompleted,
      timeSpent,
      startedAt: startTime,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    };
  }, [
    answers,
    isCompleted,
    timeSpent,
    startTime,
    totalQuestions,
    validator,
    quiz.questions,
  ]);

  // Handle answer submission
  const handleAnswer = (answer: string | string[]) => {
    try {
      setError(null);
      const validation = validator.validateAnswer(currentQuestion, answer);

      const userAnswer: UserAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: validation.isCorrect,
        score: validation.score,
        timestamp: new Date().toISOString(),
      };

      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: userAnswer,
      }));

      // Call progress callback
      const updatedProgress = calculateProgress();
      onProgress?.(updatedProgress);

      // Auto-advance for multiple choice (optional)
      if (
        currentQuestion.type === "multiple_choice" &&
        currentQuestionIndex < totalQuestions - 1
      ) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
        }, 1000);
      }
    } catch (err) {
      setError("Failed to submit answer. Please try again.");
      console.error("Answer submission error:", err);
    }
  };

  // Navigate between questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const goToPrevious = () => goToQuestion(currentQuestionIndex - 1);
  const goToNext = () => goToQuestion(currentQuestionIndex + 1);

  // Complete quiz
  const handleComplete = () => {
    setIsCompleted(true);
    setShowResults(true);
    const finalProgress = calculateProgress();
    onComplete(finalProgress);
  };

  // Reset quiz
  const handleReset = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
    setShowResults(false);
    setTimeSpent(0);
    setError(null);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get completion status for question navigation
  const getQuestionStatus = (index: number) => {
    const question = quiz.questions[index];
    const answer = answers[question.id];
    if (!answer) return "unanswered";
    return answer.isCorrect ? "correct" : "incorrect";
  };

  // Calculate overall results
  const progress = calculateProgress();

  if (showResults) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Quiz Completed!
          </h2>
          <div className="text-lg text-gray-600">
            Your Score:{" "}
            <span className="font-bold text-blue-600">
              {progress.percentageScore}%
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {progress.answeredQuestions} of {progress.totalQuestions} questions
            answered
          </div>
          <div className="text-sm text-gray-500">
            Time taken: {formatTime(progress.timeSpent)}
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-700">
              {Object.values(answers).filter((a) => a.isCorrect).length}
            </div>
            <div className="text-sm text-green-600">Correct</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-red-700">
              {Object.values(answers).filter((a) => !a.isCorrect).length}
            </div>
            <div className="text-sm text-red-600">Incorrect</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-700">
              {totalQuestions - progress.answeredQuestions}
            </div>
            <div className="text-sm text-gray-600">Unanswered</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {allowReview && (
            <button
              onClick={() => setShowResults(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Review Answers
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Quiz Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeSpent)}</span>
              {timeLimit && (
                <span className="text-gray-400">/ {timeLimit}m</span>
              )}
            </div>
            <div>Score: {progress.percentageScore}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(progress.answeredQuestions / totalQuestions) * 100}%`,
            }}
          />
        </div>

        {/* Question Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {quiz.questions.map((_, index) => {
            const status = getQuestionStatus(index);
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full text-sm font-medium transition-colors
                  ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : status === "correct"
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : status === "incorrect"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4">
          <ErrorMessage
            error={{ detail: error, status: 400 }}
            variant="error"
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Question Content */}
      <div className="p-6">
        <QuestionRenderer
          question={currentQuestion}
          userAnswer={answers[currentQuestion.id]}
          onAnswer={handleAnswer}
          showFeedback={showExplanations && !!answers[currentQuestion.id]}
        />
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <button
            onClick={goToPrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-3">
            {currentQuestionIndex === totalQuestions - 1 ? (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Complete Quiz
              </button>
            ) : (
              <button
                onClick={goToNext}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Example Quiz Component - Working skeleton for demonstration
 * This shows both named and default export patterns
 */

"use client";
import React, { useState } from "react";
import { QuizBlock } from "@/types/quiz"; // Using absolute import

interface QuizProps {
  quiz?: QuizBlock;
  onComplete?: (score: number) => void;
  className?: string;
}

// ✅ Named Export (what you're currently using)
export const Quiz: React.FC<QuizProps> = ({
  quiz,
  onComplete,
  className = "",
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!quiz) {
    return (
      <div className={`p-6 bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-600">No quiz data available</p>
      </div>
    );
  }

  const handleAnswer = (selectedOption: string) => {
    const correct = selectedOption === question?.answer;
    if (correct) setScore(score + 1);

    if (currentQuestion < (quiz.questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
      onComplete?.(score);
    }
  };

  if (showResults) {
    return (
      <div className={`p-6 bg-green-50 rounded-lg ${className}`}>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          Quiz Complete!
        </h3>
        <p className="text-green-700">
          Score: {score} / {quiz.questions?.length || 0}
        </p>
      </div>
    );
  }

  const question = quiz.questions?.[currentQuestion];

  return (
    <div className={`p-6 bg-white border rounded-lg shadow-sm ${className}`}>
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {quiz.questions?.length || 0}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-4">
        {question?.question || "Loading question..."}
      </h3>

      <div className="space-y-2">
        {question?.options?.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {option}
          </button>
        )) || <p className="text-gray-500">No options available</p>}
      </div>
    </div>
  );
};

// ✅ Alternative: Default Export Pattern
const QuizComponent: React.FC<QuizProps> = Quiz;

export default QuizComponent;

// ✅ You can also export both ways:
// export { Quiz as default } // Makes Quiz the default export too

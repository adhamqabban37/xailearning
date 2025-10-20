"use client";

import React from "react";
import { QuizQuestion, UserAnswer, QuestionComponentProps } from "@/types/quiz";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { ShortAnswerQuestion } from "./questions/ShortAnswerQuestion";
import { PracticalExerciseQuestion } from "./questions/PracticalExerciseQuestion";

interface QuestionRendererProps {
  question: QuizQuestion;
  userAnswer?: UserAnswer;
  onAnswer: (answer: string | string[]) => void;
  showFeedback?: boolean;
  disabled?: boolean;
  className?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  userAnswer,
  onAnswer,
  showFeedback = false,
  disabled = false,
  className = "",
}) => {
  const commonProps = {
    question,
    userAnswer,
    onAnswer,
    showFeedback,
    disabled,
    className,
  };

  switch (question.type) {
    case "multiple_choice":
      return <MultipleChoiceQuestion {...commonProps} />;

    case "short_answer":
      return <ShortAnswerQuestion {...commonProps} />;

    case "practical":
      return <PracticalExerciseQuestion {...commonProps} />;

    default:
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">
            Unsupported question type: {(question as any).type}
          </p>
        </div>
      );
  }
};

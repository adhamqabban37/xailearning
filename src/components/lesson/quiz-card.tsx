"use client";

import { useState, useEffect } from "react";
import type { QuizQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, ArrowDown } from "lucide-react";
import { QuestionMarkIcon } from "../ui/icons";

interface QuizCardProps {
  questions: QuizQuestion[];
  onQuizComplete?: () => void;
}

type AnswerState = "unanswered" | "correct" | "incorrect";

export function QuizCard({ questions, onQuizComplete }: QuizCardProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Trigger callback when quiz completes - run only once
  useEffect(() => {
    if (isCompleted && !hasScrolled) {
      // Notify parent component if callback provided
      onQuizComplete?.();
      setHasScrolled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  if (isCompleted) {
    return (
      <Card className="bg-secondary/60 border-secondary shadow-sm">
        <CardHeader>
          <div className="mx-auto text-secondary-foreground/80">
            <CheckCircle className="w-12 h-12" />
          </div>
          <CardTitle>Quiz Complete!</CardTitle>
          <CardDescription>
            You answered {correctAnswers} out of {questions.length} questions
            correctly.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Find the current quiz's lesson container
              const currentLesson = document.querySelector('.quiz-card')?.closest('[data-lesson-id]');
              
              if (currentLesson) {
                // Get all lessons in the container
                const allLessons = Array.from(document.querySelectorAll('[data-lesson-id]'));
                const currentIndex = allLessons.indexOf(currentLesson as Element);
                
                // Find the next lesson
                const nextLesson = allLessons[currentIndex + 1];
                
                if (nextLesson) {
                  // Scroll to next lesson
                  nextLesson.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                  
                  // Focus on the checkbox for accessibility
                  setTimeout(() => {
                    const checkbox = nextLesson.querySelector('input[type="checkbox"]') as HTMLElement;
                    checkbox?.focus();
                  }, 500);
                } else {
                  // If no next lesson, scroll to completion card
                  setTimeout(() => {
                    const completionCard = document.querySelector('[class*="completion-card"]') as HTMLElement;
                    if (completionCard) {
                      completionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Show a toast notification
                      const event = new CustomEvent('show-toast', {
                        detail: {
                          title: '🎉 You\'ve reached the end!',
                          description: 'Great work completing all lessons in this session.'
                        }
                      });
                      window.dispatchEvent(event);
                    }
                  }, 300);
                }
              }
            }}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Continue to Next Lesson
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;

    if (
      selectedAnswer.trim().toLowerCase() ===
      currentQuestion.answer.trim().toLowerCase()
    ) {
      setAnswerState("correct");
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setAnswerState("incorrect");
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setAnswerState("unanswered");
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="text-primary">
          <QuestionMarkIcon className="w-8 h-8" />
        </div>
        <div>
          <CardTitle className="text-lg">Check your understanding</CardTitle>
          <CardDescription>
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-semibold">{currentQuestion.question}</p>

        {/* Multiple Choice Options */}
        {currentQuestion.options && currentQuestion.options.length > 0 ? (
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedAnswer === option
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                } ${
                  answerState !== "unanswered"
                    ? "cursor-not-allowed opacity-70"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={answerState !== "unanswered"}
                  className="accent-primary"
                />
                <span className="flex-1">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          // Fallback for old format questions without options
          <input
            type="text"
            value={selectedAnswer || ""}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            placeholder="Type your answer here"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={answerState !== "unanswered"}
          />
        )}

        {answerState === "correct" && (
          <Alert
            variant="default"
            className="bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-800"
          >
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Correct!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              The correct answer is: <strong>{currentQuestion.answer}</strong>
            </AlertDescription>
          </Alert>
        )}
        {answerState === "incorrect" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Not quite...</AlertTitle>
            <AlertDescription>
              The correct answer is: <strong>{currentQuestion.answer}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {answerState === "unanswered" ? (
          <Button onClick={handleCheckAnswer} disabled={!selectedAnswer}>
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentQuestionIndex < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

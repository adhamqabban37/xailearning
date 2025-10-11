"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";
import { QuestionMarkIcon } from "../ui/icons";

interface QuizCardProps {
  questions: QuizQuestion[];
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export function QuizCard({ questions }: QuizCardProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (isCompleted) {
    return (
        <Card className="bg-secondary/60 border-secondary shadow-sm text-center">
            <CardHeader>
                <div className="mx-auto text-secondary-foreground/80"><CheckCircle className="w-12 h-12" /></div>
                <CardTitle>Quiz Complete!</CardTitle>
                <CardDescription>You answered {correctAnswers} out of {questions.length} questions correctly.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;

    if (selectedAnswer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase()) {
      setAnswerState('correct');
      setCorrectAnswers(prev => prev + 1);
    } else {
      setAnswerState('incorrect');
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setAnswerState('unanswered');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
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
            
            <input
            type="text"
            value={selectedAnswer || ''}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            placeholder="Type your answer here"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={answerState !== 'unanswered'}
            />

            {answerState === 'correct' && (
            <Alert variant="default" className="bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-300">Correct!</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                The correct answer is: <strong>{currentQuestion.answer}</strong>
                </AlertDescription>
            </Alert>
            )}
            {answerState === 'incorrect' && (
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
            {answerState === 'unanswered' ? (
            <Button onClick={handleCheckAnswer} disabled={!selectedAnswer}>Check Answer</Button>
            ) : (
            <Button onClick={handleNext}>
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
            )}
      </CardFooter>
    </Card>
  );
}

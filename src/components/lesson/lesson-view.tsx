"use client";

import { useState, useMemo } from 'react';
import type { Step, StudySession } from '@/lib/types';
import { useCourseStorage } from '@/hooks/use-course-storage';
import { useRouter } from 'next/navigation';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle } from 'lucide-react';
import { LessonProgressBar } from './progress-bar';
import { ResourcesPanel } from './resources-panel';
import { QuizView } from './quiz-view';

interface LessonViewProps {
  session: StudySession;
}

export function LessonView({ session }: LessonViewProps) {
  const { storedCourse, updateStepProgress, startNewSession } = useCourseStorage();
  const router = useRouter();

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    session.steps.forEach(step => {
      if (storedCourse?.progress[step.id] === 'completed') {
        initial[step.id] = true;
      }
    });
    return initial;
  });

  const allStepsInSessionCompleted = session.steps.every(step => completedSteps[step.id]);
  
  const quizQuestions = useMemo(() => {
    return session.steps
      .flatMap(step => step.quizQuestions || [])
      .filter(q => q.question && q.answer);
  }, [session.steps]);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleStepCompletion = (step: Step, isCompleted: boolean) => {
    setCompletedSteps(prev => ({ ...prev, [step.id]: isCompleted }));
    if (isCompleted) {
      updateStepProgress(step.id, 'completed');
    }
    // Note: un-completing is not persisted in this logic, only visual for the session
  };

  const handleContinue = () => {
    if (allStepsInSessionCompleted && quizQuestions.length > 0 && !showQuiz) {
      setShowQuiz(true);
    } else {
      const nextSession = startNewSession(30); // Default to 30 mins for next session
      if (nextSession) {
        window.location.reload(); // Easiest way to re-render with new session
      } else {
        router.push('/'); // Or a completion page
      }
    }
  };

  if (quizCompleted) {
     return (
        <Card className="w-full text-center p-8">
            <CardHeader>
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <CardTitle className="text-3xl mt-4">Session Complete!</CardTitle>
                <CardDescription>Great job! You've completed this study session.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleContinue} size="lg">
                    {storedCourse && storedCourse.course.sessions.length > session.sessionIndex + 1 ? "Start Next Session" : "Back to Home"}
                </Button>
            </CardContent>
        </Card>
     );
  }

  if (showQuiz) {
    return <QuizView questions={quizQuestions} onQuizComplete={() => setQuizCompleted(true)} />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-headline">{session.title}</CardTitle>
        <CardDescription>Session {session.sessionIndex + 1} of {storedCourse?.course.sessions.length}</CardDescription>
        <LessonProgressBar 
            completedSteps={session.completedStepsInCourse + Object.values(completedSteps).filter(Boolean).length} 
            totalSteps={session.totalStepsInCourse}
        />
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={session.steps.length > 0 ? [session.steps[0].id] : []}>
          {session.steps.map(step => (
            <AccordionItem value={step.id} key={step.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 w-full mr-4">
                  <Checkbox
                    id={`cb-${step.id}`}
                    checked={!!completedSteps[step.id]}
                    onCheckedChange={(checked) => handleStepCompletion(step, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Mark step ${step.title} as complete`}
                  />
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${completedSteps[step.id] ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {step.timeEstimateMinutes ? `${step.timeEstimateMinutes} min` : '5 min (est.)'}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-12 space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {step.content}
                </div>
                {step.resources && <ResourcesPanel resources={step.resources} />}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      {allStepsInSessionCompleted && (
        <CardContent className="text-center border-t pt-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-lg font-semibold">All steps completed!</h3>
            <p className="text-muted-foreground mb-4">Ready to test your knowledge?</p>
            <Button onClick={handleContinue} size="lg">
                {quizQuestions.length > 0 ? "Start Quiz" : "Finish Session"}
            </Button>
        </CardContent>
      )}
    </Card>
  );
}

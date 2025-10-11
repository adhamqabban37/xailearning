"use client";

import { useState } from 'react';
import type { StudySession } from '@/lib/types';
import { useCourseStorage } from '@/hooks/use-course-storage';
import { useRouter } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '../ui/scroll-area';
import { ConceptCard } from './concept-card';
import { QuizCard } from './quiz-card';
import { AskTheDocumentCard } from './ask-the-document-card';
import { LessonProgressBar } from './progress-bar';
import { Checkbox } from '../ui/checkbox';
import { CompletionCard } from './completion-card';
import { ResourcesPanel } from './resources-panel';

interface LessonViewProps {
  initialSession: StudySession;
}

export function LessonView({ initialSession }: LessonViewProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const { updateStepProgress, startNewSession, clearCourse, storedCourse } = useCourseStorage();

  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    if (!storedCourse?.progress) return {};
    return session.steps.reduce((acc, step) => {
      if (storedCourse.progress[step.id]) {
        acc[step.id] = true;
      }
      return acc;
    }, {} as Record<string, boolean>);
  });

  const isStepCompleted = (stepId: string) => !!completedSteps[stepId];

  const handleStepComplete = (stepId: string, isChecked: boolean) => {
    setCompletedSteps(prev => ({ ...prev, [stepId]: isChecked }));
    if (isChecked) {
      updateStepProgress(stepId, 'completed');
    } else {
      // In a real app, you might want to handle un-completing a step
      // For now, we only track completion
    }
  };

  const completedCount = Object.keys(completedSteps).length;
  const totalStepsInSession = session.steps.length;
  const isSessionComplete = completedCount === totalStepsInSession;

  const handleNextSession = () => {
    const newSession = startNewSession(session.durationMinutes);
    if (newSession) {
      setSession(newSession);
      setCompletedSteps({});
    } else {
      // Course is finished, or no more sessions
      handleFinish();
    }
  };

  const handleFinish = () => {
    // We don't clear the course so the user can review it from the homepage
    router.push('/');
  };

  const isCourseComplete = (session.completedStepsInCourse + completedCount) >= session.totalStepsInCourse;

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full h-[calc(100vh-4rem)] rounded-none border-none bg-background"
    >
      <ResizablePanel defaultSize={40} minSize={20}>
        <div className="flex h-full items-center justify-center p-2">
          <iframe src="/placeholder-pdf.pdf" className="w-full h-full border rounded-lg" title="Source Document"/>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60} minSize={30}>
        <ScrollArea className="h-full px-4">
            <div className="container mx-auto py-8 space-y-6 max-w-3xl">
                <div className='sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 -my-4'>
                    <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
                    <LessonProgressBar completedSteps={completedCount} totalSteps={totalStepsInSession} />
                </div>
                
                <AskTheDocumentCard />

                {session.steps.map(step => (
                    <div key={step.id} className="flex items-start gap-4">
                         <Checkbox
                            id={`cb-${step.id}`}
                            className='mt-8'
                            onCheckedChange={(checked) => handleStepComplete(step.id, !!checked)}
                            checked={isStepCompleted(step.id)}
                            aria-label={`Mark step ${step.title} as complete`}
                        />
                        <div className={`flex-1 transition-opacity space-y-4 ${isStepCompleted(step.id) ? 'opacity-50' : 'opacity-100'}`}>
                           <ConceptCard step={step} />
                           {step.resources && step.resources.length > 0 && <ResourcesPanel resources={step.resources} />}
                           {step.quizQuestions && step.quizQuestions.length > 0 && <QuizCard questions={step.quizQuestions} />}
                        </div>
                    </div>
                ))}
                
                {isSessionComplete && (
                  <CompletionCard 
                    onNextSession={handleNextSession} 
                    onFinish={handleFinish}
                    isCourseComplete={isCourseComplete}
                  />
                )}
            </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

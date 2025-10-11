"use client";

import { useState } from 'react';
import type { Step, StudySession } from '@/lib/types';
import { useCourseStorage } from '@/hooks/use-course-storage';
import { useRouter } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '../ui/scroll-area';
import { ConceptCard } from './concept-card';
import { KeyTermCard } from './key-term-card';
import { QuizCard } from './quiz-card';
import { AskTheDocumentCard } from './ask-the-document-card';
import { LessonProgressBar } from './progress-bar';
import { Checkbox } from '../ui/checkbox';
import { CompletionCard } from './completion-card';

interface LessonViewProps {
  initialSession: StudySession;
}

export function LessonView({ initialSession }: LessonViewProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const { updateStepProgress, startNewSession, clearCourse } = useCourseStorage();
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const isStepCompleted = (stepId: string) => !!completedSteps[stepId];

  const handleStepComplete = (stepId: string, isChecked: boolean) => {
    if (isChecked) {
      setCompletedSteps(prev => ({ ...prev, [stepId]: true }));
      updateStepProgress(stepId, 'completed');
    } else {
      // In a real app, you might want to handle un-completing a step
      const { [stepId]: _, ...rest } = completedSteps;
      setCompletedSteps(rest);
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
      router.push('/'); // Or a course completion page
    }
  };

  const handleFinish = () => {
    clearCourse();
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
                            className='mt-2'
                            onCheckedChange={(checked) => handleStepComplete(step.id, !!checked)}
                            checked={isStepCompleted(step.id)}
                            aria-label={`Mark step ${step.title} as complete`}
                        />
                        <div className={`flex-1 transition-opacity ${isStepCompleted(step.id) ? 'opacity-50' : 'opacity-100'}`}>
                           <ConceptCard step={step} />
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

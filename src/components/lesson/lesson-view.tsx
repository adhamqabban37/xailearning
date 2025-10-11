"use client";

import type { StudySession } from '@/lib/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from '../ui/scroll-area';
import { ConceptCard } from './concept-card';
import { KeyTermCard } from './key-term-card';
import { QuizCard } from './quiz-card';
import { AskTheDocumentCard } from './ask-the-document-card';

interface LessonViewProps {
  session: StudySession;
}

export function LessonView({ session }: LessonViewProps) {

  // For demonstration, we'll create some mock cards.
  // In a real implementation, this would be driven by the AI-processed course data.
  const allSteps = session.steps;
  const quizQuestions = session.steps.flatMap(s => s.quizQuestions || []).filter(q => q.question && q.answer);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full h-[calc(100vh-3.5rem)] rounded-none border-none"
    >
      <ResizablePanel defaultSize={40}>
        <div className="flex h-full items-center justify-center p-1">
          <iframe src="/placeholder-pdf.pdf" className="w-full h-full border rounded-lg" title="Source Document"/>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60}>
        <ScrollArea className="h-full px-4">
            <div className="container mx-auto py-8 space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
                
                <AskTheDocumentCard />

                {allSteps.map(step => (
                    <ConceptCard key={step.id} step={step} />
                ))}

                <KeyTermCard term="Gamification" definition="The application of game-design elements and game principles in non-game contexts." />
                <KeyTermCard term="Hydration Error" definition="A mismatch between the server-rendered HTML and the initial client-side render in React applications." />

                {quizQuestions.length > 0 && <QuizCard questions={quizQuestions} />}

            </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

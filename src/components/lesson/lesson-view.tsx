"use client";

import { useState, useEffect, useRef } from "react";
import type { StudySession, Lesson } from "@/lib/types";
import { useCourseStorage } from "@/hooks/use-course-storage";
import { useUserProgress } from "@/hooks/use-user-progress";
import { useRouter } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "../ui/scroll-area";
import { ConceptCard } from "./concept-card";
import { QuizCard } from "./quiz-card";
import { AskTheDocumentCard } from "./ask-the-document-card";
import { LessonProgressBar } from "./progress-bar";
import { Checkbox } from "../ui/checkbox";
import { CompletionCard } from "./completion-card";
import { ResourcesPanel } from "./resources-panel";
import { CertificateAwardModal } from "../certificates/CertificateAwardModal";
import { NotesDrawingPanel } from "./notes-drawing-panel";

interface LessonViewProps {
  initialSession: StudySession;
}

export function LessonView({ initialSession }: LessonViewProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const { updateStepProgress, startNewSession, storedCourse } =
    useCourseStorage();
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    () => {
      if (!storedCourse?.progress) return {};
      return session.lessons.reduce((acc, lesson) => {
        if (storedCourse.progress[lesson.id]) {
          acc[lesson.id] = true;
        }
        return acc;
      }, {} as Record<string, boolean>);
    }
  );

  // Generate course ID from session data
  // Avoid using Date.now() during SSR which can cause hydration mismatches.
  // Fallback to a deterministic slug; if none, create a stable client-only ID after mount.
  const baseSlug = storedCourse?.course.course_title
    ? storedCourse.course.course_title.replace(/[^a-zA-Z0-9]/g, "-")
    : null;
  const generatedIdRef = useRef<string | null>(null);
  if (!baseSlug && typeof window !== "undefined" && !generatedIdRef.current) {
    generatedIdRef.current = `course-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
  const courseId = baseSlug || generatedIdRef.current || "course-temp";
  const courseTitle = storedCourse?.course.course_title || session.title;
  const totalLessons = session.totalStepsInCourse;

  // Enable Supabase-backed progress tracking
  const {
    markLessonComplete,
    isLessonCompleted,
    getCourseCompletionStatus,
    setCourseCompleteCallback,
  } = useUserProgress(courseId, courseTitle, totalLessons);

  // Compute counts and completion state from Supabase
  const { completedLessons, isCompleted: courseIsComplete } =
    getCourseCompletionStatus();
  const totalStepsInSession = session.lessons.length;
  const completedCount = completedLessons;
  const isSessionComplete = completedCount === totalStepsInSession;

  // Set up certificate awarding callback
  const [shouldAwardCertificate, setShouldAwardCertificate] = useState(false);
  useEffect(() => {
    setCourseCompleteCallback((data) => {
      if (data.isCompleted) {
        setShowCertificateModal(true);
        setShouldAwardCertificate(true);
      }
    });
  }, [setCourseCompleteCallback]);

  // state moved above

  // Use Supabase-backed progress
  const isStepCompleted = (stepId: string) => isLessonCompleted(stepId);

  const handleStepComplete = async (stepId: string, isChecked: boolean) => {
    if (isChecked) {
      // Update local course storage
      updateStepProgress(stepId, "completed");
      // Persist to Supabase
      await markLessonComplete(stepId, 100, 30); // Default score and time
    }
  };

  // derived values moved above

  // Firebase course completion disabled temporarily
  // const { completedLessons, isCompleted: courseIsComplete } =
  //   getCourseCompletionStatus();

  const handleNextSession = () => {
    const newSession = startNewSession(session.durationMinutes);
    if (newSession) {
      setSession(newSession);
      setCompletedSteps({});
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  // derived values moved above

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full h-[calc(100vh-4rem)] rounded-none border-none bg-background"
    >
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <div className="flex h-full p-4">
          <NotesDrawingPanel courseId={courseId} />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65} minSize={40}>
        <ScrollArea className="h-full px-4">
          <div className="container mx-auto py-8 space-y-6 max-w-3xl">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 -my-4">
              <h1 className="text-3xl font-bold tracking-tight">
                {session.title}
              </h1>
              <LessonProgressBar
                completedSteps={completedCount}
                totalSteps={totalStepsInSession}
              />
            </div>

            <AskTheDocumentCard />

            {session.lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-start gap-4">
                <Checkbox
                  id={`cb-${lesson.id}`}
                  className="mt-8"
                  onCheckedChange={(checked) =>
                    handleStepComplete(lesson.id, !!checked)
                  }
                  checked={isStepCompleted(lesson.id)}
                  aria-label={`Mark lesson ${lesson.lesson_title} as complete`}
                />
                <div
                  className={`flex-1 transition-opacity space-y-4 ${
                    isStepCompleted(lesson.id) ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <ConceptCard lesson={lesson} />
                  {lesson.resources && lesson.resources.length > 0 && (
                    <ResourcesPanel resources={lesson.resources} />
                  )}
                  {lesson.quiz && lesson.quiz.length > 0 && (
                    <QuizCard questions={lesson.quiz} />
                  )}
                </div>
              </div>
            ))}

            {isSessionComplete && (
              <CompletionCard
                onNextSession={handleNextSession}
                onFinish={handleFinish}
                isCourseComplete={courseIsComplete}
              />
            )}
          </div>
        </ScrollArea>
      </ResizablePanel>

      {/* Certificate Award Modal */}
      <CertificateAwardModal
        courseTitle={courseTitle}
        courseId={courseId}
        visible={showCertificateModal}
        onClose={() => {
          setShowCertificateModal(false);
          setShouldAwardCertificate(false);
        }}
        shouldAward={shouldAwardCertificate}
      />
    </ResizablePanelGroup>
  );
}

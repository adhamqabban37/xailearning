"use client";

import { useCourseStorage } from "@/hooks/use-course-storage";
import { LessonView } from "@/components/lesson/lesson-view";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LessonPage() {
  const { studySession, isLoading } = useCourseStorage();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!studySession) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <Card className="text-center">
            <CardHeader>
                <CardTitle>No Active Session</CardTitle>
                <CardDescription>It looks like you don't have a study session in progress.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/">Create a New Course</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <LessonView session={studySession} />
    </div>
  );
}

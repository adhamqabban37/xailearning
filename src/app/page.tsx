"use client";
import { useState, useEffect } from 'react';
import type { Course } from '@/lib/types';
import { useCourseStorage } from '@/hooks/use-course-storage';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ContentForm } from '@/components/home/content-form';
import { CoursePreview } from '@/components/home/course-preview';
import { Loader2, BookOpenCheck, WandSparkles, UploadCloud, Rocket } from 'lucide-react';

export default function Home() {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { storedCourse, clearCourse, isLoading: storageIsLoading } = useCourseStorage();
  const router = useRouter();

  useEffect(() => {
    if (storedCourse) {
      setCourse(storedCourse.course);
    }
  }, [storedCourse]);

  const handleResume = () => {
    router.push('/lesson');
  };

  const handleStartOver = () => {
    clearCourse();
    setCourse(null);
  }

  if (storageIsLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-medium text-muted-foreground">Loading your library...</h2>
      </div>
    );
  }
  
  if (course) {
    const hasProgress = storedCourse && storedCourse.progress && Object.keys(storedCourse.progress).length > 0;
    const totalSteps = course.sessions.reduce((acc, s) => acc + s.steps.length, 0);
    const completedSteps = hasProgress ? Object.keys(storedCourse.progress).length : 0;

    return (
      <div className="container mx-auto px-4 py-8">
        {hasProgress ? (
          <div className="text-center my-8 p-8 bg-card border rounded-lg shadow-lg max-w-2xl mx-auto border-primary/20 shadow-primary/10">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-6">
                <BookOpenCheck className="text-primary h-8 w-8"/>
            </div>
            <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-muted-foreground mb-6 text-lg">You're making great progress. Ready to dive back in?</p>
            
            <div className="w-full bg-secondary rounded-full h-2.5 mb-6">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(completedSteps/totalSteps)*100}%` }}></div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{completedSteps} of {totalSteps} steps completed</p>

            <div className="flex justify-center gap-4">
              <Button onClick={handleResume} size="lg">Resume Learning</Button>
              <Button onClick={handleStartOver} variant="outline" size="lg">Start a New Course</Button>
            </div>
          </div>
        ) : (
          <CoursePreview initialCourse={course} onClear={handleStartOver} />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="relative text-center my-8 md:my-16 p-8 rounded-xl overflow-hidden">
        <div className="absolute inset-0 w-full h-full bg-grid-cyan-500/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
         <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"></div>
         <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-b from-foreground to-foreground/70 text-transparent bg-clip-text">
          Turn Any Document into an Adventure
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          Our mission is to transform static content into personalized, interactive courses with the power of AI.
        </p>
      </section>

      <section className="my-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
              <WandSparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Craft Your Content</h3>
            <p className="text-muted-foreground">Use our powerful prompt to generate rich, structured course material on any topic with your favorite AI tool.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Upload Your Document</h3>
            <p className="text-muted-foreground">Bring your generated PDF or text back here. Our AI analyzes the content to build your interactive course.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4">
              <Rocket className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Start Your Adventure</h3>
            <p className="text-muted-foreground">Dive into a personalized learning experience with videos, quizzes, and progress tracking.</p>
          </div>
        </div>
      </section>

      <section>
        <ContentForm onCourseGenerated={setCourse} isLoading={isLoading} setIsLoading={setIsLoading} />
      </section>
    </div>
  );
}

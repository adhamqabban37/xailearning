"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Course } from '@/lib/types';
import { useCourseStorage } from '@/hooks/use-course-storage';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ContentForm } from '@/components/home/content-form';
import { CoursePreview } from '@/components/home/course-preview';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/common/logo';

export default function Home() {
  const [heroImage] = PlaceHolderImages;
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
    return (
      <div className="container mx-auto px-4 py-8">
        {storedCourse && storedCourse.progress && Object.keys(storedCourse.progress).length > 0 ? (
          <div className="text-center my-8 p-8 bg-card border rounded-lg shadow-lg">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-6">
                <Logo className="text-primary"/>
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-muted-foreground mb-6 text-lg">You have a course in progress. Ready to dive back in?</p>
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
      <section className="text-center my-8 md:my-16">
        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-8 shadow-2xl shadow-primary/10">
           <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint={heroImage.imageHint}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/50" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary">
          From Static to Spectacular
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          Upload any document and watch it transform into an interactive adventure. Learning will never be the same.
        </p>
      </section>

      <section>
        <ContentForm onCourseGenerated={setCourse} isLoading={isLoading} setIsLoading={setIsLoading} />
      </section>
    </div>
  );
}

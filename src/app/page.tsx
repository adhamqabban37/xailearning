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
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  if (course) {
    return (
      <div className="container mx-auto px-4 py-8">
        {storedCourse && storedCourse.progress && Object.keys(storedCourse.progress).length > 0 ? (
          <div className="text-center my-8 p-6 bg-card border rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-muted-foreground mb-6">You have a course in progress. What would you like to do?</p>
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
        <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-8 shadow-lg">
           <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint={heroImage.imageHint}
              priority
            />
            <div className="absolute inset-0 bg-primary/30" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight mb-4">
          Turn Any Text Into an Interactive Course
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          Simply paste your content, and let our AI craft a structured, engaging learning experience for you, complete with steps, quizzes, and resources.
        </p>
      </section>

      <section>
        <ContentForm onCourseGenerated={setCourse} isLoading={isLoading} setIsLoading={setIsLoading} />
      </section>
    </div>
  );
}

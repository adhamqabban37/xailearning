"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCourseStorage } from '@/hooks/use-course-storage';
import { CheckCircle, Clock, FileText, Link, ListChecks, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import type { Course } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface CoursePreviewProps {
  initialCourse: Course;
  onClear: () => void;
}

export function CoursePreview({ initialCourse, onClear }: CoursePreviewProps) {
  const [course, setCourse] = useState(initialCourse);
  const [sessionDuration, setSessionDuration] = useState("30");
  const { saveCourse, startNewSession } = useCourseStorage();
  const router = useRouter();

  const handleStartLearning = () => {
    saveCourse(course);
    const newSession = startNewSession(parseInt(sessionDuration, 10));
    if (newSession) {
      router.push('/lesson');
    }
  };

  const totalLessons = course.sessions.reduce((acc, session) => acc + session.lessons.length, 0);

  const readinessScoreValue = course.checklist ? (100 - course.checklist.length * 10) : 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{course.course_title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{course.total_estimated_time || 'N/A'}</span>
            </div>
             <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{totalLessons} lessons</span>
            </div>
          </div>
          <CardDescription>
            {course.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-xl'><Sparkles className="text-primary"/> Analysis Report</CardTitle>
              <CardDescription>The AI has analyzed your document. Here's what it found.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg">Readiness Score</span>
                  <span className="text-2xl font-bold text-primary">{readinessScoreValue}%</span>
                </div>
                <Progress value={readinessScoreValue} className="h-3"/>
              </div>

              {course.checklist && course.checklist.length > 0 && (
                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Improvement Recommendations</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      {course.checklist.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>


          <div className="space-y-2">
            <h3 className="font-bold text-xl">Suggested Course Structure</h3>
            <Accordion type="single" collapsible className="w-full border rounded-md px-4" defaultValue="session-0">
              {course.sessions.map((session, sIndex) => (
                <AccordionItem value={`session-${sIndex}`} key={session.id} className={sIndex === course.sessions.length - 1 ? 'border-b-0' : ''}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-4">
                      <span className="text-primary">{`Session ${sIndex + 1}`}</span>
                      <span>{session.session_title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 pl-6 border-l-2 ml-2">
                      {session.lessons.map((lesson) => (
                        <li key={lesson.id} className="text-muted-foreground pl-2">
                          <p className="font-medium text-foreground">{lesson.lesson_title}</p>
                          <p className='text-xs italic mt-1'>"{lesson.content_summary}"</p>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center gap-4 bg-muted/50 p-6 rounded-b-lg">
            <div className="flex-1">
                <h4 className="font-bold mb-2">Choose your study session length:</h4>
                <RadioGroup defaultValue="30" onValueChange={setSessionDuration} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="30" id="r1" />
                        <Label htmlFor="r1">30 min</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="45" id="r2" />
                        <Label htmlFor="r2">45 min</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="60" id="r3" />
                        <Label htmlFor="r3">60 min</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <Button variant="outline" onClick={onClear}>Start Over</Button>
                 <Button onClick={handleStartLearning} className="text-lg">Start Learning</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

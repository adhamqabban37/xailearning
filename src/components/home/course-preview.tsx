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
import { CheckCircle, Clock, FileText, Link, ListChecks, HelpCircle, AlertCircle } from 'lucide-react';
import type { Course, Lesson } from '@/lib/types';
import { Badge } from '../ui/badge';

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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">{course.course_title}</CardTitle>
          <CardDescription>
            {course.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.checklist && course.checklist.length > 0 && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Suggestions for Improvement</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {course.checklist.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg p-4">
            <h3 className="font-bold mb-2">Course at a Glance:</h3>
            <div className="flex space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center"><FileText className="w-4 h-4 mr-1.5"/> {course.sessions.length} sessions</div>
                <div className="flex items-center"><ListChecks className="w-4 h-4 mr-1.5"/> {totalLessons} lessons</div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full" defaultValue="session-0">
            {course.sessions.map((session, sIndex) => (
              <AccordionItem value={`session-${sIndex}`} key={session.id}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center gap-4">
                    <span className="text-primary">{`Session ${sIndex + 1}`}</span>
                    <span>{session.session_title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pl-4">
                    {session.lessons.map((lesson, lIndex) => (
                      <li key={lesson.id} className="border-l-2 pl-4 py-1 text-muted-foreground">
                        <p className="font-medium text-foreground">{lesson.lesson_title}</p>
                        <div className="flex items-center text-xs mt-1">
                          <Clock className="w-3 h-3 mr-1.5" /> 
                          {lesson.timeEstimateMinutes ? `${lesson.timeEstimateMinutes} min` : 'Time not specified'}
                        </div>
                        {lesson.resources && lesson.resources.length > 0 && (
                            <div className="flex items-center text-xs mt-1 text-blue-500">
                                <Link className="w-3 h-3 mr-1.5" />
                                {lesson.resources.length} resource(s)
                            </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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

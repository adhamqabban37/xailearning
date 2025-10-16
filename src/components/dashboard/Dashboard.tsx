"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserCourses, SavedCourse, updateLessonProgress } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, BookOpen, Trophy, Play, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCourseStorage } from "@/hooks/use-course-storage";
import { CertificateGallery } from "@/components/certificates/CertificateGallery";
import type { Course } from "@/lib/types";

export function Dashboard() {
  const { user, userProfile } = useAuth();
  const [courses, setCourses] = useState<
    (SavedCourse & { courseId: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { saveCourse } = useCourseStorage();

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const loadCourses = async () => {
    if (!user) return;

    try {
      const userCourses = await getUserCourses(user.id);
      setCourses(userCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (course: SavedCourse) => {
    const totalLessons = course.course.sessions.reduce(
      (acc, session) => acc + session.lessons.length,
      0
    );
    const completedLessons = course.progress.filter((p) => p.completed).length;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const continueCourse = (courseData: SavedCourse & { courseId: string }) => {
    // Set the course in storage and navigate to lesson view
    saveCourse(courseData.course);
    router.push("/lesson");
  };

  const getNextLesson = (course: SavedCourse) => {
    const completedLessons = new Set(
      course.progress.filter((p) => p.completed).map((p) => p.lessonId)
    );

    for (const session of course.course.sessions) {
      for (const lesson of session.lessons) {
        if (!completedLessons.has(lesson.id)) {
          return {
            session: session.session_title,
            lesson: lesson.lesson_title,
          };
        }
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your courses...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Welcome back, {userProfile?.displayName || "Learner"}!
          </h1>
          <p className="text-muted-foreground">
            Continue your AI learning journey where you left off
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="circuit-bg border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>

          <Card className="circuit-bg border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Lessons
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.reduce(
                  (acc, course) =>
                    acc + course.progress.filter((p) => p.completed).length,
                  0
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="circuit-bg border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Certificates Earned
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  courses.filter((course) => calculateProgress(course) === 100)
                    .length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Courses
            </TabsTrigger>
            <TabsTrigger
              value="certificates"
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Certificates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <h2 className="text-2xl font-semibold">Your Courses</h2>

            {courses.length === 0 ? (
              <Card className="text-center p-8 circuit-bg border-accent/30">
                <CardContent>
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your learning journey by creating your first course
                  </p>
                  <Button
                    onClick={() => router.push("/")}
                    className="btn-gradient"
                  >
                    Create Course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((courseData) => {
                  const progress = calculateProgress(courseData);
                  const nextLesson = getNextLesson(courseData);
                  const isCompleted = progress === 100;

                  return (
                    <Card
                      key={courseData.courseId}
                      className="circuit-bg border-accent/30 hover:glow-subtle transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {courseData.course.course_title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {courseData.course.sessions.length} modules •{" "}
                              {courseData.course.total_estimated_time}
                            </CardDescription>
                          </div>
                          {isCompleted && (
                            <Badge
                              variant="default"
                              className="bg-green-600 text-white"
                            >
                              <Trophy className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {nextLesson && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Next:</span>{" "}
                            {nextLesson.lesson}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => continueCourse(courseData)}
                            className="flex-1 btn-gradient"
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {isCompleted ? "Review" : "Continue"}
                          </Button>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Last accessed:{" "}
                          {new Date(
                            courseData.lastAccessedAt
                          ).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Certificates</h2>
              <Badge variant="secondary">
                {
                  courses.filter((course) => calculateProgress(course) === 100)
                    .length
                }{" "}
                earned
              </Badge>
            </div>

            {user && <CertificateGallery userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

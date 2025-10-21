"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CourseYouTubeVideos from "@/components/CourseYouTubeVideos";

export default function InteractiveCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [courseData, setCourseData] = useState(null);
  const [progress, setProgress] = useState({});
  const [timerSeconds, setTimerSeconds] = useState(3600);
  const [isTimerPaused, setIsTimerPaused] = useState(true);
  const [timerInterval, setTimerInterval] = useState(null);

  useEffect(() => {
    // Load course from sessionStorage
    const storedCourseData = sessionStorage.getItem("courseData");
    if (storedCourseData) {
      setCourseData(JSON.parse(storedCourseData));
    }

    // Load progress from localStorage
    const storedProgress = localStorage.getItem("courseProgress");
    if (storedProgress) {
      setProgress(JSON.parse(storedProgress));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const saveProgress = () => {
    localStorage.setItem("courseProgress", JSON.stringify(progress));
  };

  const markLessonComplete = (lessonId) => {
    const newProgress = { ...progress };
    if (!newProgress[lessonId]) newProgress[lessonId] = {};
    newProgress[lessonId].completed = true;
    setProgress(newProgress);
    localStorage.setItem("courseProgress", JSON.stringify(newProgress));
  };

  const getTotalLessons = () => {
    if (!courseData?.modules) return 0;
    return courseData.modules.reduce(
      (acc, module) => acc + (module.lessons?.length || 0),
      0
    );
  };

  const getCompletedLessons = () => {
    return Object.values(progress).filter((p: any) => p?.completed).length;
  };

  const updateTimerDisplay = () => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const startTimer = () => {
    if (isTimerPaused) {
      setIsTimerPaused(false);
      const interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            alert("Study session complete!");
            resetTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);
    }
  };

  const pauseTimer = () => {
    if (!isTimerPaused) {
      setIsTimerPaused(true);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const resetTimer = () => {
    setIsTimerPaused(true);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerSeconds(3600);
  };

  const handleTimerControl = () => {
    isTimerPaused ? startTimer() : pauseTimer();
  };

  const setTimerDuration = (seconds) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setIsTimerPaused(true);
    setTimerSeconds(seconds);
  };

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading course...</p>
        </div>
      </div>
    );
  }

  const completedCount = getCompletedLessons();
  const totalCount = getTotalLessons();
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
        body {
          font-family: "Inter", sans-serif;
        }
        .quiz-option.selected {
          background-color: #3b82f6;
          color: white;
        }
        .quiz-option.correct {
          background-color: #22c55e;
          color: white;
          border-color: #16a34a;
        }
        .quiz-option.incorrect {
          background-color: #ef4444;
          color: white;
          border-color: #dc2626;
        }
      `}</style>

      <div className="min-h-screen bg-gray-900 text-white antialiased">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              {courseData.title || "Course"}
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              {courseData.description ||
                "Welcome to your interactive learning experience"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold mb-6">Course Modules</h2>
              {courseData.modules?.map((module) => (
                <div
                  key={module.id || module.moduleId}
                  className="bg-gray-800 rounded-lg p-6 mb-6"
                >
                  <h3 className="text-2xl font-bold text-blue-400 mb-4">
                    {module.title}
                  </h3>
                  <ul className="space-y-3">
                    {module.lessons?.map((lesson) => (
                      <li key={lesson.id || lesson.lessonId}>
                        <a
                          href="#"
                          className="flex items-center space-x-3 text-lg hover:text-blue-300 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            const moduleId = module.id || module.moduleId;
                            const lessonId = lesson.id || lesson.lessonId;
                            router.push(
                              `/course/${params.id}/lesson/${moduleId}/${lessonId}`
                            );
                          }}
                        >
                          {progress[lesson.id || lesson.lessonId]?.completed ? (
                            <svg
                              className="w-6 h-6 text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                          ) : (
                            <svg
                              className="w-6 h-6 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                          )}
                          <span>{lesson.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 h-fit sticky top-8">
              <h3 className="text-2xl font-bold mb-4">Your Progress</h3>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-center text-gray-400">
                {completedCount} of {totalCount} lessons complete
              </p>

              <hr className="my-6 border-gray-700" />

              <h3 className="text-2xl font-bold mb-4">Study Session</h3>
              <div className="text-6xl font-mono text-center mb-4">
                {updateTimerDisplay()}
              </div>
              <div className="flex justify-center space-x-2 mb-4">
                <button
                  onClick={() => setTimerDuration(1800)}
                  className="px-3 py-1 bg-gray-700 rounded-md hover:bg-blue-600 transition-colors"
                >
                  30 min
                </button>
                <button
                  onClick={() => setTimerDuration(3600)}
                  className="px-3 py-1 bg-blue-600 rounded-md transition-colors"
                >
                  60 min
                </button>
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={handleTimerControl}
                  className="w-full px-4 py-2 bg-blue-600 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                >
                  {isTimerPaused ? "Start" : "Pause"}
                </button>
                <button
                  onClick={resetTimer}
                  className="px-4 py-2 bg-gray-600 rounded-md font-semibold hover:bg-gray-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* YouTube Videos Section */}
          {courseData.title && (
            <div className="mb-12">
              <CourseYouTubeVideos
                searchQuery={`${courseData.title} AI learning tutorial`}
                maxResults={6}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

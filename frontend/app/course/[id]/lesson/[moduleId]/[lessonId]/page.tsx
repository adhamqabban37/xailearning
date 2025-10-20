"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [courseData, setCourseData] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    // Load course from sessionStorage
    const storedCourseData = sessionStorage.getItem("courseData");
    if (storedCourseData) {
      const course = JSON.parse(storedCourseData);
      setCourseData(course);

      // Find the specific lesson
      const moduleId = params.moduleId;
      const lessonId = params.lessonId;

      const module = course.modules?.find(
        (m) => (m.id || m.moduleId) === moduleId
      );
      if (module) {
        const foundLesson = module.lessons?.find(
          (l) => (l.id || l.lessonId) === lessonId
        );
        if (foundLesson) {
          setLesson(foundLesson);
        }
      }
    }

    // Load progress from localStorage
    const storedProgress = localStorage.getItem("courseProgress");
    if (storedProgress) {
      setProgress(JSON.parse(storedProgress));
    }
  }, [params]);

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const markLessonComplete = (lessonId) => {
    const newProgress = { ...progress };
    if (!newProgress[lessonId]) newProgress[lessonId] = {};
    newProgress[lessonId].completed = true;
    setProgress(newProgress);
    localStorage.setItem("courseProgress", JSON.stringify(newProgress));
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    let allCorrect = true;

    lesson.quiz?.forEach((q) => {
      const selectedAnswer = selectedAnswers[q.questionId || q.id];
      if (selectedAnswer !== (q.answer || q.correct_answer)) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      markLessonComplete(lesson.id || lesson.lessonId);
      setTimeout(() => {
        router.push(`/course/${params.id}`);
      }, 2000);
    }
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading lesson...</p>
        </div>
      </div>
    );
  }

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
          <button
            onClick={() => router.push(`/course/${params.id}`)}
            className="mb-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-gray-800 rounded-lg p-8">
            <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
            <p className="text-gray-400 text-lg">
              {lesson.summary || lesson.description}
            </p>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div>
                <h4 className="text-xl font-bold mb-4 text-blue-400">
                  Action Plan
                </h4>
                {lesson.actionPlan?.session_60min && (
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {lesson.actionPlan.session_60min.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
                {lesson.objectives && (
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {lesson.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="text-xl font-bold mb-4 text-blue-400">
                  Suggested Resources
                </h4>
                {lesson.resourcePack?.youtube && (
                  <ul className="space-y-4">
                    {lesson.resourcePack.youtube.map((video, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg
                          className="w-6 h-6 text-red-500 mt-1 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <div>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold hover:underline"
                          >
                            {video.title}
                          </a>
                          <span className="text-gray-400 text-sm block">
                            ({video.duration})
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {lesson.resourcePack?.articles && (
                  <ul className="space-y-4 mt-4">
                    {lesson.resourcePack.articles.map((article, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg
                          className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0114.5 16c1.255 0 2.443-.29 3.5-.804V4.804A7.968 7.968 0 0014.5 4z"></path>
                        </svg>
                        <div>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold hover:underline"
                          >
                            {article.title}
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {lesson.resources && (
                  <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto text-black mt-4">
                    {JSON.stringify(lesson.resources, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {lesson.quiz && lesson.quiz.length > 0 && (
              <div className="mt-12 bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <h4 className="text-2xl font-bold mb-6 text-center">
                  Test Your Knowledge
                </h4>
                {lesson.quiz.map((q, index) => {
                  const questionId = q.questionId || q.id || `q${index}`;
                  const selectedAnswer = selectedAnswers[questionId];
                  const correctAnswer = q.answer || q.correct_answer;

                  return (
                    <div key={questionId} className="mb-6">
                      <p className="font-semibold text-lg mb-4">
                        {index + 1}. {q.question}
                      </p>
                      <div className="space-y-3">
                        {q.options?.map((option, optIndex) => {
                          let optionClass =
                            "quiz-option border-2 border-gray-700 p-3 rounded-md cursor-pointer hover:bg-gray-700";

                          if (quizSubmitted) {
                            if (option === correctAnswer) {
                              optionClass += " correct";
                            } else if (option === selectedAnswer) {
                              optionClass += " incorrect";
                            }
                          } else if (option === selectedAnswer) {
                            optionClass += " selected";
                          }

                          return (
                            <div
                              key={optIndex}
                              className={optionClass}
                              onClick={() =>
                                !quizSubmitted &&
                                handleAnswerSelect(questionId, option)
                              }
                              style={{
                                pointerEvents: quizSubmitted ? "none" : "auto",
                              }}
                            >
                              {option}
                            </div>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <div className="mt-3 text-sm">
                          {selectedAnswer === correctAnswer ? (
                            <span className="text-green-400">Correct!</span>
                          ) : (
                            <span className="text-red-400">
                              Incorrect.{" "}
                              {q.explanation && `Explanation: ${q.explanation}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={handleQuizSubmit}
                  disabled={quizSubmitted}
                  className="w-full mt-4 px-4 py-3 bg-blue-600 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-600"
                >
                  {quizSubmitted
                    ? "Completed! Redirecting..."
                    : "Submit Answers"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

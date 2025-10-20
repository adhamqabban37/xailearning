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
  const [expandedResources, setExpandedResources] = useState<
    Record<string, boolean>
  >({});

  const toggleResource = (resourceId: string) => {
    setExpandedResources((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId],
    }));
  };

  useEffect(() => {
    // Load course from sessionStorage
    const storedCourseData = sessionStorage.getItem("courseData");
    if (storedCourseData) {
      try {
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
      } catch (e) {
        console.error("Failed to parse courseData from sessionStorage", e);
        // Recover by clearing invalid data
        sessionStorage.removeItem("courseData");
      }
    }

    // Load progress from localStorage
    const storedProgress = localStorage.getItem("courseProgress");
    if (storedProgress) {
      try {
        setProgress(JSON.parse(storedProgress));
      } catch (e) {
        console.error("Failed to parse courseProgress; clearing", e);
        localStorage.removeItem("courseProgress");
      }
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

  // Build fallback resource collections from lesson.resources when resourcePack is absent
  const buildResourceCollections = (l: any) => {
    const pack = {
      youtube: [] as any[],
      articles: [] as any[],
      pdfs: [] as any[],
    };
    const items: any[] = Array.isArray(l?.resources) ? l.resources : [];
    for (const item of items) {
      if (!item) continue;
      const isString = typeof item === "string";
      const url = isString ? item : item.url;
      const title = isString ? item : item.title || url;
      const note = isString ? undefined : item.note;
      const debugReason = isString ? undefined : item.debug_reason;
      const type = isString ? undefined : item.type;

      if (!url) continue;

      const isYouTube =
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)\w+/i.test(
          url
        );
      const isPDF = /\.pdf($|\?)/i.test(url) || type === "pdf";

      if (isYouTube) {
        // respect embeddable flag if provided
        const emb = isString ? true : item.embeddable !== false;
        if (emb) {
          pack.youtube.push({
            title,
            url,
            duration: item?.duration,
            note: note || debugReason || "YouTube video resource",
          });
        }
      } else if (isPDF) {
        pack.pdfs.push({
          title,
          url,
          note: note || "PDF document",
        });
      } else {
        pack.articles.push({
          title,
          url,
          note: note || debugReason || "Article or web resource",
        });
      }
    }
    return pack;
  };

  const effectiveResourcePack =
    (lesson as any).resourcePack || buildResourceCollections(lesson);

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

                {/* YouTube Videos */}
                {effectiveResourcePack?.youtube &&
                  effectiveResourcePack.youtube.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        Video Resources
                      </h5>
                      {effectiveResourcePack.youtube.map((video, index) => {
                        const resourceId = `video-${index}`;
                        const isExpanded = expandedResources[resourceId];

                        return (
                          <div
                            key={index}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden hover:border-red-500/50 transition-colors"
                          >
                            <button
                              onClick={() => toggleResource(resourceId)}
                              className="w-full flex items-center justify-between p-4 text-left"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <svg
                                  className="w-6 h-6 text-red-500 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                                <div className="flex-1">
                                  <div className="font-semibold text-white">
                                    {video.title}
                                  </div>
                                  {video.duration && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Duration: {video.duration}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                ></path>
                              </svg>
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-700">
                                <div className="mt-3 text-sm text-gray-300 mb-3">
                                  {video.note ||
                                    "YouTube video resource to help you learn this topic."}
                                </div>
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                                  </svg>
                                  <span>Watch on YouTube</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Articles */}
                {effectiveResourcePack?.articles &&
                  effectiveResourcePack.articles.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        Articles & Web Resources
                      </h5>
                      {effectiveResourcePack.articles.map((article, index) => {
                        const resourceId = `article-${index}`;
                        const isExpanded = expandedResources[resourceId];

                        return (
                          <div
                            key={index}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500/50 transition-colors"
                          >
                            <button
                              onClick={() => toggleResource(resourceId)}
                              className="w-full flex items-center justify-between p-4 text-left"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <svg
                                  className="w-6 h-6 text-blue-400 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0114.5 16c1.255 0 2.443-.29 3.5-.804V4.804A7.968 7.968 0 0014.5 4z"></path>
                                </svg>
                                <div className="flex-1">
                                  <div className="font-semibold text-white">
                                    {article.title}
                                  </div>
                                </div>
                              </div>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                ></path>
                              </svg>
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-700">
                                <div className="mt-3 text-sm text-gray-300 mb-3">
                                  {article.note ||
                                    "Article or web resource for additional reading and context."}
                                </div>
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                                  </svg>
                                  <span>Read Article</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* PDFs */}
                {effectiveResourcePack?.pdfs &&
                  effectiveResourcePack.pdfs.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        PDF Documents
                      </h5>
                      {effectiveResourcePack.pdfs.map((pdf, index) => {
                        const resourceId = `pdf-${index}`;
                        const isExpanded = expandedResources[resourceId];

                        return (
                          <div
                            key={index}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden hover:border-green-500/50 transition-colors"
                          >
                            <button
                              onClick={() => toggleResource(resourceId)}
                              className="w-full flex items-center justify-between p-4 text-left"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <svg
                                  className="w-6 h-6 text-green-400 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                                <div className="flex-1">
                                  <div className="font-semibold text-white">
                                    {pdf.title}
                                  </div>
                                </div>
                              </div>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                ></path>
                              </svg>
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-gray-700">
                                <div className="mt-3 text-sm text-gray-300 mb-3">
                                  {pdf.note ||
                                    "PDF document for detailed reference and study."}
                                </div>
                                <a
                                  href={pdf.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm font-medium"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    ></path>
                                  </svg>
                                  <span>Download PDF</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {!effectiveResourcePack?.youtube?.length &&
                  !effectiveResourcePack?.articles?.length &&
                  !effectiveResourcePack?.pdfs?.length && (
                    <div className="text-gray-500 text-sm italic">
                      No resources available for this lesson yet.
                    </div>
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

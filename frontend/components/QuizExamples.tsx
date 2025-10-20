"use client";

import React, { useState } from "react";
import { Book, Brain, Code, Trophy, RotateCcw } from "lucide-react";
import { Quiz } from "../components/Quiz";
import { QuizProgress } from "../types/quiz";
import type { QuizBlock } from "../types/quiz";
const sampleQuizData: QuizBlock = {
  questions: [
    {
      id: "q1",
      type: "multiple_choice" as const,
      question: "2 + 2 = ?",
      options: ["3", "4", "5"],
      answer: "4",
      explanation: "Basic arithmetic",
    },
    {
      id: "q2",
      type: "short_answer" as const,
      question: "Explain what an array is.",
      key_points: ["collection", "index"],
    },
  ],
};
const samplePythonQuiz = sampleQuizData;
const quizWithAssignment: QuizBlock & { assignment: any } = {
  ...sampleQuizData,
  assignment: {
    title: "Mini Project",
    description:
      "Build a small program demonstrating concepts used in the quiz.",
    requirements: ["Use arrays", "Include user input"],
    rubric: { correctness: "Program runs and produces expected output" },
  },
};

/**
 * Comprehensive example showing how to integrate Quiz components
 * into your course pages with different quiz types and configurations
 */
export const QuizExamples: React.FC = () => {
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<
    Record<string, QuizProgress>
  >({});

  const handleQuizComplete = (quizId: string, progress: QuizProgress) => {
    setCompletedQuizzes((prev) => ({
      ...prev,
      [quizId]: progress,
    }));

    // Here you would typically save to backend
    console.log(`Quiz ${quizId} completed:`, progress);

    // Show completion message
    alert(`Quiz completed! Your score: ${progress.percentageScore}%`);
  };

  const handleQuizProgress = (progress: QuizProgress) => {
    // Handle real-time progress updates
    console.log("Quiz progress:", progress);

    // You could save progress to backend here for resuming later
  };

  const resetQuiz = (quizId: string) => {
    setCompletedQuizzes((prev) => {
      const updated = { ...prev };
      delete updated[quizId];
      return updated;
    });
  };

  const quizzes = [
    {
      id: "react-fundamentals",
      title: "React Fundamentals Quiz",
      description:
        "Test your understanding of React concepts including hooks, components, and state management.",
      icon: <Brain className="h-6 w-6" />,
      data: sampleQuizData,
      timeLimit: 30, // 30 minutes
      config: {
        allowReview: true,
        showExplanations: true,
      },
    },
    {
      id: "python-basics",
      title: "Python Programming Quiz",
      description:
        "Evaluate your Python programming skills with practical coding challenges.",
      icon: <Code className="h-6 w-6" />,
      data: samplePythonQuiz,
      timeLimit: 45,
      config: {
        allowReview: true,
        showExplanations: true,
      },
    },
    {
      id: "fullstack-project",
      title: "Full-Stack Project Assessment",
      description:
        "Complete a comprehensive project that demonstrates your full-stack development capabilities.",
      icon: <Trophy className="h-6 w-6" />,
      data: quizWithAssignment,
      timeLimit: 120, // 2 hours for project work
      config: {
        allowReview: false,
        showExplanations: false,
      },
    },
  ];

  if (activeQuiz) {
    const quiz = quizzes.find((q) => q.id === activeQuiz);
    if (!quiz) return null;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Quiz Header */}
          <div className="mb-6">
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center space-x-2"
            >
              ← Back to Quiz Selection
            </button>
            <div className="flex items-center space-x-3 mb-2">
              {quiz.icon}
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            </div>
            <p className="text-gray-600">{quiz.description}</p>
          </div>

          {/* Quiz Component */}
          <Quiz
            quiz={quiz.data}
            onComplete={(progress) => handleQuizComplete(quiz.id, progress)}
            onProgress={handleQuizProgress}
            allowReview={quiz.config.allowReview}
            showExplanations={quiz.config.showExplanations}
            timeLimit={quiz.timeLimit}
            className="mb-8"
          />

          {/* Assignment Section (if applicable) */}
          {quiz.data.assignment && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📋 Assignment: {quiz.data.assignment.title}
              </h2>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700">
                  {quiz.data.assignment.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Requirements */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Requirements:
                  </h3>
                  <ul className="space-y-2">
                    {quiz.data.assignment.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rubric */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Grading Rubric:
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(quiz.data.assignment.rubric).map(
                      ([criteria, description]) => (
                        <div
                          key={criteria}
                          className="border-l-4 border-blue-500 pl-3"
                        >
                          <div className="font-medium text-gray-900">
                            {criteria}
                          </div>
                          <div className="text-sm text-gray-600">
                            {description}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {quiz.data.assignment.submission_format && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">
                    Submission Format:
                  </h4>
                  <p className="text-blue-800">
                    {quiz.data.assignment.submission_format}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Book className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Interactive Quiz System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our comprehensive quiz system featuring multiple question
            types, instant feedback, and detailed analytics. Choose a quiz below
            to get started.
          </p>
        </div>

        {/* Quiz Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {quizzes.map((quiz) => {
            const completion = completedQuizzes[quiz.id];

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {quiz.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quiz.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 mb-4">{quiz.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{quiz.data.questions.length} questions</span>
                    <span>{quiz.timeLimit} minutes</span>
                  </div>

                  {completion ? (
                    <div className="space-y-3">
                      {/* Completion Status */}
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-green-600" />
                          <span className="text-green-800 font-medium">
                            Completed
                          </span>
                        </div>
                        <span className="text-green-700 font-bold">
                          {completion.percentageScore}%
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setActiveQuiz(quiz.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Review Answers
                        </button>
                        <button
                          onClick={() => resetQuiz(quiz.id)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          title="Retake quiz"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveQuiz(quiz.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Quiz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quiz System Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Multiple Question Types
              </h3>
              <p className="text-sm text-gray-600">
                Multiple choice, short answer, and practical exercises
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Instant Feedback
              </h3>
              <p className="text-sm text-gray-600">
                Get immediate validation and explanations for answers
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Practical Exercises
              </h3>
              <p className="text-sm text-gray-600">
                Real-world coding challenges and project submissions
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Book className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Progress Tracking
              </h3>
              <p className="text-sm text-gray-600">
                Detailed analytics and performance monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Integration Example */}
        <div className="mt-12 bg-gray-800 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Integration Example</h2>
          <p className="text-gray-300 mb-6">
            Here's how to integrate the Quiz component into your course pages:
          </p>

          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`import { Quiz } from './components/Quiz'
import { sampleQuizData } from './data/sampleQuizData'

function CoursePage() {
  const handleQuizComplete = (progress) => {
    // Save progress to backend
    console.log('Quiz completed:', progress)
  }

  return (
    <Quiz
      quiz={sampleQuizData}
      onComplete={handleQuizComplete}
      allowReview={true}
      showExplanations={true}
      timeLimit={30}
    />
  )
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

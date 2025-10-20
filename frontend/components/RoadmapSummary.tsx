"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Target,
  CheckCircle,
  Star,
} from "lucide-react";
import Link from "next/link";

interface Lesson {
  day_number: number;
  title: string;
  duration: number;
  content: string;
  topics: string[];
  estimated_hours: number;
}

interface Course {
  id?: string;
  course_id: string;
  title: string;
  description: string;
  total_lessons: number;
  total_hours: number;
  total_days: number;
  estimated_weeks: number;
  difficulty: string;
  lessons?: Lesson[]; // Optional since backend uses modules
  key_skills: string[];
  created_at: string;
}

interface RoadmapSummaryProps {
  course: Course;
  filename?: string;
  onBack?: () => void;
}

export default function RoadmapSummary({
  course,
  filename,
  onBack,
}: RoadmapSummaryProps) {
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

  const handleStartLearning = () => {
    // Multiple ways to get course ID with fallbacks
    const courseId =
      course.course_id || course.id || sessionStorage.getItem("courseId");

    console.log("🔍 Checking course ID for learning:");
    console.log("  course.course_id:", course.course_id);
    console.log("  course.id:", course.id);
    console.log(
      "  sessionStorage courseId:",
      sessionStorage.getItem("courseId")
    );
    console.log("  Final courseId:", courseId);

    if (courseId) {
      console.log("✅ Starting learning with course ID:", courseId);
      window.location.href = `/course/${courseId}`;
    } else {
      console.error("❌ No course ID found anywhere!");
      console.log("🔍 Available course object:", course);
      alert(
        "Course ID missing. Cannot start learning. Check console for details."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-800"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Upload</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Roadmap Summary
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {course.title}
              </h2>
              <p className="text-gray-600 mb-4">{course.description}</p>
              {filename && (
                <p className="text-sm text-gray-500">
                  Generated from: {filename}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-800 font-medium">Processed</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="bg-primary-50 rounded-lg p-4 text-center">
              <BookOpen className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary-900">
                {course.total_lessons}
              </div>
              <div className="text-sm text-primary-600">Lessons</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">
                {course.total_hours}h
              </div>
              <div className="text-sm text-blue-600">Total Time</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">
                {course.estimated_weeks}
              </div>
              <div className="text-sm text-green-600">Weeks</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <Star className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">
                {course.difficulty}
              </div>
              <div className="text-sm text-orange-600">Level</div>
            </div>
          </div>

          {/* Key Skills */}
          {course.key_skills && course.key_skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Key Skills You'll Learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {course.key_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Learning Path
            </h3>
            <p className="text-gray-600 mt-1">
              Your structured learning journey
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => (
                <div
                  key={lesson.day_number}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    setSelectedLesson(selectedLesson === index ? null : index)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-100 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {lesson.day_number}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{lesson.estimated_hours}h</span>
                          </span>
                          {lesson.topics && lesson.topics.length > 0 && (
                            <span>{lesson.topics.length} topics</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {selectedLesson === index ? "−" : "+"}
                    </div>
                  </div>

                  {selectedLesson === index && (
                    <div className="mt-4 pl-14">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700">{lesson.content}</p>
                      </div>

                      {lesson.topics && lesson.topics.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">
                            Topics Covered:
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {lesson.topics.map((topic, topicIndex) => (
                              <li key={topicIndex}>{topic}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No lessons available yet. Upload a learning roadmap to get
                  started!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Upload Another PDF
          </button>
          <button
            onClick={handleStartLearning}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Start Learning
          </button>
        </div>
      </main>
    </div>
  );
}

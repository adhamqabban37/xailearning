"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Fixed: Use next/navigation for app directory
import { Quiz } from "@/components/Quiz"; // ✨ Clean absolute import
import { Module } from "@/types/api"; // ✨ Clean absolute import
import { QuizBlock } from "@/types/quiz"; // ✨ Clean absolute import

export default function ModulePage({
  params,
}: {
  params: { id: string; n: string };
}) {
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load course from sessionStorage
    const courseData = sessionStorage.getItem("courseData");
    if (courseData) {
      const course = JSON.parse(courseData);
      const moduleIndex = parseInt(params.n, 10) - 1;
      if (course.modules && course.modules[moduleIndex]) {
        setModule(course.modules[moduleIndex]);
      }
    }
    setLoading(false);
  }, [params.id, params.n]);

  if (loading) return <div className="p-8">Loading module...</div>;
  if (!module) return <div className="p-8 text-red-600">Module not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 p-8">
      <h1 className="text-3xl font-bold mb-4">{module.title}</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Objectives</h2>
        <ul className="list-disc list-inside">
          {module.objectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Resources</h2>
        <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto">
          {JSON.stringify(module.resources, null, 2)}
        </pre>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Daily Plan</h2>
        <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto">
          {JSON.stringify(module.daily_plan, null, 2)}
        </pre>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Quiz</h2>
        {module.quiz && module.quiz.questions ? (
          <Quiz quiz={module.quiz as QuizBlock} onComplete={() => {}} />
        ) : (
          <div>No quiz available for this module.</div>
        )}
      </div>
      <button
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        onClick={() => {
          const nextModule = parseInt(params.n, 10) + 1;
          window.location.href = `/course/${params.id}/module/${nextModule}`;
        }}
      >
        Finish Module
      </button>
    </div>
  );
}

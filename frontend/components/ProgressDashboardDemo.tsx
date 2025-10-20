"use client";

import React, { useState } from "react";
import { ProgressDashboard } from "./ProgressDashboard";
import { Play, RefreshCw, BookOpen, TrendingUp } from "lucide-react";

const progressScenarios = {
  justStarted: {
    totalModules: 6,
    completedModules: 0,
    completionPercentage: 0,
    totalTimeSpent: 0,
    averageQuizScore: undefined,
    lastActivity: undefined,
    modules: [],
  },
  halfway: {
    totalModules: 6,
    completedModules: 3,
    completionPercentage: 50,
    totalTimeSpent: 360,
    averageQuizScore: 75,
    lastActivity: new Date().toISOString(),
    modules: [],
  },
  almostDone: {
    totalModules: 6,
    completedModules: 5,
    completionPercentage: 83,
    totalTimeSpent: 720,
    averageQuizScore: 82,
    lastActivity: new Date().toISOString(),
    modules: [],
  },
  completed: {
    totalModules: 6,
    completedModules: 6,
    completionPercentage: 100,
    totalTimeSpent: 900,
    averageQuizScore: 88,
    lastActivity: new Date().toISOString(),
    modules: [],
  },
} as const;

type ScenarioKey = keyof typeof progressScenarios;

const scenarios: Array<{
  key: ScenarioKey;
  label: string;
  description: string;
}> = [
  {
    key: "justStarted",
    label: "Just Started",
    description: "Brand new learner, no progress yet",
  },
  {
    key: "halfway",
    label: "Making Progress",
    description: "50% complete, actively learning",
  },
  {
    key: "almostDone",
    label: "Nearly Finished",
    description: "83% complete, almost graduated",
  },
  {
    key: "completed",
    label: "Course Complete",
    description: "100% finished, ready for next challenge",
  },
];

export function ProgressDashboardDemo() {
  const [currentScenario, setCurrentScenario] =
    useState<ScenarioKey>("halfway");
  const [demoMode, setDemoMode] = useState(true);

  const currentData = (() => {
    const base = progressScenarios[currentScenario];
    return {
      course: {
        id: "demo_course",
        title: "Demo Course",
        duration: "6 weeks",
        level: "Beginner",
        final_competency: "Foundations",
      } as any,
      totalModules: base.totalModules,
      completedModules: base.completedModules,
      completionPercentage: base.completionPercentage,
      totalTimeSpent: base.totalTimeSpent,
      averageQuizScore: base.averageQuizScore,
      estimatedTimeRemaining: Math.max(
        0,
        (base.totalModules - base.completedModules) * 120
      ),
      lastActivity: base.lastActivity,
      modules: [],
    };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Demo Controls Header */}
      {demoMode && (
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">
                    Progress Dashboard Demo
                  </h1>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                  Interactive Preview
                </span>
              </div>

              <button
                onClick={() => setDemoMode(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Exit Demo Mode</span>
              </button>
            </div>

            {/* Scenario Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Learning Progress Scenario:
              </label>
              <div className="flex space-x-2">
                {scenarios.map((scenario) => (
                  <button
                    key={String(scenario.key)}
                    onClick={() => setCurrentScenario(scenario.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentScenario === scenario.key
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Scenario Info */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    {scenarios.find((s) => s.key === currentScenario)?.label}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {
                      scenarios.find((s) => s.key === currentScenario)
                        ?.description
                    }
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-blue-600">
                    <span>
                      {currentData.completedModules}/{currentData.totalModules}{" "}
                      modules completed
                    </span>
                    <span>
                      {currentData.completionPercentage}% overall progress
                    </span>
                    <span>
                      {Math.floor(currentData.totalTimeSpent / 60)}h{" "}
                      {currentData.totalTimeSpent % 60}m spent
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className={demoMode ? "pt-6" : ""}>
        <ProgressDashboard
          courseId="course_ai_fundamentals"
          initialData={currentData}
          demoMode={demoMode}
        />
      </div>

      {/* Demo Footer */}
      {demoMode && (
        <div className="bg-white border-t border-gray-200 p-4 mt-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>
                  🎯 <strong>Interactive Demo:</strong> Try clicking module
                  completion toggles, switching scenarios, and exploring the
                  progress visualizations.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4" />
                  <span>Updates in real-time</span>
                </div>

                <div className="text-sm text-gray-400">
                  Built with React + TypeScript + Tailwind CSS
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export individual components for flexible usage
export { ProgressDashboard } from "./ProgressDashboard";
export { ModuleCard } from "./ModuleCard";
export { ProgressSummary } from "./ProgressSummary";

// Default export for demo
export default ProgressDashboardDemo;

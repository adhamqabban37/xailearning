import React from "react";
import {
  BookOpen,
  Clock,
  Target,
  Users,
  CheckCircle,
  PlayCircle,
} from "lucide-react";

interface LearningGuideProps {
  learningGuide: {
    study_plan?: {
      total_duration?: string;
      recommended_pace?: string;
      daily_commitment?: string;
      milestones?: Array<{
        week: number;
        goal: string;
        skills: string[];
      }>;
    };
    learning_path?: Array<{
      lesson_number?: number;
      title?: string;
      duration?: string;
      difficulty?: string;
      prerequisites?: string[];
      outcomes?: string[];
    }>;
    resource_library?: {
      all_videos?: string[];
      practice_exercises?: Array<{
        lesson: string;
        exercises: Array<{
          title: string;
          description: string;
          difficulty: string;
          estimated_time: string;
        }>;
      }>;
      skill_matrix?: {
        skills: string[];
        progression: string;
      };
    };
  };
  courseTitle: string;
}

const LearningGuide: React.FC<LearningGuideProps> = ({
  learningGuide,
  courseTitle,
}) => {
  const { study_plan, learning_path, resource_library } = learningGuide;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📚 Learning Guide: {courseTitle}
        </h1>
        <p className="text-gray-600">
          Your comprehensive study plan and resource guide
        </p>
      </div>

      {/* Study Plan Overview */}
      {study_plan && (
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4 flex items-center">
            <Target className="mr-2" size={24} />
            Study Plan Overview
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="text-blue-600 mr-2" size={20} />
                <h3 className="font-medium">Total Duration</h3>
              </div>
              <p className="text-lg font-semibold text-blue-700">
                {study_plan.total_duration || "Self-paced"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Users className="text-green-600 mr-2" size={20} />
                <h3 className="font-medium">Recommended Pace</h3>
              </div>
              <p className="text-lg font-semibold text-green-700">
                {study_plan.recommended_pace || "1-2 lessons/week"}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <BookOpen className="text-purple-600 mr-2" size={20} />
                <h3 className="font-medium">Daily Commitment</h3>
              </div>
              <p className="text-lg font-semibold text-purple-700">
                {study_plan.daily_commitment || "30-60 min/day"}
              </p>
            </div>
          </div>

          {/* Milestones */}
          {study_plan.milestones && study_plan.milestones.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">
                Learning Milestones
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {study_plan.milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center mb-2">
                      <CheckCircle className="text-blue-600 mr-2" size={16} />
                      <span className="font-medium text-sm">
                        Week {milestone.week}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {milestone.goal}
                    </p>
                    {milestone.skills && milestone.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {milestone.skills.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning Path */}
      {learning_path && learning_path.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <PlayCircle className="mr-2" size={24} />
            Learning Path
          </h2>
          <div className="space-y-4">
            {learning_path.map((lesson, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-5 border-l-4 border-green-500"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {lesson.lesson_number
                      ? `Lesson ${lesson.lesson_number}: `
                      : ""}
                    {lesson.title}
                  </h3>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                    {lesson.duration || "2 hours"}
                  </span>
                </div>

                {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      Prerequisites:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {lesson.prerequisites.map((prereq, prereqIndex) => (
                        <span
                          key={prereqIndex}
                          className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
                        >
                          {prereq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {lesson.outcomes && lesson.outcomes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Learning Outcomes:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {lesson.outcomes.map((outcome, outcomeIndex) => (
                        <li key={outcomeIndex}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Library */}
      {resource_library && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="mr-2" size={24} />
            Resource Library
          </h2>

          {/* Skill Matrix */}
          {resource_library.skill_matrix && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">
                Skills You'll Master
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {resource_library.skill_matrix.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-sm text-purple-700">
                <strong>Progression:</strong>{" "}
                {resource_library.skill_matrix.progression}
              </p>
            </div>
          )}

          {/* Practice Exercises */}
          {resource_library.practice_exercises &&
            resource_library.practice_exercises.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  Practice Exercises
                </h3>
                <div className="space-y-3">
                  {resource_library.practice_exercises.map(
                    (lessonExercises, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-green-800 mb-2">
                          {lessonExercises.lesson}
                        </h4>
                        {lessonExercises.exercises &&
                          lessonExercises.exercises.length > 0 && (
                            <div className="space-y-2">
                              {lessonExercises.exercises.map(
                                (exercise, exerciseIndex) => (
                                  <div
                                    key={exerciseIndex}
                                    className="flex justify-between items-start"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {exercise.title}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {exercise.description}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                        {exercise.difficulty}
                                      </span>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {exercise.estimated_time}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Start Learning Journey
        </button>
        <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
          Download Study Plan
        </button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
          View All Resources
        </button>
      </div>
    </div>
  );
};

export default LearningGuide;

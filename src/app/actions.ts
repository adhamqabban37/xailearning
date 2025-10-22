"use server";

import { analyzeDocument } from "@/ai/flows/restructure-messy-pdf";
import { auditCourse } from "@/ai/flows/audit-course";
import type { Course, CourseAnalysis } from "@/lib/types";

/**
 * Transform AI analysis output into the UI `Course` shape.
 * - Flattens and sums time estimates for `total_estimated_time`.
 * - Normalizes resource categories and quiz items.
 * - Generates stable IDs based on indexes.
 */
function transformAnalysisToCourse(analysis: CourseAnalysis): Course {
  const allLessons = (analysis.modules || []).flatMap((m) => m.lessons || []);
  const totalTime = allLessons.reduce(
    (acc, lesson) => acc + (lesson.time_estimate_minutes || 0),
    0
  );

  return {
    course_title: analysis.course_title,
    description: `An AI-generated course on "${analysis.course_title}".`,
    total_estimated_time: `${totalTime} minutes`,
    sessions: (analysis.modules || []).map((module, sIndex) => ({
      id: `session-${sIndex}`,
      session_title: module.module_title,
      lessons: (module.lessons || []).map((lesson, lIndex) => {
        const resources = [
          ...(lesson.resources?.youtube || []).map((r) => ({
            ...r,
            type: "video" as const,
          })),
          ...(lesson.resources?.articles || []).map((r) => ({
            ...r,
            type: "article" as const,
          })),
          ...(lesson.resources?.pdfs_docs || []).map((r) => ({
            ...r,
            type: "docs" as const,
          })),
        ];

        // Debug logging for resources
        console.log(`📹 Lesson "${lesson.lesson_title}" resources:`, {
          youtube: lesson.resources?.youtube?.length || 0,
          articles: lesson.resources?.articles?.length || 0,
          pdfs_docs: lesson.resources?.pdfs_docs?.length || 0,
          total: resources.length,
        });

        // Log actual URLs for debugging
        if (lesson.resources?.youtube && lesson.resources.youtube.length > 0) {
          console.log(
            `  YouTube URLs:`,
            lesson.resources.youtube.map((v) => ({
              title: v.title,
              url: v.url,
              hasUrl: !!v.url,
              urlType: typeof v.url,
            }))
          );
        }

        return {
          id: `session-${sIndex}-lesson-${lIndex}`,
          lesson_title: lesson.lesson_title,
          content_summary: (lesson.key_points || []).join("\n"),
          content_snippet: (lesson.key_points || []).join(", "),
          key_points: lesson.key_points || [],
          resources: resources,
          quiz: (lesson.quiz || []).map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          })),
          timeEstimateMinutes: lesson.time_estimate_minutes,
        };
      }),
    })),
    checklist: [],
    readiness_score: 100,
    analysis_report: analysis,
  };
}

export async function generateCourseFromText(
  text: string,
  duration?: string
): Promise<Course | { error: string }> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 100) {
    return {
      error:
        "Please enter a substantial amount of text (at least 100 characters) to create a course.",
    };
  }
  // Cap very large inputs to keep latency/cost in check
  const MAX_CHARS = 12000; // Reduced from 16000 for faster processing
  const safeText =
    trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;

  try {
    console.log("Starting course generation from text...");

    // Add timeout wrapper for AI processing (5 minutes for Ollama)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Course generation timed out after 5 minutes")),
        300000 // 5 minutes
      );
    });

    const analysisPromise = analyzeDocument({
      textContent: safeText,
      duration: duration,
    });

    const analysis = await Promise.race([analysisPromise, timeoutPromise]);

    console.log("📊 Analysis result:", {
      hasAnalysis: !!analysis,
      hasModules: !!(analysis?.modules),
      moduleCount: analysis?.modules?.length || 0,
      courseTitle: analysis?.course_title
    });

    if (!analysis || !analysis.modules || analysis.modules.length === 0) {
      console.error("❌ Empty or invalid analysis returned from AI");
      return {
        error:
          "The AI could not generate a valid course structure. This can happen if:\n" +
          "• The content is too short or unclear\n" +
          "• The AI service is overloaded\n" +
          "• The text doesn't contain structured educational content\n\n" +
          "Try providing more detailed, structured content (e.g., lesson outlines, chapter headings).",
      };
    }

    const course = transformAnalysisToCourse(analysis);

    // Run audit in background without blocking
    auditCourse({ courseContent: JSON.stringify(analysis, null, 2) })
      .then((report) =>
        console.log("Course Audit Report:", JSON.stringify(report, null, 2))
      )
      .catch((err) => console.error("Auditing failed:", err));

    return course;
  } catch (e: any) {
    console.error("Error generating course from text:", e);
    return {
      error:
        e.message ||
        "An unexpected error occurred while generating the course. Please try again later.",
    };
  }
}

// Note: PDF uploads are handled via pages/api/upload to keep pdf-parse on the server only.

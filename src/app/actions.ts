
'use server';

import { analyzeDocument } from '@/ai/flows/restructure-messy-pdf';
import { analyzePdf } from '@/ai/flows/analyze-pdf-flow';
import type { Course, CourseAnalysis } from '@/lib/types';

function transformAnalysisToCourse(analysis: CourseAnalysis): Course {
  const allLessons = (analysis.modules || []).flatMap(m => m.lessons || []);
  const totalTime = allLessons.reduce((acc, lesson) => acc + (lesson.time_estimate_minutes || 0), 0);

  return {
    course_title: analysis.course_title,
    description: `An AI-generated course on "${analysis.course_title}".`,
    total_estimated_time: `${totalTime} minutes`,
    sessions: (analysis.modules || []).map((module, sIndex) => ({
      id: `session-${sIndex}`,
      session_title: module.module_title,
      lessons: (module.lessons || []).map((lesson, lIndex) => {
        const resources = [
          ...(lesson.resources?.youtube || []).map(r => ({ ...r, type: 'video' })),
          ...(lesson.resources?.articles || []).map(r => ({ ...r, type: 'article' })),
          ...(lesson.resources?.pdfs_docs || []).map(r => ({ ...r, type: 'docs' })),
        ];

        return {
          id: `session-${sIndex}-lesson-${lIndex}`,
          lesson_title: lesson.lesson_title,
          content_summary: (lesson.key_points || []).join('\n'),
          content_snippet: (lesson.key_points || []).join(', '),
          key_points: lesson.key_points || [],
          resources: resources,
          quiz: (lesson.quiz || []).map(q => ({
            question: q.question,
            answer: q.answer,
            explanation: q.explanation
          })),
          timeEstimateMinutes: lesson.time_estimate_minutes,
        };
      }),
    })),
    // These fields are no longer in the new schema, but the Course type expects them.
    // We provide default/empty values to satisfy the type.
    checklist: [],
    readiness_score: 100,
    analysis_report: analysis, // Keep the full report for detailed view if needed
  };
}

export async function generateCourseFromText(text: string, duration?: string): Promise<Course | { error: string }> {
  if (!text.trim() || text.length < 100) {
    return { error: 'Please enter a substantial amount of text (at least 100 characters) to create a course.' };
  }
  try {
    const analysis = await analyzeDocument({ textContent: text, duration: duration });

    if (!analysis || !analysis.modules || analysis.modules.length === 0) {
        return { error: 'The AI could not analyze the provided text. Please try again with different content.' };
    }

    const course = transformAnalysisToCourse(analysis);
    
    return course;
  } catch (e: any) {
    console.error('Error generating course:', e);
    return { error: e.message || 'An unexpected error occurred while generating the course. Please try again later.' };
  }
}

export async function generateCourseFromPdf(formData: FormData): Promise<Course | { error: string }> {
  const file = formData.get('pdfFile') as File | null;
  const duration = formData.get('duration') as string | undefined;

  if (!file) {
    return { error: 'No PDF file found in the form data.' };
  }
  
  if (file.type !== 'application/pdf') {
    return { error: 'Invalid file type. Please upload a PDF.' };
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const pdfDataUri = `data:application/pdf;base64,${fileBuffer.toString('base64')}`;

    const analysis = await analyzePdf({ pdfDataUri, duration });
    
    if (!analysis || !analysis.modules || analysis.modules.length === 0) {
        return { error: 'The AI could not analyze the provided PDF. It might be empty, corrupted, or an image-only PDF.' };
    }

    const course = transformAnalysisToCourse(analysis);

    return course;
  } catch (error: any) {
    console.error('Error processing PDF with AI:', error);
    return { error: error.message || 'Failed to process the PDF file. Please ensure it is a valid PDF.' };
  }
}

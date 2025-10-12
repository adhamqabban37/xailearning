
'use server';

import { analyzeDocument } from '@/ai/flows/restructure-messy-pdf';
import { analyzePdf } from '@/ai/flows/analyze-pdf-flow';
import type { Course, CourseAnalysis } from '@/lib/types';

function transformAnalysisToCourse(analysis: CourseAnalysis): Course {
  return {
    course_title: analysis.document_summary.type,
    description: `An AI-generated course based on the analyzed document.`,
    total_estimated_time: analysis.document_summary.total_estimated_time || 'Not estimated',
    sessions: (analysis.suggested_structure || []).map((session, sIndex) => ({
      id: `session-${sIndex}`,
      session_title: session.module_title,
      lessons: (session.lessons || []).map((lesson, lIndex) => ({
        id: `session-${sIndex}-lesson-${lIndex}`,
        lesson_title: lesson.lesson_title,
        content_summary: (lesson.key_points || []).join('\n'),
        content_snippet: (lesson.key_points || []).join(', '),
        key_points: lesson.key_points || [],
        resources: lesson.resources ? lesson.resources.map(r => ({ title: r.title, type: r.type, url: r.url })) : [],
      })),
    })),
    checklist: analysis.improvement_recommendations,
    readiness_score: parseInt(analysis.readiness_score.replace('%', ''), 10),
    analysis_report: analysis, // Keep the full report for detailed view
  };
}

export async function generateCourseFromText(text: string, duration?: string): Promise<Course | { error: string }> {
  if (!text.trim() || text.length < 100) {
    return { error: 'Please enter a substantial amount of text (at least 100 characters) to create a course.' };
  }
  try {
    const analysis = await analyzeDocument({ textContent: text, duration: duration });

    if (!analysis || !analysis.suggested_structure || analysis.suggested_structure.length === 0) {
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
    
    if (!analysis || !analysis.suggested_structure || analysis.suggested_structure.length === 0) {
        return { error: 'The AI could not analyze the provided PDF. It might be empty, corrupted, or an image-only PDF.' };
    }

    const course = transformAnalysisToCourse(analysis);

    return course;
  } catch (error: any) {
    console.error('Error processing PDF with AI:', error);
    return { error: error.message || 'Failed to process the PDF file. Please ensure it is a valid PDF.' };
  }
}

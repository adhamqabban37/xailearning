
'use server';

import { analyzeDocument } from '@/ai/flows/restructure-messy-pdf';
import { auditCourse } from '@/ai/flows/audit-course';
import type { Course, CourseAnalysis } from '@/lib/types';
import pdf from 'pdf-parse/lib/pdf-parse.js';

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
          ...(lesson.resources?.youtube || []).map(r => ({ ...r, type: 'video' as const })),
          ...(lesson.resources?.articles || []).map(r => ({ ...r, type: 'article' as const })),
          ...(lesson.resources?.pdfs_docs || []).map(r => ({ ...r, type: 'docs' as const })),
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
            options: q.options,
            answer: q.answer,
            explanation: q.explanation
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

export async function generateCourseFromText(text: string, duration?: string): Promise<Course | { error: string }> {
  if (!text.trim() || text.length < 100) {
    return { error: 'Please enter a substantial amount of text (at least 100 characters) to create a course.' };
  }
  
  try {
    console.log('Starting course generation from text...');
    const analysis = await analyzeDocument({ textContent: text, duration: duration });

    if (!analysis || !analysis.modules || analysis.modules.length === 0) {
      return { error: 'The AI could not analyze the provided text. Please try again with different content.' };
    }

    const course = transformAnalysisToCourse(analysis);
    
    auditCourse({ courseContent: JSON.stringify(analysis, null, 2) })
      .then(report => console.log('Course Audit Report:', JSON.stringify(report, null, 2)))
      .catch(err => console.error('Auditing failed:', err));

    return course;
  } catch (e: any) {
    console.error('Error generating course from text:', e);
    return { error: e.message || 'An unexpected error occurred while generating the course. Please try again later.' };
  }
}

export async function generateCourseFromPdf(formData: FormData): Promise<Course | { error: string }> {
  const file = formData.get('file') as File;
  const duration = formData.get('duration') as string | undefined;

  if (!file) {
    return { error: "No file was uploaded." };
  }
  
  if (file.type !== 'application/pdf') {
    return { error: "Invalid file type. Please upload a PDF." };
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
      return { error: `File is too large. Please upload a PDF smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    
    if (!data.text || data.text.trim().length < 100) {
        return { error: 'The PDF content is too short or could not be extracted. Please try a different PDF.' };
    }

    return await generateCourseFromText(data.text, duration);

  } catch (e: any) {
    console.error("Error processing PDF on server:", e);
    if (e.message?.includes('is not a PDF file')) {
        return { error: 'The uploaded file does not appear to be a valid PDF.' };
    }
    return { error: "There was an error processing your PDF file. It might be corrupted or in an unsupported format." };
  }
}

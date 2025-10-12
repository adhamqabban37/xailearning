
'use server';

import { analyzeDocument } from '@/ai/flows/restructure-messy-pdf';
import { auditCourse } from '@/ai/flows/audit-course';
import type { Course, CourseAnalysis } from '@/lib/types';
import { Buffer } from 'buffer';
import pdf from 'pdf-parse';

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
    checklist: [], // This can be populated by the audit if needed
    readiness_score: 100, // Placeholder, can be calculated from audit
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
    
    // Asynchronously audit the generated course (non-blocking)
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
  const file = formData.get('pdfFile') as File | null;
  const duration = formData.get('duration') as string | undefined;

  if (!file) {
    return { error: 'No PDF file found. Please upload a file.' };
  }
  
  if (file.type !== 'application/pdf') {
    return { error: 'Invalid file type. Please upload a PDF.' };
  }

  // Validate file size (e.g., max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { error: 'PDF file is too large. Please upload a file smaller than 10MB.' };
  }

  try {
    console.log(`Processing PDF: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdf(buffer);
    const textContent = data.text;
    
    if (!textContent.trim() || textContent.length < 100) {
      return { error: 'The PDF appears to be empty or does not contain enough selectable text to create a course.' };
    }
    
    return await generateCourseFromText(textContent, duration);

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    
    if (error.message?.includes('Invalid PDF')) {
      return { error: 'The uploaded file is not a valid PDF. Please check the file and try again.' };
    }
    
    return { error: error.message || 'Failed to process the PDF file. Please ensure it is a valid, text-based PDF.' };
  }
}


'use server';

import { restructureMessyPdf } from '@/ai/flows/restructure-messy-pdf';
import type { Course } from '@/lib/types';
import type { Buffer } from 'node:buffer';

export async function generateCourseFromText(text: string): Promise<Course | { error: string }> {
  if (!text.trim() || text.length < 100) {
    return { error: 'Please enter a substantial amount of text (at least 100 characters) to create a course.' };
  }
  try {
    const structuredContent = await restructureMessyPdf({ pdfText: text });

    if (!structuredContent || !structuredContent.sessions || structuredContent.sessions.length === 0) {
        return { error: 'The AI could not structure a course from the provided text. Please try again with different content.' };
    }

    // Add unique IDs to sessions and lessons for client-side tracking
    const courseWithIds: Course = {
      ...structuredContent,
      sessions: structuredContent.sessions.map((session, sIndex) => ({
        ...session,
        id: `session-${sIndex}`,
        lessons: session.lessons.map((lesson, lIndex) => ({
          ...lesson,
          id: `session-${sIndex}-lesson-${lIndex}`,
        })),
      })),
    };

    return courseWithIds;
  } catch (e: any) {
    console.error('Error generating course:', e);
    return { error: e.message || 'An unexpected error occurred while generating the course. Please try again later.' };
  }
}

export async function generateCourseFromPdf(formData: FormData): Promise<Course | { error: string }> {
  const file = formData.get('pdfFile') as File | null;

  if (!file) {
    return { error: 'No PDF file found in the form data.' };
  }
  
  try {
    const pdf = (await import('pdf-parse')).default;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(fileBuffer);
    return generateCourseFromText(data.text);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return { error: 'Failed to process the PDF file. Please ensure it is a valid PDF.' };
  }
}

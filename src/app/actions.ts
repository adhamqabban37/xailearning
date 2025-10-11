
'use server';

import { restructureMessyPdf } from '@/ai/flows/restructure-messy-pdf';
import type { Course } from '@/lib/types';
// Dynamically import pdf-parse to avoid server-side bundling issues.
// import pdf from 'pdf-parse';

export async function generateCourseFromText(text: string): Promise<Course | { error: string }> {
  if (!text.trim() || text.length < 100) {
    return { error: 'Please enter a substantial amount of text (at least 100 characters) to create a course.' };
  }
  try {
    const structuredContent = await restructureMessyPdf({ pdfText: text });

    if (!structuredContent || !structuredContent.sessions || structuredContent.sessions.length === 0) {
        return { error: 'The AI could not structure a course from the provided text. Please try again with different content.' };
    }

    // Add unique IDs to sessions and steps for client-side tracking
    const courseWithIds: Course = {
      ...structuredContent,
      sessions: structuredContent.sessions.map((session, sIndex) => ({
        ...session,
        title: session.title || `Session ${sIndex + 1}`,
        id: `session-${sIndex}`,
        steps: session.steps.map((step, stIndex) => ({
          ...step,
          title: step.title || `Step ${stIndex + 1}`,
          id: `session-${sIndex}-step-${stIndex}`,
        })),
      })),
    };

    return courseWithIds;
  } catch (e) {
    console.error('Error generating course:', e);
    return { error: 'An unexpected error occurred while generating the course. Please try again later.' };
  }
}

export async function generateCourseFromPdf(fileBuffer: Buffer): Promise<Course | { error: string }> {
  try {
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(fileBuffer);
    return generateCourseFromText(data.text);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return { error: 'Failed to process the PDF file. Please ensure it is a valid PDF.' };
  }
}

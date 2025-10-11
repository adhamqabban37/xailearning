'use server';

/**
 * @fileOverview A Genkit flow to restructure messy PDFs into a coherent course structure.
 *
 * - restructureMessyPdf - A function that handles the restructuring of messy PDFs.
 * - RestructureMessyPdfInput - The input type for the restructureMessyPdf function.
 * - RestructureMessyPdfOutput - The return type for the restructureMessyPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RestructureMessyPdfInputSchema = z.object({
  pdfText: z
    .string()
    .describe('The text content extracted from the PDF document.'),
});
export type RestructureMessyPdfInput = z.infer<typeof RestructureMessyPdfInputSchema>;

const ResourceSchema = z.object({
  title: z.string().describe('The title of the resource.'),
  type: z.string().describe('The type of resource (e.g., video, article).'),
  url: z.string().url().describe('The URL of the resource.'),
});

const QuizQuestionSchema = z.object({
    question: z.string().describe('The quiz question.'),
    options: z.array(z.string()).optional().describe('A list of possible answers for multiple-choice questions.'),
    answer: z.string().describe('The correct answer to the question.'),
});

const LessonSchema = z.object({
    lesson_title: z.string().describe("The title of the lesson."),
    content_summary: z.string().describe("A summary of the lesson's content."),
    resources: z.array(ResourceSchema).optional().describe("A list of external resources for the lesson."),
    quiz: z.array(QuizQuestionSchema).optional().describe("A list of quiz questions for the lesson."),
    timeEstimateMinutes: z.number().optional().describe('Estimated time in minutes to complete the lesson.'),
});


const SessionSchema = z.object({
  session_title: z.string().describe('The title of the session.'),
  estimated_time: z.string().optional().describe('Estimated time to complete the session.'),
  lessons: z.array(LessonSchema),
});


const RestructureMessyPdfOutputSchema = z.object({
  course_title: z.string().describe("The main title of the generated course."),
  description: z.string().describe("A brief description of the course."),
  sessions: z.array(SessionSchema),
  checklist: z
    .array(z.string())
    .optional()
    .describe('A checklist of missing elements in the PDF.'),
});

export type RestructureMessyPdfOutput = z.infer<typeof RestructureMessyPdfOutputSchema>;

export async function restructureMessyPdf(
  input: RestructureMessyPdfInput
): Promise<RestructureMessyPdfOutput> {
  return restructureMessyPdfFlow(input);
}

const restructureMessyPdfPrompt = ai.definePrompt({
  name: 'restructureMessyPdfPrompt',
  input: {schema: RestructureMessyPdfInputSchema},
  output: {schema: RestructureMessyPdfOutputSchema},
  prompt: `You are an expert instructional designer, AI researcher, and content curator. Your job is to analyze any given text, PDF, or document and transform it into a structured, interactive learning experience for the learner.

OBJECTIVE:
Take the provided text (which can come from a prompt, document, or pasted content) and convert it into a complete AI-powered learning roadmap, ready for use as an online course.

🧠 MANDATORY ANALYSIS INSTRUCTIONS

Course Structure Detection

Identify and organize the document into clear sessions, lessons, and steps, even if the text uses different labels (e.g., Day 1, Module 2, Part 3, etc.).

Generate missing or unclear titles automatically for any unnamed sections.

Add short, descriptive subtitles if missing.

Time Estimates

Detect and extract all mentions of time (e.g., “15 minutes,” “2 hours”).

If missing, suggest reasonable default estimates (e.g., 10 minutes per lesson, 5 minutes per quiz).

Resource Extraction

Extract all external resources such as YouTube videos, articles, PDFs, or references.

If none exist, search and recommend 3–5 high-quality external resources (YouTube, official docs, blogs) relevant to the lesson topics.

Always return resources in this format:

{
  "title": "Intro to Neural Networks - YouTube",
  "type": "video",
  "url": "https://www.youtube.com/watch?v=aircAruvnKk"
}


Quiz Generation

Create 3–5 quiz questions per session that check for understanding of the material.

Use multiple-choice, true/false, or short-answer formats.

Example format:

{
  "question": "What is a neural network?",
  "options": ["A computer", "A learning algorithm", "A data storage system"],
  "answer": "A learning algorithm"
}


Checklist Creation

Generate a missing-elements checklist, noting anything the user needs to complete or clarify (e.g., missing titles, unclear time estimates, no external resources).

Formatting & Output

Return your entire analysis in clean, organized JSON for easy parsing.

Here is the text to analyze:

{{{pdfText}}}

Return the data in the specified JSON format.
`,
});

const restructureMessyPdfFlow = ai.defineFlow(
  {
    name: 'restructureMessyPdfFlow',
    inputSchema: RestructureMessyPdfInputSchema,
    outputSchema: RestructureMessyPdfOutputSchema,
  },
  async input => {
    const {output} = await restructureMessyPdfPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a course structure.");
    }
    return output;
  }
);


'use server';

/**
 * @fileOverview A Genkit flow to analyze a PDF document and check its readiness for course creation.
 *
 * - analyzePdf - A function that handles the document analysis from a PDF file.
 * - AnalyzePdfInput - The input type for the analyzePdf function.
 * - AnalyzeDocumentOutput - The return type from the shared schema.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {AnalyzeDocumentOutputSchema, type AnalyzeDocumentOutput} from './schemas';

const AnalyzePdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  duration: z.string().optional().describe('The desired course length (e.g., short, medium, long).'),
});
export type AnalyzePdfInput = z.infer<typeof AnalyzePdfInputSchema>;


export async function analyzePdf(
  input: AnalyzePdfInput
): Promise<AnalyzeDocumentOutput> {
  return analyzePdfFlow(input);
}

const analyzePdfPrompt = ai.definePrompt({
  name: 'analyzePdfPrompt',
  input: {schema: AnalyzePdfInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert AI instructional designer, course architect, and content curator.
Your task is to generate a complete, interactive, and engaging course from the provided document.

Requirements:

Lesson Sequencing:

Organize the course from easiest concepts to most advanced.
Reorder lessons if needed for logical progression.
Show dependencies between lessons explicitly if you detect them.

Interactivity:

Include short quizzes (3–5 questions per lesson) to check understanding.
Include mini-projects, exercises, or prompts for active learning in each module.
Suggest discussion prompts or reflection tasks where appropriate.

External Resources:

Include valid, working URLs for YouTube videos, articles, and documentation.
Provide clickable links with clear titles. For videos, suggest relevant timestamps if possible.
Ensure resources are high-quality, recent (2021+), and authoritative.

Course Flow & Engagement:

Each lesson should have a short hook to capture learner interest.
Key points should be concise and actionable.
Include estimated time per lesson for pacing guidance.

Here is the PDF to analyze:

{{{media url=pdfDataUri}}}
`,
});

const analyzePdfFlow = ai.defineFlow(
  {
    name: 'analyzePdfFlow',
    inputSchema: AnalyzePdfInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async input => {
    const {output} = await analyzePdfPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a document analysis.");
    }
    return output;
  }
);

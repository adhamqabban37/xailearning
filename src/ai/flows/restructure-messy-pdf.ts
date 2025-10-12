
'use server';

/**
 * @fileOverview A Genkit flow to analyze a document and check its readiness for course creation.
 *
 * - analyzeDocument - A function that handles the document analysis.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {AnalyzeDocumentOutputSchema, type AnalyzeDocumentOutput} from './schemas';

const AnalyzeDocumentInputSchema = z.object({
  textContent: z
    .string()
    .describe('The text content extracted from the document.'),
  duration: z.string().optional().describe('The desired course length (e.g., short, medium, long).'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

export async function analyzeDocument(
  input: AnalyzeDocumentInput
): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const analyzeDocumentPrompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert AI instructional designer, course architect, and content curator.
Your task is to generate a complete, interactive, and engaging course from the provided text content.

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

Here is the text to analyze:

{{{textContent}}}
`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await analyzeDocumentPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a document analysis.");
    }
    return output;
  }
);

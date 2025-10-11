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

const RestructureMessyPdfOutputSchema = z.object({
  sessions: z.array(
    z.object({
      title: z.string().describe('The title of the session.'),
      steps: z.array(
        z.object({
          title: z.string().describe('The title of the step.'),
          content: z.string().describe('The content of the step.'),
          timeEstimateMinutes: z
            .number()
            .optional()
            .describe('Estimated time in minutes to complete the step.'),
          resources: z
            .array(
              z.object({
                title: z.string().describe('The title of the resource.'),
                url: z.string().describe('The URL of the resource.'),
              })
            )
            .optional(),
          quizQuestions: z
            .array(
              z.object({
                question: z.string().describe('The quiz question.'),
                answer: z.string().describe('The answer to the question.'),
              })
            )
            .optional(),
        })
      ),
    })
  ),
  missingElementsChecklist: z
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
  prompt: `You are an AI expert in course content organization.
Your task is to take the text extracted from a messy PDF and restructure it into a coherent course structure.

Specifically, you need to:

1.  Detect sessions, lessons, and steps even if the labels vary (e.g., Day/Module/Week/Lesson).
2.  Suggest missing titles for sessions and steps if they are not clearly provided in the text.
3.  Identify and extract the content for each step.
4.  Pull out time mentions (minutes/hours) and convert them to clear per-step estimates. If missing, suggest defaults.
5.  Capture and deduplicate all external resources: YouTube videos, articles, docs; label them clearly (Title + URL).
6.  Extract quiz questions if they are present in the text. Do not generate new ones.
7.  Create a checklist of any missing elements (titles, steps, estimates, resources, quizzes) that the user may need to add.

Here is the PDF text:

{{{pdfText}}}

Return the data in JSON format based on the following schema:
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
    return output!;
  }
);


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
  prompt: `You are a senior AI systems engineer and instructional content architect.
Your task is to power and stabilize the AI-driven analysis pipeline for an educational learning platform.
This system converts pasted text into structured, validated, ready-to-learn course data.

Analyze the uploaded text content and perform the following checks and outputs.

The user has specified that the desired length of the course should be {{{duration}}}. Please tailor the number of sessions and lessons, and the depth of the content, to fit this duration.

AI TASK FLOW
Step 1 — Input Handling
Accept the pasted text.

Step 2 — Text Extraction and Cleaning
Your main task is to analyze the provided text.
Remove extra whitespace, broken words, symbols, and irrelevant headers/footers.
Retain bullet points, numbered steps, and tables if present.
Validate text completeness by detecting truncated or missing paragraphs.

Step 3 — Structure Detection
Detect any hierarchy such as:
Modules / Sections / Days / Lessons
Subtopics / Steps / Exercises
Generate missing titles if needed.
Group all related paragraphs under the proper structure.

Step 4 — Resource Detection
Identify external resources:
YouTube links, articles, PDFs, references
Validate all links with real URLs (no placeholders).
If URLs are missing but referenced (e.g. “See video below”), flag them.

Step 5 — Quality & Error Debugging
Detect and report the following:
Broken formatting or repeated text
Missing or unclear lesson titles
Sections with no content
Empty resources or broken URLs
Excessive or missing whitespace

Step 6 — Add Interactive Elements
For each lesson, add the following:
- time_estimate_minutes: An integer representing the estimated time to complete the lesson.
- quiz: An array with 1-2 quiz questions (question, answer, and optional explanation) to check understanding.

Step 7 — Output & Integration JSON
Generate final structured output for front-end use. Adhere strictly to the JSON schema.

MANDATORY OUTPUT RULES
Always output valid JSON.
Include text cleanliness, readiness score, and issue log.
Ensure extraction and structuring steps never crash if data is incomplete.
Provide actionable fixes in “improvement_recommendations.”

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
  async input => {
    const {output} = await analyzeDocumentPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a document analysis.");
    }
    return output;
  }
);

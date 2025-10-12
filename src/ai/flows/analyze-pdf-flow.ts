
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
  prompt: `You are a senior AI systems engineer and instructional content architect.
Your task is to power and stabilize the AI-driven PDF analysis pipeline for an educational learning platform.
This system converts uploaded PDFs into structured, validated, ready-to-learn course data.

Analyze the uploaded PDF content and perform the following checks and outputs.

The user has specified that the desired length of the course should be {{{duration}}}. Please tailor the number of sessions and lessons, and the depth of the content, to fit this duration.

AI TASK FLOW
Step 1 — Input Handling
Accept the uploaded PDF.
Automatically detect if the PDF is scanned or digital.
If scanned (image-based), recommend OCR reprocessing in the debug_report.

Step 2 — Text Extraction and Cleaning
Internally, you will receive cleaned text. Your job is to analyze its structure.
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

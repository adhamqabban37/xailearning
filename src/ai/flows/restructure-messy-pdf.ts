
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

const AnalyzeDocumentInputSchema = z.object({
  textContent: z
    .string()
    .describe('The text content extracted from the document.'),
  duration: z.string().optional().describe('The desired course length (e.g., short, medium, long).'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;


// Defines the detailed JSON structure for the AI's analysis output.
const FileCheckSchema = z.object({
  status: z.string().describe('Status of text extraction, e.g., "clean" or "issues_detected".'),
  issues: z.array(z.string()).optional().describe('A list of issues found during extraction.'),
});

const DocumentSummarySchema = z.object({
  type: z.string().describe('The detected document type (e.g., roadmap, book, article).'),
  sections_detected: z.number().describe('Number of main sections or chapters found.'),
  lessons_detected: z.number().describe('Total number of lessons or sub-sections found.'),
  detected_structure_confidence: z.string().describe('Confidence score for the detected structure, as a percentage.'),
  total_estimated_time: z.string().optional().describe("The total estimated time to complete the course."),
});

const SuggestedLessonSchema = z.object({
  lesson_title: z.string().describe("The title of the lesson."),
  key_points: z.array(z.string()).describe("A brief list of key points for the lesson's content."),
});

const SuggestedModuleSchema = z.object({
  module_title: z.string().describe('The title of the module/session.'),
  lessons: z.array(SuggestedLessonSchema),
});

const DebugReportSchema = z.object({
    scanned_pdf_detected: z.boolean().describe('Whether the document appears to be a scanned PDF.'),
    text_cleanliness: z.string().describe('A percentage score representing the cleanliness of the extracted text.'),
    missing_elements: z.array(z.string()).describe('A list of elements that are missing from the content.'),
});

export const AnalyzeDocumentOutputSchema = z.object({
  file_check: FileCheckSchema,
  document_summary: DocumentSummarySchema,
  suggested_structure: z.array(SuggestedModuleSchema),
  readiness_score: z.string().describe('A percentage score (e.g., "89%") indicating suitability for course generation.'),
  debug_report: DebugReportSchema,
  improvement_recommendations: z
    .array(z.string())
    .describe('A list of suggestions to improve the content.'),
});

export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;


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

Step 6 — Output & Integration JSON
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

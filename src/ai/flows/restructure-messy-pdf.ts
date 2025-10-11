
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

const FileCheckSchema = z.object({
  status: z
    .string()
    .describe('Status of text extraction, e.g., "clean" or "issues_detected".'),
  issues: z.array(z.string()).optional().describe('A list of issues found during extraction.'),
});

const DocumentSummarySchema = z.object({
  type: z.string().describe('The detected document type (e.g., roadmap, book, article).'),
  sections_detected: z.number().describe('Number of main sections or chapters found.'),
  lessons_detected: z.number().describe('Total number of lessons or sub-sections found.'),
  total_estimated_time: z.string().describe("The total estimated time to complete the course."),
});

const SuggestedLessonSchema = z.object({
  lesson_title: z.string().describe("The title of the lesson."),
  content_snippet: z.string().describe("A brief snippet of the lesson's content."),
});

const SuggestedSessionSchema = z.object({
  session_title: z.string().describe('The title of the session.'),
  lessons: z.array(SuggestedLessonSchema),
});


export const AnalyzeDocumentOutputSchema = z.object({
  file_check: FileCheckSchema,
  document_summary: DocumentSummarySchema,
  suggested_structure: z.array(SuggestedSessionSchema),
  readiness_score: z.number().min(0).max(100).describe('A percentage score (0-100) indicating suitability for course generation.'),
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
  prompt: `You are an expert instructional designer and AI content analyst. Your job is to analyze the provided text and determine its suitability for being transformed into a structured learning course. Adhere strictly to the provided JSON schema for your response.

The user has specified that the desired length of the course should be {{{duration}}}. Please tailor the number of sessions and lessons, and the depth of the content, to fit this duration.

Analyze the uploaded text content and perform the following checks and outputs:

1. Extraction Debugging
Confirm whether the text was extracted cleanly.
Detect the document type (e.g., roadmap, book, article, notes, syllabus).
Return a summary of the document structure.
Also, calculate and return the total estimated time required to learn all the content.

2. Content Structuring
Identify modules / sessions / lessons automatically.
Generate missing section titles if not found.
Group similar paragraphs together logically under the right headings.

3. Integrity & Completeness Check
Report missing elements such as:
- Titles not detected
- Empty or unclear lesson content
- Missing resource links or references
- Repetitive or duplicated text

4. Learning Suitability Report
Determine if the text is suitable for course generation with a numerical score.
Suggest improvements like “Split long section into multiple lessons” or “Add learning objectives.” If the score is less than 85, you must provide at least 3 improvement recommendations.

5. Output Format (JSON)
Return the entire analysis in the specified JSON format. Do not include any commentary outside the JSON structure.

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

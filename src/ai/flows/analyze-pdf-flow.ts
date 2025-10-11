
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
import {AnalyzeDocumentOutputSchema, type AnalyzeDocumentOutput} from './restructure-messy-pdf';

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
  prompt: `You are an expert instructional designer and AI content analyst. Your job is to analyze the provided PDF document and determine its suitability for being transformed into a structured learning course. Adhere strictly to the provided JSON schema for your response.

The user has specified that the desired length of the course should be {{{duration}}}. Please tailor the number of sessions and lessons, and the depth of the content, to fit this duration.

Analyze the uploaded PDF content and perform the following checks and outputs:

1. Extraction Debugging
Confirm whether the text was extracted cleanly.
Identify if the PDF seems to have scanned/image-based text.
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

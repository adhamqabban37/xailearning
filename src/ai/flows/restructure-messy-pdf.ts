"use server";

/**
 * @fileOverview A Genkit flow to analyze a document and check its readiness for course creation.
 *
 * - analyzeDocument - A function that handles the document analysis.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import { ai, geminiPro, generationConfig } from "@/ai/genkit";
import { z } from "genkit";
import {
  AnalyzeDocumentOutputSchema,
  type AnalyzeDocumentOutput,
} from "./schemas";

const AnalyzeDocumentInputSchema = z.object({
  textContent: z
    .string()
    .describe("The text content extracted from the document."),
  duration: z
    .string()
    .optional()
    .describe("The desired course length (e.g., short, medium, long)."),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

export async function analyzeDocument(
  input: AnalyzeDocumentInput
): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const analyzeDocumentPrompt = ai.definePrompt({
  name: "analyzeDocumentPrompt",
  model: geminiPro,
  config: generationConfig,
  input: { schema: AnalyzeDocumentInputSchema },
  output: { schema: AnalyzeDocumentOutputSchema },
  prompt: `You are an expert AI instructional designer. Generate a structured course from the provided text.

REQUIREMENTS:
1. Create 2-4 modules, each with 2-4 lessons
2. Each lesson must have: title, 3-5 key points, 1-3 MCQs with 4 options each, external resources
3. Organize from basic to advanced concepts
4. Keep responses concise and focused

QUIZ FORMAT:
- One correct answer + 3 plausible distractors
- Questions directly related to lesson content
- Type: "MCQ"

RESOURCES:
- Include 1-2 relevant YouTube videos, articles, or docs per lesson
- Use real, working URLs when possible

Content to analyze:
{{{textContent}}}`,
});

export const analyzeDocumentFlow = ai.defineFlow(
  {
    name: "analyzeDocumentFlow",
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeDocumentPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a document analysis.");
    }
    return output;
  }
);

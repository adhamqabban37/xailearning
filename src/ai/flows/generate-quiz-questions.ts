"use server";

/**
 * @fileOverview This file defines a Genkit flow to generate quiz questions from text content.
 *
 * The flow takes text content as input and generates a set of quiz questions with answers and explanations.
 *
 * @file GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * @file GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 * @file generateQuizQuestions - a function that handles the quiz questions generation process.
 */

import { ai, geminiPro, generationConfig } from "@/ai/genkit";
import { z } from "genkit";

const GenerateQuizQuestionsInputSchema = z.object({
  textContent: z
    .string()
    .describe("The text content to generate quiz questions from."),
});

export type GenerateQuizQuestionsInput = z.infer<
  typeof GenerateQuizQuestionsInputSchema
>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe("The quiz question."),
        type: z
          .literal("MCQ")
          .describe("The type of quiz question - always MCQ."),
        options: z
          .array(z.string())
          .describe("Array of 4 answer choices (3 distractors + 1 correct)."),
        answer: z.string().describe("The correct answer to the question."),
        explanation: z.string().describe("Explanation of the answer."),
      })
    )
    .describe("The generated multiple-choice quiz questions."),
});

export type GenerateQuizQuestionsOutput = z.infer<
  typeof GenerateQuizQuestionsOutputSchema
>;

export async function generateQuizQuestions(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const generateQuizQuestionsPrompt = ai.definePrompt({
  name: "generateQuizQuestionsPrompt",
  model: geminiPro,
  config: generationConfig,
  input: { schema: GenerateQuizQuestionsInputSchema },
  output: { schema: GenerateQuizQuestionsOutputSchema },
  prompt: `You are an expert educator creating multiple-choice quizzes to test understanding of course content.

  Based on the following text content, generate 3-5 multiple-choice quiz questions. Each question MUST have:
  - One correct answer
  - 3 plausible distractors (incorrect but reasonable options)
  - A brief explanation of why the correct answer is right
  - All options should be clearly related to the lesson content

  Text Content: {{{textContent}}}

  Format the questions as a JSON array with this EXACT structure:
  [{
    "question": "The quiz question.",
    "type": "MCQ",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option B",
    "explanation": "Brief explanation of why this is correct."
  }]

  Make sure the "answer" field exactly matches one of the items in the "options" array.
  `,
});

export const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: "generateQuizQuestionsFlow",
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuizQuestionsPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate quiz questions.");
    }
    return output;
  }
);

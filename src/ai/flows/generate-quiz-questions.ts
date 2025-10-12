
'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate quiz questions from text content.
 *
 * The flow takes text content as input and generates a set of quiz questions with answers and explanations.
 *
 * @file GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * @file GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 * @file generateQuizQuestions - A function that handles the quiz questions generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  textContent: z.string().describe('The text content to generate quiz questions from.'),
});

export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('The quiz question.'),
        answer: z.string().describe('The correct answer to the question.'),
        explanation: z.string().describe('Explanation of the answer.'),
      })
    )
    .describe('The generated quiz questions.'),
});

export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const generateQuizQuestionsPrompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are an expert educator creating quizzes to test understanding of course content.

  Based on the following text content, generate 3-5 quiz questions with one correct answer and a short explanation for each answer.
  Make sure the questions test understanding of the key concepts in the text.

  Text Content: {{{textContent}}}

  Format the questions as a JSON array of objects with the following structure:
  [{
    "question": "The quiz question.",
    "answer": "The correct answer to the question.",
    "explanation": "Explanation of the answer."
  }]
  `,
});

const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await generateQuizQuestionsPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate quiz questions.');
    }
    return output;
  }
);

"use server";

/**
 * @fileOverview This file defines a Genkit flow to suggest missing content in a course structure.
 *
 * It takes course content as input and identifies missing elements like titles, steps, estimates, or resources.
 * The flow returns a checklist with prompts for the user to fill in the gaps.
 *
 * @fileExport suggestMissingContent - A function that suggests missing content in a course.
 * @fileExport SuggestMissingContentInput - The input type for the suggestMissingContent function.
 * @fileExport SuggestMissingContentOutput - The return type for the suggestMissingContent function.
 */

import { ai, geminiPro, generationConfig } from "@/ai/genkit";
import { z } from "genkit";

const SuggestMissingContentInputSchema = z.object({
  courseContent: z
    .string()
    .describe("The course content in PDF or text format."),
});
export type SuggestMissingContentInput = z.infer<
  typeof SuggestMissingContentInputSchema
>;

const SuggestMissingContentOutputSchema = z.object({
  missingItemsChecklist: z
    .array(z.string())
    .describe(
      "A checklist of missing items in the course content with prompts to fill the gaps."
    ),
});
export type SuggestMissingContentOutput = z.infer<
  typeof SuggestMissingContentOutputSchema
>;

export async function suggestMissingContent(
  input: SuggestMissingContentInput
): Promise<SuggestMissingContentOutput> {
  return suggestMissingContentFlow(input);
}

const suggestMissingContentPrompt = ai.definePrompt({
  name: "suggestMissingContentPrompt",
  model: geminiPro,
  config: generationConfig,
  input: { schema: SuggestMissingContentInputSchema },
  output: { schema: SuggestMissingContentOutputSchema },
  prompt: `You are an AI assistant designed to identify missing elements in course content and provide a checklist with prompts to the user to fill in the gaps.

  Analyze the following course content:
  {{{courseContent}}}

  Identify any missing elements such as session titles, lesson steps, time estimates for each step, external resources (videos, links), and quiz questions per session.

  Return a checklist of missing items with friendly prompts for the user to fill in the gaps. Be specific about what is missing and suggest how the user can add the information. Return your answer as a simple array of strings.
  `,
});

export const suggestMissingContentFlow = ai.defineFlow(
  {
    name: "suggestMissingContentFlow",
    inputSchema: SuggestMissingContentInputSchema,
    outputSchema: SuggestMissingContentOutputSchema,
  },
  async (input) => {
    const { output } = await suggestMissingContentPrompt(input);
    if (!output) {
      throw new Error("The AI failed to suggest missing content.");
    }
    return output;
  }
);

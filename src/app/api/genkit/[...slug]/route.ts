
import { nextGenkit } from '@genkit-ai/next';
import { defineFlow, run } from 'genkit';
import { z } from 'genkit/zod';
import { analyzeDocument } from '@/ai/flows/restructure-messy-pdf';
import { auditCourse } from '@/ai/flows/audit-course';
import { generateQuizQuestions } from '@/ai/flows/generate-quiz-questions';
import { suggestMissingContent } from '@/ai/flows/suggest-missing-content';

// This is your main endpoint.
// It is recommended to only define the flow you need to run here.
const courseFlow = defineFlow(
  {
    name: 'courseFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    // You can add your business logic here.
    const llmResponse = await run('run-llm', async () => {
      // Your business logic with the LLM.
    });

    return llmResponse;
  }
);

// nextGenkit() is a helper that wraps your flows and handles the incoming requests.
export const { POST } = nextGenkit({
  flows: [
    courseFlow,
    analyzeDocument, 
    auditCourse,
    generateQuizQuestions,
    suggestMissingContent
],
});

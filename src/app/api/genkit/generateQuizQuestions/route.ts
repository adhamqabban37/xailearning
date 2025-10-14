import appRoute from "@genkit-ai/next";
import { generateQuizQuestionsFlow } from "@/ai/flows/generate-quiz-questions";

export const POST = appRoute(generateQuizQuestionsFlow);

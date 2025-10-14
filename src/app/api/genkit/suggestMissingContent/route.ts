import appRoute from "@genkit-ai/next";
import { suggestMissingContentFlow } from "@/ai/flows/suggest-missing-content";

export const POST = appRoute(suggestMissingContentFlow);

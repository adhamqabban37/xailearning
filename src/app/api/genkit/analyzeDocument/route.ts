import appRoute from "@genkit-ai/next";
import { analyzeDocumentFlow } from "@/ai/flows/restructure-messy-pdf";

export const POST = appRoute(analyzeDocumentFlow);

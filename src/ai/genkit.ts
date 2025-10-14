import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import type { GeminiConfig } from "@genkit-ai/google-genai";

// Use a free-tier supported model for Google AI Studio keys
export const geminiPro = googleAI.model("gemini-2.5-flash");

// Keep config untyped to avoid tight coupling to package types across versions
export const generationConfig: GeminiConfig = {
  // As educational content can sometimes be flagged, we are disabling the safety settings
  // for this model. This should be used with caution and only for trusted content.
  safetySettings: [
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_NONE",
    },
  ],
};

export const ai = genkit({
  plugins: [
    // Initialize the Google AI plugin.
    // By not specifying apiVersion, the client will use the default stable endpoint.
    googleAI(),
  ],
});

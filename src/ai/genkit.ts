
import {genkit, GenerationCommonConfig} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Use a stable, generally available model.
export const geminiPro = googleAI.model('gemini-1.5-pro');

export const generationConfig: GenerationCommonConfig = {
  // As educational content can sometimes be flagged, we are disabling the safety settings
  // for this model. This should be used with caution and only for trusted content.
  safetySettings: [
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_NONE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_NONE',
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

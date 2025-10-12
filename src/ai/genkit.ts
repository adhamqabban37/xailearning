
import {genkit, GenerationCommonConfig} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const geminiFlash = googleAI.model('gemini-1.5-flash');

const generationConfig: GenerationCommonConfig = {
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
  plugins: [googleAI()],
  models: {
    'gemini-flash': {
      model: geminiFlash,
      config: generationConfig,
    },
  },
  model: 'googleai/gemini-1.5-flash',
});

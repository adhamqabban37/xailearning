
'use server';

/**
 * @fileOverview This file defines a Genkit flow to extract the main text content from a given URL.
 *
 * @fileExport extractTextFromUrl - A function that handles the text extraction process.
 * @fileExport ExtractTextFromUrlInput - The input type for the extractTextFromUrl function.
 * @fileExport ExtractTextFromUrlOutput - The return type for the extractFromUrl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromUrlInputSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to extract text from.'),
});
export type ExtractTextFromUrlInput = z.infer<typeof ExtractTextFromUrlInputSchema>;


const ExtractTextFromUrlOutputSchema = z.object({
  textContent: z.string().describe('The main extracted text content from the webpage.'),
});
export type ExtractTextFromUrlOutput = z.infer<typeof ExtractTextFromUrlOutputSchema>;


export async function extractTextFromUrl(
  input: ExtractTextFromUrlInput
): Promise<ExtractTextFromUrlOutput> {
  return extractTextFromUrlFlow(input);
}


const extractTextFromUrlTool = ai.defineTool(
    {
      name: 'extractTextFromUrlTool',
      description: 'Fetches the content of a webpage and returns it as a string.',
      inputSchema: z.object({ url: z.string().url() }),
      outputSchema: z.string(),
    },
    async ({ url }) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      return await response.text();
    }
  );
  

const extractTextFromUrlPrompt = ai.definePrompt({
  name: 'extractTextFromUrlPrompt',
  input: {schema: z.object({htmlContent: z.string()})},
  output: {schema: ExtractTextFromUrlOutputSchema},
  prompt: `You are a web content extraction expert. Your task is to analyze the provided HTML content and extract only the main article text. 
  
  Exclude all non-essential elements such as:
  - Navigation bars
  - Sidebars
  - Headers and footers
  - Advertisements
  - Social media sharing buttons
  - Comment sections
  
  Focus on returning the clean, readable, primary content of the page.
  
  HTML Content to process: {{{htmlContent}}}
  `,
});

const extractTextFromUrlFlow = ai.defineFlow(
  {
    name: 'extractTextFromUrlFlow',
    inputSchema: ExtractTextFromUrlInputSchema,
    outputSchema: ExtractTextFromUrlOutputSchema,
  },
  async (input: ExtractTextFromUrlInput) => {
    const htmlContent = await extractTextFromUrlTool(input);
    
    if (!htmlContent) {
        throw new Error("Could not retrieve content from the URL.");
    }

    const {output} = await extractTextFromUrlPrompt({htmlContent});

    return output!;
  }
);
    

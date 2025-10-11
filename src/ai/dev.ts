import { config } from 'dotenv';
config();

import '@/ai/flows/restructure-messy-pdf.ts';
import '@/ai/flows/generate-quiz-questions.ts';
import '@/ai/flows/suggest-missing-content.ts';
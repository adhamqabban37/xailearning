
'use server';

/**
 * @fileOverview This file defines a Genkit flow to audit and evaluate a course structure.
 *
 * It takes course content as input (JSON, PDF, or text) and returns a structured report
 * highlighting what works, what's missing, and what can be improved.
 *
 * @fileExport auditCourse - A function that audits the course content.
 * @fileExport AuditCourseInput - The input type for the auditCourse function.
 * @fileExport AuditCourseOutput - The return type for the auditCourse function.
 */

import {ai, geminiPro, generationConfig} from '@/ai/genkit';
import {z} from 'genkit';

const AuditCourseInputSchema = z.object({
  courseContent: z.string().describe('The full course content in JSON, PDF, or raw text format.'),
});
export type AuditCourseInput = z.infer<typeof AuditCourseInputSchema>;

const AuditCourseOutputSchema = z.object({
  summary: z.object({
    total_modules: z.number().describe('Total number of modules found.'),
    total_lessons: z.number().describe('Total number of lessons found.'),
    lessons_missing_titles: z.array(z.string()).describe('List of lessons or IDs with missing titles.'),
    lessons_missing_key_points: z.array(z.string()).describe('List of lessons missing key points.'),
    lessons_missing_quizzes: z.array(z.string()).describe('List of lessons missing quizzes.'),
    lessons_missing_resources: z.array(z.string()).describe('List of lessons missing external resources.'),
    lessons_missing_time_estimates: z.array(z.string()).describe('List of lessons missing time estimates.'),
    broken_links: z.array(z.string()).describe('List of identified broken or invalid URLs.'),
    lesson_order_issues: z.array(z.string()).describe('List of lessons that seem out of logical order.'),
  }),
  recommendations: z.array(z.string()).describe('A list of actionable recommendations for improvement.'),
});
export type AuditCourseOutput = z.infer<typeof AuditCourseOutputSchema>;


export async function auditCourse(
  input: AuditCourseInput
): Promise<AuditCourseOutput> {
  return auditCourseFlow(input);
}

const auditCoursePrompt = ai.definePrompt({
  name: 'auditCoursePrompt',
  model: geminiPro,
  config: generationConfig,
  input: {schema: AuditCourseInputSchema},
  output: {schema: AuditCourseOutputSchema},
  prompt: `You are an expert AI instructional designer, course evaluator, and AI content auditor.
Your task is to analyze a complete course provided in JSON, PDF, or text format and report what is working, what is missing, and what needs improvement.

Requirements:

Check Lesson Structure:
- Verify that all modules and lessons are present.
- Detect missing lesson titles or empty content fields.
- Identify lessons without key points, quizzes, or resources.

Check Quizzes and Activities:
- Ensure every lesson has at least 1–2 quiz questions.
- Detect missing quiz types (MCQ, short answer, practical).
- Verify presence of exercises or interactive activities.

Check External Resources:
- List all YouTube links, articles, and PDFs.
- Validate that URLs are active and working.
- Highlight broken or missing links.

Check Course Flow and Engagement:
- Determine if lessons are sequenced from easiest to hardest.
- Identify lessons that are too advanced or confusing.
- Detect missing hooks or engagement points.

Check Time Estimates:
- Ensure each lesson has a time estimate.
- Flag lessons with missing or unrealistic duration.

Instructions for AI:
- Read the entire course input carefully.
- Evaluate all lessons, quizzes, resources, and time estimates.
- Identify all gaps, missing content, and errors.
- Return a detailed JSON report highlighting what is working (✅), what is missing (❌), and suggestions for improvement.

Input:
{{{courseContent}}}
`,
});

const auditCourseFlow = ai.defineFlow(
  {
    name: 'auditCourseFlow',
    inputSchema: AuditCourseInputSchema,
    outputSchema: AuditCourseOutputSchema,
  },
  async (input) => {
    const {output} = await auditCoursePrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate an audit report.');
    }
    return output;
  }
);

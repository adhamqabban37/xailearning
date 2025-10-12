
import {z} from 'genkit';

const ResourceSchema = z.object({
  title: z.string().describe("The title of the resource."),
  url: z.string().url().describe("The full URL to the resource."),
  timestamps: z.string().optional().describe("Relevant timestamps for video resources."),
});

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  type: z.enum(["MCQ", "Short", "Practical"]).describe("The type of quiz question."),
  options: z.array(z.string()).optional().describe("A list of options for MCQ questions."),
  answer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().optional().describe('A brief explanation of the correct answer.'),
});

const LessonSchema = z.object({
  lesson_title: z.string().describe("The title of the lesson."),
  key_points: z.array(z.string()).describe("A brief list of key points for the lesson's content."),
  time_estimate_minutes: z.number().optional().describe("The estimated time in minutes to complete the lesson."),
  resources: z.object({
    youtube: z.array(ResourceSchema).optional().describe("A list of YouTube video resources."),
    articles: z.array(ResourceSchema).optional().describe("A list of article resources."),
    pdfs_docs: z.array(ResourceSchema).optional().describe("A list of PDF or documentation resources."),
  }).optional().describe("A categorized list of external resources for the lesson."),
  quiz: z.array(QuizQuestionSchema).optional().describe("A short quiz with 1-3 questions to check understanding."),
  activities: z.array(z.string()).optional().describe("A list of suggested activities or mini-projects."),
});

const ModuleSchema = z.object({
  module_title: z.string().describe('The title of the module/session.'),
  lessons: z.array(LessonSchema),
});

export const AnalyzeDocumentOutputSchema = z.object({
  course_title: z.string().describe("The title of the generated course."),
  modules: z.array(ModuleSchema),
});

export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

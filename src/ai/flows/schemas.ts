
import {z} from 'genkit';

const ResourceSchema = z.object({
  title: z.string().describe("The title of the resource."),
  type: z.string().describe("The type of resource (e.g., video, article, book)."),
  url: z.string().url().describe("The full URL to the resource."),
});

// Defines the detailed JSON structure for the AI's analysis output.
const FileCheckSchema = z.object({
  status: z.string().describe('Status of text extraction, e.g., "clean" or "issues_detected".'),
  issues: z.array(z.string()).optional().describe('A list of issues found during extraction.'),
});

const DocumentSummarySchema = z.object({
  type: z.string().describe('The detected document type (e.g., roadmap, book, article).'),
  sections_detected: z.number().describe('Number of main sections or chapters found.'),
  lessons_detected: z.number().describe('Total number of lessons or sub-sections found.'),
  detected_structure_confidence: z.string().describe('Confidence score for the detected structure, as a percentage.'),
  total_estimated_time: z.string().optional().describe("The total estimated time to complete the course."),
});

const SuggestedLessonSchema = z.object({
  lesson_title: z.string().describe("The title of the lesson."),
  key_points: z.array(z.string()).describe("A brief list of key points for the lesson's content."),
  resources: z.array(ResourceSchema).optional().describe("A list of external resources for the lesson."),
});

const SuggestedModuleSchema = z.object({
  module_title: z.string().describe('The title of the module/session.'),
  lessons: z.array(SuggestedLessonSchema),
});

const DebugReportSchema = z.object({
    scanned_pdf_detected: z.boolean().describe('Whether the document appears to be a scanned PDF.'),
    text_cleanliness: z.string().describe('A percentage score representing the cleanliness of the extracted text.'),
    missing_elements: z.array(z.string()).describe('A list of elements that are missing from the content.'),
});

export const AnalyzeDocumentOutputSchema = z.object({
  file_check: FileCheckSchema,
  document_summary: DocumentSummarySchema,
  suggested_structure: z.array(SuggestedModuleSchema),
  readiness_score: z.string().describe('A percentage score (e.g., "89%") indicating suitability for course generation.'),
  debug_report: DebugReportSchema,
  improvement_recommendations: z
    .array(z.string())
    .describe('A list of suggestions to improve the content.'),
});

export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

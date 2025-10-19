"use server";

/**
 * @fileOverview A Genkit flow to analyze a document and check its readiness for course creation.
 *
 * - analyzeDocument - A function that handles the document analysis.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import { aiGenerateStream } from "@/lib/ai-provider";

export type AnalyzeDocumentInput = {
  textContent: string;
  duration?: string;
};

export type AnalyzeDocumentOutput = any;

export async function analyzeDocument(
  input: AnalyzeDocumentInput
): Promise<AnalyzeDocumentOutput> {
  console.log("📚 Starting course generation with DeepSeek...");
  const system =
    "You are an expert AI instructional designer. Output ONLY valid JSON, no markdown or explanation.";

  // Truncate very long content to avoid timeouts
  const maxContentLength = 8000;
  const truncatedContent =
    input.textContent.length > maxContentLength
      ? input.textContent.substring(0, maxContentLength) +
        "...[content truncated]"
      : input.textContent;

  console.log(`📝 Content length: ${truncatedContent.length} chars`);

  const prompt = `Create a structured course in JSON format from this text. Requirements:
- 2-3 modules with 2-3 lessons each
- Each lesson: title, 3-5 key points, 2-3 MCQs (4 options, 1 correct)

CRITICAL REQUIREMENTS FOR RESOURCES:
1. YOUTUBE VIDEOS - You MUST provide REAL, VALID YouTube URLs:
   * Search your knowledge for actual popular educational videos on this topic
   * Use videos from verified channels: Crash Course, Khan Academy, freeCodeCamp, MIT OpenCourseWare, 3Blue1Brown, Traversy Media
   * Include the FULL URL starting with "https://www.youtube.com/watch?v=" or "https://youtu.be/"
   * DO NOT use placeholder URLs like "dQw4w9WgXcQ" - use REAL video IDs from your training data
   * Example REAL videos you might know:
     - Python: "https://www.youtube.com/watch?v=rfscVS0vtbw" (Python Full Course - freeCodeCamp)
     - JavaScript: "https://www.youtube.com/watch?v=PkZNo7MFNFg" (JavaScript Tutorial - freeCodeCamp)
     - React: "https://www.youtube.com/watch?v=bMknfKXIFA8" (React Course - freeCodeCamp)
     - Machine Learning: "https://www.youtube.com/watch?v=Gv9_4yMHFhI" (ML Course - freeCodeCamp)

2. ARTICLES - Provide REAL URLs from reputable sources:
   * Wikipedia (https://en.wikipedia.org/wiki/...)
   * MDN Web Docs (https://developer.mozilla.org/...)
   * Official documentation sites
   * DO NOT make up URLs - use real ones you know exist

- Include 1-2 video resources AND 1-2 article/documentation URLs per lesson
- Output ONLY the JSON object

JSON structure:
{
  "course_title": "Course Title Here",
  "modules": [{
    "module_title": "Module 1 Title",
    "lessons": [{
      "lesson_title": "Lesson Title",
      "key_points": ["point1", "point2", "point3"],
      "time_estimate_minutes": 15,
      "quiz": [{
        "question": "Question text here?",
        "type": "MCQ",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Option A",
        "explanation": "Why Option A is correct"
      }],
      "resources": {
        "youtube": [
          {"title": "Real Video Title from Known Channel", "url": "https://www.youtube.com/watch?v=REAL_VIDEO_ID"}
        ],
        "articles": [
          {"title": "Real Article Title", "url": "https://en.wikipedia.org/wiki/Real_Topic"}
        ],
        "pdfs_docs": []
      }
    }]
  }]
}

REMEMBER: Every URL must be a REAL, COMPLETE URL that actually exists. No placeholders, no made-up URLs.

Text: ${truncatedContent}`;

  console.log("🤖 Streaming response from DeepSeek...");
  let out = "";
  let chunkCount = 0;
  for await (const chunk of aiGenerateStream(prompt, {
    system,
    timeout: 300_000,
  })) {
    out += chunk;
    chunkCount++;
    if (chunkCount % 50 === 0) {
      console.log(
        `📦 Received ${chunkCount} chunks, ${out.length} chars so far...`
      );
    }
  }
  console.log(
    `✅ DeepSeek completed. Total: ${out.length} chars in ${chunkCount} chunks`
  );

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = out.trim();
  if (jsonStr.includes("```json")) {
    const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    jsonStr = match ? match[1] : jsonStr;
  } else if (jsonStr.includes("```")) {
    const match = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
    jsonStr = match ? match[1] : jsonStr;
  }

  // Find the first complete JSON object
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Ollama did not return a valid JSON object.");

  return JSON.parse(match[0]);
}

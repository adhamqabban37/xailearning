"use client";

import { useState } from "react";
import { UNIVERSAL_PROMPT, PROMPT_INSTRUCTIONS } from "../lib/promptTemplate";
import { uploadApi } from "../lib/api";
import RoadmapSummary from "../components/RoadmapSummary";
import LearningGuide from "../components/LearningGuide";
import toast from "react-hot-toast";

export default function HomePage() {
  const [copied, setCopied] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [showLearningGuide, setShowLearningGuide] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(UNIVERSAL_PROMPT);
    setCopied(true);
    toast.success("Prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetToUpload = () => {
    setShowSummary(false);
    setShowLearningGuide(false);
    setCourseData(null);
    setUploadedFileName("");
    setUploading(false);
    setIsDragActive(false);
  };

  const handleFileUpload = async (file: File) => {
    // Enhanced client-side validation
    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("Please upload a PDF file only");
      return;
    }

    if (file.size === 0) {
      toast.error("Cannot upload empty file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setUploadedFileName(file.name);

    try {
      toast.success(`Uploading ${file.name}...`);

      const response = await uploadApi.uploadRoadmap(file);

      // Handle successful response
      const data = response;
      if (data.course) {
        // Extract course_id from response (either top-level or from course object)
        const courseId = data.course_id || data.course?.id;
        console.log("🆔 Course ID extracted:", courseId);

        if (!courseId) {
          // Generate fallback UUID if still missing
          const fallbackId = crypto.randomUUID();
          console.warn(
            "⚠️  No course ID in response, generating fallback:",
            fallbackId
          );
          data.course_id = fallbackId;
          if (data.course) {
            data.course.id = fallbackId;
          }
        }

        // Convert course data to format compatible with RoadmapSummary
        const courseWithLessons = {
          ...data.course,
          course_id: courseId, // Ensure course_id is available for RoadmapSummary
          id: courseId, // Also provide as id
          lessons:
            data.course.lessons?.map((lesson: any, index: number) => ({
              day_number: lesson.lesson_number || index + 1,
              title: lesson.title,
              duration: lesson.duration || "2 hours",
              content:
                lesson.content ||
                lesson.topics?.join(", ") ||
                "Content details coming soon",
              topics: lesson.topics || [],
              estimated_hours: parseInt(
                lesson.duration?.match(/\d+/)?.[0] || "2"
              ),
              learning_objectives: lesson.learning_objectives || [],
              resources: lesson.resources || [],
              practice_exercises: lesson.practice_exercises || [],
              skill_tags: lesson.skill_tags || [],
            })) || [],
          // Add learning guide information
          learning_guide: data.learning_guide,
          study_plan: data.learning_guide?.study_plan,
          learning_path: data.learning_guide?.learning_path,
          resource_library: data.learning_guide?.resource_library,
        };

        toast.success(
          `🎉 Course generated successfully! Created "${
            data.course.title
          }" with ${
            data.course.modules_count || data.course.lessons?.length || 0
          } lessons and comprehensive learning guide.`
        );

        // Show the enhanced roadmap summary with learning guide
        setCourseData(courseWithLessons);
        // Save course data and learning guide to sessionStorage with course_id
        sessionStorage.setItem("courseData", JSON.stringify(courseWithLessons));
        sessionStorage.setItem("courseId", courseId); // Store course ID separately for easy access
        sessionStorage.setItem(
          "learningGuide",
          JSON.stringify(data.learning_guide)
        );
        setShowSummary(true);

        console.log("✅ Course and learning guide generated:", data);
        console.log("🆔 Stored course ID:", courseId);
        console.log("📚 Learning guide:", data.learning_guide);
      } else {
        toast.success("PDF uploaded successfully!");
        console.log("Upload response:", data);
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      // Extract detailed error message from backend
      let errorMessage = "Failed to process PDF. Please try again.";

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 422) {
        errorMessage =
          "Invalid PDF format or content. Please ensure your PDF contains a structured learning roadmap.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid file. Please upload a valid PDF file.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        duration: 6000, // Longer duration for detailed errors
      });
      if (error.stack) {
        toast.error(`Stack trace: ${error.stack}`);
        console.error("Stack trace:", error.stack);
      } else {
        console.error("Upload error:", error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (uploading) return; // Prevent multiple uploads

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      toast.error("Please upload only one PDF file at a time");
      return;
    }

    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // If showing summary, render the RoadmapSummary component
  if (showSummary && courseData) {
    return (
      <div>
        <RoadmapSummary
          course={courseData}
          filename={uploadedFileName}
          onBack={resetToUpload}
        />

        {/* Learning Guide Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowLearningGuide(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            📚 View Learning Guide
          </button>
        </div>
      </div>
    );
  }

  // If showing learning guide, render the LearningGuide component
  if (showLearningGuide && courseData) {
    const learningGuideData =
      courseData.learning_guide ||
      JSON.parse(sessionStorage.getItem("learningGuide") || "{}");

    return (
      <div>
        <div className="mb-4 p-4 bg-gray-100 flex justify-between items-center">
          <button
            onClick={() => setShowLearningGuide(false)}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Course Summary
          </button>
          <button
            onClick={resetToUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Upload New PDF
          </button>
        </div>

        <LearningGuide
          learningGuide={learningGuideData}
          courseTitle={courseData.title || "Your Course"}
        />
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        body {
          font-family: "Inter", sans-serif;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glow-effect {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
        }
      `}</style>

      <div className="bg-gray-900 text-white overflow-x-hidden">
        {/* Background Glow Effects */}
        <div className="glow-effect top-[-10%] left-[-10%] w-96 h-96 bg-purple-600"></div>
        <div className="glow-effect top-[20%] right-[-15%] w-96 h-96 bg-teal-500"></div>
        <div className="glow-effect bottom-[-10%] left-[20%] w-80 h-80 bg-indigo-600"></div>

        <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your Personal AI Learning Co-pilot
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              Generate a personalized learning roadmap on any topic and
              transform it into an interactive educational journey.
            </p>
          </header>

          <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: Instructions & Features */}
            <div className="space-y-8">
              {/* Learning Roadmap Generator Section */}
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 text-teal-400"
                  >
                    <path d="m12 14 4-4"></path>
                    <path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
                    <path d="m12 20 4-4"></path>
                    <path d="M12 4v12"></path>
                  </svg>
                  Learning Roadmap Generator
                </h2>
                <p className="text-gray-300 mb-4 pl-9">
                  Copy the prompt below and use it with your favorite AI model.
                  Replace the highlighted text with your details, then upload
                  the generated PDF.
                </p>

                <div className="bg-gray-900/50 rounded-lg relative border border-gray-700">
                  <button
                    onClick={copyPrompt}
                    className={`absolute top-2 right-2 py-1 px-3 rounded-md text-xs font-semibold transition-colors z-10 ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <pre className="p-4 font-mono text-sm text-gray-200 overflow-x-auto whitespace-pre-wrap">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: UNIVERSAL_PROMPT.replace(
                          /\[ENTER YOUR TOPIC HERE\]/g,
                          '<span class="text-teal-400 font-semibold">[ENTER YOUR TOPIC HERE]</span>'
                        )
                          .replace(
                            /\[Beginner \/ Intermediate \/ Advanced\]/g,
                            '<span class="text-teal-400 font-semibold">[Beginner / Intermediate / Advanced]</span>'
                          )
                          .replace(
                            /\[X hours per week for Y weeks\]/g,
                            '<span class="text-teal-400 font-semibold">[X hours per week for Y weeks]</span>'
                          )
                          .replace(
                            /\[Visual \/ Auditory \/ Kinesthetic \/ Mixed\]/g,
                            '<span class="text-teal-400 font-semibold">[Visual / Auditory / Kinesthetic / Mixed]</span>'
                          )
                          .replace(
                            /\[Clear, measurable outcome\]/g,
                            '<span class="text-teal-400 font-semibold">[Clear, measurable outcome]</span>'
                          ),
                      }}
                    />
                  </pre>
                </div>
              </div>

              {/* Features Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-xl text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-3 text-teal-400"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <h3 className="font-semibold">60-Minute Sessions</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Structured learning with built-in timers.
                  </p>
                </div>
                <div className="glass-card p-5 rounded-xl text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-3 text-teal-400"
                  >
                    <path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5c.23 0 .46-.01.68-.03"></path>
                    <path d="m10 15-2-2 2-2"></path>
                    <path d="m14 15 2-2-2-2"></path>
                  </svg>
                  <h3 className="font-semibold">Smart Quizzes</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Auto-generated quizzes to test you.
                  </p>
                </div>
                <div className="glass-card p-5 rounded-xl text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-3 text-teal-400"
                  >
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                  <h3 className="font-semibold">Progress Tracking</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Monitor your journey with detailed analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Upload */}
            <div className="glass-card rounded-2xl p-6 lg:p-8 flex flex-col items-center justify-center text-center h-full">
              <div
                className={`border-2 border-dashed rounded-xl w-full h-full flex flex-col items-center justify-center p-8 transition-all duration-300 cursor-pointer ${
                  isDragActive
                    ? "border-teal-400 bg-white/5"
                    : uploading
                    ? "border-gray-500 opacity-50 cursor-not-allowed"
                    : "border-gray-500 hover:border-teal-400 hover:bg-white/5"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  id="pdf-upload"
                  disabled={uploading}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
                >
                  <div className="bg-gray-800 p-4 rounded-full border border-gray-600 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-teal-400 ${
                        uploading ? "animate-pulse" : ""
                      }`}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold">
                    {uploading ? "Processing PDF..." : "Upload Your Roadmap"}
                  </h2>
                  <p className="mt-2 text-gray-300">
                    {uploading
                      ? `Processing ${uploadedFileName}...`
                      : isDragActive
                      ? "Drop your PDF here"
                      : "Once you have your PDF, upload it here to start learning."}
                  </p>
                  {!uploading && (
                    <>
                      <button className="mt-6 bg-teal-500 hover:bg-teal-400 text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors">
                        Click to Upload PDF
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        or drag and drop
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </main>

          <footer className="text-center mt-12 py-4">
            <p className="text-gray-500">
              &copy; 2025 AI Learner Platform. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}

"use client";

import React, { useState } from "react";
import { ProductionPDFUploader } from "../../components/PDFUploader/ProductionPDFUploader";
import { PDFUploadResult } from "../../hooks/useUploadPDF";

// Example of how to use the ProductionPDFUploader component
export default function PDFUploadExamplePage() {
  const [uploadResults, setUploadResults] = useState<PDFUploadResult[]>([]);
  const [activeEndpoint, setActiveEndpoint] = useState("next");

  // Available endpoints for testing
  const endpoints = {
    next: "/api/parse-pdf", // Next.js API route
    fastapi: "http://localhost:8000/api/parse-pdf", // FastAPI backend
    express: "http://localhost:3001/api/parse-pdf", // Express server
  };

  const handleUploadComplete = (result: PDFUploadResult) => {
    console.log("✅ Upload completed:", result);
    setUploadResults((prev) => [result, ...prev]);
  };

  const handleUploadError = (error: string) => {
    console.error("❌ Upload failed:", error);
    // You can show toast notifications or other UI feedback here
  };

  const handleUploadStart = () => {
    console.log("🚀 Upload started");
    // You can show loading states or other UI feedback here
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF Upload Demo
          </h1>
          <p className="text-gray-600">
            Production-ready PDF file upload with comprehensive error handling
          </p>
        </div>

        {/* Endpoint Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select API Endpoint:
          </label>
          <div className="flex flex-wrap gap-3">
            {Object.entries(endpoints).map(([key, endpoint]) => (
              <button
                key={key}
                onClick={() => setActiveEndpoint(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeEndpoint === key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {key === "next" && "Next.js API"}
                {key === "fastapi" && "FastAPI (Port 8000)"}
                {key === "express" && "Express (Port 3001)"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Current endpoint:{" "}
            <code className="bg-gray-100 px-1 rounded">
              {endpoints[activeEndpoint as keyof typeof endpoints]}
            </code>
          </p>
        </div>

        {/* Upload Component */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <ProductionPDFUploader
            apiEndpoint={endpoints[activeEndpoint as keyof typeof endpoints]}
            onUploadStart={handleUploadStart}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            maxFileSize={20}
            showConnectionTest={true}
            showProgressBar={true}
            showFileInfo={true}
          />
        </div>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Upload Results ({uploadResults.length})
              </h2>
              <button
                onClick={clearResults}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                      {result.filename}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <span className="ml-2 font-medium">
                        {result.data.metadata.page_count}
                      </span>
                    </div>
                    {result.data.summary && (
                      <>
                        <div>
                          <span className="text-gray-600">Words:</span>
                          <span className="ml-2 font-medium">
                            {result.data.summary.total_words.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Characters:</span>
                          <span className="ml-2 font-medium">
                            {result.data.summary.total_characters.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tables:</span>
                          <span className="ml-2 font-medium">
                            {result.data.summary.has_tables ? "Yes" : "No"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* First page preview */}
                  {result.data.pages.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <h4 className="font-medium text-gray-700 mb-1">
                        First Page Preview:
                      </h4>
                      <p className="text-gray-600 line-clamp-3">
                        {result.data.pages[0].text.substring(0, 200)}
                        {result.data.pages[0].text.length > 200 && "..."}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integration Examples */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Integration Examples
          </h2>

          <div className="space-y-6">
            {/* Basic Usage */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Basic Usage</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`import { ProductionPDFUploader } from './components/PDFUploader/ProductionPDFUploader';

function MyComponent() {
  const handleUploadComplete = (result) => {
    console.log('PDF parsed:', result);
    // Process the parsed data
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
    // Handle the error
  };

  return (
    <ProductionPDFUploader
      apiEndpoint="/api/parse-pdf"
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      maxFileSize={20}
      showConnectionTest={true}
    />
  );
}`}
              </pre>
            </div>

            {/* Fetch API Example */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Vanilla JavaScript Fetch
              </h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`const fileInput = document.querySelector('#pdfFile');
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/parse-pdf', {
  method: 'POST',
  body: formData
})
.then(response => {
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  return response.json();
})
.then(result => {
  console.log('PDF parsed successfully:', result);
})
.catch(error => {
  console.error('Upload failed:', error);
});`}
              </pre>
            </div>

            {/* Axios Example */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Axios Example</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`import axios from 'axios';

const uploadPDF = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/parse-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(\`Upload progress: \${progress}%\`);
      },
    });

    console.log('PDF parsed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

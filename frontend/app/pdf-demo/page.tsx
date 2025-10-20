"use client";

import { useState } from "react";
import {
  SimplePDFUploader,
  PDFParseResult,
} from "../../components/PDFUploader/SimplePDFUploader";
import { EnhancedPDFUploader } from "../../components/PDFUploader/EnhancedPDFUploader";

export default function PDFParserDemo() {
  const [activeTab, setActiveTab] = useState<"simple" | "enhanced">("enhanced");
  const [lastResult, setLastResult] = useState<PDFParseResult | null>(null);

  const handleParseComplete = (result: PDFParseResult) => {
    setLastResult(result);
    console.log("PDF parsed successfully:", result);
  };

  const handleError = (error: string) => {
    console.error("PDF parsing failed:", error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF Parser Demo
          </h1>
          <p className="text-gray-600">
            Test both FastAPI (port 8000) and Express (port 3001) PDF parsing
            endpoints
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab("simple")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "simple"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Simple Uploader
            </button>
            <button
              onClick={() => setActiveTab("enhanced")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "enhanced"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Enhanced Uploader
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {activeTab === "simple"
                ? "Simple PDF Uploader"
                : "Enhanced PDF Uploader"}
            </h2>

            {activeTab === "simple" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    FastAPI Endpoint
                  </h3>
                  <SimplePDFUploader
                    apiEndpoint="http://localhost:8000/api/parse-pdf"
                    onParseComplete={handleParseComplete}
                    onError={handleError}
                  />
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Express Endpoint
                  </h3>
                  <SimplePDFUploader
                    apiEndpoint="http://localhost:3001/api/parse-pdf"
                    onParseComplete={handleParseComplete}
                    onError={handleError}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    FastAPI Endpoint
                  </h3>
                  <EnhancedPDFUploader
                    apiEndpoint="http://localhost:8000/api/parse-pdf"
                    onParseComplete={handleParseComplete}
                    onError={handleError}
                    showResults={false}
                  />
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    Express Endpoint
                  </h3>
                  <EnhancedPDFUploader
                    apiEndpoint="http://localhost:3001/api/parse-pdf"
                    onParseComplete={handleParseComplete}
                    onError={handleError}
                    showResults={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Parse Results
            </h2>

            {lastResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">
                    ✅ {lastResult.filename}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Pages:</span>
                      <div className="font-medium">
                        {lastResult.data.summary?.total_pages ||
                          lastResult.data.metadata.page_count}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-600">Characters:</span>
                      <div className="font-medium">
                        {lastResult.data.summary?.total_characters?.toLocaleString() ||
                          "N/A"}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-600">Words:</span>
                      <div className="font-medium">
                        {lastResult.data.summary?.total_words?.toLocaleString() ||
                          "N/A"}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-600">Author:</span>
                      <div className="font-medium">
                        {lastResult.data.metadata.author || "Unknown"}
                      </div>
                    </div>
                  </div>

                  {lastResult.data.summary && (
                    <div className="mt-4 flex space-x-4 text-sm">
                      {lastResult.data.summary.has_tables && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          📊 Has Tables
                        </span>
                      )}
                      {lastResult.data.summary.has_images && (
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                          🖼️ Has Images
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* First page preview */}
                {lastResult.data.pages.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">
                      First Page Preview
                    </h4>
                    <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                      {lastResult.data.pages[0].text.substring(0, 300)}
                      {lastResult.data.pages[0].text.length > 300 && "..."}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Upload a PDF to see parsing results here</p>
              </div>
            )}
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Frontend Integration Code
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Basic Fetch Example
              </h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`const fileInput = document.querySelector('#pdfFile');
const form = new FormData();
form.append('file', fileInput.files[0]);

fetch('/api/parse-pdf', {
  method: 'POST',
  body: form
}).then(r => r.json()).then(result => {
  console.log('parsed PDF', result);
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                React Component Usage
              </h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`import { SimplePDFUploader } from './components/PDFUploader/SimplePDFUploader';

function MyComponent() {
  const handleParseComplete = (result) => {
    console.log('PDF parsed:', result);
    // Process the parsed data
  };

  return (
    <SimplePDFUploader
      apiEndpoint="http://localhost:8000/api/parse-pdf"
      onParseComplete={handleParseComplete}
      onError={(error) => console.error(error)}
    />
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

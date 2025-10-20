"use client";

import { useState } from "react";
import { uploadApi } from "../../lib/api";

export default function ConnectionTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoint = async (url: string, name: string) => {
    try {
      console.log(`Testing ${name} at ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const result = {
        name,
        url,
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : await response.text(),
        timestamp: new Date().toISOString(),
      };

      console.log(`${name} result:`, result);
      return result;
    } catch (error: any) {
      const result = {
        name,
        url,
        status: "ERROR",
        ok: false,
        data: error.message,
        timestamp: new Date().toISOString(),
        error: true,
      };

      console.error(`${name} error:`, error);
      return result;
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    const endpoints = [
      { name: "FastAPI Health", url: "http://localhost:8000/api/health" },
      { name: "Express Health", url: "http://localhost:3001/health" },
      { name: "Next.js API", url: "http://localhost:3000/api/parse-pdf" },
    ];

    const results = [];
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint.url, endpoint.name);
      results.push(result);
      setTestResults([...results]);
    }

    setIsLoading(false);
  };

  const testFileUpload = async () => {
    // Create a simple test file
    const testContent = "This is a test PDF content for debugging";
    const testFile = new File([testContent], "test.pdf", {
      type: "application/pdf",
    });

    try {
      console.log("Testing file upload...");
      const result = await uploadApi.uploadRoadmap(testFile);
      console.log("Upload test result:", result);

      setTestResults((prev) => [
        ...prev,
        {
          name: "File Upload Test",
          url: "http://localhost:8000/api/upload-roadmap",
          status: "SUCCESS",
          ok: true,
          data: result,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error: any) {
      console.error("Upload test error:", error);

      setTestResults((prev) => [
        ...prev,
        {
          name: "File Upload Test",
          url: "http://localhost:8000/api/upload-roadmap",
          status: "ERROR",
          ok: false,
          data: error.message,
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connection Test
          </h1>
          <p className="text-gray-600">Debug network connectivity issues</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Testing..." : "Test All Endpoints"}
            </button>

            <button
              onClick={testFileUpload}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Test File Upload
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Test Results
              </h2>

              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.error
                      ? "bg-red-50 border-red-200"
                      : result.ok
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">
                      {result.name}
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          result.error
                            ? "bg-red-100 text-red-800"
                            : result.ok
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {result.status}
                      </span>
                    </h3>
                    <span className="text-xs text-gray-500">
                      {result.timestamp}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{result.url}</p>

                  <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32">
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Environment Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">API Base URL:</span>
              <span className="ml-2">
                {process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}
              </span>
            </div>
            <div>
              <span className="font-medium">Current Time:</span>
              <span className="ml-2">{new Date().toISOString()}</span>
            </div>
            <div>
              <span className="font-medium">User Agent:</span>
              <span className="ml-2">
                {typeof window !== "undefined"
                  ? window.navigator.userAgent
                  : "Server"}
              </span>
            </div>
            <div>
              <span className="font-medium">Current Host:</span>
              <span className="ml-2">
                {typeof window !== "undefined"
                  ? window.location.host
                  : "Server"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

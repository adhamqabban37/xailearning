import React, { useState } from "react";

const DebugUploader = () => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const testUpload = async (file: File) => {
    setUploading(true);
    setDebugLogs([]);

    try {
      addLog(`Starting upload: ${file.name} (${file.size} bytes)`);
      addLog(`File type: ${file.type}`);

      const formData = new FormData();
      formData.append("file", file);

      addLog("Creating request to http://localhost:8001/api/upload-roadmap");

      const response = await fetch("http://localhost:8001/api/upload-roadmap", {
        method: "POST",
        body: formData,
      });

      addLog(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Error response: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      addLog(
        `Success! Received ${JSON.stringify(data).length} characters of data`
      );
      addLog(`Course: ${data.course_title}`);
      addLog(`Lessons: ${data.lessons?.length || 0}`);
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 Debug PDF Upload</h2>

      <div className="mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) testUpload(file);
          }}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {uploading && (
        <div className="mb-4 p-3 bg-blue-100 rounded">🔄 Uploading...</div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
        <h3 className="font-semibold mb-2">Debug Logs:</h3>
        {debugLogs.length === 0 ? (
          <p className="text-gray-500">
            No logs yet. Upload a PDF to start debugging.
          </p>
        ) : (
          debugLogs.map((log, index) => (
            <div key={index} className="text-xs font-mono mb-1 break-all">
              {log}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Test File:</strong> Use the test_course.pdf from your desktop
        </p>
        <p>
          <strong>Expected:</strong> Should show successful upload with course
          data
        </p>
        <p>
          <strong>If Error:</strong> Check console (F12) for network issues
        </p>
      </div>
    </div>
  );
};

export default DebugUploader;

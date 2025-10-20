// Simple PDF uploader component using your existing form patterns
"use client";

import { useState } from "react";
import { Upload, File, Loader2 } from "lucide-react";

export interface PDFParseResult {
  ok: boolean;
  filename: string;
  data: {
    metadata: {
      title: string;
      author: string;
      page_count: number;
    };
    pages: Array<{
      page_number: number;
      text: string;
      char_count: number;
    }>;
    summary?: {
      total_pages: number;
      total_characters: number;
      total_words: number;
      has_tables: boolean;
      has_images: boolean;
    };
  };
}

interface SimplePDFUploaderProps {
  onParseComplete?: (result: PDFParseResult) => void;
  onError?: (error: string) => void;
  apiEndpoint?: string;
}

export function SimplePDFUploader({
  onParseComplete,
  onError,
  apiEndpoint = "/api/parse-pdf", // Default to FastAPI endpoint
}: SimplePDFUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onError?.("No file selected");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Upload failed");
      }

      const result: PDFParseResult = await response.json();
      console.log("parsed PDF", result);
      onParseComplete?.(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("PDF parsing error:", error);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> a PDF file
            </p>
            <p className="text-xs text-gray-500">PDF files only (MAX 20MB)</p>
          </div>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
          <File className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
            MB)
          </span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{isUploading ? "Parsing PDF..." : "Parse PDF"}</span>
      </button>
    </div>
  );
}

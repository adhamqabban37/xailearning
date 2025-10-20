// Enhanced PDF uploader with error handling and API integration
"use client";

import { useState } from "react";
import { Upload, File, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { parseApiError } from "../../lib/api";
import { ErrorMessage, SuccessMessage } from "../ErrorMessage";

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
      tables?: any[];
      images_count?: number;
    }>;
    summary?: {
      total_pages: number;
      total_characters: number;
      total_words: number;
      total_tables?: number;
      total_images?: number;
      has_tables: boolean;
      has_images: boolean;
    };
  };
}

interface EnhancedPDFUploaderProps {
  onParseComplete?: (result: PDFParseResult) => void;
  onError?: (error: string) => void;
  apiEndpoint?: string;
  maxFileSize?: number; // in MB
  showResults?: boolean;
}

export function EnhancedPDFUploader({
  onParseComplete,
  onError,
  apiEndpoint = "http://localhost:8000/api/parse-pdf", // FastAPI endpoint
  maxFileSize = 20,
  showResults = true,
}: EnhancedPDFUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<PDFParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setParseResult(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      clearMessages();

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        setError(`File is too large. Maximum size is ${maxFileSize}MB.`);
        return;
      }

      // Validate file type
      if (
        !file.type.includes("pdf") &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setError("Please select a PDF file.");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("No file selected");
      return;
    }

    setIsUploading(true);
    clearMessages();

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.error || `HTTP ${response.status}`
        );
      }

      const result: PDFParseResult = await response.json();

      setParseResult(result);
      setSuccess(`✅ Successfully parsed ${result.filename}`);
      onParseComplete?.(result);
    } catch (error: any) {
      const errorMessage = parseApiError(error).detail;
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    clearMessages();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* File Upload Area */}
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="pdf-upload"
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            selectedFile
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {selectedFile ? (
              <CheckCircle className="w-8 h-8 mb-4 text-green-500" />
            ) : (
              <Upload className="w-8 h-8 mb-4 text-gray-500" />
            )}
            <p className="mb-2 text-sm text-gray-600">
              <span className="font-semibold">
                {selectedFile ? "File selected" : "Click to upload"}
              </span>
              {!selectedFile && " a PDF file"}
            </p>
            <p className="text-xs text-gray-500">
              PDF files only (MAX {maxFileSize}MB)
            </p>
          </div>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <File className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                {selectedFile.name}
              </p>
              <p className="text-xs text-blue-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={resetUploader}
            className="text-xs text-blue-600 hover:text-blue-800"
            disabled={isUploading}
          >
            Change
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isUploading ? "Parsing PDF..." : "Parse PDF"}</span>
        </button>

        {selectedFile && !isUploading && (
          <button
            onClick={resetUploader}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Messages */}
      {error && <ErrorMessage error={error} />}
      {success && <SuccessMessage message={success} />}

      {/* Results Preview */}
      {showResults && parseResult && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">Parse Results</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pages:</span>
              <span className="font-medium">
                {parseResult.data.summary?.total_pages ||
                  parseResult.data.metadata.page_count}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Characters:</span>
              <span className="font-medium">
                {parseResult.data.summary?.total_characters?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Words:</span>
              <span className="font-medium">
                {parseResult.data.summary?.total_words?.toLocaleString()}
              </span>
            </div>
            {parseResult.data.summary?.total_tables !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tables:</span>
                <span className="font-medium">
                  {parseResult.data.summary.total_tables}
                </span>
              </div>
            )}
            {parseResult.data.summary?.total_images !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Images:</span>
                <span className="font-medium">
                  {parseResult.data.summary.total_images}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Production-ready PDF upload component with comprehensive error handling
"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useUploadPDF, PDFUploadResult } from "../../hooks/useUploadPDF";

interface ProductionPDFUploaderProps {
  // Callback functions
  onUploadStart?: () => void;
  onUploadComplete?: (result: PDFUploadResult) => void;
  onUploadError?: (error: string) => void;

  // Configuration
  apiEndpoint?: string;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];

  // UI customization
  className?: string;
  showConnectionTest?: boolean;
  showProgressBar?: boolean;
  showFileInfo?: boolean;
}

export const ProductionPDFUploader: React.FC<ProductionPDFUploaderProps> = ({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  apiEndpoint = "http://localhost:8000/api/parse-pdf",
  maxFileSize = 20,
  acceptedFileTypes = [".pdf"],
  className = "",
  showConnectionTest = true,
  showProgressBar = true,
  showFileInfo = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null
  );

  const {
    isUploading,
    progress,
    error,
    result,
    success,
    uploadFile,
    reset,
    testConnection,
  } = useUploadPDF();

  // Test connection on component mount
  React.useEffect(() => {
    if (showConnectionTest) {
      handleTestConnection();
    }
  }, [apiEndpoint, showConnectionTest]);

  const handleTestConnection = async () => {
    const isConnected = await testConnection(apiEndpoint);
    setConnectionStatus(isConnected);
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const isValidType = acceptedFileTypes.some(
      (type) =>
        file.name.toLowerCase().endsWith(type.replace(".", "")) ||
        file.type.includes(type.replace(".", ""))
    );

    if (!isValidType) {
      onUploadError?.(
        `Please select a valid file type: ${acceptedFileTypes.join(", ")}`
      );
      return;
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      onUploadError?.(`File is too large. Maximum size is ${maxFileSize}MB`);
      return;
    }

    setSelectedFile(file);
    reset(); // Clear previous results
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    onUploadStart?.();

    try {
      await uploadFile(selectedFile, apiEndpoint);

      if (result) {
        onUploadComplete?.(result);
      }
    } catch (err) {
      // Error is handled by the hook
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      onUploadError?.(errorMessage);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Connection Status */}
      {showConnectionTest && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {connectionStatus ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Connected to server
                </span>
              </>
            ) : connectionStatus === false ? (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  Server not accessible
                </span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-700">
                  Testing connection...
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleTestConnection}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            disabled={connectionStatus === null}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Test</span>
          </button>
        </div>
      )}

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : selectedFile
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }
          ${isUploading ? "pointer-events-none opacity-75" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-4">
          {selectedFile ? (
            <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
          ) : (
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
          )}

          <div>
            <p className="text-lg font-medium text-gray-700">
              {selectedFile ? "File Ready for Upload" : "Select PDF File"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {selectedFile
                ? `${selectedFile.name} (${(
                    selectedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB)`
                : `Drag & drop or click to browse • Max ${maxFileSize}MB`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgressBar && isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || connectionStatus === false}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing PDF...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Parse PDF</span>
            </>
          )}
        </button>

        {(selectedFile || result || error) && !isUploading && (
          <button
            onClick={handleReset}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Upload Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && !error && (
        <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Upload Successful
            </p>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* File Information */}
      {showFileInfo && result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Parse Results
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Pages:</span>
              <span className="ml-2 font-medium">
                {result.data.metadata.page_count}
              </span>
            </div>
            {result.data.summary && (
              <>
                <div>
                  <span className="text-blue-700">Words:</span>
                  <span className="ml-2 font-medium">
                    {result.data.summary.total_words.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Characters:</span>
                  <span className="ml-2 font-medium">
                    {result.data.summary.total_characters.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Tables:</span>
                  <span className="ml-2 font-medium">
                    {result.data.summary.has_tables ? "Yes" : "No"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced API utility specifically for file uploads
import axios, { AxiosError, AxiosProgressEvent } from "axios";

// Upload-specific error interface
export interface UploadError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

// Upload response interface
export interface UploadResponse<T = any> {
  ok: boolean;
  data: T;
  filename?: string;
  message?: string;
}

/**
 * Enhanced Axios instance specifically configured for file uploads
 */
const uploadApi = axios.create({
  // Support multiple backends
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
  timeout: 60000, // 60 seconds for large files
  headers: {
    // Don't set Content-Type - let browser set it with boundary for FormData
  },
});

/**
 * Parse upload-specific errors with detailed logging
 */
export const parseUploadError = (error: any): UploadError => {
  console.error("Upload Error Details:", {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    data: error.response?.data,
    config: {
      url: error.config?.url,
      method: error.config?.method,
    },
  });

  // Network errors (no response received)
  if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
    return {
      message: "Network error. Please check your connection and try again.",
      code: "NETWORK_ERROR",
    };
  }

  // Timeout errors
  if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
    return {
      message: "Upload timeout. Please try again with a smaller file.",
      code: "TIMEOUT_ERROR",
    };
  }

  // HTTP errors with response
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return {
          message: data?.detail || data?.error || "Invalid file or request",
          status,
          code: "BAD_REQUEST",
          details: data,
        };
      case 413:
        return {
          message: "File too large. Please choose a smaller file.",
          status,
          code: "FILE_TOO_LARGE",
        };
      case 415:
        return {
          message: "File type not supported. Please upload a PDF file.",
          status,
          code: "UNSUPPORTED_MEDIA_TYPE",
        };
      case 422:
        return {
          message: data?.detail || "Invalid file content",
          status,
          code: "UNPROCESSABLE_ENTITY",
          details: data,
        };
      case 500:
        return {
          message: "Server error. Please try again later.",
          status,
          code: "INTERNAL_SERVER_ERROR",
        };
      default:
        return {
          message: data?.detail || data?.error || `Upload failed (${status})`,
          status,
          code: "HTTP_ERROR",
          details: data,
        };
    }
  }

  // Fallback for unknown errors
  return {
    message: error.message || "An unexpected error occurred during upload",
    code: "UNKNOWN_ERROR",
  };
};

/**
 * Upload PDF file with progress tracking and robust error handling
 */
export const uploadPDFFile = async (
  file: File,
  endpoint: string = "/api/parse-pdf",
  onProgress?: UploadProgressCallback
): Promise<UploadResponse> => {
  try {
    // Validate file before upload
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type
    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      throw new Error("Please select a PDF file");
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new Error("File is too large. Maximum size is 20MB");
    }

    // Create FormData
    const formData = new FormData();
    formData.append("file", file);

    console.log("Uploading file:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      endpoint,
    });

    // Make the upload request
    const response = await uploadApi.post(endpoint, formData, {
      headers: {
        // Let browser set Content-Type with boundary
        Accept: "application/json",
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    console.log("Upload successful:", response.data);
    return response.data;
  } catch (error) {
    const uploadError = parseUploadError(error);
    console.error("Upload failed:", uploadError);
    throw uploadError;
  }
};

/**
 * Test endpoint connectivity
 */
export const testEndpoint = async (endpoint: string): Promise<boolean> => {
  try {
    // Try a simple GET request to test connectivity
    const healthEndpoint = endpoint
      .replace("/api/parse-pdf", "/health")
      .replace("/parse-pdf", "/health");

    await uploadApi.get(healthEndpoint, { timeout: 5000 });
    return true;
  } catch (error) {
    console.warn(`Endpoint ${endpoint} is not accessible:`, error);
    return false;
  }
};

export default uploadApi;

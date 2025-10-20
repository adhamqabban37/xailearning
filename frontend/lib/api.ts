import axios, { AxiosError, AxiosResponse } from "axios";
import { Course, Module, Progress } from "../types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8002";

// Enhanced error interface matching backend format
export interface ApiError {
  detail: string;
  request_id?: string;
  status: number;
  timestamp?: string;
}

export interface ApiErrorResponse {
  detail: string;
  request_id?: string;
}

// Enhanced error handler utility
export const parseApiError = (error: any): ApiError => {
  if (error.response) {
    const response = error.response as AxiosResponse<ApiErrorResponse>;
    return {
      detail: response.data?.detail || "An error occurred",
      request_id: response.data?.request_id,
      status: response.status,
      timestamp: new Date().toISOString(),
    };
  } else if (error.request) {
    return {
      detail: "Network error. Please check your connection.",
      status: 0,
      timestamp: new Date().toISOString(),
    };
  } else {
    return {
      detail: error.message || "An unexpected error occurred",
      status: 0,
      timestamp: new Date().toISOString(),
    };
  }
};

// User-friendly error message mapper
export const getErrorMessage = (error: ApiError): string => {
  switch (error.status) {
    case 400:
      return error.detail.includes("Validation error")
        ? `Please check your input: ${error.detail.replace(
            "Validation error: ",
            ""
          )}`
        : error.detail;
    case 401:
      return "Authentication required. Please log in.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 413:
      return "File is too large. Please choose a file under 10MB.";
    case 415:
      return "File type not supported. Please upload a PDF or text file.";
    case 422:
      return `Processing error: ${error.detail}`;
    case 500:
      return "Server error. Please try again later.";
    case 0:
      return error.detail; // Network or client errors
    default:
      return error.detail || "An unexpected error occurred";
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log error details for debugging
    const apiError = parseApiError(error);
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: apiError.status,
      detail: apiError.detail,
      request_id: apiError.request_id,
    });

    // Re-throw with enhanced error info
    const enhancedError = new Error(getErrorMessage(apiError));
    (enhancedError as any).apiError = apiError;
    throw enhancedError;
  }
);

// Response types for API endpoints
export interface CourseListResponse {
  courses: Course[];
}

export interface CourseCreateRequest {
  title: string;
  level?: string;
  duration: string;
  final_competency?: string;
  source_filename: string;
}

export interface ProgressUpdateRequest {
  course_id: string;
  module_index?: number;
  day_key?: string;
  minutes?: number;
  actions_done?: string[];
  quiz_score?: number;
  notes?: string;
  completed: boolean;
}

export interface ProgressResponse {
  success: boolean;
  message: string;
  total_minutes: number;
  modules_completed: number;
  current_module?: number;
  current_day?: string;
}

export interface CourseProgressResponse {
  course_id: string;
  progress: Record<string, Progress>;
  total_modules: number;
  completed_modules: number;
  total_minutes: number;
}

export interface UploadResponse {
  course: {
    id?: string;
    title: string;
    description?: string;
    level?: string;
    duration: string;
    milestones?: string[];
    final_competency?: string;
    source_filename: string;
    structured: boolean;
    timeline?: Record<string, any>;
    library?: Record<string, any>;
    modules?: Module[];
    lessons?: Array<{
      lesson_number: number;
      title: string;
      topics: string[];
      duration: string;
      content: string;
      resources?: string[];
      skill_tags?: string[];
      daily_plan?: Record<string, any>;
      practice_exercises?: Array<{
        exercise_number: number;
        title: string;
        description: string;
        difficulty: string;
        estimated_time: string;
      }>;
      learning_objectives?: string[];
      key_takeaways?: string[];
    }>;
    modules_count?: number;
    meta?: Record<string, any>;
  };
  learning_guide: {
    study_plan?: {
      total_duration?: string;
      recommended_pace?: string;
      daily_commitment?: string;
      milestones?: Array<{
        week: number;
        goal: string;
        skills: string[];
      }>;
    };
    learning_path?: Array<{
      lesson_number?: number;
      title?: string;
      duration?: string;
      difficulty?: string;
      prerequisites?: string[];
      outcomes?: string[];
    }>;
    resource_library?: {
      all_videos?: string[];
      practice_exercises?: Array<{
        lesson: string;
        exercises: Array<{
          title: string;
          description: string;
          difficulty: string;
          estimated_time: string;
        }>;
      }>;
      skill_matrix?: {
        skills: string[];
        progression: string;
      };
    };
  };
  processing_info: {
    filename: string;
    file_size: number;
    text_length: number;
    lessons_parsed: number;
    lessons_enriched: number;
    course_saved: boolean;
    pipeline_steps_completed: string[];
  };
  status?: string;
}

// Course API with enhanced error handling
export const courseApi = {
  getAll: async (): Promise<CourseListResponse> => {
    try {
      const response = await api.get<CourseListResponse>("/api/courses");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: string): Promise<Course> => {
    try {
      const response = await api.get<Course>(`/api/courses/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: CourseCreateRequest): Promise<Course> => {
    try {
      const response = await api.post<Course>("/api/courses", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getProgress: async (courseId: string): Promise<CourseProgressResponse> => {
    try {
      const response = await api.get<CourseProgressResponse>(
        `/api/courses/${courseId}/progress`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Progress API with enhanced error handling
export const progressApi = {
  update: async (data: ProgressUpdateRequest): Promise<ProgressResponse> => {
    try {
      const response = await api.patch<ProgressResponse>("/api/progress", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getCourseProgress: async (
    courseId: string
  ): Promise<CourseProgressResponse> => {
    try {
      const response = await api.get<CourseProgressResponse>(
        `/api/courses/${courseId}/progress`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Upload API with enhanced error handling
export const uploadApi = {
  uploadRoadmap: async (file: File): Promise<UploadResponse> => {
    try {
      console.log("🚀 Starting file upload:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        baseURL: API_BASE_URL,
      });

      const formData = new FormData();
      formData.append("file", file);

      // Create a special axios instance for file uploads (no Content-Type header)
      const uploadInstance = axios.create({
        baseURL: API_BASE_URL,
        timeout: 60000, // 60 seconds for file uploads
        headers: {
          Accept: "application/json",
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
      });

      const response = await uploadInstance.post<UploadResponse>(
        "/api/upload-roadmap",
        formData
      );

      console.log("✅ Upload successful:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Upload failed:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      });

      // Enhanced error parsing for better user feedback
      if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
        throw new Error(
          "Network error. Please check that the server is running on http://localhost:8002"
        );
      }

      if (error.code === "ECONNABORTED") {
        throw new Error(
          "Upload timeout. Please try again with a smaller file."
        );
      }

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            throw new Error(data?.detail || "Invalid file or request");
          case 413:
            throw new Error("File too large. Please choose a smaller file.");
          case 415:
            throw new Error(
              "File type not supported. Please upload a PDF file."
            );
          case 422:
            throw new Error(data?.detail || "Invalid file content");
          case 500:
            throw new Error("Server error. Please try again later.");
          default:
            throw new Error(data?.detail || `Upload failed (${status})`);
        }
      }

      throw error;
    }
  },
};

export default api;

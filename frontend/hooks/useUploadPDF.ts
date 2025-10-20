import { useState } from "react";
import uploadApi, { UploadResponse } from "../lib/upload-api";

export interface PDFUploadResult extends UploadResponse<any> {}

export const useUploadPDF = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PDFUploadResult | null>(null);
  const [success, setSuccess] = useState(false);

  const uploadFile = async (file: File, endpoint = "/api/parse-pdf") => {
    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);
    try {
      const res = await uploadApi.post<PDFUploadResult>(
        endpoint,
        (() => {
          const fd = new FormData();
          fd.append("file", file);
          return fd;
        })(),
        {
          headers: { Accept: "application/json" },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
      );
      setResult(res.data);
      setSuccess(true);
      return res.data;
    } catch (e: any) {
      setError(e?.message || "Upload failed");
      throw e;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setSuccess(false);
  };

  const testConnection = async (fullUrl: string) => {
    try {
      await uploadApi.get(fullUrl.replace(/\/parse-pdf$/, "/health"), {
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  };

  return {
    isUploading,
    progress,
    error,
    result,
    success,
    uploadFile,
    reset,
    testConnection,
  };
};

export default useUploadPDF;

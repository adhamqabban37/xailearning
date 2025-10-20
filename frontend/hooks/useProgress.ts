import { useEffect, useState } from "react";
import { courseApi } from "../lib/api";

export const useProgress = (courseId: string | null) => {
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!courseId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    courseApi
      .getProgress(courseId)
      .then((data) => setProgressData(data))
      .catch((e: any) => setError(e?.message || "Failed to load progress"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const updateProgress = async (_payload: any) => {
    // no-op placeholder to satisfy component usage
    return { success: true };
  };

  return { progressData, loading, error, updateProgress };
};

export default useProgress;

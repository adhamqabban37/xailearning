// Firebase dependencies removed. Consumers should migrate to Supabase-backed auth in authSupabase.ts
import { supabase } from "./supabaseClient";
import type { Course } from "./types";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface LessonProgress {
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number;
  timeSpent?: number;
}

export interface SavedCourse {
  courseId: string;
  course: Course;
  progress: LessonProgress[];
  savedAt: Date;
  lastAccessedAt: Date;
}

// Authentication functions
export const signUp = async () => {
  throw new Error("Deprecated: use authSupabase.signUp instead");
};

export const signIn = async () => {
  throw new Error("Deprecated: use authSupabase.signIn instead");
};

export const logOut = async () => {
  await supabase.auth.signOut();
};

// User profile functions
export const getUserProfile = async (
  _uid: string
): Promise<UserProfile | null> => {
  // TODO: Implement Supabase-backed profiles if needed
  return null;
};

// Course and progress functions
/**
 * Insert a new course row for a user.
 *
 * Contract
 * - Input: uid, Course object (see types.ts)
 * - Output: course id (uuid) on success; returns a temporary id `tmp_<timestamp>` on failure
 * - Side effects: writes to `user_courses` table.
 */
export const saveCourse = async (
  uid: string,
  course: Course
): Promise<string> => {
  try {
    const payload = {
      user_id: uid,
      course,
      progress: [],
      saved_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    } as any;
    const { data, error } = await supabase
      .from("user_courses")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return (data as any).id as string;
  } catch (e) {
    console.warn("[auth.saveCourse] Supabase insert failed:", e);
    // Fallback: return a temporary id so callers can proceed (non-persistent)
    return `tmp_${Date.now()}`;
  }
};

/**
 * List a user's saved courses sorted by saved_at DESC.
 * Returns simplified rows with proper Date objects for timestamps.
 */
export const getUserCourses = async (
  uid: string
): Promise<(SavedCourse & { courseId: string })[]> => {
  try {
    const { data, error } = await supabase
      .from("user_courses")
      .select("id, course, progress, saved_at, last_accessed_at")
      .eq("user_id", uid)
      .order("saved_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      courseId: row.id as string,
      course: row.course as Course,
      progress: (row.progress as LessonProgress[]) || [],
      savedAt: row.saved_at ? new Date(row.saved_at) : new Date(),
      lastAccessedAt: row.last_accessed_at
        ? new Date(row.last_accessed_at)
        : new Date(),
    }));
  } catch (e) {
    console.warn("[auth.getUserCourses] Supabase select failed:", e);
    return [];
  }
};

// Update a user's lesson progress for a specific course/lesson
/**
 * Merge and persist lesson progress for a user/course.
 *
 * Behavior
 * - Reads current `progress` array
 * - Upserts the target lesson's progress, setting `completedAt` when completed
 * - Updates `last_accessed_at`
 */
export const updateLessonProgress = async (
  uid: string,
  courseId: string,
  lessonId: string,
  progress: Partial<LessonProgress>
) => {
  try {
    const { data: row, error: fetchError } = await supabase
      .from("user_courses")
      .select("progress")
      .eq("id", courseId)
      .eq("user_id", uid)
      .single();
    if (fetchError) throw fetchError;

    const current: LessonProgress[] = (row?.progress as LessonProgress[]) || [];
    const idx = current.findIndex((p) => p.lessonId === lessonId);
    const base: LessonProgress = {
      courseId,
      lessonId,
      completed: false,
    };
    const updated: LessonProgress = {
      ...base,
      ...current[idx],
      ...progress,
      completedAt: progress.completed ? new Date() : current[idx]?.completedAt,
    } as LessonProgress;

    if (idx >= 0) {
      current[idx] = updated;
    } else {
      current.push(updated);
    }

    const { error: updateError } = await supabase
      .from("user_courses")
      .update({
        progress: current,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .eq("user_id", uid);
    if (updateError) throw updateError;
  } catch (e) {
    console.warn("[auth.updateLessonProgress] Supabase update failed:", e);
  }
};

// Retrieve a user's course progress
/**
 * Fetch a user's progress for a given course.
 * Returns an array of LessonProgress; coerces `completedAt` to Date when present.
 */
export const getCourseProgress = async (
  uid: string,
  courseId: string
): Promise<LessonProgress[]> => {
  try {
    const { data, error } = await supabase
      .from("user_courses")
      .select("progress")
      .eq("id", courseId)
      .eq("user_id", uid)
      .single();
    if (error) throw error;
    return ((data?.progress as LessonProgress[]) || []).map((p) => ({
      ...p,
      completedAt: p.completedAt ? new Date(p.completedAt as any) : undefined,
    }));
  } catch (e) {
    console.warn("[auth.getCourseProgress] Supabase select failed:");
    return [];
  }
};

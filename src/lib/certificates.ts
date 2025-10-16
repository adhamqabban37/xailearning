import { supabase } from "./supabaseClient";

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  certificateUrl?: string;
  downloadCount: number;
  completedAt: Date;
}

export interface CertificateTemplate {
  backgroundColor: string;
  secondaryColor: string;
  signatureUrl?: string;
  template: "modern" | "classic" | "circuit";
}
// Certificate management functions (Supabase)
export const awardCertificate = async (
  userId: string,
  courseId: string,
  courseTitle: string,
  userName: string
): Promise<string> => {
  const now = new Date();
  const certificateData: Omit<Certificate, "id"> = {
    userId,
    courseId,
    courseTitle,
    userName,
    completedAt: now,
    downloadCount: 0,
  };
  const { data, error } = await supabase
    .from("certificates")
    .insert({
      user_id: certificateData.userId,
      course_id: certificateData.courseId,
      course_title: certificateData.courseTitle,
      user_name: certificateData.userName,
      certificate_url: certificateData.certificateUrl ?? null,
      download_count: certificateData.downloadCount,
      completed_at: certificateData.completedAt.toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
};

export const getUserCertificates = async (
  userId: string
): Promise<Certificate[]> => {
  const { data, error } = await supabase
    .from("certificates")
    .select(
      "id, user_id, course_id, course_title, user_name, certificate_url, download_count, completed_at"
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    courseTitle: row.course_title,
    userName: row.user_name,
    certificateUrl: row.certificate_url ?? undefined,
    downloadCount: row.download_count ?? 0,
    completedAt: row.completed_at ? new Date(row.completed_at) : new Date(),
  }));
};

export const getCertificate = async (
  certificateId: string
): Promise<Certificate | null> => {
  const { data, error } = await supabase
    .from("certificates")
    .select(
      "id, user_id, course_id, course_title, user_name, certificate_url, download_count, completed_at"
    )
    .eq("id", certificateId)
    .single();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    courseId: data.course_id,
    courseTitle: data.course_title,
    userName: data.user_name,
    certificateUrl: data.certificate_url ?? undefined,
    downloadCount: data.download_count ?? 0,
    completedAt: data.completed_at ? new Date(data.completed_at) : new Date(),
  };
};

export const incrementDownloadCount = async (certificateId: string) => {
  const { data, error } = await supabase
    .from("certificates")
    .update({ download_count: (supabase as any).sql`download_count + 1` })
    .eq("id", certificateId)
    .select("id")
    .single();
  if (error) throw error;
  return data?.id as string;
};

import { supabase } from "@/lib/supabase";

export type ResumeLink = { label: string; url: string };
export type ResumeEducation = { school: string; degree?: string; duration?: string; details?: string };
export type ResumeSkillSection = { section: string; items: string[] };
export type ResumeExperience = { company: string; role?: string; duration?: string; bullets: string[] };
export type ResumeProject = { name: string; description?: string; bullets: string[]; links?: ResumeLink[] };
export type ResumeCertification = { name: string; issuer?: string; year?: string };

export type Resume = {
  id?: string;
  user_id: string;
  full_name: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  links: ResumeLink[];
  summary?: string;
  education: ResumeEducation[];
  technical_skills: ResumeSkillSection[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  achievements: string[];
  certifications: ResumeCertification[];
  created_at?: string;
  updated_at?: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchMyResume(): Promise<Resume | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data as unknown as Resume) || null;
}

export async function upsertMyResume(resume: Omit<Resume, "user_id">): Promise<Resume> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const payload = { ...resume, user_id: userId } as Partial<Resume>;
  const { data, error } = await supabase
    .from("resumes")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Resume;
}

export async function deleteMyResume(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const { error } = await supabase.from("resumes").delete().eq("user_id", userId);
  if (error) throw error;
}



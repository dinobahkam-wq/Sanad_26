import type { AuthError, PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type AppProfile = {
  id: string;
  phone: string | null;
  internal_email: string | null;
  full_name: string | null;
  status: string | null;
  onboarding_status: string | null;
};

export type ProfileInput = {
  userId: string;
  email?: string | null;
  fullName: string;
  phone: string;
};

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function isProfileComplete(profile: AppProfile | null) {
  return Boolean(
    profile?.full_name?.trim() &&
      profile?.phone?.trim() &&
      profile?.status === "active" &&
      profile?.onboarding_status === "completed",
  );
}

export async function getOwnProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("app_profiles")
    .select("id,phone,internal_email,full_name,status,onboarding_status")
    .eq("id", userId)
    .maybeSingle<AppProfile>();

  if (error) throw error;
  return data;
}

export async function upsertOwnProfile(supabase: SupabaseClient, input: ProfileInput) {
  const normalizedPhone = normalizePhone(input.phone);

  const { data, error } = await supabase
    .from("app_profiles")
    .upsert(
      {
        id: input.userId,
        internal_email: input.email ?? null,
        phone: normalizedPhone,
        full_name: input.fullName.trim(),
        onboarding_status: "completed",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("id,phone,internal_email,full_name,status,onboarding_status")
    .single<AppProfile>();

  if (error) throw error;
  return data;
}

export function getSupabaseErrorInfo(error: unknown) {
  const candidate = error as Partial<AuthError & PostgrestError> | null;

  return {
    message: candidate?.message ?? String(error),
    code: candidate?.code,
    details: candidate?.details,
    hint: candidate?.hint,
    status: candidate?.status,
    full: error,
  };
}

export function logSupabaseError(context: string, error: unknown) {
  console.error(context, getSupabaseErrorInfo(error));
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOwnProfile, logSupabaseError, normalizePhone, upsertOwnProfile } from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/share";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) {
          router.replace(`/auth/login?next=${encodeURIComponent("/auth/complete-profile")}`);
          return;
        }

        const profile = await getOwnProfile(supabase, user.id);
        if (!isMounted) return;

        setEmail(user.email ?? profile?.internal_email ?? null);
        setFullName(profile?.full_name ?? "");
        setPhone(profile?.phone ?? "");
      } catch (error) {
        logSupabaseError("Load profile failed", error);
        if (isMounted) setErrorMessage("تعذر تحميل بيانات الملف الشخصي.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [router]);

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const normalizedPhone = normalizePhone(phone);
    if (fullName.trim().length < 2) {
      setErrorMessage("اكتب الاسم الكامل بشكل صحيح.");
      return;
    }
    if (normalizedPhone.length < 8) {
      setErrorMessage("اكتب رقم هاتف صحيحًا بالأرقام.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) {
        router.replace(`/auth/login?next=${encodeURIComponent("/auth/complete-profile")}`);
        return;
      }

      await upsertOwnProfile(supabase, {
        userId: user.id,
        email: user.email ?? email,
        fullName,
        phone: normalizedPhone,
      });

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      logSupabaseError("Complete profile failed", error);
      setErrorMessage("تعذر حفظ الملف الشخصي. تحقق من البيانات ثم حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submitProfile}>
      {isLoading ? <div className="notice">جاري تحميل بياناتك...</div> : null}
      <label className="field">
        <span>الاسم الكامل</span>
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </label>
      <label className="field">
        <span>رقم الهاتف</span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      </label>
      <p className="error" role="alert">
        {errorMessage}
      </p>
      <button className="button button-primary" type="submit" disabled={isSubmitting || isLoading}>
        {isSubmitting ? "جاري الحفظ..." : "حفظ الملف الشخصي"}
      </button>
    </form>
  );
}

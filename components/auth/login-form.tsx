"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getOwnProfile, isProfileComplete, logSupabaseError } from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/share";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      const currentUser = user ?? session?.user;
      if (!currentUser) throw new Error("No authenticated user after sign in.");

      const profile = await getOwnProfile(supabase, currentUser.id);
      const destination = isProfileComplete(profile)
        ? nextPath
        : `/auth/complete-profile?next=${encodeURIComponent(nextPath)}`;

      router.replace(destination);
      router.refresh();
    } catch (error) {
      logSupabaseError("Login failed", error);
      setErrorMessage("تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور ثم حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submitLogin}>
      <label className="field">
        <span>البريد الإلكتروني</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="field">
        <span>كلمة المرور</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <p className="error" role="alert">
        {errorMessage}
      </p>
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "جاري الدخول..." : "تسجيل الدخول"}
      </button>
      <Link className="button button-secondary" href="/auth/register">
        إنشاء حساب جديد
      </Link>
    </form>
  );
}

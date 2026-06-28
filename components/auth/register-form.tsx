"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { logSupabaseError, normalizePhone, upsertOwnProfile } from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/share";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user returned from signup.");

      await upsertOwnProfile(supabase, {
        userId: data.user.id,
        email: email.trim(),
        fullName,
        phone: normalizedPhone,
      });

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      logSupabaseError("Register failed", error);
      setErrorMessage("تعذر إنشاء الحساب. قد يكون البريد أو الهاتف مستخدمًا مسبقًا.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submitRegister}>
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
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <p className="error" role="alert">
        {errorMessage}
      </p>
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
      </button>
      <Link className="button button-secondary" href="/auth/login">
        لدي حساب بالفعل
      </Link>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  getSupabaseErrorInfo,
  logSupabaseError,
  normalizePhone,
  upsertOwnProfile,
} from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/share";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    const normalizedPhone = normalizePhone(phone);
    if (fullName.trim().length < 2) {
      setMessage("اكتب الاسم الكامل بشكل صحيح.");
      return;
    }
    if (normalizedPhone.length < 8) {
      setMessage("اكتب رقم هاتف صحيحًا بالأرقام.");
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

      if (!data.session) {
        setIsSuccess(true);
        setMessage("تم إنشاء الحساب. يرجى تأكيد البريد الإلكتروني ثم تسجيل الدخول.");
        window.setTimeout(() => {
          router.replace(`/auth/login?next=${encodeURIComponent(nextPath)}`);
        }, 1800);
        return;
      }

      await upsertOwnProfile(supabase, {
        userId: data.session.user.id,
        email: email.trim(),
        fullName,
        phone: normalizedPhone,
      });

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      const info = getSupabaseErrorInfo(error);
      logSupabaseError("Register failed", error);
      setMessage(
        info.status === 429 || info.code === "over_email_send_rate_limit"
          ? "تمت محاولات تسجيل كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
          : "تعذر إنشاء الحساب. قد يكون البريد أو الهاتف مستخدمًا مسبقًا.",
      );
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
      <p className={isSuccess ? "notice" : "error"} role="alert">
        {message}
      </p>
      <button className="button button-primary" type="submit" disabled={isSubmitting || isSuccess}>
        {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
      </button>
      <Link className="button button-secondary" href="/auth/login">
        لدي حساب بالفعل
      </Link>
    </form>
  );
}

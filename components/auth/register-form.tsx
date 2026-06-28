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

function isRateLimitError(info: ReturnType<typeof getSupabaseErrorInfo>) {
  const text = `${info.message} ${info.code} ${info.status}`.toLowerCase();
  return info.status === 429 || text.includes("rate") || text.includes("too many") || text.includes("over_email");
}

function isAlreadyRegisteredError(info: ReturnType<typeof getSupabaseErrorInfo>) {
  const text = `${info.message} ${info.code}`.toLowerCase();
  return (
    text.includes("already registered") ||
    text.includes("already exists") ||
    text.includes("user_already_exists") ||
    text.includes("email_exists")
  );
}

function registerUserMessage(error: unknown) {
  const info = getSupabaseErrorInfo(error);

  if (isRateLimitError(info)) {
    return "تمت محاولات تسجيل كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  }

  if (isAlreadyRegisteredError(info)) {
    return "هذا البريد مسجل مسبقًا. جرّب تسجيل الدخول.";
  }

  return info.message && info.message !== "[object Object]"
    ? info.message
    : "تعذر إنشاء الحساب. تحقق من البيانات ثم حاول مرة أخرى.";
}

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

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const normalizedPhone = normalizePhone(phone);

    if (trimmedName.length < 2) {
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
      console.info("register: before signUp", {
        email: trimmedEmail,
        hasPassword: Boolean(password),
        phoneLength: normalizedPhone.length,
      });

      const signUpResult = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      console.info("register: signUp result", {
        hasUser: Boolean(signUpResult.data.user),
        hasSession: Boolean(signUpResult.data.session),
        userId: signUpResult.data.user?.id,
        error: signUpResult.error ? getSupabaseErrorInfo(signUpResult.error) : null,
      });

      if (signUpResult.error) throw signUpResult.error;
      if (!signUpResult.data.user) throw new Error("No user returned from signup.");

      if (!signUpResult.data.session) {
        setIsSuccess(true);
        setMessage("تم إنشاء الحساب. يرجى تأكيد البريد الإلكتروني ثم تسجيل الدخول.");
        window.setTimeout(() => {
          router.replace(`/auth/login?next=${encodeURIComponent(nextPath)}`);
        }, 1800);
        return;
      }

      const upsertResult = await upsertOwnProfile(supabase, {
        userId: signUpResult.data.session.user.id,
        email: trimmedEmail,
        fullName: trimmedName,
        phone: normalizedPhone,
      });

      console.info("register: profile upsert result", {
        profileId: upsertResult.id,
        status: upsertResult.status,
        onboardingStatus: upsertResult.onboarding_status,
      });

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      logSupabaseError("Register failed", error);
      setMessage(registerUserMessage(error));
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

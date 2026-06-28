import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "إنشاء حساب",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="حساب جديد"
      title="إنشاء حساب سند"
      description="أنشئ حسابًا باستخدام بريدك وكلمة مرورك، ثم نربط ملفك بجدول app_profiles."
      footer={
        <p>
          لديك حساب؟ <Link href="/auth/login">تسجيل الدخول</Link>
        </p>
      }
    >
      <Suspense fallback={<div className="notice">جاري تجهيز نموذج التسجيل...</div>}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}

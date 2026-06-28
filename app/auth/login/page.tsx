import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="دخول آمن"
      title="تسجيل الدخول"
      description="ادخل إلى سند لمشاركة إشعارات العمليات ومتابعة معالجتها."
      footer={
        <p>
          لا تملك حسابًا؟ <Link href="/auth/register">أنشئ حسابًا جديدًا</Link>
        </p>
      }
    >
      <Suspense fallback={<div className="notice">جاري تجهيز نموذج الدخول...</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}

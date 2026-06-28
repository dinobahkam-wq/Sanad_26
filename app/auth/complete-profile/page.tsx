import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";

export const metadata: Metadata = {
  title: "إكمال الملف الشخصي",
};

export default function CompleteProfilePage() {
  return (
    <AuthShell
      eyebrow="بيانات الحساب"
      title="إكمال الملف الشخصي"
      description="أكمل اسمك ورقم هاتفك حتى يتم تفعيل ملفك داخل تطبيق سند."
    >
      <Suspense fallback={<div className="notice">جاري تجهيز نموذج الملف الشخصي...</div>}>
        <CompleteProfileForm />
      </Suspense>
    </AuthShell>
  );
}

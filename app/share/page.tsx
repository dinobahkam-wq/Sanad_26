import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ShareIntakeForm } from "@/components/share-intake-form";
import { getOwnProfile, isProfileComplete } from "@/lib/auth/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "مشاركة إشعار",
};

export default async function SharePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/share");
  }

  const profile = await getOwnProfile(supabase, user.id);
  if (!isProfileComplete(profile)) {
    redirect("/auth/complete-profile?next=/share");
  }

  return (
    <main className="shell">
      <AppHeader />
      <section className="panel page-card">
        <p className="eyebrow">طلب جديد</p>
        <h1>مشاركة إشعار عملية</h1>
        <p>اختر ملف الإشعار وسيتم إنشاء طلب مشاركة في سند مع مهمة معالجة بحالة الانتظار.</p>
        <ShareIntakeForm userId={user.id} phone={profile.phone} fullName={profile.full_name} />
      </section>
    </main>
  );
}

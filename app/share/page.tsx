import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { ShareIntakeForm } from "@/components/share-intake-form";

export const metadata: Metadata = {
  title: "مشاركة إشعار",
};

export default function SharePage() {
  return (
    <main className="shell">
      <AppHeader />
      <section className="panel page-card">
        <p className="eyebrow">طلب جديد</p>
        <h1>مشاركة إشعار عملية</h1>
        <p>
          اختر ملف الإشعار وسيتم إنشاء طلب مشاركة في سند مع مهمة معالجة بحالة الانتظار.
        </p>
        <ShareIntakeForm />
      </section>
    </main>
  );
}

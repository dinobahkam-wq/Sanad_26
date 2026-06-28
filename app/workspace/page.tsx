import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { StatusCard } from "@/components/status-card";

export const metadata: Metadata = {
  title: "مساحة العمل",
};

export default function WorkspacePage() {
  return (
    <main className="shell">
      <AppHeader />
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">مساحة العمل</p>
          <h1>متابعة مشاركات سند</h1>
          <p className="lead">
            مساحة منظمة لمتابعة طلبات المشاركة، ملفاتها، وظائف المعالجة، ونتائج الاستخراج والربط.
          </p>
        </div>

        <div className="status-grid">
          <StatusCard title="الطلبات" value="share_intakes" description="مصدر طلبات المشاركة وحالتها." />
          <StatusCard title="الملفات" value="share_intake_files" description="بيانات الملفات ومسارات التخزين." />
          <StatusCard title="المعالجة" value="share_processing_jobs" description="طابور استخراج وربط الإشعارات." />
        </div>

        <div className="notice">
          لم يتم إضافة منطق قاعدة بيانات وهمي هنا. اربط هذه المساحة باستعلامات Supabase بعد اعتماد سياسات
          القراءة المناسبة للمستخدمين.
        </div>

        <div className="actions">
          <Link className="button button-primary" href="/share">
            إنشاء مشاركة جديدة
          </Link>
        </div>
      </section>
    </main>
  );
}

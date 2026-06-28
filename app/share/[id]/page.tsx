import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";

type ShareStatusPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "حالة المشاركة",
};

export default async function ShareStatusPage({ params }: ShareStatusPageProps) {
  const { id } = await params;

  return (
    <main className="shell">
      <AppHeader />
      <section className="panel page-card">
        <p className="eyebrow">حالة الطلب</p>
        <h1>طلب المشاركة</h1>
        <div className="success-panel">
          <span className="status-pill">في قائمة الانتظار</span>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>رقم الطلب</dt>
              <dd>{id}</dd>
            </div>
            <div className="detail-row">
              <dt>الحالة الحالية</dt>
              <dd>بانتظار المعالجة</dd>
            </div>
          </dl>
          <p>
            هذه الصفحة جاهزة لربط قراءة الحالة من `share_intakes` ونتائج الاستخراج من
            `share_extraction_results` عند اعتماد سياسة القراءة المناسبة.
          </p>
          <Link className="button button-secondary" href="/share">
            مشاركة إشعار آخر
          </Link>
        </div>
      </section>
    </main>
  );
}

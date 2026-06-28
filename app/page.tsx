import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { StatusCard } from "@/components/status-card";

export default function HomePage() {
  return (
    <main className="shell">
      <AppHeader />
      <section className="hero-grid">
        <div className="panel hero-panel">
          <div>
            <p className="eyebrow">Share-to-SANAD</p>
            <h1>أرسل إشعار العملية إلى سند</h1>
            <p className="lead">
              تطبيق PWA عربي لمعالجة صور وإشعارات العمليات المالية وربطها بسجلات سند من خلال مسار واضح
              وآمن.
            </p>
          </div>
          <div className="actions">
            <Link className="button button-primary" href="/share">
              مشاركة إشعار
            </Link>
            <Link className="button button-secondary" href="/workspace">
              فتح مساحة العمل
            </Link>
          </div>
        </div>

        <aside className="feature-grid">
          <StatusCard title="المشاركة" value="ملف واحد" description="ارفع صورة أو PDF لإشعار العملية." />
          <StatusCard title="المعالجة" value="Queued" description="ينشئ التطبيق مهمة معالجة قابلة للمتابعة." />
          <StatusCard title="الربط" value="جاهز" description="مصمم لربط النتائج بعمليات سند بعد الاستخراج." />
        </aside>
      </section>
    </main>
  );
}

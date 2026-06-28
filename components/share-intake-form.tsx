"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logSupabaseError } from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { IntakeResult, ShareFileKind } from "@/types/share";

function getFileKind(file: File): ShareFileKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "unknown";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} كيلوبايت`;
  return `${(size / 1024 / 1024).toFixed(1)} ميجابايت`;
}

export function ShareIntakeForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntakeResult | null>(null);

  const fileSummary = useMemo(() => {
    if (!file) return "لم يتم اختيار ملف";
    return `${file.name} · ${formatFileSize(file.size)}`;
  }, [file]);

  async function createIntake() {
    if (!file) {
      setError("اختر صورة أو ملف PDF لإشعار العملية.");
      return;
    }

    const kind = getFileKind(file);
    if (kind === "unknown") {
      setError("نوع الملف غير مدعوم. ارفع صورة أو ملف PDF فقط.");
      return;
    }

    setError("");
    setResult(null);
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) {
        router.replace("/auth/login?next=/share");
        return;
      }

      const now = new Date().toISOString();

      const { data: intake, error: intakeError } = await supabase
        .from("share_intakes")
        .insert({
          source: "pwa",
          status: "queued",
          received_at: now,
          submitted_by_user_id: session.user.id,
        })
        .select("id,status")
        .single();

      if (intakeError) throw intakeError;
      if (!intake?.id) throw new Error("Share intake row was not returned.");

      const uploadPlaceholder = {
        bucket: null,
        path: null,
        status: "pending_upload",
      };

      const { data: intakeFile, error: fileError } = await supabase
        .from("share_intake_files")
        .insert({
          share_intake_id: intake.id,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          file_kind: kind,
          storage_bucket: uploadPlaceholder.bucket,
          storage_path: uploadPlaceholder.path,
          upload_status: uploadPlaceholder.status,
        })
        .select("id")
        .single();

      if (fileError) throw fileError;
      if (!intakeFile?.id) throw new Error("Share intake file row was not returned.");

      const { data: job, error: jobError } = await supabase
        .from("share_processing_jobs")
        .insert({
          share_intake_id: intake.id,
          status: "queued",
          job_type: "extract_financial_notice",
          queued_at: now,
        })
        .select("id,status")
        .single();

      if (jobError) throw jobError;
      if (!job?.id) throw new Error("Share processing job row was not returned.");

      setResult({
        intakeId: intake.id,
        fileId: intakeFile.id,
        jobId: job.id,
        status: "queued",
      });
      setFile(null);
    } catch (submitError) {
      logSupabaseError("Share intake failed", submitError);
      setError("تعذر إنشاء طلب المشاركة. تحقق من صلاحية الحساب وسياسات الوصول ثم حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-stack">
      <label className="file-drop">
        <strong>اختر إشعار العملية</strong>
        <span className="file-name">{fileSummary}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="notice">
        سيتم إنشاء سجل مشاركة باسم المستخدم الحالي، ثم سجل ملف، ثم مهمة معالجة بحالة الانتظار. رفع الملف
        الفعلي جاهز للربط مع Storage عند اعتماد bucket وسياسات الوصول.
      </div>

      <p className="error" role="alert">
        {error}
      </p>

      <button className="button button-primary" type="button" disabled={isSubmitting} onClick={createIntake}>
        {isSubmitting ? "جاري إنشاء الطلب..." : "إرسال إلى سند"}
      </button>

      {result ? (
        <section className="success-panel">
          <span className="status-pill">في قائمة الانتظار</span>
          <h2>تم إنشاء طلب المشاركة</h2>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>رقم الطلب</dt>
              <dd>{result.intakeId}</dd>
            </div>
            <div className="detail-row">
              <dt>رقم الملف</dt>
              <dd>{result.fileId}</dd>
            </div>
            <div className="detail-row">
              <dt>مهمة المعالجة</dt>
              <dd>{result.jobId}</dd>
            </div>
          </dl>
          <Link className="button button-secondary" href={`/share/${result.intakeId}`}>
            متابعة حالة الطلب
          </Link>
        </section>
      ) : null}
    </div>
  );
}

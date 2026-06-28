"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseErrorInfo } from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { AttachmentType, IntakeResult } from "@/types/share";

type ShareIntakeFormProps = {
  userId: string;
  phone: string;
  fullName: string;
};

type ShareFilePayload = {
  intake_id: string;
  bucket: "transaction-files";
  path: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_status: "pending";
  attachment_type: AttachmentType;
};

function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("text/")) return "text";
  return file.type ? "document" : "unknown";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} كيلوبايت`;
  return `${(size / 1024 / 1024).toFixed(1)} ميجابايت`;
}

function safePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "attachment";
}

function buildPendingStoragePath(intakeId: string, file: File) {
  return `pending/${intakeId}/${Date.now()}-${safePathPart(file.name)}`;
}

function logSupabaseStep(step: string, result: unknown) {
  console.info(step, result);
}

function warnHandledSupabaseError(context: string, error: unknown) {
  console.warn(context, getSupabaseErrorInfo(error));
}

export function ShareIntakeForm({ userId, phone, fullName }: ShareIntakeFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntakeResult | null>(null);

  const fileSummary = useMemo(() => {
    if (!file) return "لم يتم اختيار ملف";
    return `${file.name} · ${formatFileSize(file.size)}`;
  }, [file]);

  const hasVerifiedProfileProps = Boolean(userId && phone && fullName);
  const canSubmit = hasVerifiedProfileProps && !isSubmitting;

  async function createIntake() {
    if (!hasVerifiedProfileProps) {
      setError("يجب تسجيل الدخول وإكمال الملف الشخصي قبل إرسال الإشعار.");
      return;
    }

    if (!file) {
      setError("اختر صورة أو ملفًا لإشعار العملية.");
      return;
    }

    const attachmentType = getAttachmentType(file);

    setError("");
    setResult(null);
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();

      const intakeResult = await supabase
        .from("share_intakes")
        .insert({
          submitted_by_user_id: userId,
          submitted_by_phone: phone,
          submitted_by_display_name: fullName,
          source_channel: "pwa_share",
          status: "received",
        })
        .select("id,status")
        .single();

      logSupabaseStep("share_intakes insert result", intakeResult);
      if (intakeResult.error) {
        warnHandledSupabaseError("share_intakes insert failed", intakeResult.error);
        setError("تعذر إنشاء طلب المشاركة. تحقق من صلاحية الحساب ثم حاول مرة أخرى.");
        return;
      }
      if (!intakeResult.data?.id) {
        console.error("share_intakes insert returned no id", intakeResult);
        setError("تعذر إنشاء طلب المشاركة. حاول مرة أخرى.");
        return;
      }

      const filePayload: ShareFilePayload = {
        intake_id: intakeResult.data.id,
        bucket: "transaction-files",
        path: buildPendingStoragePath(intakeResult.data.id, file),
        original_filename: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size_bytes: file.size,
        storage_status: "pending",
        attachment_type: attachmentType,
      };

      console.info("share_intake_files insert payload", filePayload);

      const intakeFileResult = await supabase
        .from("share_intake_files")
        .insert(filePayload)
        .select("id")
        .single();

      logSupabaseStep("share_intake_files insert result", intakeFileResult);
      if (intakeFileResult.error) {
        warnHandledSupabaseError("share_intake_files insert failed", intakeFileResult.error);
        setError("تعذر حفظ بيانات الملف. تحقق من نوع الملف وحاول مرة أخرى.");
        return;
      }
      if (!intakeFileResult.data?.id) {
        console.error("share_intake_files insert returned no id", intakeFileResult);
        setError("تعذر حفظ بيانات الملف. حاول مرة أخرى.");
        return;
      }

      const jobResult = await supabase
        .from("share_processing_jobs")
        .insert({
          intake_id: intakeResult.data.id,
          file_id: intakeFileResult.data.id,
          status: "queued",
          job_type: "extract",
          job_payload: {},
        })
        .select("id,status")
        .single();

      logSupabaseStep("share_processing_jobs insert result", jobResult);
      if (jobResult.error) {
        warnHandledSupabaseError("share_processing_jobs insert failed", jobResult.error);
        setError("تم حفظ الملف، لكن تعذر إنشاء مهمة المعالجة. حاول مرة أخرى.");
        return;
      }
      if (!jobResult.data?.id) {
        console.error("share_processing_jobs insert returned no id", jobResult);
        setError("تم حفظ الملف، لكن تعذر إنشاء مهمة المعالجة. حاول مرة أخرى.");
        return;
      }

      setResult({
        intakeId: intakeResult.data.id,
        fileId: intakeFileResult.data.id,
        jobId: jobResult.data.id,
        status: "queued",
      });
      setFile(null);
    } catch (unexpectedError) {
      console.error("Unexpected share intake failure", getSupabaseErrorInfo(unexpectedError));
      setError("حدث خطأ غير متوقع أثناء إرسال الإشعار. حاول مرة أخرى.");
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
          accept="image/*,application/pdf,text/*"
          disabled={!hasVerifiedProfileProps}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="notice">
        تم التحقق من حسابك وملفك الشخصي قبل عرض هذه الصفحة. سيتم ربط الطلب باسمك ورقم هاتفك المسجلين.
      </div>

      <p className="error" role="alert">
        {error}
      </p>

      <button className="button button-primary" type="button" disabled={!canSubmit} onClick={createIntake}>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type AppProfile,
  getOwnProfile,
  isProfileComplete,
  logSupabaseError,
} from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { IntakeResult, ShareFileKind } from "@/types/share";

type ShareGateState = "loading" | "ready" | "redirecting" | "invalid";

function getFileKind(file: File): ShareFileKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "unknown";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} كيلوبايت`;
  return `${(size / 1024 / 1024).toFixed(1)} ميجابايت`;
}

function logSupabaseStep(step: string, result: unknown) {
  console.info(step, result);
}

export function ShareIntakeForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [gateState, setGateState] = useState<ShareGateState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);

  const fileSummary = useMemo(() => {
    if (!file) return "لم يتم اختيار ملف";
    return `${file.name} · ${formatFileSize(file.size)}`;
  }, [file]);

  const canSubmit = gateState === "ready" && Boolean(userId) && Boolean(profile) && !isSubmitting;

  useEffect(() => {
    let isMounted = true;

    async function checkSessionAndProfile() {
      setGateState("loading");
      setError("");

      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session?.user) {
          if (isMounted) setGateState("redirecting");
          router.replace("/auth/login?next=/share");
          return;
        }

        const userProfile = await getOwnProfile(supabase, session.user.id);
        if (!isProfileComplete(userProfile)) {
          if (isMounted) setGateState("redirecting");
          router.replace("/auth/complete-profile?next=/share");
          return;
        }

        if (!isMounted) return;
        setUserId(session.user.id);
        setProfile(userProfile);
        setGateState("ready");
      } catch (gateError) {
        logSupabaseError("Share auth/profile gate failed", gateError);
        if (!isMounted) return;
        setGateState("invalid");
        setError("تعذر التحقق من الجلسة والملف الشخصي. حدّث الصفحة وحاول مرة أخرى.");
      }
    }

    checkSessionAndProfile();
    return () => {
      isMounted = false;
    };
  }, [router]);

  async function createIntake() {
    if (!canSubmit || !userId || !profile) {
      setError("يجب تسجيل الدخول وإكمال الملف الشخصي قبل إرسال الإشعار.");
      return;
    }

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

      const intakeResult = await supabase
        .from("share_intakes")
        .insert({
          submitted_by_user_id: userId,
          submitted_by_phone: profile.phone,
          submitted_by_display_name: profile.full_name,
          source_channel: "pwa_share",
          status: "received",
        })
        .select("id,status")
        .single();

      logSupabaseStep("share_intakes insert result", intakeResult);
      if (intakeResult.error) throw intakeResult.error;
      if (!intakeResult.data?.id) throw new Error("Share intake row was not returned.");

      const intakeFileResult = await supabase
        .from("share_intake_files")
        .insert({
          share_intake_id: intakeResult.data.id,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          file_kind: kind,
          upload_status: "pending_upload",
        })
        .select("id")
        .single();

      logSupabaseStep("share_intake_files insert result", intakeFileResult);
      if (intakeFileResult.error) throw intakeFileResult.error;
      if (!intakeFileResult.data?.id) throw new Error("Share intake file row was not returned.");

      const jobResult = await supabase
        .from("share_processing_jobs")
        .insert({
          share_intake_id: intakeResult.data.id,
          status: "queued",
          job_type: "extract_financial_notice",
          queued_at: new Date().toISOString(),
        })
        .select("id,status")
        .single();

      logSupabaseStep("share_processing_jobs insert result", jobResult);
      if (jobResult.error) throw jobResult.error;
      if (!jobResult.data?.id) throw new Error("Share processing job row was not returned.");

      setResult({
        intakeId: intakeResult.data.id,
        fileId: intakeFileResult.data.id,
        jobId: jobResult.data.id,
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
      {gateState === "loading" ? <div className="notice">جاري التحقق من حسابك...</div> : null}
      {gateState === "redirecting" ? <div className="notice">جاري تحويلك لإكمال الدخول...</div> : null}

      <label className="file-drop">
        <strong>اختر إشعار العملية</strong>
        <span className="file-name">{fileSummary}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          disabled={gateState !== "ready"}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      <div className="notice">
        لن يتم إنشاء طلب مشاركة إلا بعد وجود جلسة صالحة وملف شخصي مكتمل. يتم ربط الطلب باسم ورقم صاحب
        الحساب الحالي.
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

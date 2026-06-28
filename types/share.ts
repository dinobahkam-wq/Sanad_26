export type IntakeStatus = "queued" | "processing" | "completed" | "failed";
export type ShareFileKind = "image" | "pdf" | "unknown";

export type ShareIntakeRecord = {
  id: string;
  status?: IntakeStatus;
  created_at?: string;
};

export type ShareIntakeFileRecord = {
  id: string;
  share_intake_id: string;
  file_name?: string;
  mime_type?: string;
};

export type ShareProcessingJobRecord = {
  id: string;
  share_intake_id: string;
  status?: IntakeStatus;
};

export type IntakeResult = {
  intakeId: string;
  fileId: string;
  jobId: string;
  status: IntakeStatus;
};

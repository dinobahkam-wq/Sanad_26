export type IntakeStatus = "received" | "queued" | "processing" | "completed" | "failed";
export type AttachmentType = "image" | "document" | "pdf" | "text" | "unknown";

export type ShareIntakeRecord = {
  id: string;
  status?: IntakeStatus;
  created_at?: string;
};

export type ShareIntakeFileRecord = {
  id: string;
  intake_id: string;
  original_filename?: string;
  mime_type?: string;
  attachment_type?: AttachmentType;
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

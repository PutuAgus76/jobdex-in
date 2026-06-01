export type DashboardNavItem = {
  label: string;
  href: string;
};

export type UserRole =
  | "super_admin"
  | "koordinator_divisi"
  | "koordinator_acara"
  | "anggota";

export type UserProfile = {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  whatsapp_number: string;
  role: UserRole;
  division_id: string;
  avatar_url: string;
  is_active: boolean;
  created_at?: unknown;
  updated_at?: unknown;
  whatsapp_command_pin?: string;
};

export type EventStatus =
  | "persiapan"
  | "berlangsung"
  | "selesai"
  | "dibatalkan";

export type Event = {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  event_date: unknown;
  coordinator_id: string;
  status: EventStatus;
  progress_percentage: number;
  created_by: string;
  created_at?: unknown;
  updated_at?: unknown;
};

export type EventMember = {
  id: string;
  event_id: string;
  user_id: string;
  role_in_event: string;
  added_by: string;
  added_at?: unknown;
};

export type EventInput = {
  name: string;
  description: string;
  event_date: string;
  coordinator_id: string;
  status: EventStatus;
};

export type TaskType = "divisi" | "acara";

export type TaskStatus =
  | "belum_dimulai"
  | "sedang_dikerjakan"
  | "butuh_bantuan"
  | "stuck"
  | "menunggu_materi"
  | "draft_selesai"
  | "perlu_revisi"
  | "revisi_dikerjakan"
  | "menunggu_approval"
  | "approved"
  | "ditunda";

export type TaskPriority = "rendah" | "sedang" | "tinggi" | "kritis";

export type ApprovalStatus = "pending" | "approved" | "need_revision";

export type Task = {
  id: string;
  organization_id: string;
  type: TaskType;
  division_id?: string;
  event_id?: string;
  name: string;
  description: string;
  pic_id: string;
  coordinator_id: string;
  deadline: unknown;
  status: TaskStatus;
  priority: TaskPriority;
  copywriting: string;
  copywriting_docs_url: string;
  design_reference_url: string;
  drive_reference_url: string;
  color_palette: string[];
  visual_direction: string;
  revision_notes: string;
  stuck_notes: string;
  result_design_url: string;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: unknown;
  is_archived: boolean;
  created_by: string;
  created_at?: unknown;
  updated_at?: unknown;
};

export type TaskStatusLog = {
  id: string;
  task_id: string;
  from_status: TaskStatus;
  to_status: TaskStatus;
  changed_by: string;
  note: string;
  created_at?: unknown;
};

export type TaskUpload = {
  id: string;
  task_id: string;
  upload_url: string;
  thumbnail_url: string;
  public_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  version_number: number;
  uploaded_by: string;
  uploaded_at?: unknown;
};

export type DesignType =
  | "poster"
  | "name_tag"
  | "twibbon"
  | "feed_ig"
  | "story_ig"
  | "banner"
  | "sertifikat"
  | "dokumentasi"
  | "animasi"
  | "merchandise"
  | "lainnya";

export type DesignReference = {
  id: string;
  organization_id: string;
  title: string;
  event_name: string;
  design_type: DesignType;
  year: number;
  drive_url: string;
  thumbnail_url: string;
  style_notes: string;
  color_palette: string[];
  notes: string;
  is_archived: boolean;
  created_by: string;
  created_at?: unknown;
  updated_at?: unknown;

  // New expanded fields
  scope?: "divisi" | "acara";
  category?: "divisi" | "acara" | "canva" | "drive" | "video" | "dokumen" | "lainnya";
  event_id?: string;
  drive_links?: string[];
  canva_links?: string[];
  doc_links?: string[];
  other_links?: string[];
  summary_notes?: string;
  file_inventory_notes?: string;
  file_inventory?: Array<{
    name: string;
    url: string;
    type: "file" | "folder";
    mime_type?: string;
    level?: number;
    parent_folder?: string;
  }>;
};

export type DesignReferenceInput = {
  title: string;
  event_name: string;
  design_type: DesignType;
  year: number;
  drive_url: string;
  thumbnail_url: string;
  style_notes: string;
  color_palette: string[];
  notes: string;

  // New expanded fields
  scope?: "divisi" | "acara";
  category?: "divisi" | "acara" | "canva" | "drive" | "video" | "dokumen" | "lainnya";
  event_id?: string;
  drive_links?: string[];
  canva_links?: string[];
  doc_links?: string[];
  other_links?: string[];
  summary_notes?: string;
  file_inventory_notes?: string;
  file_inventory?: Array<{
    name: string;
    url: string;
    type: "file" | "folder";
    mime_type?: string;
    level?: number;
    parent_folder?: string;
  }>;
};

export type WhatsAppLogStatus = "sent" | "failed" | "pending";

export type WhatsAppLog = {
  id: string;
  organization_id: string;
  task_id?: string;
  event_type: string;
  message_content: string;
  recipient: string;
  recipient_type?: "group" | "personal";
  is_group?: boolean;
  status: WhatsAppLogStatus;
  wablas_response?: string;
  error_message?: string;
  retry_count: number;
  created_at?: unknown;
};

export type AILog = {
  id: string;
  organization_id: string;
  asked_by: string;
  question: string;
  context_summary: string;
  answer: string;
  model_used: string;
  source?: "web" | "whatsapp";
  whatsapp_sender?: string;
  whatsapp_group_id?: string;
  created_at?: unknown;
};

export type TaskInput = {
  type: TaskType;
  event_id: string;
  name: string;
  description: string;
  pic_id: string;
  coordinator_id: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  copywriting: string;
  copywriting_docs_url: string;
  design_reference_url: string;
  drive_reference_url: string;
  color_palette: string[];
  visual_direction: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  whatsapp_group_id: string;
  logo_url: string;
  created_at?: unknown;
  updated_at?: unknown;
};

export type Division = {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  coordinator_id: string;
  created_at?: unknown;
  updated_at?: unknown;
};

export type NewUserProfileInput = Pick<
  UserProfile,
  "id" | "name" | "email" | "whatsapp_number"
>;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  whatsapp_number: string;
};

export type MemberUpdateInput = {
  name: string;
  whatsapp_number: string;
  role?: UserRole;
  division_id: string;
  is_active: boolean;
  whatsapp_command_pin?: string;
};

export type AuthContextValue = {
  user: import("firebase/auth").User | null;
  userProfile: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  reloadUserProfile: () => Promise<UserProfile | null>;
};

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

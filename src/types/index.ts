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

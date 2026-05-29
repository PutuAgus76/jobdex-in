export type DashboardNavItem = {
  label: string;
  href: string;
};

export type UserRole = "anggota";

export type UserProfile = {
  id: string;
  organization_id: "main_org";
  name: string;
  email: string;
  whatsapp_number: string;
  role: UserRole;
  division_id: "humas_media_kreatif";
  avatar_url: string;
  is_active: boolean;
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

export type AuthContextValue = {
  user: import("firebase/auth").User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
};

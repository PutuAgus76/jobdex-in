import type { DashboardNavItem } from "@/types";

export const appConfig = {
  name: "JobDex.in",
  description:
    "Aplikasi manajemen job desk untuk Humas dan Media Kreatif organisasi mahasiswa.",
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Job Desk",
    href: "/dashboard/tasks",
  },
  {
    label: "Acara",
    href: "/dashboard/events",
  },
  {
    label: "Anggota",
    href: "/dashboard/members",
  },
  {
    label: "Referensi",
    href: "/dashboard/references",
  },
  {
    label: "Pengaturan",
    href: "/dashboard/settings",
  },
];

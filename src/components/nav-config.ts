import { LayoutDashboard, Building2, Users, Home, FolderKanban, User } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

export const ADMIN_BOTTOM_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: Building2 },
  { href: "/admin/workers", label: "Workers", icon: Users },
];

export const ADMIN_SIDEBAR_NAV: NavItem[] = ADMIN_BOTTOM_NAV;

export const SUPERVISOR_BOTTOM_NAV: NavItem[] = [
  { href: "/supervisor", label: "Home", icon: Home },
  { href: "/supervisor/projects", label: "Projects", icon: FolderKanban },
  { href: "/supervisor/profile", label: "Profile", icon: User },
];

export const SUPERVISOR_SIDEBAR_NAV: NavItem[] = SUPERVISOR_BOTTOM_NAV;

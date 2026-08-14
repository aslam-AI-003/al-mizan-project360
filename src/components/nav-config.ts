import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  BarChart3,
  MoreHorizontal,
  Users,
  Truck,
  ScrollText,
  Bell,
  Home,
  FolderKanban,
  Wallet,
  FileText,
  User,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

export const ADMIN_BOTTOM_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: Building2 },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/more", label: "More", icon: MoreHorizontal },
];

export const ADMIN_SIDEBAR_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: Building2 },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/workers", label: "Workers", icon: Users },
  { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

export const SUPERVISOR_BOTTOM_NAV: NavItem[] = [
  { href: "/supervisor", label: "Home", icon: Home },
  { href: "/supervisor/projects", label: "Projects", icon: FolderKanban },
  { href: "/supervisor/notifications", label: "Alerts", icon: Bell },
  { href: "/supervisor/profile", label: "Profile", icon: User },
];

export const SUPERVISOR_SIDEBAR_NAV: NavItem[] = SUPERVISOR_BOTTOM_NAV;

export const CLIENT_BOTTOM_NAV: NavItem[] = [
  { href: "/client", label: "Home", icon: Home },
  { href: "/client/payments", label: "Payments", icon: Wallet },
  { href: "/client/documents", label: "Documents", icon: FileText },
  { href: "/client/profile", label: "Profile", icon: User },
];

export const CLIENT_SIDEBAR_NAV: NavItem[] = CLIENT_BOTTOM_NAV;

import { Home, ClipboardPlus, Truck, User } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

export const OWNER_NAV: NavItem[] = [
  { href: "/admin", label: "Home", icon: Home },
  { href: "/admin/entry", label: "Daily Entry", icon: ClipboardPlus },
  { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { href: "/admin/profile", label: "Profile", icon: User },
];

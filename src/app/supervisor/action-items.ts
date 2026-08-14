import { ClipboardList, Users, Boxes, ShoppingCart, Wallet, Camera, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SupervisorAction = { slug: string; label: string; icon: LucideIcon };

/** The 7 site actions a supervisor can perform on a project (spec sections 7/8/10/16/18/26). */
export const SUPERVISOR_PROJECT_ACTIONS: SupervisorAction[] = [
  { slug: "daily-update", label: "Daily Update", icon: ClipboardList },
  { slug: "attendance", label: "Labour Attendance", icon: Users },
  { slug: "materials", label: "Material Usage", icon: Boxes },
  { slug: "purchase-request", label: "Purchase Request", icon: ShoppingCart },
  { slug: "expense", label: "Expense", icon: Wallet },
  { slug: "photos", label: "Upload Photos", icon: Camera },
  { slug: "issue", label: "Report Issue", icon: AlertTriangle },
];

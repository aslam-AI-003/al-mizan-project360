import { ClipboardList, Users, Boxes, ShoppingCart, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SupervisorAction = { slug: string; label: string; icon: LucideIcon };

/** The site actions a supervisor can perform on a project. */
export const SUPERVISOR_PROJECT_ACTIONS: SupervisorAction[] = [
  { slug: "daily-update", label: "Daily Update", icon: ClipboardList },
  { slug: "attendance", label: "Labour Attendance", icon: Users },
  { slug: "material-purchase", label: "Material Purchase", icon: ShoppingCart },
  { slug: "materials", label: "Material Usage", icon: Boxes },
  { slug: "expense", label: "Expense", icon: Wallet },
];

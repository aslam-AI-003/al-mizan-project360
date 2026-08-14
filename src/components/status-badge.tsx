import { titleCase } from "@/lib/format";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_MAP: Record<string, Tone> = {
  // project status
  PLANNING: "neutral",
  STARTED: "info",
  IN_PROGRESS: "info",
  ON_HOLD: "warning",
  DELAYED: "danger",
  COMPLETED: "success",
  // generic statuses
  ACTIVE: "success",
  INACTIVE: "neutral",
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SENT_BACK: "warning",
  PURCHASED: "info",
  PAID: "success",
  PENDING: "warning",
  PARTIALLY_PAID: "warning",
  DUE: "warning",
  PRESENT: "success",
  ABSENT: "danger",
  HALF_DAY: "warning",
  OVERTIME: "info",
  OPEN: "danger",
  RESOLVED: "success",
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
  NOT_STARTED: "neutral",
};

const TONE_CLASSES: Record<Tone, string> = {
  success: "text-[var(--status-success)] bg-[var(--status-success-bg)]",
  warning: "text-[var(--status-warning)] bg-[var(--status-warning-bg)]",
  danger: "text-[var(--status-danger)] bg-[var(--status-danger-bg)]",
  info: "text-[var(--status-info)] bg-[var(--status-info-bg)]",
  neutral: "text-[var(--status-neutral)] bg-[var(--status-neutral-bg)]",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = TONE_MAP[status] ?? "neutral";
  return <span className={`badge ${TONE_CLASSES[tone]}`}>{label ?? titleCase(status)}</span>;
}

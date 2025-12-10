import { cn } from "@/lib/utils";

type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending";

interface StatusBadgeProps {
  status: StatusVariant;
  label: string;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  error: "bg-destructive/15 text-destructive",
  info: "bg-primary/15 text-primary",
  pending: "bg-warning/15 text-warning-foreground",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[status],
        className
      )}
    >
      {label}
    </span>
  );
}

// Convenience function to map receipt/qualification status to badge variant
export function getReceiptStatusVariant(
  status: "pending" | "approved" | "rejected"
): StatusVariant {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "pending":
      return "pending";
    default:
      return "default";
  }
}

export function getQualificationStatusVariant(
  status: "in_progress" | "receipts_complete" | "qualified" | "pending_review" | "forfeited"
): StatusVariant {
  switch (status) {
    case "qualified":
      return "success";
    case "receipts_complete":
      return "info";
    case "in_progress":
      return "pending";
    case "pending_review":
      return "warning";
    case "forfeited":
      return "error";
    default:
      return "default";
  }
}

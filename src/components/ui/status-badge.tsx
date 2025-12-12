import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending";

interface StatusBadgeProps {
  variant?: StatusVariant;
  status?: StatusVariant; // alias for variant
  label?: string;
  children?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
};

export function StatusBadge({ variant, status, label, children, size = "md", className }: StatusBadgeProps) {
  const effectiveVariant = variant || status || "default";
  const content = children || label;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[effectiveVariant],
        sizeStyles[size],
        className
      )}
    >
      {content}
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

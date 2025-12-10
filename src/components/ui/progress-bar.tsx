import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning";
  className?: string;
  isLoading?: boolean;
}

export function ProgressBar({
  value,
  max,
  label,
  showValue = true,
  size = "md",
  variant = "default",
  className,
  isLoading = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variantClasses = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && <div className="h-4 w-24 bg-muted animate-pulse rounded" />}
        <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
          <div className="h-full w-1/2 bg-muted-foreground/20 animate-pulse rounded-full" />
        </div>
        {showValue && <div className="h-4 w-16 bg-muted animate-pulse rounded" />}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {showValue && (
            <p className="text-sm text-muted-foreground">
              ${value} / ${max}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {!label && showValue && (
        <p className="text-sm text-muted-foreground">{percentage}% complete</p>
      )}
    </div>
  );
}

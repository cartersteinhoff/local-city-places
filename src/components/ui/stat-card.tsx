import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  isLoading?: boolean; // kept for backwards compatibility, not used
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("p-4 md:p-6 bg-card rounded-xl border border-border", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
          </div>
        )}
      </div>
      {trend && (
        <p className="text-sm text-muted-foreground mt-3">
          <span
            className={cn(
              "font-medium",
              trend.value >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>{" "}
          {trend.label}
        </p>
      )}
    </div>
  );
}

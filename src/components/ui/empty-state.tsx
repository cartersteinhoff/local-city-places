import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode | {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderAction = () => {
    if (!action) return null;

    // If action is a ReactNode (like a button or link element)
    if (typeof action !== "object" || !("label" in action)) {
      return action;
    }

    // If action is the object format
    return (
      <Button
        asChild={!!action.href}
        onClick={action.onClick}
        className="bg-primary-gradient hover:opacity-90"
      >
        {action.href ? (
          <a href={action.href}>{action.label}</a>
        ) : (
          action.label
        )}
      </Button>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {renderAction()}
    </div>
  );
}

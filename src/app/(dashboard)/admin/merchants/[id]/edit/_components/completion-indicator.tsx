"use client";

import { calculateCompletion, MerchantData } from "@/lib/merchant-completion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";

interface CompletionIndicatorProps {
  data: MerchantData;
  className?: string;
}

export function CompletionIndicator({ data, className }: CompletionIndicatorProps) {
  const completion = calculateCompletion(data);
  const isComplete = completion.percentage === 100;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              isComplete ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${completion.percentage}%` }}
          />
        </div>
        <span className={cn(
          "text-sm font-medium tabular-nums min-w-[4rem] text-right",
          isComplete ? "text-green-600" : "text-muted-foreground"
        )}>
          {completion.percentage}%
          {isComplete && <Sparkles className="w-4 h-4 inline ml-1" />}
        </span>
      </div>

      {/* Section dots */}
      <div className="flex items-center gap-1 flex-wrap">
        {completion.sections.map((section) => {
          const isSectionComplete = section.percentage === 100;
          const hasPartial = section.completed > 0 && !isSectionComplete;

          return (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                    isSectionComplete && "bg-green-100 text-green-700",
                    hasPartial && "bg-yellow-100 text-yellow-700",
                    !isSectionComplete && !hasPartial && "bg-muted text-muted-foreground"
                  )}
                >
                  {isSectionComplete ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      hasPartial ? "bg-yellow-500" : "bg-muted-foreground/30"
                    )} />
                  )}
                  {section.label}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isSectionComplete ? (
                  <p>All {section.label.toLowerCase()} fields complete!</p>
                ) : section.missingFields.length > 0 ? (
                  <div>
                    <p className="font-medium mb-1">Missing:</p>
                    <ul className="text-xs space-y-0.5">
                      {section.missingFields.map((field) => (
                        <li key={field}>• {field}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>{section.completed}/{section.total} fields complete</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for tight spaces
export function CompletionBadge({ data }: { data: MerchantData }) {
  const completion = calculateCompletion(data);
  const isComplete = completion.percentage === 100;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          isComplete ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
        )}>
          {isComplete && <CheckCircle2 className="w-3 h-3" />}
          {completion.percentage}%
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{completion.completed}/{completion.total} fields complete</p>
      </TooltipContent>
    </Tooltip>
  );
}

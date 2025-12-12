"use client";

import { UserPlus, CheckCircle, Star, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  type: "registration" | "issued" | "review" | "completed";
  memberName: string | null;
  grcValue?: number;
  wordCount?: number;
  date: string | Date;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="h-5 w-32 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent activity</p>
          <p className="text-sm mt-1">Issue GRCs to get started</p>
        </div>
      </div>
    );
  }

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "registration":
        return <UserPlus className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "review":
        return <Star className="w-4 h-4" />;
      case "issued":
        return <Send className="w-4 h-4" />;
    }
  };

  const getIconBg = (type: ActivityItem["type"]) => {
    switch (type) {
      case "registration":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "review":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      case "issued":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    }
  };

  const getMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case "registration":
        return (
          <>
            <span className="font-medium">{activity.memberName}</span> registered with your{" "}
            <span className="font-medium">${activity.grcValue}</span> GRC
          </>
        );
      case "completed":
        return (
          <>
            <span className="font-medium">{activity.memberName}</span> completed their{" "}
            <span className="font-medium">${activity.grcValue}</span> GRC
          </>
        );
      case "review":
        return (
          <>
            New review from <span className="font-medium">{activity.memberName}</span>
            {activity.wordCount && (
              <span className="text-muted-foreground"> ({activity.wordCount} words)</span>
            )}
          </>
        );
      case "issued":
        return (
          <>
            <span className="font-medium">${activity.grcValue}</span> GRC issued
          </>
        );
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(
                activity.type
              )}`}
            >
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{getMessage(activity)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

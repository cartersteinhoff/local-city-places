"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList, BarChart3 } from "lucide-react";
import { merchantNavItems } from "../nav";
import { useUser } from "@/hooks/use-user";
import { formatDistanceToNow } from "date-fns";

interface Survey {
  id: string;
  title: string;
  questionCount: number;
  responseCount: number;
  lastResponseAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SurveysPage() {
  const router = useRouter();
  const { user, isLoading: loading, isAuthenticated } = useUser();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  const loadSurveys = async () => {
    try {
      const res = await fetch("/api/merchant/surveys");
      const data = await res.json();
      if (data.surveys) {
        setSurveys(data.surveys);
      }
    } catch (err) {
      console.error("Failed to load surveys:", err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated) {
      loadSurveys();
    }
  }, [loading, isAuthenticated]);

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? null : (
        <>
          <PageHeader
            title="Surveys"
            description="View surveys assigned to your business and track responses"
          />

          {surveys.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No surveys assigned"
              description="You don't have any surveys assigned to your business yet. Surveys will appear here once assigned by an administrator."
            />
          ) : (
            <div className="space-y-4">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{survey.title}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            survey.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              survey.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {survey.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{survey.questionCount} questions</span>
                        <span>•</span>
                        <span>{survey.responseCount} responses</span>
                        {survey.lastResponseAt && (
                          <>
                            <span>•</span>
                            <span>
                              Last response{" "}
                              {formatDistanceToNow(new Date(survey.lastResponseAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <a href={`/merchant/surveys/${survey.id}/responses`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Responses
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  ClipboardList,
  MoreHorizontal,
  Edit,
  BarChart3,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();
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

  const handleToggleActive = async (surveyId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/merchant/surveys/${surveyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      loadSurveys();
    } catch (err) {
      console.error("Failed to toggle survey:", err);
    }
  };

  const handleDelete = async (surveyId: string) => {
    if (!confirm("Are you sure you want to delete this survey? This will also delete all responses.")) {
      return;
    }

    try {
      await fetch(`/api/merchant/surveys/${surveyId}`, { method: "DELETE" });
      loadSurveys();
    } catch (err) {
      console.error("Failed to delete survey:", err);
    }
  };

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Surveys"
            description="Gather feedback from your GRC recipients"
            action={
              <a href="/merchant/surveys/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Survey
                </Button>
              </a>
            }
          />

          {dataLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-6">
                  <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : surveys.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No surveys yet"
              description="Create a survey to gather valuable customer feedback during GRC registration."
              action={
                <a href="/merchant/surveys/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Survey
                  </Button>
                </a>
              }
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/merchant/surveys/${survey.id}`} className="flex items-center">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={`/merchant/surveys/${survey.id}/responses`}
                            className="flex items-center"
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Responses
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(survey.id, survey.isActive)}
                        >
                          {survey.isActive ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(survey.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                    <a
                      href={`/merchant/surveys/${survey.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit Survey
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href={`/merchant/surveys/${survey.id}/responses`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Responses ({survey.responseCount})
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

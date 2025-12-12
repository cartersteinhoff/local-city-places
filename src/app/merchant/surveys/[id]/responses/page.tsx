"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, MessageSquare } from "lucide-react";
import { merchantNavItems } from "../../../nav";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";

interface Question {
  id: string;
  text: string;
  type: "text" | "multiple_choice";
  options?: string[];
  required: boolean;
}

interface Response {
  id: string;
  memberName: string;
  answers: Record<string, string>;
  month: number | null;
  year: number | null;
  createdAt: string;
}

interface Summary {
  [questionId: string]:
    | { type: "multiple_choice"; options: Record<string, number> }
    | { type: "text"; answers: string[] };
}

interface ResponsesData {
  survey: {
    id: string;
    title: string;
    questions: Question[];
  };
  responses: Response[];
  summary: Summary;
  totalResponses: number;
}

export default function SurveyResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();
  const [data, setData] = useState<ResponsesData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAllText, setShowAllText] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && id) {
      fetch(`/api/merchant/surveys/${id}/responses`)
        .then((res) => res.json())
        .then((responseData) => {
          if (!responseData.error) {
            setData(responseData);
          }
          setDataLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load responses:", err);
          setDataLoading(false);
        });
    }
  }, [loading, isAuthenticated, id]);

  const handleExportCSV = () => {
    if (!data) return;

    const headers = ["Member", "Date", ...data.survey.questions.map((q) => q.text)];
    const rows = data.responses.map((r) => [
      r.memberName,
      format(new Date(r.createdAt), "yyyy-MM-dd"),
      ...data.survey.questions.map((q) => r.answers[q.id] || ""),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-responses-${data.survey.title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleShowAll = (questionId: string) => {
    setShowAllText((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading || dataLoading ? null : !data ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Survey not found</p>
        </div>
      ) : (
        <>
          <PageHeader
            title={`${data.survey.title} - Responses`}
            description={`${data.totalResponses} total responses`}
            action={
              <div className="flex items-center gap-3">
                <a
                  href="/merchant/surveys"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </a>
                {data.totalResponses > 0 && (
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            }
          />

          {data.totalResponses === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No responses yet</h3>
              <p className="text-muted-foreground">
                Responses will appear here when GRC recipients complete your survey.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {data.survey.questions.map((question) => {
                const questionSummary = data.summary[question.id];

                return (
                  <div
                    key={question.id}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <h3 className="font-semibold mb-4">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>

                    {question.type === "multiple_choice" && questionSummary?.type === "multiple_choice" ? (
                      <div className="space-y-3">
                        {Object.entries(questionSummary.options).map(([option, count]) => {
                          const percent =
                            data.totalResponses > 0
                              ? Math.round((count / data.totalResponses) * 100)
                              : 0;

                          return (
                            <div key={option}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>{option}</span>
                                <span className="text-muted-foreground">
                                  {percent}% ({count})
                                </span>
                              </div>
                              <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : questionSummary?.type === "text" ? (
                      <div className="space-y-2">
                        {(showAllText[question.id]
                          ? questionSummary.answers
                          : questionSummary.answers.slice(0, 5)
                        ).map((answer, i) => (
                          <div
                            key={i}
                            className="p-3 bg-muted/50 rounded-lg text-sm"
                          >
                            "{answer}"
                          </div>
                        ))}
                        {questionSummary.answers.length > 5 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowAll(question.id)}
                            className="w-full"
                          >
                            {showAllText[question.id]
                              ? "Show less"
                              : `Show all ${questionSummary.answers.length} responses`}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No responses</p>
                    )}
                  </div>
                );
              })}

              {/* Individual Responses Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Individual Responses</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Member</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        {data.survey.questions.map((q) => (
                          <th key={q.id} className="text-left p-3 font-medium max-w-[200px] truncate">
                            {q.text}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.responses.map((response) => (
                        <tr key={response.id}>
                          <td className="p-3 font-medium">{response.memberName}</td>
                          <td className="p-3 text-muted-foreground">
                            {format(new Date(response.createdAt), "MMM d, yyyy")}
                          </td>
                          {data.survey.questions.map((q) => (
                            <td key={q.id} className="p-3 max-w-[200px] truncate">
                              {response.answers[q.id] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Save,
} from "lucide-react";
import { merchantNavItems } from "../../nav";
import { useUser } from "@/hooks/use-user";

interface Question {
  id: string;
  text: string;
  type: "text" | "multiple_choice";
  options?: string[];
  required: boolean;
}

export default function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, userName, isLoading: loading, isAuthenticated } = useUser();

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Question dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"text" | "multiple_choice">("text");
  const [questionOptions, setQuestionOptions] = useState<string[]>(["", ""]);
  const [questionRequired, setQuestionRequired] = useState(true);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "merchant" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && id) {
      fetch(`/api/merchant/surveys/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.survey) {
            setTitle(data.survey.title);
            setQuestions(data.survey.questions || []);
            setIsActive(data.survey.isActive);
          }
          setDataLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load survey:", err);
          setDataLoading(false);
        });
    }
  }, [loading, isAuthenticated, id]);

  const openAddDialog = () => {
    setEditingQuestion(null);
    setQuestionText("");
    setQuestionType("text");
    setQuestionOptions(["", ""]);
    setQuestionRequired(true);
    setDialogOpen(true);
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setQuestionType(question.type);
    setQuestionOptions(question.options || ["", ""]);
    setQuestionRequired(question.required);
    setDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!questionText.trim()) return;

    const questionData: Question = {
      id: editingQuestion?.id || crypto.randomUUID(),
      text: questionText.trim(),
      type: questionType,
      options: questionType === "multiple_choice" ? questionOptions.filter((o) => o.trim()) : undefined,
      required: questionRequired,
    };

    if (editingQuestion) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? questionData : q))
      );
    } else {
      setQuestions((prev) => [...prev, questionData]);
    }

    setDialogOpen(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleAddOption = () => {
    setQuestionOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (questionOptions.length > 2) {
      setQuestionOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setQuestionOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a survey title");
      return;
    }
    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/merchant/surveys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), questions, isActive }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update survey");
        return;
      }

      router.push("/merchant/surveys");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout navItems={merchantNavItems}>
      {loading || dataLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          <PageHeader
            title="Edit Survey"
            description="Update your survey questions"
            action={
              <div className="flex items-center gap-3">
                <a
                  href="/merchant/surveys"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </a>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            }
          />

          <div className="max-w-3xl">
            {/* Survey Title */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Survey Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Customer Satisfaction Survey"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <Label htmlFor="active" className="cursor-pointer">
                      Survey Active
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Active surveys are shown to GRC recipients
                    </p>
                  </div>
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Questions</h3>
                <span className="text-sm text-muted-foreground">
                  {questions.length} question{questions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No questions yet</p>
                  <p className="text-sm mt-1">Add your first question to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg group"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="w-4 h-4 cursor-grab" />
                        <span className="text-sm font-medium">{index + 1}.</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {question.text}
                          {question.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {question.type === "text" ? "Text answer" : "Multiple choice"}
                          {question.type === "multiple_choice" &&
                            question.options &&
                            ` (${question.options.length} options)`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(question)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={openAddDialog}
                className="w-full mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Save Button (mobile) */}
            <div className="lg:hidden">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Question Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? "Edit Question" : "Add Question"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="question-text">Question *</Label>
                  <Textarea
                    id="question-text"
                    placeholder="Enter your question..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={questionType}
                    onValueChange={(v) => setQuestionType(v as "text" | "multiple_choice")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text (Short Answer)</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {questionType === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {questionOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                          />
                          {questionOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="required" className="cursor-pointer">
                    Required question
                  </Label>
                  <Switch
                    id="required"
                    checked={questionRequired}
                    onCheckedChange={setQuestionRequired}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveQuestion} disabled={!questionText.trim()}>
                  {editingQuestion ? "Update" : "Add"} Question
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
}

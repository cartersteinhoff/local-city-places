"use client";

import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyAnswers } from "@/lib/validations/member";

interface SurveyQuestion {
  id: string;
  type: "text" | "multiple_choice" | "single_choice";
  question: string;
  options?: string[];
  required?: boolean;
}

interface SurveyStepProps {
  merchantName: string;
  questions: SurveyQuestion[];
  data: SurveyAnswers;
  onNext: (data: SurveyAnswers) => void;
  isLoading?: boolean;
}

export function SurveyStep({ merchantName, questions, data, onNext, isLoading }: SurveyStepProps) {
  const [answers, setAnswers] = useState<SurveyAnswers>(data || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      setErrors((prev) => ({ ...prev, [questionId]: "" }));
    }
  };

  const handleSingleChoiceChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      setErrors((prev) => ({ ...prev, [questionId]: "" }));
    }
  };

  const handleMultipleChoiceChange = (questionId: string, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, value] };
      }
      return { ...prev, [questionId]: current.filter((v) => v !== value) };
    });
    if (errors[questionId]) {
      setErrors((prev) => ({ ...prev, [questionId]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    const newErrors: Record<string, string> = {};
    for (const question of questions) {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[question.id] = "This question is required";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext(answers);
  };

  // If no questions, skip this step
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">No Survey Required</h2>
          <p className="text-muted-foreground">
            {merchantName} doesn&apos;t have any survey questions at this time.
          </p>
        </div>
        <Button onClick={() => onNext({})} className="w-full" size="lg">
          Continue
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Quick Survey</h2>
        <p className="text-muted-foreground">
          {merchantName} would like to learn a bit about you.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <Label className="text-base">
              {index + 1}. {question.question}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {question.type === "text" && (
              <Textarea
                value={(answers[question.id] as string) || ""}
                onChange={(e) => handleTextChange(question.id, e.target.value)}
                placeholder="Your answer..."
                disabled={isLoading}
                className={errors[question.id] ? "border-destructive" : ""}
              />
            )}

            {question.type === "single_choice" && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleSingleChoiceChange(question.id, option)}
                      disabled={isLoading}
                      className="w-4 h-4 text-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const currentAnswers = (answers[question.id] as string[]) || [];
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={option}
                        checked={currentAnswers.includes(option)}
                        onChange={(e) =>
                          handleMultipleChoiceChange(question.id, option, e.target.checked)
                        }
                        disabled={isLoading}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {errors[question.id] && (
              <p className="text-sm text-destructive">{errors[question.id]}</p>
            )}
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
}

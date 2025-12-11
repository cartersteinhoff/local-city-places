"use client";

import { useState } from "react";
import { Gift, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { countWords, REVIEW_BONUS_MIN_WORDS } from "@/lib/validations/member";

interface ReviewOfferStepProps {
  merchantName: string;
  onNext: (reviewContent: string | undefined) => void;
  isLoading?: boolean;
}

export function ReviewOfferStep({ merchantName, onNext, isLoading }: ReviewOfferStepProps) {
  const [content, setContent] = useState("");
  const wordCount = countWords(content);
  const hasEnoughWords = wordCount >= REVIEW_BONUS_MIN_WORDS;

  const handleSubmit = () => {
    // Only pass content if it meets the minimum word count
    onNext(hasEnoughWords ? content : undefined);
  };

  const handleSkip = () => {
    onNext(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Gift className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Earn a Bonus Month!</h2>
        <p className="text-muted-foreground">
          Write a {REVIEW_BONUS_MIN_WORDS}+ word review about {merchantName} and get an extra month of rebates.
        </p>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">
              One-time bonus offer
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              This offer is only available during your first registration.
              Write a thoughtful review to unlock +1 bonus month of rebates!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Share your experience with ${merchantName}. What do you like about them? Would you recommend them to others?`}
          rows={6}
          disabled={isLoading}
          className="resize-none"
        />
        <div className="flex items-center justify-between text-sm">
          <span
            className={
              hasEnoughWords
                ? "text-green-600 dark:text-green-400 font-medium"
                : "text-muted-foreground"
            }
          >
            {wordCount} / {REVIEW_BONUS_MIN_WORDS} words
            {hasEnoughWords && " ✓"}
          </span>
          {!hasEnoughWords && wordCount > 0 && (
            <span className="text-muted-foreground">
              {REVIEW_BONUS_MIN_WORDS - wordCount} more words needed
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleSubmit}
          className="w-full"
          size="lg"
          disabled={isLoading || (content.length > 0 && !hasEnoughWords)}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : hasEnoughWords ? (
            "Submit Review & Earn Bonus"
          ) : (
            "Continue Without Review"
          )}
        </Button>

        {content.length > 0 && !hasEnoughWords && (
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full"
            disabled={isLoading}
          >
            Skip review (no bonus)
          </Button>
        )}
      </div>
    </div>
  );
}

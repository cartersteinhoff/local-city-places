import { z } from "zod";

// Personal info validation (Step 2)
export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number must be less than 20 characters"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(255, "Address must be less than 255 characters"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  state: z
    .string()
    .min(2, "State is required")
    .max(50, "State must be less than 50 characters"),
  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code (e.g., 85001 or 85001-1234)"),
});

// Grocery store validation (Step 3)
export const groceryStoreSchema = z.object({
  groceryStore: z.string().min(1, "Please select a grocery store"),
  groceryStorePlaceId: z.string().min(1, "Invalid store selection"),
});

// Survey response validation (Step 4)
export const surveyAnswerSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string())])
);

// Review validation (Step 5)
export const reviewSchema = z.object({
  content: z.string().optional(),
});

// Start date validation (Step 6)
export const startDateSchema = z.object({
  startMonth: z.number().min(1).max(12),
  startYear: z.number().min(2024).max(2030),
});

// Full registration schema (for API validation)
export const memberRegistrationSchema = personalInfoSchema;

// GRC registration schema (for API validation)
export const grcRegistrationSchema = z.object({
  grcId: z.string().uuid("Invalid GRC ID"),
  groceryStore: z.string().min(1, "Grocery store is required"),
  groceryStorePlaceId: z.string().min(1, "Grocery store place ID is required"),
  surveyAnswers: surveyAnswerSchema.optional(),
  reviewContent: z.string().optional(),
  startMonth: z.number().min(1).max(12),
  startYear: z.number().min(2024).max(2030),
});

// Survey response schema (for API validation)
export const surveyResponseSchema = z.object({
  surveyId: z.string().uuid("Invalid survey ID"),
  grcId: z.string().uuid("Invalid GRC ID"),
  answers: surveyAnswerSchema,
  isRegistration: z.boolean(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2024).max(2030).optional(),
});

// Review creation schema (for API validation)
export const reviewCreateSchema = z.object({
  merchantId: z.string().uuid("Invalid merchant ID"),
  grcId: z.string().uuid("Invalid GRC ID"),
  content: z.string().min(1, "Review content is required"),
});

// Types derived from schemas
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type GroceryStore = z.infer<typeof groceryStoreSchema>;
export type SurveyAnswers = z.infer<typeof surveyAnswerSchema>;
export type StartDate = z.infer<typeof startDateSchema>;
export type MemberRegistration = z.infer<typeof memberRegistrationSchema>;
export type GrcRegistration = z.infer<typeof grcRegistrationSchema>;
export type SurveyResponse = z.infer<typeof surveyResponseSchema>;
export type ReviewCreate = z.infer<typeof reviewCreateSchema>;

// Helper to count words in review
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Constants
export const REVIEW_BONUS_MIN_WORDS = 50;

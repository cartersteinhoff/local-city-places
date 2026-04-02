import { z } from "zod";

export const sweepstakesEntrySchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  referredBy: z
    .string()
    .trim()
    .max(32, "Referral code must be less than 32 characters")
    .optional()
    .or(z.literal("")),
});

export type SweepstakesEntryInput = z.infer<typeof sweepstakesEntrySchema>;

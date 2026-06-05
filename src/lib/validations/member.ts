import { z } from "zod";

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
    .regex(
      /^\d{5}(-\d{4})?$/,
      "Please enter a valid ZIP code (e.g., 85001 or 85001-1234)",
    ),
});

export const memberRegistrationSchema = personalInfoSchema;

export const reviewCreateSchema = z.object({
  merchantId: z.string().uuid("Invalid merchant ID"),
  content: z.string().min(1, "Review content is required"),
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type MemberRegistration = z.infer<typeof memberRegistrationSchema>;
export type ReviewCreate = z.infer<typeof reviewCreateSchema>;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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

export const favoriteMerchantTestimonialPhotoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url("Photo URL must be valid"),
});

export const favoriteMerchantTestimonialSchema = z.object({
  testimonialId: z.string().uuid().optional(),
  merchantId: z.string().uuid("Merchant is required"),
  content: z
    .string()
    .trim()
    .min(50, "Testimonial must be at least 50 characters")
    .max(4000, "Testimonial must be less than 4000 characters"),
  photos: z
    .array(favoriteMerchantTestimonialPhotoSchema)
    .min(2, "At least 2 photos are required")
    .max(6, "You can upload up to 6 photos"),
});

export const favoriteMerchantModerationSchema = z.object({
  action: z.enum(["approve", "reject", "request_changes"]),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

export const favoriteMerchantPhotoModerationSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export type FavoriteMerchantTestimonialInput = z.infer<typeof favoriteMerchantTestimonialSchema>;
export type FavoriteMerchantModerationInput = z.infer<typeof favoriteMerchantModerationSchema>;
export type FavoriteMerchantPhotoModerationInput = z.infer<
  typeof favoriteMerchantPhotoModerationSchema
>;

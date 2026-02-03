/**
 * Calculate profile completion percentage for merchant pages
 */

export interface MerchantData {
  businessName?: string;
  categoryId?: string;
  description?: string;
  aboutStory?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  logoUrl?: string;
  vimeoUrl?: string;
  photos?: string[];
  services?: { name: string; description?: string; price?: string }[];
}

export interface SectionCompletion {
  id: string;
  label: string;
  completed: number;
  total: number;
  percentage: number;
  missingFields: string[];
}

export interface CompletionResult {
  percentage: number;
  completed: number;
  total: number;
  sections: SectionCompletion[];
}

const hasValue = (val: unknown): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return true;
};

export function calculateCompletion(data: MerchantData): CompletionResult {
  const sections: SectionCompletion[] = [];

  // Business section (4 points)
  const businessFields = [
    { key: "businessName", label: "Business Name", value: data.businessName },
    { key: "categoryId", label: "Category", value: data.categoryId },
    { key: "description", label: "Description", value: data.description },
    { key: "aboutStory", label: "About/Story", value: data.aboutStory },
  ];
  const businessCompleted = businessFields.filter((f) => hasValue(f.value)).length;
  const businessMissing = businessFields.filter((f) => !hasValue(f.value)).map((f) => f.label);
  sections.push({
    id: "business",
    label: "Business",
    completed: businessCompleted,
    total: 4,
    percentage: Math.round((businessCompleted / 4) * 100),
    missingFields: businessMissing,
  });

  // Location section (4 points)
  const locationFields = [
    { key: "streetAddress", label: "Street Address", value: data.streetAddress },
    { key: "city", label: "City", value: data.city },
    { key: "state", label: "State", value: data.state },
    { key: "zipCode", label: "ZIP Code", value: data.zipCode },
  ];
  const locationCompleted = locationFields.filter((f) => hasValue(f.value)).length;
  const locationMissing = locationFields.filter((f) => !hasValue(f.value)).map((f) => f.label);
  sections.push({
    id: "location",
    label: "Location",
    completed: locationCompleted,
    total: 4,
    percentage: Math.round((locationCompleted / 4) * 100),
    missingFields: locationMissing,
  });

  // Contact section (5 points)
  const contactFields = [
    { key: "phone", label: "Phone", value: data.phone },
    { key: "website", label: "Website", value: data.website },
    { key: "instagramUrl", label: "Instagram", value: data.instagramUrl },
    { key: "facebookUrl", label: "Facebook", value: data.facebookUrl },
    { key: "tiktokUrl", label: "TikTok", value: data.tiktokUrl },
  ];
  const contactCompleted = contactFields.filter((f) => hasValue(f.value)).length;
  const contactMissing = contactFields.filter((f) => !hasValue(f.value)).map((f) => f.label);
  sections.push({
    id: "contact",
    label: "Contact",
    completed: contactCompleted,
    total: 5,
    percentage: Math.round((contactCompleted / 5) * 100),
    missingFields: contactMissing,
  });

  // Hours section (1 point for any day filled)
  const hasAnyHours = data.hours && Object.values(data.hours).some((v) => hasValue(v));
  sections.push({
    id: "hours",
    label: "Hours",
    completed: hasAnyHours ? 1 : 0,
    total: 1,
    percentage: hasAnyHours ? 100 : 0,
    missingFields: hasAnyHours ? [] : ["Business Hours"],
  });

  // Media section (3 points: logo, video, any photo)
  const mediaFields = [
    { key: "logoUrl", label: "Logo", value: data.logoUrl },
    { key: "vimeoUrl", label: "Video", value: data.vimeoUrl },
    { key: "photos", label: "Photos", value: data.photos && data.photos.length > 0 },
  ];
  const mediaCompleted = mediaFields.filter((f) => hasValue(f.value)).length;
  const mediaMissing = mediaFields.filter((f) => !hasValue(f.value)).map((f) => f.label);
  sections.push({
    id: "media",
    label: "Media",
    completed: mediaCompleted,
    total: 3,
    percentage: Math.round((mediaCompleted / 3) * 100),
    missingFields: mediaMissing,
  });

  // Services section (1 point for any service)
  const hasServices = data.services && data.services.length > 0 && data.services.some((s) => hasValue(s.name));
  sections.push({
    id: "services",
    label: "Services",
    completed: hasServices ? 1 : 0,
    total: 1,
    percentage: hasServices ? 100 : 0,
    missingFields: hasServices ? [] : ["Services/Menu Items"],
  });

  // Calculate totals
  const totalCompleted = sections.reduce((sum, s) => sum + s.completed, 0);
  const totalPossible = sections.reduce((sum, s) => sum + s.total, 0);
  const percentage = Math.round((totalCompleted / totalPossible) * 100);

  return {
    percentage,
    completed: totalCompleted,
    total: totalPossible,
    sections,
  };
}

/**
 * Get all missing fields across all sections
 */
export function getMissingFields(data: MerchantData): string[] {
  const result = calculateCompletion(data);
  return result.sections.flatMap((s) => s.missingFields);
}

/**
 * Check if profile is complete (100%)
 */
export function isProfileComplete(data: MerchantData): boolean {
  return calculateCompletion(data).percentage === 100;
}

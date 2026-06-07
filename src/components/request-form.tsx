"use client";

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Clock,
  FileCheck2,
  ImagePlus,
  Loader2,
  MapPinned,
  Send,
  Upload,
  UserRound,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GooglePlacesAutocomplete,
  type PlaceDetails,
} from "@/components/ui/google-places-autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatPhoneNumber, stripPhoneNumber } from "@/lib/utils";

interface RequestFormState {
  businessName: string;
  requestedCategory: string;
  cityState: string;
  ownerName: string;
  email: string;
  mobilePhone: string;
  website: string;
  businessAddress1: string;
  zipCode: string;
  yearsInBusiness: string;
  shortDescription: string;
  permissionGranted: boolean;
}

type StepId = "category" | "contact" | "assets" | "review";

interface SelectedBusinessMatch {
  name: string;
  address: string;
  cityState: string;
  zipCode: string;
}

interface SubmittedRequestSummary {
  businessName: string;
  requestedCategory: string;
  market: string;
}

interface Step {
  id: StepId;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const initialState: RequestFormState = {
  businessName: "",
  requestedCategory: "",
  cityState: "",
  ownerName: "",
  email: "",
  mobilePhone: "",
  website: "",
  businessAddress1: "",
  zipCode: "",
  yearsInBusiness: "",
  shortDescription: "",
  permissionGranted: false,
};

const steps: Step[] = [
  {
    id: "category",
    label: "Business",
    title: "Tell us about your business.",
    description: "Choose the category and find the business record for review.",
    icon: MapPinned,
  },
  {
    id: "contact",
    label: "Owner",
    title: "Add the owner contact.",
    description:
      "This is used for review follow-up and the Merchant Invite once fulfillment is ready.",
    icon: UserRound,
  },
  {
    id: "assets",
    label: "Assets",
    title: "Add optional assets.",
    description:
      "Logo and photos can wait, but permission is required before the request can be timestamped.",
    icon: ImagePlus,
  },
  {
    id: "review",
    label: "Review",
    title: "Review and submit.",
    description:
      "The official timestamp is created only when you submit this final review.",
    icon: ClipboardCheck,
  },
];

const fieldLabels: Record<keyof RequestFormState, string> = {
  businessName: "Business Name",
  requestedCategory: "Category Requested",
  cityState: "City, State",
  ownerName: "Owner Name",
  email: "Email",
  mobilePhone: "Mobile Phone",
  website: "Website",
  businessAddress1: "Business Address",
  zipCode: "Zip",
  yearsInBusiness: "Years in Business",
  shortDescription: "Short Business Description",
  permissionGranted: "Permission Checkbox",
};

const stepRequiredFields: Record<StepId, Array<keyof RequestFormState>> = {
  category: [
    "businessName",
    "requestedCategory",
    "cityState",
    "businessAddress1",
    "zipCode",
    "shortDescription",
  ],
  contact: ["ownerName", "email", "mobilePhone"],
  assets: ["permissionGranted"],
  review: [],
};

const requiredFields: Array<keyof RequestFormState> = [
  "businessName",
  "requestedCategory",
  "cityState",
  "ownerName",
  "email",
  "mobilePhone",
  "businessAddress1",
  "zipCode",
  "shortDescription",
  "permissionGranted",
];

function parseCityState(value: string): { city: string; state: string } {
  const parts = value.split(",").map((part) => part.trim());

  if (parts.length >= 2) {
    const state = parts[parts.length - 1].toUpperCase().slice(0, 2);
    const city = parts.slice(0, -1).join(", ");
    return { city, state };
  }

  return { city: value.trim(), state: "" };
}

function formatStreetAddress(
  details: PlaceDetails | undefined,
  fallback: string,
) {
  if (details?.streetAddress) {
    return details.streetAddress;
  }

  if (details?.formattedAddress) {
    return details.formattedAddress.split(",")[0]?.trim() || fallback;
  }

  return fallback.split(",")[0]?.trim() || fallback;
}

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatStepValue(value: string) {
  return value.trim() || "Not provided";
}

function formatMissingFields(fields: Array<keyof RequestFormState>) {
  return fields.map((field) => fieldLabels[field]).join(", ");
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-t border-slate-200 py-3 text-sm sm:grid-cols-[180px_1fr]">
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className="min-w-0 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

export function RequestForm() {
  const [form, setForm] = useState<RequestFormState>(initialState);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [requestId, setRequestId] = useState("");
  const [submittedSummary, setSubmittedSummary] =
    useState<SubmittedRequestSummary | null>(null);
  const [showManualBusinessDetails, setShowManualBusinessDetails] =
    useState(false);
  const [selectedBusinessMatch, setSelectedBusinessMatch] =
    useState<SelectedBusinessMatch | null>(null);
  const [attemptedSteps, setAttemptedSteps] = useState<
    Partial<Record<StepId, boolean>>
  >({});

  const currentStep = steps[currentStepIndex];
  const parsedCityState = useMemo(
    () => parseCityState(form.cityState),
    [form.cityState],
  );
  const shouldShowBusinessDetails = showManualBusinessDetails;

  const isFieldComplete = (field: keyof RequestFormState) => {
    const value = form[field];

    if (typeof value === "boolean") {
      return value;
    }

    if (field === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    if (field === "mobilePhone") {
      return stripPhoneNumber(value).length === 10;
    }

    if (field === "cityState") {
      const { city, state } = parseCityState(value);
      return city.length > 0 && state.length === 2;
    }

    return value.trim().length > 0;
  };

  const missingRequiredFields = requiredFields.filter(
    (field) => !isFieldComplete(field),
  );
  const currentStepMissingFields = stepRequiredFields[currentStep.id].filter(
    (field) => !isFieldComplete(field),
  );
  const canGoNext = currentStepMissingFields.length === 0;
  const isFirstStep = currentStepIndex === 0;
  const isReviewStep = currentStep.id === "review";

  const updateField = <K extends keyof RequestFormState>(
    field: K,
    value: RequestFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddressSelect = (
    selectedAddress: string,
    _placeId: string,
    details?: PlaceDetails,
  ) => {
    if (!selectedAddress && !_placeId && !details) {
      return;
    }

    const nextCityState =
      details?.city || details?.state
        ? [details.city, details.state].filter(Boolean).join(", ")
        : form.cityState;
    const nextBusinessName = details?.name || form.businessName;
    const nextAddress = formatStreetAddress(details, selectedAddress);
    const nextZipCode = details?.zipCode || form.zipCode;

    setSelectedBusinessMatch({
      name: nextBusinessName || selectedAddress.split(",")[0] || "Business",
      address: nextAddress,
      cityState: nextCityState,
      zipCode: nextZipCode,
    });

    setForm((current) => {
      return {
        ...current,
        businessName: nextBusinessName,
        businessAddress1: nextAddress,
        cityState: nextCityState,
        zipCode: nextZipCode,
      };
    });
  };

  const goToNextStep = () => {
    setError("");

    if (!canGoNext) {
      setAttemptedSteps((current) => ({ ...current, [currentStep.id]: true }));

      setError(
        currentStep.id === "category" &&
          currentStepMissingFields.some((field) =>
            ["businessName", "cityState", "zipCode"].includes(field),
          )
          ? "Select a Google match or click Manual entry to add the business details."
          : `Add ${formatMissingFields(currentStepMissingFields)} before continuing.`,
      );
      return;
    }

    setCurrentStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const goToPreviousStep = () => {
    setError("");
    setCurrentStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isReviewStep) {
      goToNextStep();
      return;
    }

    setError("");

    if (missingRequiredFields.length > 0) {
      const firstMissingStepIndex = steps.findIndex((step) =>
        stepRequiredFields[step.id].some((field) => !isFieldComplete(field)),
      );

      if (firstMissingStepIndex >= 0) {
        setCurrentStepIndex(firstMissingStepIndex);
      }

      setError(
        `Add ${formatMissingFields(missingRequiredFields)} before submitting.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      const { city, state } = parseCityState(form.cityState);
      const submissionFields = {
        businessName: form.businessName,
        ownerName: form.ownerName,
        email: form.email,
        mobilePhone: stripPhoneNumber(form.mobilePhone),
        website: form.website,
        businessAddress1: form.businessAddress1,
        city,
        state,
        zipCode: form.zipCode,
        requestedCategory: form.requestedCategory,
        yearsInBusiness: form.yearsInBusiness,
        shortDescription: form.shortDescription,
        permissionGranted: form.permissionGranted,
      };

      Object.entries(submissionFields).forEach(([key, value]) => {
        payload.append(key, String(value));
      });

      if (logo) {
        payload.append("logo", logo);
      }

      photos.forEach((photo) => {
        payload.append("photos", photo);
      });

      const res = await fetch("/api/merchant-requests", {
        method: "POST",
        body: payload,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not submit the request.");
      }

      setSubmittedAt(data.request.createdAt);
      setRequestId(data.request.id);
      setSubmittedSummary({
        businessName: form.businessName,
        requestedCategory: form.requestedCategory,
        market: [city, state].filter(Boolean).join(", "),
      });
      setForm(initialState);
      setShowManualBusinessDetails(false);
      setSelectedBusinessMatch(null);
      setAttemptedSteps({});
      setLogo(null);
      setPhotos([]);
      setCurrentStepIndex(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedAt) {
    return (
      <div className="overflow-hidden rounded-[8px] border border-white/70 bg-white text-slate-950 shadow-[0_24px_70px_rgba(8,30,45,0.24)]">
        <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#bf4c00] sm:text-xs">
                Request Submitted
              </p>
              <h2 className="mt-1.5 text-xl font-black tracking-normal text-slate-950 sm:text-[24px]">
                Your Phoenix Metro 250 request is in review.
              </h2>
              <p className="mt-1.5 max-w-xl text-sm font-semibold leading-5 text-slate-600">
                We received your category request. If selected, fulfillment
                begins before the Merchant Dashboard invite is sent.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                Received
              </dt>
              <dd className="mt-1 text-sm font-black text-slate-950">
                {formatSubmittedAt(submittedAt)}
              </dd>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                Reference
              </dt>
              <dd className="mt-1 text-sm font-black text-slate-950">
                {requestId.slice(0, 8).toUpperCase()}
              </dd>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                Category
              </dt>
              <dd className="mt-1 truncate text-sm font-black text-slate-950">
                {submittedSummary?.requestedCategory || "Submitted category"}
              </dd>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                Market
              </dt>
              <dd className="mt-1 text-sm font-black text-slate-950">
                {submittedSummary?.market || "Phoenix Metro"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-l-4 border-[#ff6a00] bg-orange-50 px-4 py-3">
            <p className="text-sm font-semibold leading-6 text-slate-700">
              Your timestamp now holds this request in review order for the
              submitted city and category.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold leading-6 text-slate-500">
              Watch for follow-up if the business is selected.
            </p>
            <Button
              type="button"
              className="h-11 rounded-[8px] bg-[#ff6a00] font-black text-white hover:bg-[#e85f00]"
              onClick={() => {
                setSubmittedAt("");
                setRequestId("");
                setSubmittedSummary(null);
              }}
            >
              Submit Another Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[8px] border border-white/70 bg-white text-slate-950 shadow-[0_24px_70px_rgba(8,30,45,0.24)]"
    >
      <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#bf4c00] sm:text-xs">
              Founding Merchant Request
            </p>
            <h2 className="mt-1.5 text-xl font-black tracking-normal text-slate-950 sm:text-[24px]">
              {currentStep.title}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm font-semibold leading-5 text-slate-600">
              {currentStep.description}
            </p>
          </div>
          <p className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm sm:text-sm">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-[#ff6a00] transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 sm:px-5">
        <div className="grid grid-cols-4 gap-1.5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isComplete = index < currentStepIndex;
            const isLocked = index > currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                aria-current={isActive ? "step" : undefined}
                disabled={isLocked || isSubmitting}
                className={cn(
                  "flex h-8 min-w-0 items-center justify-center gap-1 rounded-[8px] px-1.5 text-[9px] font-bold transition-colors sm:gap-1.5 sm:px-2 sm:text-xs",
                  isActive &&
                    "bg-white text-[#bf4c00] shadow-sm ring-1 ring-[#ff6a00]/45",
                  isComplete && "bg-emerald-50 text-emerald-800",
                  !isActive &&
                    !isComplete &&
                    "bg-slate-50 text-slate-400 ring-1 ring-slate-200/80",
                  isLocked && "cursor-not-allowed opacity-70",
                )}
                onClick={() => {
                  setError("");
                  setCurrentStepIndex(index);
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="min-h-[292px] sm:min-h-[300px]">
          {currentStep.id === "category" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="requestedCategory">
                    Category Requested *
                  </Label>
                  <Input
                    id="requestedCategory"
                    value={form.requestedCategory}
                    onChange={(event) =>
                      updateField("requestedCategory", event.target.value)
                    }
                    placeholder="Roofing, coffee shop, dental..."
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Type the category you believe best fits the business.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="businessAddress1">Business Address *</Label>
                    <GooglePlacesAutocomplete
                      id="businessAddress1"
                      value={form.businessAddress1}
                      onInputChange={(value) => {
                        updateField("businessAddress1", value);
                        setSelectedBusinessMatch(null);
                      }}
                      onChange={handleAddressSelect}
                      placeholder="Search business name or address..."
                      types={[]}
                      fetchDetails
                      allowManualEntry
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Select a Google match to fill business name, city, state,
                      and zip.
                    </p>
                    {!shouldShowBusinessDetails && !selectedBusinessMatch && (
                      <p className="mt-1 text-xs text-slate-500">
                        Can&apos;t find your business?{" "}
                        <button
                          type="button"
                          className="font-bold text-[#bf4c00] underline-offset-2 hover:underline"
                          onClick={() => {
                            setShowManualBusinessDetails(true);
                            setSelectedBusinessMatch(null);
                          }}
                        >
                          Manual entry
                        </button>
                      </p>
                    )}
                  </div>

                  {selectedBusinessMatch && (
                    <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                            Selected Business
                          </p>
                          <p className="mt-1 truncate text-sm font-black text-slate-950">
                            {selectedBusinessMatch.name}
                          </p>
                          <p className="mt-0.5 text-sm leading-5 text-slate-600">
                            {selectedBusinessMatch.address}
                            <br />
                            {[
                              selectedBusinessMatch.cityState,
                              selectedBusinessMatch.zipCode,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-xs font-black text-[#bf4c00] underline-offset-2 hover:underline"
                          onClick={() => setShowManualBusinessDetails(true)}
                        >
                          Edit manually
                        </button>
                      </div>
                    </div>
                  )}

                  {shouldShowBusinessDetails && (
                    <div className="space-y-4 rounded-[8px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
                        <div>
                          <Label htmlFor="cityState">City, State *</Label>
                          <Input
                            id="cityState"
                            value={form.cityState}
                            onChange={(event) =>
                              updateField("cityState", event.target.value)
                            }
                            placeholder="Phoenix, AZ"
                            required
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Enter as city, state code.
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="zipCode">Zip *</Label>
                          <Input
                            id="zipCode"
                            value={form.zipCode}
                            onChange={(event) =>
                              updateField("zipCode", event.target.value)
                            }
                            placeholder="85004"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                          id="businessName"
                          value={form.businessName}
                          onChange={(event) =>
                            updateField("businessName", event.target.value)
                          }
                          placeholder="Business name"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="yearsInBusiness" className="mb-0">
                        Years in Business
                      </Label>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        Optional
                      </span>
                    </div>
                    <Input
                      id="yearsInBusiness"
                      type="number"
                      min="0"
                      value={form.yearsInBusiness}
                      onChange={(event) =>
                        updateField("yearsInBusiness", event.target.value)
                      }
                      placeholder="12"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shortDescription">
                      Short Business Description *
                    </Label>
                    <Textarea
                      id="shortDescription"
                      value={form.shortDescription}
                      onChange={(event) =>
                        updateField("shortDescription", event.target.value)
                      }
                      placeholder="What do you do, who do you serve, and what should locals know first?"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep.id === "contact" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={form.ownerName}
                  onChange={(event) =>
                    updateField("ownerName", event.target.value)
                  }
                  placeholder="Owner name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="owner@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="mobilePhone">Mobile Phone *</Label>
                <Input
                  id="mobilePhone"
                  type="tel"
                  value={form.mobilePhone}
                  onChange={(event) =>
                    updateField(
                      "mobilePhone",
                      formatPhoneNumber(event.target.value),
                    )
                  }
                  placeholder="(425) 451-8599"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Used for direct fulfillment follow-up.
                </p>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    updateField("website", event.target.value)
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>
          )}

          {currentStep.id === "assets" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="logo">Upload Logo</Label>
                  <label
                    htmlFor="logo"
                    className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-600 transition-colors hover:border-[#ff6a00] hover:bg-orange-50"
                  >
                    <Upload className="h-5 w-5 text-[#ff6a00]" />
                    <span className="max-w-full truncate font-bold">
                      {logo ? logo.name : "Choose logo image"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Optional, max 5MB
                    </span>
                  </label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                    className="sr-only"
                    onChange={(event) =>
                      setLogo(event.target.files?.[0] || null)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="photos">Upload Photos</Label>
                  <label
                    htmlFor="photos"
                    className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-sm text-slate-600 transition-colors hover:border-[#ff6a00] hover:bg-orange-50"
                  >
                    <Upload className="h-5 w-5 text-[#ff6a00]" />
                    <span className="font-bold">
                      {photos.length > 0
                        ? `${photos.length} photo${photos.length === 1 ? "" : "s"} selected`
                        : "Choose business photos"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Optional, up to 6
                    </span>
                  </label>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                    multiple
                    className="sr-only"
                    onChange={(event) =>
                      setPhotos(
                        Array.from(event.target.files || []).slice(0, 6),
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 border-l-4 border-[#073253] bg-slate-50 px-4 py-4">
                <Checkbox
                  id="permissionGranted"
                  checked={form.permissionGranted}
                  onCheckedChange={(checked) =>
                    updateField("permissionGranted", Boolean(checked))
                  }
                  className="mt-1"
                />
                <div>
                  <Label
                    htmlFor="permissionGranted"
                    className="mb-0 cursor-pointer text-sm font-black leading-6"
                  >
                    Permission Checkbox *
                  </Label>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    I give Local City Places permission to review this request,
                    contact me about category availability, and use the
                    submitted business information and optional media for
                    fulfillment if selected.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep.id === "review" && (
            <div className="space-y-5">
              <div className="border-l-4 border-[#ff6a00] bg-orange-50 px-4 py-3">
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#bf4c00]" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    Submit now to create the official request timestamp. Admin
                    can then review city/category priority in received order.
                  </p>
                </div>
              </div>

              <dl>
                <ReviewRow
                  label="Business"
                  value={formatStepValue(form.businessName)}
                />
                <ReviewRow
                  label="Category"
                  value={formatStepValue(form.requestedCategory)}
                />
                <ReviewRow
                  label="Market"
                  value={
                    parsedCityState.city
                      ? `${parsedCityState.city}, ${parsedCityState.state}`
                      : "Not provided"
                  }
                />
                <ReviewRow
                  label="Owner"
                  value={formatStepValue(form.ownerName)}
                />
                <ReviewRow label="Email" value={formatStepValue(form.email)} />
                <ReviewRow
                  label="Mobile"
                  value={formatStepValue(form.mobilePhone)}
                />
                <ReviewRow
                  label="Website"
                  value={formatStepValue(form.website)}
                />
                <ReviewRow
                  label="Address"
                  value={
                    [
                      form.businessAddress1,
                      parsedCityState.city,
                      parsedCityState.state,
                      form.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Not provided"
                  }
                />
                <ReviewRow
                  label="Years"
                  value={formatStepValue(form.yearsInBusiness)}
                />
                <ReviewRow
                  label="Description"
                  value={formatStepValue(form.shortDescription)}
                />
                <ReviewRow
                  label="Assets"
                  value={[
                    logo ? `Logo: ${logo.name}` : "No logo",
                    photos.length > 0
                      ? `${photos.length} photo${photos.length === 1 ? "" : "s"}`
                      : "No photos",
                  ].join(" | ")}
                />
                <ReviewRow
                  label="Permission"
                  value={form.permissionGranted ? "Granted" : "Missing"}
                />
              </dl>
            </div>
          )}
        </div>

        {error && (
          <div
            className="mt-5 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-[24px] items-center gap-2 text-sm font-bold text-slate-600">
            {canGoNext || isReviewStep ? (
              <>
                <CircleCheck className="h-4 w-4 text-emerald-600" />
                <span>
                  {isReviewStep
                    ? "Ready for final review."
                    : "This step is ready."}
                </span>
              </>
            ) : !attemptedSteps[currentStep.id] ? (
              <>
                <FileCheck2 className="h-4 w-4 text-[#ff6a00]" />
                <span>Complete the required fields to continue.</span>
              </>
            ) : (
              <>
                <FileCheck2 className="h-4 w-4 text-[#ff6a00]" />
                <span>
                  {currentStepMissingFields.length} required item
                  {currentStepMissingFields.length === 1 ? "" : "s"} left.
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[8px] sm:w-auto"
              onClick={goToPreviousStep}
              disabled={isFirstStep || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {isReviewStep ? (
              <Button
                type="submit"
                className="h-11 rounded-[8px] bg-[#ff6a00] text-sm font-black text-white hover:bg-[#e85f00] sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                Submit and Timestamp
              </Button>
            ) : (
              <Button
                type="button"
                className="h-12 rounded-[8px] bg-[#ff6a00] text-base font-black text-white hover:bg-[#e85f00] sm:w-auto"
                onClick={goToNextStep}
                disabled={isSubmitting}
              >
                Continue
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

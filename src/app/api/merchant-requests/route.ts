import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchantRequests } from "@/db";
import { uploadMerchantRequestImage } from "@/lib/storage";
import { stripPhoneNumber } from "@/lib/utils";

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const logoMaxSize = 5 * 1024 * 1024;
const photoMaxSize = 10 * 1024 * 1024;
const maxPhotos = 6;

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function getPhotoFiles(formData: FormData) {
  return formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, maxPhotos);
}

function validateImageFile(file: File, maxSize: number) {
  if (!supportedImageTypes.has(file.type)) {
    return "Use JPG, PNG, WebP, GIF, HEIC, or HEIF images.";
  }

  if (file.size > maxSize) {
    return `Image is too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
  }

  return null;
}

function normalizeWebsite(value: string) {
  if (!value) return null;

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(withProtocol).toString();
  } catch {
    return value;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const businessName = getField(formData, "businessName");
    const ownerName = getField(formData, "ownerName");
    const email = getField(formData, "email").toLowerCase();
    const mobilePhone = stripPhoneNumber(getField(formData, "mobilePhone"));
    const website = normalizeWebsite(getField(formData, "website"));
    const businessAddress1 = getField(formData, "businessAddress1");
    const city = getField(formData, "city");
    const state = getField(formData, "state").toUpperCase().slice(0, 2);
    const zipCode = getField(formData, "zipCode");
    const requestedCategory = getField(formData, "requestedCategory");
    const yearsInBusinessRaw = getField(formData, "yearsInBusiness");
    const shortDescription = getField(formData, "shortDescription");
    const permissionGranted =
      getField(formData, "permissionGranted") === "true" ||
      getField(formData, "permissionGranted") === "on";

    const missingFields = [
      ["businessName", businessName],
      ["ownerName", ownerName],
      ["email", email],
      ["mobilePhone", mobilePhone],
      ["businessAddress1", businessAddress1],
      ["city", city],
      ["state", state],
      ["zipCode", zipCode],
      ["requestedCategory", requestedCategory],
      ["shortDescription", shortDescription],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: "Missing required fields", fields: missingFields },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 },
      );
    }

    if (mobilePhone.length !== 10) {
      return NextResponse.json(
        { error: "Mobile phone must be 10 digits" },
        { status: 400 },
      );
    }

    if (state.length !== 2) {
      return NextResponse.json(
        { error: "State must be a 2-letter code" },
        { status: 400 },
      );
    }

    if (!permissionGranted) {
      return NextResponse.json(
        { error: "Permission is required before submitting the request" },
        { status: 400 },
      );
    }

    const yearsInBusiness = yearsInBusinessRaw
      ? Number.parseInt(yearsInBusinessRaw, 10)
      : null;

    if (
      yearsInBusiness !== null &&
      (Number.isNaN(yearsInBusiness) || yearsInBusiness < 0)
    ) {
      return NextResponse.json(
        { error: "Years in business must be a positive number" },
        { status: 400 },
      );
    }

    const logo = getOptionalFile(formData, "logo");
    const photos = getPhotoFiles(formData);

    if (logo) {
      const logoError = validateImageFile(logo, logoMaxSize);
      if (logoError) {
        return NextResponse.json({ error: logoError }, { status: 400 });
      }
    }

    for (const photo of photos) {
      const photoError = validateImageFile(photo, photoMaxSize);
      if (photoError) {
        return NextResponse.json({ error: photoError }, { status: 400 });
      }
    }

    const requestId = randomUUID();
    const logoUrl = logo
      ? await uploadMerchantRequestImage(logo, requestId, "logo")
      : null;
    const photoUrls = (
      await Promise.all(
        photos.map((photo) =>
          uploadMerchantRequestImage(photo, requestId, "photo"),
        ),
      )
    ).filter((url): url is string => Boolean(url));

    const [merchantRequest] = await db
      .insert(merchantRequests)
      .values({
        id: requestId,
        businessName,
        ownerName,
        email,
        mobilePhone,
        website,
        businessAddress1,
        city,
        state,
        zipCode,
        requestedCategory,
        yearsInBusiness,
        shortDescription,
        logoUrl,
        logoFileName: logo?.name || null,
        photoUrls: photoUrls.length > 0 ? photoUrls : null,
        photoFileNames:
          photos.length > 0 ? photos.map((photo) => photo.name) : null,
        permissionGranted,
      })
      .returning({
        id: merchantRequests.id,
        createdAt: merchantRequests.createdAt,
        status: merchantRequests.status,
        categoryStatus: merchantRequests.categoryStatus,
      });

    return NextResponse.json(
      {
        success: true,
        request: {
          ...merchantRequest,
          createdAt: merchantRequest.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating merchant request:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 },
    );
  }
}

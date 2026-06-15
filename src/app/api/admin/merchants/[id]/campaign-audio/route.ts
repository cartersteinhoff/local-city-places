import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
  db,
  type MerchantCampaignAudio,
  type MerchantCampaignAudioAsset,
  merchants,
} from "@/db";
import { getSession } from "@/lib/auth";
import { revalidateMerchantPublicPaths } from "@/lib/merchant-public-revalidation";

type CampaignAudioKind = "radioSpot" | "soundtrack";

const audioKinds = ["radioSpot", "soundtrack"] satisfies CampaignAudioKind[];
const maxAudioSize = 60 * 1024 * 1024;

function isCampaignAudioKind(
  value: FormDataEntryValue | null,
): value is CampaignAudioKind {
  return (
    typeof value === "string" && audioKinds.includes(value as CampaignAudioKind)
  );
}

function safeFileSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  if (file.type === "audio/wav" || file.type === "audio/x-wav") return "wav";
  if (file.type === "audio/mp4") return "m4a";
  if (file.type === "audio/aac") return "aac";
  return "mp3";
}

function getContentType(file: File) {
  if (file.type) return file.type;

  const extension = getFileExtension(file);
  if (extension === "wav") return "audio/wav";
  if (extension === "m4a") return "audio/mp4";
  if (extension === "aac") return "audio/aac";
  return "audio/mpeg";
}

function isAudioFile(file: File) {
  return (
    file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac)$/i.test(file.name)
  );
}

function defaultAssetText(kind: CampaignAudioKind, businessName: string) {
  if (kind === "radioSpot") {
    return {
      title: `${businessName} KLCP Radio Spot`,
      description: `Final produced KLCP radio spot for ${businessName}.`,
      fileLabel: "klcp-radio-spot",
    };
  }

  return {
    title: `${businessName} Signature Soundtrack`,
    description: `Signature campaign soundtrack for ${businessName}.`,
    fileLabel: "signature-soundtrack",
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Audio storage is not configured." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kindValue = formData.get("kind");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    if (!isCampaignAudioKind(kindValue)) {
      return NextResponse.json(
        { error: "Choose radio spot or signature soundtrack." },
        { status: 400 },
      );
    }

    if (!isAudioFile(file)) {
      return NextResponse.json(
        { error: "Invalid file type. Use MP3, WAV, M4A, or AAC." },
        { status: 400 },
      );
    }

    if (file.size > maxAudioSize) {
      return NextResponse.json(
        { error: "Audio file is too large. Max size is 60MB." },
        { status: 400 },
      );
    }

    const defaults = defaultAssetText(kindValue, merchant.businessName);
    const titleValue = formData.get("title");
    const descriptionValue = formData.get("description");
    const title =
      typeof titleValue === "string" && titleValue.trim()
        ? titleValue.trim()
        : defaults.title;
    const description =
      typeof descriptionValue === "string" && descriptionValue.trim()
        ? descriptionValue.trim()
        : defaults.description;
    const extension = getFileExtension(file);
    const contentType = getContentType(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedAt = new Date().toISOString();
    const merchantFileSegment =
      safeFileSegment(merchant.businessName) || "merchant";
    const pathname = `campaign-audio/${merchant.id}/${kindValue}/${merchantFileSegment}-${defaults.fileLabel}-${Date.now()}.${extension}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    const asset: MerchantCampaignAudioAsset = {
      title: title || defaults.title,
      description: description || defaults.description,
      url: blob.url,
      fileName: `${merchantFileSegment}-${defaults.fileLabel}.${extension}`,
      contentType,
      sizeBytes: buffer.length,
      uploadedAt,
      status: "ready",
    };
    const nextCampaignAudio: MerchantCampaignAudio = {
      ...(merchant.campaignAudio || {}),
      [kindValue]: asset,
      updatedAt: uploadedAt,
    };

    await db
      .update(merchants)
      .set({ campaignAudio: nextCampaignAudio, updatedAt: new Date() })
      .where(eq(merchants.id, merchant.id));

    revalidateMerchantPublicPaths(merchant);

    return NextResponse.json({
      success: true,
      asset,
      campaignAudio: nextCampaignAudio,
    });
  } catch (error) {
    console.error("Error uploading campaign audio:", error);
    return NextResponse.json(
      { error: "Failed to upload campaign audio" },
      { status: 500 },
    );
  }
}

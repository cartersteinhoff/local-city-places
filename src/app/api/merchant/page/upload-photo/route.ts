import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchantOwners, merchants } from "@/db";
import { getSession } from "@/lib/auth";
import {
  merchantOwnerJoin,
  merchantOwnerWhere,
} from "@/lib/merchant-ownership";
import { revalidateMerchantPublicPaths } from "@/lib/merchant-public-revalidation";
import { uploadMerchantLogo, uploadMerchantPhotoFromFile } from "@/lib/storage";

const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxImageSize = 10 * 1024 * 1024;

async function getOwnedMerchant(userId: string) {
  const [row] = await db
    .select({ merchant: merchants })
    .from(merchants)
    .leftJoin(merchantOwners, merchantOwnerJoin(userId))
    .where(merchantOwnerWhere(userId))
    .limit(1);

  return row?.merchant ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (
      !session ||
      (session.user.role !== "merchant" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchant = await getOwnedMerchant(session.user.id);
    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant page not found" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 },
      );
    }

    if (file.size > maxImageSize) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB." },
        { status: 400 },
      );
    }

    let url: string | null;

    if (type === "logo") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      url = await uploadMerchantLogo(base64, file.name);

      if (url) {
        await db
          .update(merchants)
          .set({ logoUrl: url, updatedAt: new Date() })
          .where(eq(merchants.id, merchant.id));
        revalidateMerchantPublicPaths(merchant);
      }
    } else {
      url = await uploadMerchantPhotoFromFile(file, merchant.id);
    }

    if (!url) {
      return NextResponse.json(
        { error: "Failed to upload image. Storage not configured." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading merchant page photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 },
    );
  }
}

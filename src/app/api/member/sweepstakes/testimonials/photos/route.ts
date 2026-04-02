import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { uploadFavoriteMerchantTestimonialPhoto } from "@/lib/storage";
import { db, members } from "@/db";

const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "member") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Photo too large. Max size is 8MB." },
        { status: 400 }
      );
    }

    const url = await uploadFavoriteMerchantTestimonialPhoto(file, member.id);

    if (!url) {
      return NextResponse.json(
        { error: "Upload failed. Storage is not configured." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Favorite merchant photo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload testimonial photo" },
      { status: 500 }
    );
  }
}

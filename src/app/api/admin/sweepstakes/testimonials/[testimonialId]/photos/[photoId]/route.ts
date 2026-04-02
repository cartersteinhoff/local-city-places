import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { favoriteMerchantPhotoModerationSchema } from "@/lib/validations/sweepstakes";
import {
  db,
  favoriteMerchantTestimonialPhotos,
  favoriteMerchantTestimonials,
} from "@/db";

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ testimonialId: string; photoId: string }>;
  }
) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { testimonialId, photoId } = await params;
    const body = await request.json();
    const parsed = favoriteMerchantPhotoModerationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid photo moderation data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [photo] = await db
      .select({
        id: favoriteMerchantTestimonialPhotos.id,
        testimonialId: favoriteMerchantTestimonialPhotos.testimonialId,
        status: favoriteMerchantTestimonialPhotos.status,
        testimonialStatus: favoriteMerchantTestimonials.status,
      })
      .from(favoriteMerchantTestimonialPhotos)
      .innerJoin(
        favoriteMerchantTestimonials,
        eq(favoriteMerchantTestimonialPhotos.testimonialId, favoriteMerchantTestimonials.id)
      )
      .where(
        and(
          eq(favoriteMerchantTestimonialPhotos.id, photoId),
          eq(favoriteMerchantTestimonialPhotos.testimonialId, testimonialId)
        )
      )
      .limit(1);

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.testimonialStatus === "approved") {
      return NextResponse.json(
        {
          error:
            "This nomination is already approved. Photo decisions are locked once the testimonial has been published.",
        },
        { status: 409 }
      );
    }

    const [updatedPhoto] = await db
      .update(favoriteMerchantTestimonialPhotos)
      .set({
        status: parsed.data.action === "approve" ? "approved" : "rejected",
        moderatedAt: new Date(),
        moderatedBy: session.user.id,
      })
      .where(eq(favoriteMerchantTestimonialPhotos.id, photo.id))
      .returning({
        id: favoriteMerchantTestimonialPhotos.id,
        testimonialId: favoriteMerchantTestimonialPhotos.testimonialId,
        url: favoriteMerchantTestimonialPhotos.url,
        displayOrder: favoriteMerchantTestimonialPhotos.displayOrder,
        status: favoriteMerchantTestimonialPhotos.status,
        moderatedAt: favoriteMerchantTestimonialPhotos.moderatedAt,
      });

    return NextResponse.json({
      success: true,
      photo: {
        ...updatedPhoto,
        moderatedAt: updatedPhoto.moderatedAt
          ? updatedPhoto.moderatedAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("Error moderating favorite merchant photo:", error);
    return NextResponse.json(
      { error: "Failed to moderate favorite merchant photo" },
      { status: 500 }
    );
  }
}

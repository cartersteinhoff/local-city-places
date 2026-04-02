import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { issueFavoriteMerchantReward } from "@/lib/favorite-merchant";
import { revalidateMerchantPublicPaths } from "@/lib/merchant-public-revalidation";
import { favoriteMerchantModerationSchema } from "@/lib/validations/sweepstakes";
import {
  db,
  favoriteMerchantTestimonialPhotos,
  favoriteMerchantTestimonials,
  members,
  merchants,
  users,
} from "@/db";

async function getAdminTestimonialDetail(testimonialId: string) {
  const [testimonial] = await db
    .select({
      id: favoriteMerchantTestimonials.id,
      cycleId: favoriteMerchantTestimonials.cycleId,
      memberId: favoriteMerchantTestimonials.memberId,
      merchantId: favoriteMerchantTestimonials.merchantId,
      merchantName: merchants.businessName,
      merchantCity: merchants.city,
      merchantState: merchants.state,
      merchantSlug: merchants.slug,
      memberFirstName: users.firstName,
      memberLastName: users.lastName,
      memberEmail: users.email,
      content: favoriteMerchantTestimonials.content,
      wordCount: favoriteMerchantTestimonials.wordCount,
      status: favoriteMerchantTestimonials.status,
      moderationNotes: favoriteMerchantTestimonials.moderationNotes,
      approvedAt: favoriteMerchantTestimonials.approvedAt,
      rewardStatus: favoriteMerchantTestimonials.rewardStatus,
      rewardReferenceId: favoriteMerchantTestimonials.rewardReferenceId,
      createdAt: favoriteMerchantTestimonials.createdAt,
      updatedAt: favoriteMerchantTestimonials.updatedAt,
    })
    .from(favoriteMerchantTestimonials)
    .innerJoin(members, eq(favoriteMerchantTestimonials.memberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .innerJoin(merchants, eq(favoriteMerchantTestimonials.merchantId, merchants.id))
    .where(eq(favoriteMerchantTestimonials.id, testimonialId))
    .limit(1);

  if (!testimonial) {
    return null;
  }

  const photos = await db
    .select({
      id: favoriteMerchantTestimonialPhotos.id,
      url: favoriteMerchantTestimonialPhotos.url,
      displayOrder: favoriteMerchantTestimonialPhotos.displayOrder,
      status: favoriteMerchantTestimonialPhotos.status,
      moderatedAt: favoriteMerchantTestimonialPhotos.moderatedAt,
    })
    .from(favoriteMerchantTestimonialPhotos)
    .where(eq(favoriteMerchantTestimonialPhotos.testimonialId, testimonial.id))
    .orderBy(favoriteMerchantTestimonialPhotos.displayOrder);

  const [photoStats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${favoriteMerchantTestimonialPhotos.status} = 'pending')`,
      approved: sql<number>`count(*) filter (where ${favoriteMerchantTestimonialPhotos.status} = 'approved')`,
      rejected: sql<number>`count(*) filter (where ${favoriteMerchantTestimonialPhotos.status} = 'rejected')`,
    })
    .from(favoriteMerchantTestimonialPhotos)
    .where(eq(favoriteMerchantTestimonialPhotos.testimonialId, testimonial.id));

  return {
    ...testimonial,
    createdAt: testimonial.createdAt.toISOString(),
    updatedAt: testimonial.updatedAt.toISOString(),
    approvedAt: testimonial.approvedAt ? testimonial.approvedAt.toISOString() : null,
    photos: photos.map((photo) => ({
      ...photo,
      moderatedAt: photo.moderatedAt ? photo.moderatedAt.toISOString() : null,
    })),
    photoStats: {
      total: Number(photoStats.total) || 0,
      pending: Number(photoStats.pending) || 0,
      approved: Number(photoStats.approved) || 0,
      rejected: Number(photoStats.rejected) || 0,
    },
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { testimonialId } = await params;
    const testimonial = await getAdminTestimonialDetail(testimonialId);

    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error("Error fetching favorite merchant testimonial:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite merchant testimonial" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { testimonialId } = await params;
    const body = await request.json();
    const parsed = favoriteMerchantModerationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid moderation data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const testimonial = await getAdminTestimonialDetail(testimonialId);

    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const { action, notes } = parsed.data;
    const trimmedNotes = notes?.trim() || null;

    if (testimonial.status === "approved" && action !== "approve") {
      return NextResponse.json(
        {
          error:
            "Approved testimonials cannot be moved back to another moderation state because the reward certificate has already been issued.",
        },
        { status: 409 }
      );
    }

    if (action === "approve") {
      if (testimonial.photoStats.pending > 0) {
        return NextResponse.json(
          {
            error:
              "Review every photo before approving this nomination. Each photo needs its own approve or reject decision.",
          },
          { status: 409 }
        );
      }

      if (testimonial.photoStats.approved < 2) {
        return NextResponse.json(
          {
            error:
              "Approve at least 2 photos before approving this nomination so the merchant page has an accepted photo set.",
          },
          { status: 409 }
        );
      }

      const memberDisplayName = [testimonial.memberFirstName, testimonial.memberLastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const reward = await issueFavoriteMerchantReward({
        testimonialId: testimonial.id,
        recipientEmail: testimonial.memberEmail,
        recipientName: memberDisplayName || undefined,
      });

      const [updatedTestimonial] = await db
        .update(favoriteMerchantTestimonials)
        .set({
          status: "approved",
          moderationNotes: trimmedNotes,
          approvedAt: new Date(),
          approvedBy: session.user.id,
          rewardStatus: "registration_required",
          rewardReferenceId: reward.rewardGrcId,
          updatedAt: new Date(),
        })
        .where(eq(favoriteMerchantTestimonials.id, testimonial.id))
        .returning({
          id: favoriteMerchantTestimonials.id,
          status: favoriteMerchantTestimonials.status,
          moderationNotes: favoriteMerchantTestimonials.moderationNotes,
          rewardStatus: favoriteMerchantTestimonials.rewardStatus,
          rewardReferenceId: favoriteMerchantTestimonials.rewardReferenceId,
        });

      revalidateMerchantPublicPaths({
        city: testimonial.merchantCity,
        state: testimonial.merchantState,
        slug: testimonial.merchantSlug,
      });

      return NextResponse.json({
        success: true,
        testimonial: {
          ...updatedTestimonial,
          photoStats: testimonial.photoStats,
        },
        reward: reward,
      });
    }

    const [updatedTestimonial] = await db
      .update(favoriteMerchantTestimonials)
      .set({
        status: action === "request_changes" ? "changes_requested" : "rejected",
        moderationNotes: trimmedNotes,
        approvedAt: null,
        approvedBy: null,
        rewardStatus: "not_created",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(favoriteMerchantTestimonials.id, testimonial.id),
          eq(favoriteMerchantTestimonials.status, testimonial.status)
        )
      )
      .returning({
        id: favoriteMerchantTestimonials.id,
        status: favoriteMerchantTestimonials.status,
        moderationNotes: favoriteMerchantTestimonials.moderationNotes,
        rewardStatus: favoriteMerchantTestimonials.rewardStatus,
      });

    return NextResponse.json({
      success: true,
      testimonial: {
        ...updatedTestimonial,
        photoStats: testimonial.photoStats,
      },
    });
  } catch (error) {
    console.error("Error moderating favorite merchant testimonial:", error);
    return NextResponse.json(
      { error: "Failed to moderate favorite merchant testimonial" },
      { status: 500 }
    );
  }
}

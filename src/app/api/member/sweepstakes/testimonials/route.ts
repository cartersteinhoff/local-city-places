import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
  db,
  favoriteMerchantTestimonialPhotos,
  favoriteMerchantTestimonials,
  members,
  merchants,
  sweepstakesEntries,
} from "@/db";
import { getSession } from "@/lib/auth";
import {
  countWords,
  createOrConfirmSweepstakesEntryFromTestimonial,
  ensureCurrentSweepstakesCycle,
  getSweepstakesLeaderboard,
} from "@/lib/sweepstakes";
import { favoriteMerchantTestimonialSchema } from "@/lib/validations/sweepstakes";

export async function GET() {
  try {
    const session = await getSession();

    if (
      !session ||
      (session.user.role !== "member" && session.user.role !== "admin")
    ) {
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

    const cycle = await ensureCurrentSweepstakesCycle();

    const [confirmedEntry] = await db
      .select({ id: sweepstakesEntries.id })
      .from(sweepstakesEntries)
      .where(
        and(
          eq(sweepstakesEntries.memberId, member.id),
          eq(sweepstakesEntries.cycleId, cycle.id),
          eq(sweepstakesEntries.status, "confirmed"),
        ),
      )
      .limit(1);

    const rows = await db
      .select({
        id: favoriteMerchantTestimonials.id,
        merchantId: favoriteMerchantTestimonials.merchantId,
        merchantName: merchants.businessName,
        content: favoriteMerchantTestimonials.content,
        wordCount: favoriteMerchantTestimonials.wordCount,
        status: favoriteMerchantTestimonials.status,
        moderationNotes: favoriteMerchantTestimonials.moderationNotes,
        rewardStatus: favoriteMerchantTestimonials.rewardStatus,
        createdAt: favoriteMerchantTestimonials.createdAt,
        updatedAt: favoriteMerchantTestimonials.updatedAt,
        photoId: favoriteMerchantTestimonialPhotos.id,
        photoUrl: favoriteMerchantTestimonialPhotos.url,
        photoOrder: favoriteMerchantTestimonialPhotos.displayOrder,
        photoStatus: favoriteMerchantTestimonialPhotos.status,
        photoModeratedAt: favoriteMerchantTestimonialPhotos.moderatedAt,
      })
      .from(favoriteMerchantTestimonials)
      .innerJoin(
        merchants,
        eq(favoriteMerchantTestimonials.merchantId, merchants.id),
      )
      .leftJoin(
        favoriteMerchantTestimonialPhotos,
        eq(
          favoriteMerchantTestimonials.id,
          favoriteMerchantTestimonialPhotos.testimonialId,
        ),
      )
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
        ),
      )
      .orderBy(
        desc(favoriteMerchantTestimonials.createdAt),
        favoriteMerchantTestimonialPhotos.displayOrder,
      );

    const [activeSubmissionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteMerchantTestimonials)
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
          ne(favoriteMerchantTestimonials.status, "rejected"),
        ),
      );

    const [rejectedSubmissionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteMerchantTestimonials)
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
          eq(favoriteMerchantTestimonials.status, "rejected"),
        ),
      );

    const leaderboard = await getSweepstakesLeaderboard(cycle.id);
    const currentStandingRow =
      leaderboard.find((row) => row.memberId === member.id) ?? null;

    const testimonials = new Map<
      string,
      {
        id: string;
        merchantId: string;
        merchantName: string;
        content: string;
        wordCount: number;
        status: string;
        moderationNotes: string | null;
        rewardStatus: string;
        createdAt: string;
        updatedAt: string;
        photos: Array<{
          id: string;
          url: string;
          displayOrder: number;
          status: "pending" | "approved" | "rejected";
          moderatedAt: string | null;
        }>;
      }
    >();

    for (const row of rows) {
      if (!testimonials.has(row.id)) {
        testimonials.set(row.id, {
          id: row.id,
          merchantId: row.merchantId,
          merchantName: row.merchantName,
          content: row.content,
          wordCount: row.wordCount,
          status: row.status,
          moderationNotes: row.moderationNotes,
          rewardStatus: row.rewardStatus,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          photos: [],
        });
      }

      if (row.photoId && row.photoUrl) {
        testimonials.get(row.id)?.photos.push({
          id: row.photoId,
          url: row.photoUrl,
          displayOrder: row.photoOrder ?? 0,
          status: row.photoStatus ?? "pending",
          moderatedAt: row.photoModeratedAt
            ? row.photoModeratedAt.toISOString()
            : null,
        });
      }
    }

    return NextResponse.json({
      cycle: {
        id: cycle.id,
        name: cycle.name,
      },
      submissionLimit: 5,
      confirmedEntryThisMonth: !!confirmedEntry,
      activeSubmissions: activeSubmissionCount?.count ?? 0,
      remainingSubmissions: Math.max(
        0,
        5 - (activeSubmissionCount?.count ?? 0),
      ),
      rejectedSubmissions: rejectedSubmissionCount?.count ?? 0,
      currentStanding: currentStandingRow
        ? {
            memberId: currentStandingRow.memberId,
            displayName: currentStandingRow.displayName,
            regularEntries: currentStandingRow.regularEntries,
            referralEntries: currentStandingRow.referralEntries,
            totalEntries: currentStandingRow.totalEntries,
            rank: currentStandingRow.rank,
          }
        : null,
      leaderboardPreview: leaderboard.slice(0, 10).map((row) => ({
        memberId: row.memberId,
        displayName: row.displayName,
        regularEntries: row.regularEntries,
        referralEntries: row.referralEntries,
        totalEntries: row.totalEntries,
        rank: row.rank,
      })),
      testimonials: Array.from(testimonials.values()),
    });
  } catch (error) {
    console.error("Error fetching favorite merchant testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (
      !session ||
      (session.user.role !== "member" && session.user.role !== "admin")
    ) {
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

    const body = await request.json();
    const result = favoriteMerchantTestimonialSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid testimonial data", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { testimonialId, merchantId, content, photos } = result.data;
    const trimmedContent = content.trim();
    const wordCount = countWords(trimmedContent);

    if (wordCount < 50) {
      return NextResponse.json(
        { error: "Testimonial must include at least 50 words." },
        { status: 400 },
      );
    }

    const cycle = await ensureCurrentSweepstakesCycle();

    const [confirmedEntry] = await db
      .select({ id: sweepstakesEntries.id })
      .from(sweepstakesEntries)
      .where(
        and(
          eq(sweepstakesEntries.memberId, member.id),
          eq(sweepstakesEntries.cycleId, cycle.id),
          eq(sweepstakesEntries.status, "confirmed"),
        ),
      )
      .limit(1);

    const maybeLockInSweepstakesEntry = async () => {
      if (confirmedEntry) {
        return false;
      }

      const entryName =
        [session.user.firstName, session.user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || session.user.email;
      const entryResult = await createOrConfirmSweepstakesEntryFromTestimonial({
        userId: session.user.id,
        memberId: member.id,
        entryName,
        entryEmail: session.user.email,
      });

      return !entryResult.alreadyEnteredThisCycle;
    };

    const [merchant] = await db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 },
      );
    }

    if (testimonialId) {
      const [existingTestimonial] = await db
        .select()
        .from(favoriteMerchantTestimonials)
        .where(
          and(
            eq(favoriteMerchantTestimonials.id, testimonialId),
            eq(favoriteMerchantTestimonials.memberId, member.id),
          ),
        )
        .limit(1);

      if (!existingTestimonial) {
        return NextResponse.json(
          { error: "Testimonial not found" },
          { status: 404 },
        );
      }

      if (existingTestimonial.status !== "changes_requested") {
        return NextResponse.json(
          {
            error:
              "Only testimonials with requested changes can be resubmitted.",
          },
          { status: 409 },
        );
      }

      const [conflictingActiveTestimonial] = await db
        .select({
          id: favoriteMerchantTestimonials.id,
        })
        .from(favoriteMerchantTestimonials)
        .where(
          and(
            eq(favoriteMerchantTestimonials.memberId, member.id),
            eq(favoriteMerchantTestimonials.cycleId, cycle.id),
            eq(favoriteMerchantTestimonials.merchantId, merchantId),
            ne(favoriteMerchantTestimonials.status, "rejected"),
            ne(favoriteMerchantTestimonials.id, existingTestimonial.id),
          ),
        )
        .limit(1);

      if (conflictingActiveTestimonial) {
        return NextResponse.json(
          {
            error:
              "You already have another active testimonial for this merchant this month.",
            testimonialId: conflictingActiveTestimonial.id,
          },
          { status: 409 },
        );
      }

      const existingPhotos = await db
        .select({
          id: favoriteMerchantTestimonialPhotos.id,
          status: favoriteMerchantTestimonialPhotos.status,
        })
        .from(favoriteMerchantTestimonialPhotos)
        .where(
          eq(
            favoriteMerchantTestimonialPhotos.testimonialId,
            existingTestimonial.id,
          ),
        );

      const existingPhotosById = new Map(
        existingPhotos.map((photo) => [photo.id, photo]),
      );
      const retainedPhotoIds = photos
        .map((photo) => photo.id)
        .filter((photoId): photoId is string => typeof photoId === "string");
      const retainedPhotoIdSet = new Set(retainedPhotoIds);

      for (const photoId of retainedPhotoIds) {
        const existingPhoto = existingPhotosById.get(photoId);
        if (!existingPhoto) {
          return NextResponse.json(
            { error: "One of the selected photos could not be found." },
            { status: 400 },
          );
        }

        if (existingPhoto.status === "rejected") {
          return NextResponse.json(
            {
              error:
                "Remove rejected photos and upload replacements before resubmitting.",
            },
            { status: 409 },
          );
        }
      }

      await db
        .update(favoriteMerchantTestimonials)
        .set({
          merchantId,
          content: trimmedContent,
          wordCount,
          status: "submitted",
          moderationNotes: null,
          approvedAt: null,
          approvedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(favoriteMerchantTestimonials.id, existingTestimonial.id));

      const photoIdsToDelete = existingPhotos
        .filter((photo) => !retainedPhotoIdSet.has(photo.id))
        .map((photo) => photo.id);

      if (photoIdsToDelete.length > 0) {
        await db
          .delete(favoriteMerchantTestimonialPhotos)
          .where(
            inArray(favoriteMerchantTestimonialPhotos.id, photoIdsToDelete),
          );
      }

      const existingPhotoInputs = photos.filter(
        (photo): photo is typeof photo & { id: string } => !!photo.id,
      );
      for (const [index, photo] of existingPhotoInputs.entries()) {
        await db
          .update(favoriteMerchantTestimonialPhotos)
          .set({
            displayOrder: index,
          })
          .where(eq(favoriteMerchantTestimonialPhotos.id, photo.id));
      }

      const newPhotoInputs = photos.filter((photo) => !photo.id);
      if (newPhotoInputs.length > 0) {
        await db.insert(favoriteMerchantTestimonialPhotos).values(
          newPhotoInputs.map((photo, index) => ({
            testimonialId: existingTestimonial.id,
            url: photo.url,
            displayOrder: existingPhotoInputs.length + index,
            status: "pending" as const,
          })),
        );
      }

      const createdSweepstakesEntry = await maybeLockInSweepstakesEntry();

      return NextResponse.json({
        success: true,
        testimonialId: existingTestimonial.id,
        message: createdSweepstakesEntry
          ? "Your testimonial has been resubmitted for review, and your sweepstakes entry is now locked in."
          : "Your testimonial has been resubmitted for review.",
      });
    }

    const [activeSubmissionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteMerchantTestimonials)
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
          ne(favoriteMerchantTestimonials.status, "rejected"),
        ),
      );

    if ((activeSubmissionCount?.count ?? 0) >= 5) {
      return NextResponse.json(
        {
          error:
            "You have already used your 5 favorite merchant submissions for this month.",
        },
        { status: 409 },
      );
    }

    const [existingForMerchant] = await db
      .select({
        id: favoriteMerchantTestimonials.id,
        status: favoriteMerchantTestimonials.status,
      })
      .from(favoriteMerchantTestimonials)
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
          eq(favoriteMerchantTestimonials.merchantId, merchantId),
          ne(favoriteMerchantTestimonials.status, "rejected"),
        ),
      )
      .limit(1);

    if (existingForMerchant) {
      return NextResponse.json(
        {
          error:
            existingForMerchant.status === "changes_requested"
              ? "This merchant already has a testimonial waiting for your revisions."
              : "You already have an active testimonial for this merchant this month.",
          testimonialId: existingForMerchant.id,
        },
        { status: 409 },
      );
    }

    const [createdTestimonial] = await db
      .insert(favoriteMerchantTestimonials)
      .values({
        cycleId: cycle.id,
        memberId: member.id,
        merchantId,
        content: trimmedContent,
        wordCount,
      })
      .returning({ id: favoriteMerchantTestimonials.id });

    await db.insert(favoriteMerchantTestimonialPhotos).values(
      photos.map((photo, index) => ({
        testimonialId: createdTestimonial.id,
        url: photo.url,
        displayOrder: index,
        status: "pending" as const,
      })),
    );

    const createdSweepstakesEntry = await maybeLockInSweepstakesEntry();

    return NextResponse.json({
      success: true,
      testimonialId: createdTestimonial.id,
      message: createdSweepstakesEntry
        ? `Your favorite merchant nomination for ${merchant.businessName} is now pending review, and your sweepstakes entry is locked in.`
        : `Your favorite merchant nomination for ${merchant.businessName} is now pending review.`,
    });
  } catch (error) {
    console.error("Error creating favorite merchant testimonial:", error);
    return NextResponse.json(
      { error: "Failed to submit favorite merchant testimonial" },
      { status: 500 },
    );
  }
}

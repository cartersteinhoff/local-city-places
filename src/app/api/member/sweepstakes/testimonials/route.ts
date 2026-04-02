import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { countWords, ensureCurrentSweepstakesCycle } from "@/lib/sweepstakes";
import {
  favoriteMerchantTestimonialSchema,
} from "@/lib/validations/sweepstakes";
import {
  db,
  favoriteMerchantTestimonialPhotos,
  favoriteMerchantTestimonials,
  members,
  merchants,
  sweepstakesEntries,
} from "@/db";

export async function GET() {
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

    const cycle = await ensureCurrentSweepstakesCycle();

    const [confirmedEntry] = await db
      .select({ id: sweepstakesEntries.id })
      .from(sweepstakesEntries)
      .where(
        and(
          eq(sweepstakesEntries.memberId, member.id),
          eq(sweepstakesEntries.cycleId, cycle.id),
          eq(sweepstakesEntries.status, "confirmed")
        )
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
      })
      .from(favoriteMerchantTestimonials)
      .innerJoin(merchants, eq(favoriteMerchantTestimonials.merchantId, merchants.id))
      .leftJoin(
        favoriteMerchantTestimonialPhotos,
        eq(favoriteMerchantTestimonials.id, favoriteMerchantTestimonialPhotos.testimonialId)
      )
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id)
        )
      )
      .orderBy(
        desc(favoriteMerchantTestimonials.createdAt),
        favoriteMerchantTestimonialPhotos.displayOrder
      );

    const [activeSubmissionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteMerchantTestimonials)
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
          ne(favoriteMerchantTestimonials.status, "rejected")
        )
      );

    const [rejectedSubmissionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteMerchantTestimonials)
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
          eq(favoriteMerchantTestimonials.status, "rejected")
        )
      );

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
        photos: Array<{ id: string; url: string; displayOrder: number }>;
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
      remainingSubmissions: Math.max(0, 5 - (activeSubmissionCount?.count ?? 0)),
      rejectedSubmissions: rejectedSubmissionCount?.count ?? 0,
      testimonials: Array.from(testimonials.values()),
    });
  } catch (error) {
    console.error("Error fetching favorite merchant testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const result = favoriteMerchantTestimonialSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid testimonial data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { testimonialId, merchantId, content, photos } = result.data;
    const trimmedContent = content.trim();
    const wordCount = countWords(trimmedContent);

    if (wordCount < 50) {
      return NextResponse.json(
        { error: "Testimonial must include at least 50 words." },
        { status: 400 }
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
          eq(sweepstakesEntries.status, "confirmed")
        )
      )
      .limit(1);

    if (!confirmedEntry) {
      return NextResponse.json(
        { error: "Confirm your current sweepstakes entry before submitting a favorite merchant testimonial." },
        { status: 409 }
      );
    }

    const [merchant] = await db
      .select({
        id: merchants.id,
        businessName: merchants.businessName,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    if (testimonialId) {
      const [existingTestimonial] = await db
        .select()
        .from(favoriteMerchantTestimonials)
        .where(
          and(
            eq(favoriteMerchantTestimonials.id, testimonialId),
            eq(favoriteMerchantTestimonials.memberId, member.id)
          )
        )
        .limit(1);

      if (!existingTestimonial) {
        return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
      }

      if (existingTestimonial.status !== "changes_requested") {
        return NextResponse.json(
          { error: "Only testimonials with requested changes can be resubmitted." },
          { status: 409 }
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
            ne(favoriteMerchantTestimonials.id, existingTestimonial.id)
          )
        )
        .limit(1);

      if (conflictingActiveTestimonial) {
        return NextResponse.json(
          {
            error: "You already have another active testimonial for this merchant this month.",
            testimonialId: conflictingActiveTestimonial.id,
          },
          { status: 409 }
        );
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

      await db
        .delete(favoriteMerchantTestimonialPhotos)
        .where(eq(favoriteMerchantTestimonialPhotos.testimonialId, existingTestimonial.id));

      if (photos.length > 0) {
        await db.insert(favoriteMerchantTestimonialPhotos).values(
          photos.map((photo, index) => ({
            testimonialId: existingTestimonial.id,
            url: photo.url,
            displayOrder: index,
          }))
        );
      }

      return NextResponse.json({
        success: true,
        testimonialId: existingTestimonial.id,
        message: "Your testimonial has been resubmitted for review.",
      });
    }

    const [activeSubmissionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(favoriteMerchantTestimonials)
      .where(
        and(
          eq(favoriteMerchantTestimonials.memberId, member.id),
          eq(favoriteMerchantTestimonials.cycleId, cycle.id),
          ne(favoriteMerchantTestimonials.status, "rejected")
        )
      );

    if ((activeSubmissionCount?.count ?? 0) >= 5) {
      return NextResponse.json(
        { error: "You have already used your 5 favorite merchant submissions for this month." },
        { status: 409 }
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
          ne(favoriteMerchantTestimonials.status, "rejected")
        )
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
        { status: 409 }
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
      }))
    );

    return NextResponse.json({
      success: true,
      testimonialId: createdTestimonial.id,
      message: `Your favorite merchant nomination for ${merchant.businessName} is now pending review.`,
    });
  } catch (error) {
    console.error("Error creating favorite merchant testimonial:", error);
    return NextResponse.json(
      { error: "Failed to submit favorite merchant testimonial" },
      { status: 500 }
    );
  }
}

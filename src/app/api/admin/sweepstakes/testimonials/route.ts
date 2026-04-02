import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import {
  db,
  favoriteMerchantTestimonialPhotos,
  favoriteMerchantTestimonials,
  members,
  merchants,
  users,
} from "@/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const offset = (page - 1) * limit;
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof or>> = [];

    if (status && status !== "all") {
      conditions.push(
        eq(
          favoriteMerchantTestimonials.status,
          status as "submitted" | "changes_requested" | "approved" | "rejected",
        ),
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(favoriteMerchantTestimonials.content, `%${search}%`),
          ilike(merchants.businessName, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const photoCountSq = db
      .select({
        testimonialId: favoriteMerchantTestimonialPhotos.testimonialId,
        count: sql<number>`count(*)`.as("photo_count"),
        pendingCount:
          sql<number>`count(*) filter (where ${favoriteMerchantTestimonialPhotos.status} = 'pending')`.as(
            "pending_count",
          ),
        approvedCount:
          sql<number>`count(*) filter (where ${favoriteMerchantTestimonialPhotos.status} = 'approved')`.as(
            "approved_count",
          ),
        rejectedCount:
          sql<number>`count(*) filter (where ${favoriteMerchantTestimonialPhotos.status} = 'rejected')`.as(
            "rejected_count",
          ),
      })
      .from(favoriteMerchantTestimonialPhotos)
      .groupBy(favoriteMerchantTestimonialPhotos.testimonialId)
      .as("photo_counts");

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(favoriteMerchantTestimonials)
      .innerJoin(members, eq(favoriteMerchantTestimonials.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(
        merchants,
        eq(favoriteMerchantTestimonials.merchantId, merchants.id),
      )
      .where(whereClause);

    const totalPages = Math.max(1, Math.ceil(Number(count) / limit));

    const testimonialRows = await db
      .select({
        id: favoriteMerchantTestimonials.id,
        merchantId: favoriteMerchantTestimonials.merchantId,
        merchantName: merchants.businessName,
        memberId: favoriteMerchantTestimonials.memberId,
        memberFirstName: users.firstName,
        memberLastName: users.lastName,
        memberEmail: users.email,
        content: favoriteMerchantTestimonials.content,
        wordCount: favoriteMerchantTestimonials.wordCount,
        status: favoriteMerchantTestimonials.status,
        moderationNotes: favoriteMerchantTestimonials.moderationNotes,
        rewardStatus: favoriteMerchantTestimonials.rewardStatus,
        rewardReferenceId: favoriteMerchantTestimonials.rewardReferenceId,
        createdAt: favoriteMerchantTestimonials.createdAt,
        updatedAt: favoriteMerchantTestimonials.updatedAt,
        photoCount: sql<number>`coalesce(${photoCountSq.count}, 0)`,
        pendingPhotoCount: sql<number>`coalesce(${photoCountSq.pendingCount}, 0)`,
        approvedPhotoCount: sql<number>`coalesce(${photoCountSq.approvedCount}, 0)`,
        rejectedPhotoCount: sql<number>`coalesce(${photoCountSq.rejectedCount}, 0)`,
      })
      .from(favoriteMerchantTestimonials)
      .innerJoin(members, eq(favoriteMerchantTestimonials.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(
        merchants,
        eq(favoriteMerchantTestimonials.merchantId, merchants.id),
      )
      .leftJoin(
        photoCountSq,
        eq(favoriteMerchantTestimonials.id, photoCountSq.testimonialId),
      )
      .where(whereClause)
      .orderBy(desc(favoriteMerchantTestimonials.createdAt))
      .limit(limit)
      .offset(offset);

    const testimonialIds = testimonialRows.map((row) => row.id);

    const photos =
      testimonialIds.length > 0
        ? await db
            .select({
              id: favoriteMerchantTestimonialPhotos.id,
              testimonialId: favoriteMerchantTestimonialPhotos.testimonialId,
              url: favoriteMerchantTestimonialPhotos.url,
              displayOrder: favoriteMerchantTestimonialPhotos.displayOrder,
              status: favoriteMerchantTestimonialPhotos.status,
            })
            .from(favoriteMerchantTestimonialPhotos)
            .where(
              inArray(
                favoriteMerchantTestimonialPhotos.testimonialId,
                testimonialIds,
              ),
            )
            .orderBy(
              favoriteMerchantTestimonialPhotos.testimonialId,
              favoriteMerchantTestimonialPhotos.displayOrder,
            )
        : [];

    const photosByTestimonial = new Map<
      string,
      Array<{
        id: string;
        url: string;
        displayOrder: number;
        status: "pending" | "approved" | "rejected";
      }>
    >();

    for (const photo of photos) {
      if (!photosByTestimonial.has(photo.testimonialId)) {
        photosByTestimonial.set(photo.testimonialId, []);
      }

      photosByTestimonial.get(photo.testimonialId)?.push({
        id: photo.id,
        url: photo.url,
        displayOrder: photo.displayOrder,
        status: photo.status,
      });
    }

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        submitted: sql<number>`count(*) filter (where ${favoriteMerchantTestimonials.status} = 'submitted')`,
        changesRequested: sql<number>`count(*) filter (where ${favoriteMerchantTestimonials.status} = 'changes_requested')`,
        approved: sql<number>`count(*) filter (where ${favoriteMerchantTestimonials.status} = 'approved')`,
        rejected: sql<number>`count(*) filter (where ${favoriteMerchantTestimonials.status} = 'rejected')`,
      })
      .from(favoriteMerchantTestimonials);

    return NextResponse.json({
      testimonials: testimonialRows.map((row) => ({
        ...row,
        photoCount: Number(row.photoCount) || 0,
        pendingPhotoCount: Number(row.pendingPhotoCount) || 0,
        approvedPhotoCount: Number(row.approvedPhotoCount) || 0,
        rejectedPhotoCount: Number(row.rejectedPhotoCount) || 0,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        photos: photosByTestimonial.get(row.id) || [],
      })),
      pagination: {
        total: Number(count),
        page,
        limit,
        totalPages,
      },
      stats: {
        total: Number(stats.total),
        submitted: Number(stats.submitted),
        changesRequested: Number(stats.changesRequested),
        approved: Number(stats.approved),
        rejected: Number(stats.rejected),
      },
    });
  } catch (error) {
    console.error("Error fetching favorite merchant testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite merchant testimonials" },
      { status: 500 },
    );
  }
}

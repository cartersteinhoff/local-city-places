import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchantRequests } from "@/db";
import { getSession } from "@/lib/auth";

const statuses = ["new", "fulfilled"] as const;

const categoryStatuses = ["requested", "assigned", "waitlisted"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const updateValues: Partial<typeof merchantRequests.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.status === "string") {
      if (!statuses.includes(body.status as (typeof statuses)[number])) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      updateValues.status = body.status as (typeof statuses)[number];

      if (body.status === "fulfilled") {
        updateValues.fulfilledAt = new Date();
      }
    }

    if (typeof body.categoryStatus === "string") {
      if (
        !categoryStatuses.includes(
          body.categoryStatus as (typeof categoryStatuses)[number],
        )
      ) {
        return NextResponse.json(
          { error: "Invalid category status" },
          { status: 400 },
        );
      }

      updateValues.categoryStatus =
        body.categoryStatus as (typeof categoryStatuses)[number];
    }

    if (typeof body.adminNotes === "string") {
      updateValues.adminNotes = body.adminNotes.trim() || null;
    }

    const [updatedRequest] = await db
      .update(merchantRequests)
      .set(updateValues)
      .where(eq(merchantRequests.id, id))
      .returning();

    if (!updatedRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({
      request: {
        ...updatedRequest,
        createdAt: updatedRequest.createdAt.toISOString(),
        updatedAt: updatedRequest.updatedAt.toISOString(),
        inviteSentAt: updatedRequest.inviteSentAt?.toISOString() || null,
        fulfilledAt: updatedRequest.fulfilledAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error updating merchant request:", error);
    return NextResponse.json(
      { error: "Failed to update merchant request" },
      { status: 500 },
    );
  }
}

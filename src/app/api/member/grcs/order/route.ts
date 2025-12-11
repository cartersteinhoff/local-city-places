import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { memberGrcQueue, members } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const orderSchema = z.object({
  grcIds: z.array(z.string().uuid()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get member profile
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = orderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { grcIds } = result.data;

    // Delete existing queue entries for this member
    await db
      .delete(memberGrcQueue)
      .where(eq(memberGrcQueue.memberId, member.id));

    // Insert new queue entries with sort order
    if (grcIds.length > 0) {
      await db.insert(memberGrcQueue).values(
        grcIds.map((grcId, index) => ({
          memberId: member.id,
          grcId,
          sortOrder: index,
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving GRC order:", error);
    return NextResponse.json(
      { error: "Failed to save GRC order" },
      { status: 500 }
    );
  }
}

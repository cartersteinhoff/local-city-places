import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, merchantInvites } from "@/db";
import { eq, and, isNull } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if invite exists and is unused
    const [invite] = await db
      .select()
      .from(merchantInvites)
      .where(eq(merchantInvites.id, id))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Cannot delete an invite that has already been used" },
        { status: 400 }
      );
    }

    // Delete the invite
    await db
      .delete(merchantInvites)
      .where(and(eq(merchantInvites.id, id), isNull(merchantInvites.usedAt)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting merchant invite:", error);
    return NextResponse.json({ error: "Failed to delete invite" }, { status: 500 });
  }
}

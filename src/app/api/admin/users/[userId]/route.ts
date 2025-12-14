import { NextRequest, NextResponse } from "next/server";
import { db, users, members, merchants, grcPurchases } from "@/db";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { userId } = await params;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        role: users.role,
        profilePhotoUrl: users.profilePhotoUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get member profile if exists
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);

    // Get merchant profile if exists
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, userId))
      .limit(1);

    // Check if merchant has trial GRCs
    let hasTrialGrcs = false;
    if (merchant) {
      const [trialPurchase] = await db
        .select({ id: grcPurchases.id })
        .from(grcPurchases)
        .where(
          and(
            eq(grcPurchases.merchantId, merchant.id),
            eq(grcPurchases.isTrial, true)
          )
        )
        .limit(1);
      hasTrialGrcs = !!trialPurchase;
    }

    return NextResponse.json({
      user,
      member,
      merchant: merchant ? { ...merchant, hasTrialGrcs } : null,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();

    // Support both old format (just role) and new format (user, member, merchant objects)
    const userUpdate = body.user || (body.role ? { role: body.role } : null);
    const memberUpdate = body.member;
    const merchantUpdate = body.merchant;

    // Validate role if provided
    if (userUpdate?.role && !["member", "merchant", "admin"].includes(userUpdate.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent self-demotion
    if (userId === session.user.id && userUpdate?.role && userUpdate.role !== "admin") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    // Update user
    if (userUpdate) {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...(userUpdate.email && { email: userUpdate.email }),
          ...(userUpdate.phone !== undefined && { phone: userUpdate.phone }),
          ...(userUpdate.role && { role: userUpdate.role }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // Update member if provided
    if (memberUpdate) {
      const [existingMember] = await db
        .select()
        .from(members)
        .where(eq(members.userId, userId))
        .limit(1);

      if (existingMember) {
        await db
          .update(members)
          .set({
            ...(memberUpdate.firstName && { firstName: memberUpdate.firstName }),
            ...(memberUpdate.lastName && { lastName: memberUpdate.lastName }),
            ...(memberUpdate.address !== undefined && { address: memberUpdate.address }),
            ...(memberUpdate.city !== undefined && { city: memberUpdate.city }),
            ...(memberUpdate.state !== undefined && { state: memberUpdate.state }),
            ...(memberUpdate.zip !== undefined && { zip: memberUpdate.zip }),
            ...(memberUpdate.homeCity !== undefined && { homeCity: memberUpdate.homeCity }),
          })
          .where(eq(members.userId, userId));
      }
    }

    // Update merchant if provided
    if (merchantUpdate) {
      const [existingMerchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, userId))
        .limit(1);

      if (existingMerchant) {
        await db
          .update(merchants)
          .set({
            ...(merchantUpdate.businessName && { businessName: merchantUpdate.businessName }),
            ...(merchantUpdate.city !== undefined && { city: merchantUpdate.city }),
            ...(merchantUpdate.phone !== undefined && { phone: merchantUpdate.phone }),
            ...(merchantUpdate.website !== undefined && { website: merchantUpdate.website }),
            ...(merchantUpdate.description !== undefined && { description: merchantUpdate.description }),
            ...(merchantUpdate.verified !== undefined && { verified: merchantUpdate.verified }),
          })
          .where(eq(merchants.userId, userId));
      }
    }

    // Fetch and return updated data
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { userId } = await params;

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Delete user (cascades to members/merchants due to onDelete: "cascade")
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

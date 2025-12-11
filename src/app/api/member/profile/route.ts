import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { uploadProfilePhoto, validateImageFormat, validateImageSize } from "@/lib/storage";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with member profile
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      profile: {
        email: user.email,
        phone: user.phone,
        profilePhotoUrl: user.profilePhotoUrl,
        notificationPrefs: user.notificationPrefs || {
          emailReceipts: true,
          emailReminders: true,
          emailMarketing: false,
        },
        firstName: member.firstName,
        lastName: member.lastName,
        address: member.address,
        city: member.city,
        state: member.state,
        zip: member.zip,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      zip,
      notificationPrefs,
      profilePhoto, // Base64 image
    } = body;

    // Get member
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 400 }
      );
    }

    // Handle profile photo upload if provided
    let profilePhotoUrl: string | null | undefined;
    if (profilePhoto) {
      const formatValidation = validateImageFormat(profilePhoto);
      if (!formatValidation.valid) {
        return NextResponse.json(
          { error: formatValidation.error },
          { status: 400 }
        );
      }

      const sizeValidation = validateImageSize(profilePhoto, 5 * 1024 * 1024); // 5MB limit
      if (!sizeValidation.valid) {
        return NextResponse.json({ error: sizeValidation.error }, { status: 413 });
      }

      profilePhotoUrl = await uploadProfilePhoto(
        profilePhoto,
        `member-${member.id}.jpg`
      );
    }

    // Update user table (phone, notification prefs, profile photo)
    const userUpdates: Record<string, unknown> = {};
    if (phone !== undefined) userUpdates.phone = phone;
    if (notificationPrefs !== undefined) userUpdates.notificationPrefs = notificationPrefs;
    if (profilePhotoUrl) userUpdates.profilePhotoUrl = profilePhotoUrl;

    if (Object.keys(userUpdates).length > 0) {
      await db
        .update(users)
        .set({ ...userUpdates, updatedAt: new Date() })
        .where(eq(users.id, session.user.id));
    }

    // Update member table (name, address)
    const memberUpdates: Record<string, unknown> = {};
    if (firstName !== undefined) memberUpdates.firstName = firstName;
    if (lastName !== undefined) memberUpdates.lastName = lastName;
    if (address !== undefined) memberUpdates.address = address;
    if (city !== undefined) memberUpdates.city = city;
    if (state !== undefined) memberUpdates.state = state;
    if (zip !== undefined) memberUpdates.zip = zip;

    if (Object.keys(memberUpdates).length > 0) {
      await db
        .update(members)
        .set(memberUpdates)
        .where(eq(members.id, member.id));
    }

    return NextResponse.json({ success: true, profilePhotoUrl });
  } catch (error) {
    console.error("Error updating profile:", error);
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

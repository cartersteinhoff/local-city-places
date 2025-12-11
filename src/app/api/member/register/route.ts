import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { memberRegistrationSchema } from "@/lib/validations/member";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user already has a member profile
    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.userId, session.user.id))
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: "Member profile already exists" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = memberRegistrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, address, city, state, zip } = result.data;

    // Create member profile
    const [newMember] = await db
      .insert(members)
      .values({
        userId: session.user.id,
        firstName,
        lastName,
        address,
        city,
        state,
        zip,
        homeCity: city, // Set home city from registration city
      })
      .returning({ id: members.id });

    return NextResponse.json({
      success: true,
      memberId: newMember.id,
    });
  } catch (error) {
    console.error("Error creating member profile:", error);
    return NextResponse.json(
      { error: "Failed to create member profile" },
      { status: 500 }
    );
  }
}

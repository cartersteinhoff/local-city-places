import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, merchantInvites, merchantRequests } from "@/db";
import { generateToken, getSession, hashToken } from "@/lib/auth";
import { sendMerchantInviteEmail } from "@/lib/email";
import { validateEmailForMerchant } from "@/lib/merchant-onboarding";

const defaultExpiryDays = 7;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const expiresInDays = Math.min(
      30,
      Math.max(
        1,
        Number.parseInt(String(body.expiresInDays || defaultExpiryDays), 10) ||
          defaultExpiryDays,
      ),
    );
    const shouldSendEmail = body.sendEmail !== false;
    const requestedEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : undefined;
    const message =
      typeof body.message === "string" ? body.message.trim() : undefined;

    const [merchantRequest] = await db
      .select()
      .from(merchantRequests)
      .where(eq(merchantRequests.id, id))
      .limit(1);

    if (!merchantRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const inviteEmail = requestedEmail || merchantRequest.email;

    if (!inviteEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const validationError = await validateEmailForMerchant(inviteEmail);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message, errorType: validationError.type },
        { status: 400 },
      );
    }

    const token = generateToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const [invite] = await db
      .insert(merchantInvites)
      .values({
        token: hashedToken,
        email: inviteEmail,
        expiresAt,
        createdBy: session.user.id,
      })
      .returning();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const inviteUrl = `${appUrl}/onboard/merchant?token=${token}`;
    const emailSent = shouldSendEmail
      ? await sendMerchantInviteEmail({
          email: inviteEmail,
          inviteUrl,
          expiresInDays,
          subject,
          message,
        })
      : false;

    const now = new Date();
    const [updatedRequest] = await db
      .update(merchantRequests)
      .set({
        status: "fulfilled",
        categoryStatus: "assigned",
        merchantInviteId: invite.id,
        inviteSentAt: now,
        fulfilledAt: merchantRequest.fulfilledAt || now,
        updatedAt: now,
      })
      .where(eq(merchantRequests.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt.toISOString(),
      },
      inviteUrl,
      emailSent,
      request: {
        ...updatedRequest,
        createdAt: updatedRequest.createdAt.toISOString(),
        updatedAt: updatedRequest.updatedAt.toISOString(),
        inviteSentAt: updatedRequest.inviteSentAt?.toISOString() || null,
        fulfilledAt: updatedRequest.fulfilledAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Error sending merchant request invite:", error);
    return NextResponse.json(
      { error: "Failed to send merchant invite" },
      { status: 500 },
    );
  }
}

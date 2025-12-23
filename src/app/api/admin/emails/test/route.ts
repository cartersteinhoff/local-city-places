import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email/postmark-broadcast";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, content, previewText, testEmail } = body;

    if (!subject || !content || !testEmail) {
      return NextResponse.json(
        { error: "Subject, content, and test email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const result = await sendTestEmail({
      to: testEmail,
      subject,
      htmlContent: content,
      previewText,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error || "Failed to send" }, { status: 500 });
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

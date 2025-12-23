import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { wrapInBaseTemplate } from "@/lib/email/base-template";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, previewText } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Wrap content in base template
    const html = wrapInBaseTemplate(content, {
      preheaderText: previewText,
      showUnsubscribe: true,
    });

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

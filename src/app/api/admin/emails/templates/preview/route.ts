import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, params } = await request.json();

    let html = "";
    switch (templateId) {
      case "magic-link":
        html = generateMagicLinkPreview(params);
        break;
      case "welcome":
        html = generateWelcomePreview(params);
        break;
      case "merchant-invite":
        html = generateMerchantInvitePreview(params);
        break;
      case "merchant-welcome":
        html = generateMerchantWelcomePreview(params);
        break;
      default:
        return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Template preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function emailShell(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:24px 32px;text-align:center;border-bottom:1px solid #e5e7eb;">
        <img src="${APP_URL}/images/logo-horizontal.png" alt="Local City Places" style="max-width:280px;height:auto;" />
      </div>
      <div style="padding:32px;">${body}</div>
      <div style="padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;color:#666;font-size:14px;">
        <p><strong>Need help?</strong><br><a href="mailto:support@localcityplaces.com">support@localcityplaces.com</a></p>
        <p style="font-size:12px;color:#999;">© 2025 Local City Places. All rights reserved.<br>954 E. County Down Drive, Chandler, AZ 85249</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function cta(href: string, label: string) {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#007bff;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600;">${label}</a>
  </div>`;
}

function generateMagicLinkPreview(params: { token: string }) {
  const magicLink = `${APP_URL}/api/auth/verify?token=${params.token}`;
  return emailShell(
    "Sign in to Local City Places",
    `<h2 style="margin:0 0 16px;color:#1e293b;">Sign in to your account</h2>
    <p style="color:#334155;line-height:1.6;">Click the button below to sign in to Local City Places.</p>
    ${cta(magicLink, "Sign In")}
    <p style="color:#666;font-size:14px;">Or copy and paste this link: <a href="${magicLink}">${magicLink}</a></p>`,
  );
}

function generateWelcomePreview(params: { email: string; token: string }) {
  const magicLink = `${APP_URL}/api/auth/verify?token=${params.token}`;
  return emailShell(
    "Welcome to Local City Places",
    `<h2 style="margin:0 0 16px;color:#1e293b;">Welcome to Local City Places!</h2>
    <p style="color:#334155;line-height:1.6;">An administrator has created a member account for ${params.email}.</p>
    ${cta(magicLink, "Sign In to Your Account")}
    <p style="color:#666;font-size:14px;">This link will expire in 3 days for security reasons.</p>`,
  );
}

function generateMerchantInvitePreview(params: {
  inviteUrl: string;
  expiresInDays: number;
}) {
  return emailShell(
    "You're invited to Local City Places",
    `<h2 style="margin:0 0 16px;color:#1e293b;">Welcome, Partner!</h2>
    <p style="color:#334155;line-height:1.6;">You've been invited to join Local City Places as a merchant partner.</p>
    <p style="color:#334155;line-height:1.6;">Complete your registration, set up your business profile, and start getting discovered by local customers.</p>
    ${cta(params.inviteUrl, "Complete Your Registration")}
    <p style="color:#666;font-size:14px;">This invitation expires in ${params.expiresInDays} day${params.expiresInDays !== 1 ? "s" : ""}.</p>`,
  );
}

function generateMerchantWelcomePreview(params: {
  businessName: string;
  loginUrl: string;
}) {
  return emailShell(
    "Welcome to Local City Places",
    `<h2 style="margin:0 0 16px;color:#1e293b;">Welcome to Local City Places!</h2>
    <p style="color:#334155;line-height:1.6;">Your merchant account for <strong>${params.businessName}</strong> has been created and is ready to go.</p>
    <ol style="color:#334155;line-height:1.8;">
      <li>Access your dashboard</li>
      <li>Complete your business profile</li>
      <li>Review your public business page</li>
    </ol>
    ${cta(params.loginUrl, "Access Your Dashboard")}`,
  );
}

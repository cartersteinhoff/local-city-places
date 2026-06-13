import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.user.role !== "admin") {
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
      case "merchant-request-confirmation":
        html = generateMerchantRequestConfirmationPreview(params);
        break;
      case "merchant-request-admin-notification":
        html = generateMerchantRequestAdminNotificationPreview(params);
        break;
      case "merchant-invite":
        html = generateMerchantInvitePreview(params);
        break;
      case "merchant-welcome":
        html = generateMerchantWelcomePreview(params);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown template" },
          { status: 400 },
        );
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Template preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
        <img src="${APP_URL}/images/email-logo.png" alt="Local City Places" width="280" height="125" style="width:280px;max-width:100%;height:auto;" />
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

function formatRequestTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Jun 7, 2026, 10:00 AM MST";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Phoenix",
    timeZoneName: "short",
  }).format(date);
}

function getSamplePhotoUrls(count: number) {
  const samplePaths = [
    "/images/morning-buzz-media-card.png",
    "/images/phoenix-skyline-section-mobile-v3.webp",
    "/images/gas-grocery-gift-card.png",
    "/images/new-year-250-background.jpg",
    "/images/morning-buzz-homepage-wide.webp",
    "/images/john-heidi-show.jpg",
  ];

  return samplePaths.slice(0, Math.max(0, Math.min(count, samplePaths.length)));
}

function buildPhotoPreviewGrid(photoCount?: number) {
  const photoUrls = getSamplePhotoUrls(photoCount || 0);
  if (photoUrls.length === 0) return "";

  const rows: string[] = [];

  for (let i = 0; i < photoUrls.length; i += 3) {
    const cells = photoUrls
      .slice(i, i + 3)
      .map((url, index) => {
        const photoNumber = i + index + 1;

        return `<td width="33.33%" style="padding:4px;vertical-align:top;">
          <a href="${APP_URL}${url}" style="display:block;text-decoration:none;">
            <img src="${APP_URL}${url}" alt="Submitted merchant photo ${photoNumber}" width="180" height="96" style="display:block;width:100%;max-width:180px;height:96px;object-fit:cover;border:1px solid #e2e8f0;border-radius:6px;" />
          </a>
        </td>`;
      })
      .join("");

    rows.push(`<tr>${cells}</tr>`);
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;table-layout:fixed;">${rows.join("")}</table>`;
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

function generateMerchantRequestConfirmationPreview(params: {
  ownerName: string;
  businessName: string;
  requestedCategory: string;
  city: string;
  state: string;
  createdAt: string;
}) {
  const market = [params.city, params.state].filter(Boolean).join(", ");
  const receivedAt = formatRequestTimestamp(params.createdAt);

  return emailShell(
    "We received your Phoenix Metro 250 request",
    `<p style="margin:0 0 12px;color:#f97316;font-size:13px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">Phoenix Metro 250 Selection</p>
    <h2 style="margin:0 0 16px;color:#1e293b;">We received your request.</h2>
    <p style="color:#334155;line-height:1.6;">Hi ${params.ownerName},</p>
    <p style="color:#334155;line-height:1.6;">Thanks for submitting <strong>${params.businessName}</strong> for review. Your request has been received and the timestamp below now marks when it entered the category review queue.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Business</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.businessName}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Requested category</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.requestedCategory}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Market</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${market}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Received</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${receivedAt}</p>
    </div>
    <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:16px;margin:24px 0;">
      <p style="color:#7c2d12;margin:0;font-size:15px;"><strong>Timestamp rule:</strong> Categories are reviewed in the order requests are received for each city and category.</p>
    </div>
    <p style="color:#334155;line-height:1.6;">There is no cost to request and no obligation. Submitting this form does not guarantee selection or category assignment.</p>
    <p style="color:#334155;line-height:1.6;">If selected, fulfillment begins first. That can include category review, merchant page preparation, audio assets, and then a Merchant Dashboard invite when everything is ready to activate.</p>`,
  );
}

function generateMerchantRequestAdminNotificationPreview(params: {
  ownerName: string;
  businessName: string;
  email: string;
  mobilePhone: string;
  website?: string;
  businessAddress1: string;
  city: string;
  state: string;
  zipCode: string;
  requestedCategory: string;
  yearsInBusiness?: number;
  shortDescription: string;
  photoCount?: number;
  createdAt: string;
}) {
  const receivedAt = formatRequestTimestamp(params.createdAt);
  const adminUrl = `${APP_URL}/admin/merchant-requests`;
  const photoGridHtml = buildPhotoPreviewGrid(params.photoCount);

  return emailShell(
    "New merchant request",
    `<p style="margin:0 0 12px;color:#f97316;font-size:13px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">Merchant Request Submitted</p>
    <h2 style="margin:0 0 16px;color:#1e293b;">${params.businessName}</h2>
    <p style="color:#334155;line-height:1.6;">A merchant request was just submitted and is ready for admin review.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Owner</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.ownerName}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Email</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.email}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Mobile phone</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.mobilePhone}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Requested category</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.requestedCategory}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Address</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.businessAddress1}, ${params.city}, ${params.state} ${params.zipCode}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Website</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.website || "Not provided"}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Years in business</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.yearsInBusiness ?? "Not provided"}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Submitted description</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${params.shortDescription}</p>
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Uploads</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">Photos: ${params.photoCount || 0}</p>
      ${
        photoGridHtml
          ? `<p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Submitted photos</p>
      ${photoGridHtml}`
          : ""
      }
      <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Received</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:16px;font-weight:700;">${receivedAt}</p>
    </div>
    ${cta(adminUrl, "Review Merchant Requests")}`,
  );
}

function generateMerchantWelcomePreview(params: {
  businessName: string;
  loginUrl: string;
}) {
  const siteUrl = getSiteUrlFromLoginUrl(params.loginUrl);

  return emailShell(
    "Welcome to Local City Places",
    `<h2 style="margin:0 0 16px;color:#1e293b;">Welcome to Local City Places!</h2>
    <p style="color:#334155;line-height:1.6;">Your Merchant Dashboard for <strong>${params.businessName}</strong> has been created and is ready to go.</p>
    <p style="color:#334155;line-height:1.6;">Go to <a href="${siteUrl}" style="color:#f97316;font-weight:700;">${siteUrl}</a> and click the LOGIN button in the top right of the home page. Your email address is already authorized to receive a MAGIC Link by Email and there is no password necessary.</p>
    <p style="color:#334155;line-height:1.6;"><strong>Once in your Merchant Dashboard be sure to check out:</strong></p>
    <ul style="color:#334155;line-height:1.8;">
      <li>Your On-Air Studio where you will find both your first radio spot and your Signature Soundtrack</li>
      <li>Your Merchant Page (where you can edit the details 24/7)</li>
      <li>Your RESERVED Category for your city (NO COMPETITORS ALLOWED)</li>
    </ul>
    <p style="color:#334155;line-height:1.6;">Once you're settled in, take a look at MarketLOCK360 which enables you to LOCK IN benefits you will not find anywhere else in the advertising world and INCREASE your revenues exponentially while DECREASING your costs to the floor.</p>
    <p style="color:#334155;line-height:1.6;">I will be in touch soon to help you get settled and acclimated.</p>
    <p style="color:#334155;line-height:1.6;">Oh and don't forget to start listening to KLCP Radio because your radio spot and your Signature Soundtrack have already started playing on there.</p>
    <p style="color:#334155;line-height:1.6;">We look forward to serving your NEEDS NOW and in the FUTURE.</p>
    <p style="color:#334155;line-height:1.6;">Now go make it a GREAT Day! 🚀</p>
    <p style="color:#334155;line-height:1.6;">Troy &quot;<strong style="color:#ff7a3c;">LOVES to Increase Business</strong>&quot; Warren</p>`,
  );
}

function getSiteUrlFromLoginUrl(loginUrl: string) {
  try {
    return new URL(loginUrl).origin;
  } catch {
    return "https://localcityplaces.com";
  }
}

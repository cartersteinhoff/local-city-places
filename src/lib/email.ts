import * as postmark from "postmark";

const FROM_EMAIL =
  process.env.POSTMARK_FROM_EMAIL || "team@localcityplaces.com";
const FROM_NAME = process.env.POSTMARK_FROM_NAME || "Local City Places";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// Always use production URL for email images (localhost not accessible from email clients)
const EMAIL_ASSETS_URL = "https://localcityplaces.com";

const client = process.env.POSTMARK_API_KEY
  ? new postmark.ServerClient(process.env.POSTMARK_API_KEY)
  : null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRequestTimestamp(date: Date) {
  const requestDate = Number.isNaN(date.getTime()) ? new Date() : date;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Phoenix",
    timeZoneName: "short",
  }).format(requestDate);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  messageStream?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  messageStream,
}: SendEmailOptions): Promise<boolean> {
  // In development without API key, log to console
  if (!client) {
    console.log("=".repeat(50));
    console.log("EMAIL (Postmark not configured - logging only)");
    console.log("=".repeat(50));
    console.log(`To: ${to}`);
    console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
    console.log(`Subject: ${subject}`);
    console.log("-".repeat(50));
    console.log(text || html);
    console.log("=".repeat(50));
    return true;
  }

  try {
    await client.sendEmail({
      From: `${FROM_NAME} <${FROM_EMAIL}>`,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text || html.replace(/<[^>]*>/g, ""),
      MessageStream:
        messageStream || process.env.POSTMARK_MESSAGE_STREAM || "outbound",
    });
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Simple sign-in email for existing users
export async function sendMagicLinkEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const magicLink = `${APP_URL}/api/auth/verify?token=${token}`;

  const subject = "Sign in to Local City Places";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Sign in to Local City Places</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f9fafb; }
    .email-wrapper { width: 100%; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); padding: 48px 20px; }
    .email-container { max-width: 700px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); }
    .email-header { background: #ffffff; padding: 24px 32px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .email-content { background-color: #ffffff; padding: 40px 32px; }
    .email-content h2 { color: #1e293b; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; }
    .email-content p { color: #334155; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px; }
    .cta-button { text-align: center; margin: 30px 0; }
    .cta-button a { display: inline-block; background: #007bff; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; }
    .email-footer { background: #ffffff; padding: 32px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .email-footer p { color: #666666; font-size: 14px; margin: 0 0 12px 0; line-height: 1.6; }
    .email-footer a { color: #2563eb; text-decoration: underline; }
    .footer-divider { width: 40px; height: 1px; background: #e2e8f0; margin: 20px auto; }
    .footer-legal { font-size: 12px; color: #999999; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <img src="${EMAIL_ASSETS_URL}/images/email-logo.png" alt="Local City Places" width="300" height="134" style="width: 300px; max-width: 100%; height: auto;" />
      </div>
      <div class="email-content">
        <h2>Sign in to your account</h2>
        <p>Click the button below to sign in to Local City Places.</p>
        <div class="cta-button">
          <a href="${magicLink}">Sign In</a>
        </div>
        <p style="color: #999; font-size: 14px;">This link will expire in 3 days for security reasons.<br>If you didn't request this, you can safely ignore it.</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">Or copy and paste this link: <a href="${magicLink}" style="color: #007bff;">${magicLink}</a></p>
      </div>
      <div class="email-footer">
        <p><strong>Need help?</strong><br><a href="mailto:support@localcityplaces.com">support@localcityplaces.com</a></p>
        <div class="footer-divider"></div>
        <p class="footer-legal">© 2025 Local City Places. All rights reserved.<br>954 E. County Down Drive, Chandler, AZ 85249</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Sign in to Local City Places

Click this link to sign in: ${magicLink}

This link will expire in 3 days for security reasons. If you didn't request this, you can safely ignore it.

Need help? support@localcityplaces.com

© 2025 Local City Places. All rights reserved.
954 E. County Down Drive, Chandler, AZ 85249`;

  return sendEmail({ to: email, subject, html, text });
}

// Welcome email for admin-created accounts
export async function sendWelcomeEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const magicLink = `${APP_URL}/api/auth/verify?token=${token}`;

  const subject = "Welcome to Local City Places";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to Local City Places</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #f9fafb;
    }
    .email-wrapper {
      width: 100%;
      background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
      padding: 48px 20px;
    }
    .email-container {
      max-width: 700px;
      margin: 0 auto;
      background-color: transparent;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .email-header {
      background: #ffffff;
      padding: 24px 32px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .email-header h1 {
      color: #000000;
      margin: 0;
      font-size: 32px;
      font-weight: 300;
      letter-spacing: 0.5px;
    }
    .email-content {
      background-color: #ffffff;
      padding: 40px 32px;
    }
    .email-content h2 {
      color: #1e293b;
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 700;
    }
    .email-content p {
      color: #334155;
      line-height: 1.6;
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .info-box {
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      background-color: #e8f4f8;
      border-left: 4px solid #007bff;
    }
    .info-box p {
      color: #333;
      font-size: 14px;
      margin: 0;
    }
    .details-box {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .details-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .details-box .label {
      color: #333;
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .details-box .value {
      color: #666;
    }
    .cta-button {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button a {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
    }
    .email-footer {
      background: #ffffff;
      padding: 32px 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .email-footer p {
      color: #666666;
      font-size: 14px;
      margin: 0 0 12px 0;
      line-height: 1.6;
    }
    .email-footer a {
      color: #2563eb;
      text-decoration: underline;
    }
    .footer-divider {
      width: 40px;
      height: 1px;
      background: #e2e8f0;
      margin: 20px auto;
    }
    .footer-legal {
      font-size: 12px;
      color: #999999;
      margin-top: 20px;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 24px 12px;
      }
      .email-content {
        padding: 32px 24px;
      }
      .email-header {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <img src="${EMAIL_ASSETS_URL}/images/email-logo.png" alt="Local City Places" width="300" height="134" style="width: 300px; max-width: 100%; height: auto;" />
      </div>

      <!-- Content -->
      <div class="email-content">
        <h2>Welcome to Local City Places!</h2>
        <p>Hi there,</p>
        <p>An administrator has created a Member account for you on Local City Places. Click the button below to sign in and access your account.</p>

        <div class="details-box">
          <p class="label">Account Details:</p>
          <p class="value">Email: ${email}</p>
          <p class="value">Account Type: Member</p>
        </div>

        <div class="cta-button">
          <a href="${magicLink}">Sign In to Your Account</a>
        </div>

        <p style="color: #999; font-size: 14px;">This link will expire in 3 days for security reasons.<br>If you didn't expect this email, you can safely ignore it.</p>

        <p style="color: #666; font-size: 14px; margin-top: 20px;">Or copy and paste this link: <a href="${magicLink}" style="color: #007bff;">${magicLink}</a></p>

        <div class="info-box">
          <p><strong>What's a Magic Link?</strong> You'll never need a password to sign in. Just enter your email at login, and we'll send you a secure link like this one to access your account instantly.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <p>
          <strong>Need help?</strong><br>
          <a href="mailto:support@localcityplaces.com">support@localcityplaces.com</a>
        </p>

        <div class="footer-divider"></div>

        <p class="footer-legal">
          © 2025 Local City Places. All rights reserved.<br>
          954 E. County Down Drive, Chandler, AZ 85249
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Welcome to Local City Places!

Hi there,

An administrator has created a Member account for you on Local City Places.
Click the link below to sign in and access your account.

Account Details:
- Email: ${email}
- Account Type: Member

Sign In: ${magicLink}

This link will expire in 3 days for security reasons. If you didn't expect this email, you can safely ignore it.

What's a Magic Link? You'll never need a password to sign in. Just enter your email at login, and we'll send you a secure link like this one to access your account instantly.

Need help? support@localcityplaces.com

© 2025 Local City Places. All rights reserved.
954 E. County Down Drive, Chandler, AZ 85249`;

  return sendEmail({ to: email, subject, html, text });
}

interface MerchantRequestConfirmationEmailOptions {
  email: string;
  ownerName: string;
  businessName: string;
  requestedCategory: string;
  city: string;
  state: string;
  createdAt: Date;
}

const MERCHANT_REQUEST_ADMIN_RECIPIENTS = [
  "troy@localcityplaces.com",
  "cartersteinhoff@gmail.com",
];

export async function sendMerchantRequestConfirmationEmail({
  email,
  ownerName,
  businessName,
  requestedCategory,
  city,
  state,
  createdAt,
}: MerchantRequestConfirmationEmailOptions): Promise<boolean> {
  const safeOwnerName = escapeHtml(ownerName || businessName);
  const safeBusinessName = escapeHtml(businessName);
  const safeRequestedCategory = escapeHtml(requestedCategory);
  const market = [city, state].filter(Boolean).join(", ");
  const safeMarket = escapeHtml(market);
  const receivedAt = formatRequestTimestamp(createdAt);

  const subject = "We received your Phoenix Metro 250 request";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>We received your Phoenix Metro 250 request</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f9fafb; }
    .email-wrapper { width: 100%; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); padding: 48px 20px; }
    .email-container { max-width: 680px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18); }
    .email-header { background: #ffffff; padding: 24px 32px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .email-content { background-color: #ffffff; padding: 40px 32px; }
    .eyebrow { color: #f97316; font-size: 13px; font-weight: 800; letter-spacing: 0.14em; margin: 0 0 12px; text-transform: uppercase; }
    .email-content h1 { color: #0f172a; margin: 0 0 16px; font-size: 28px; line-height: 1.2; font-weight: 800; }
    .email-content p { color: #334155; line-height: 1.6; margin: 0 0 16px; font-size: 16px; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: 0; }
    .detail-label { color: #64748b; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 3px; }
    .detail-value { color: #0f172a; font-size: 16px; font-weight: 700; margin: 0; }
    .notice-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 6px; padding: 16px; margin: 24px 0; }
    .notice-box p { color: #7c2d12; margin: 0; font-size: 15px; }
    .email-footer { background: #ffffff; padding: 28px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .email-footer p { color: #666666; font-size: 14px; margin: 0 0 12px 0; line-height: 1.6; }
    .email-footer a { color: #2563eb; text-decoration: underline; }
    .footer-divider { width: 40px; height: 1px; background: #e2e8f0; margin: 20px auto; }
    .footer-legal { font-size: 12px; color: #999999; margin-top: 20px; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 24px 12px; }
      .email-content { padding: 32px 24px; }
      .email-header { padding: 24px 20px; }
      .email-content h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <img src="${EMAIL_ASSETS_URL}/images/email-logo.png" alt="Local City Places" width="300" height="134" style="width: 300px; max-width: 100%; height: auto;" />
      </div>
      <div class="email-content">
        <p class="eyebrow">Phoenix Metro 250 Selection</p>
        <h1>We received your request.</h1>
        <p>Hi ${safeOwnerName},</p>
        <p>Thanks for submitting <strong>${safeBusinessName}</strong> for review. Your request has been received and the timestamp below now marks when it entered the category review queue.</p>

        <div class="details-box">
          <div class="detail-row">
            <p class="detail-label">Business</p>
            <p class="detail-value">${safeBusinessName}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Requested category</p>
            <p class="detail-value">${safeRequestedCategory}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Market</p>
            <p class="detail-value">${safeMarket}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Received</p>
            <p class="detail-value">${receivedAt}</p>
          </div>
        </div>

        <div class="notice-box">
          <p><strong>Timestamp rule:</strong> Categories are reviewed in the order requests are received for each city and category.</p>
        </div>

        <p>There is no cost to request and no obligation. Submitting this form does not guarantee selection or category assignment.</p>
        <p>If selected, fulfillment begins first. That can include category review, merchant page preparation, audio assets, and then a Merchant Dashboard invite when everything is ready to activate.</p>
        <p>If we need anything else, we will follow up using the contact information from your request.</p>
      </div>
      <div class="email-footer">
        <p><strong>Need help?</strong><br><a href="mailto:support@localcityplaces.com">support@localcityplaces.com</a></p>
        <div class="footer-divider"></div>
        <p class="footer-legal">© 2026 Local City Places. All rights reserved.<br>954 E. County Down Drive, Chandler, AZ 85249</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `We received your Phoenix Metro 250 request

Hi ${ownerName || businessName},

Thanks for submitting ${businessName} for review. Your request has been received and the timestamp below now marks when it entered the category review queue.

Business: ${businessName}
Requested category: ${requestedCategory}
Market: ${market}
Received: ${receivedAt}

Timestamp rule: Categories are reviewed in the order requests are received for each city and category.

There is no cost to request and no obligation. Submitting this form does not guarantee selection or category assignment.

If selected, fulfillment begins first. That can include category review, merchant page preparation, audio assets, and then a Merchant Dashboard invite when everything is ready to activate.

If we need anything else, we will follow up using the contact information from your request.

Need help? support@localcityplaces.com

© 2026 Local City Places. All rights reserved.
954 E. County Down Drive, Chandler, AZ 85249`;

  return sendEmail({ to: email, subject, html, text });
}

interface MerchantRequestAdminNotificationEmailOptions {
  recipients?: string[];
  ownerName: string;
  businessName: string;
  email: string;
  mobilePhone: string;
  website: string | null;
  businessAddress1: string;
  city: string;
  state: string;
  zipCode: string;
  requestedCategory: string;
  yearsInBusiness: number | null;
  shortDescription: string;
  logoUrl: string | null;
  photoUrls: string[] | null;
  createdAt: Date;
}

export async function sendMerchantRequestAdminNotificationEmail({
  recipients = MERCHANT_REQUEST_ADMIN_RECIPIENTS,
  ownerName,
  businessName,
  email,
  mobilePhone,
  website,
  businessAddress1,
  city,
  state,
  zipCode,
  requestedCategory,
  yearsInBusiness,
  shortDescription,
  logoUrl,
  photoUrls,
  createdAt,
}: MerchantRequestAdminNotificationEmailOptions): Promise<boolean> {
  const safeBusinessName = escapeHtml(businessName);
  const safeOwnerName = escapeHtml(ownerName);
  const safeEmail = escapeHtml(email);
  const safeMobilePhone = escapeHtml(mobilePhone);
  const safeWebsite = website ? escapeHtml(website) : "Not provided";
  const safeAddress = escapeHtml(
    `${businessAddress1}, ${city}, ${state} ${zipCode}`,
  );
  const safeRequestedCategory = escapeHtml(requestedCategory);
  const safeShortDescription = escapeHtml(shortDescription);
  const receivedAt = formatRequestTimestamp(createdAt);
  const adminUrl = `${APP_URL}/admin/merchant-requests`;
  const safeAdminUrl = escapeHtml(adminUrl);
  const photoCount = photoUrls?.length || 0;
  const subject = `New merchant request: ${businessName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New merchant request</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f9fafb; }
    .email-wrapper { width: 100%; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); padding: 48px 20px; }
    .email-container { max-width: 700px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18); }
    .email-header { background: #ffffff; padding: 24px 32px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .email-content { background-color: #ffffff; padding: 40px 32px; }
    .eyebrow { color: #f97316; font-size: 13px; font-weight: 800; letter-spacing: 0.14em; margin: 0 0 12px; text-transform: uppercase; }
    .email-content h1 { color: #0f172a; margin: 0 0 16px; font-size: 28px; line-height: 1.2; font-weight: 800; }
    .email-content p { color: #334155; line-height: 1.6; margin: 0 0 16px; font-size: 16px; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .detail-row:last-child { border-bottom: 0; }
    .detail-label { color: #64748b; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 3px; }
    .detail-value { color: #0f172a; font-size: 16px; font-weight: 700; margin: 0; }
    .description-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 6px; padding: 16px; margin: 24px 0; }
    .description-box p { color: #7c2d12; margin: 0; font-size: 15px; }
    .cta-button { text-align: center; margin: 30px 0; }
    .cta-button a { display: inline-block; background: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 700; }
    .email-footer { background: #ffffff; padding: 28px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .email-footer p { color: #666666; font-size: 14px; margin: 0 0 12px 0; line-height: 1.6; }
    .footer-legal { font-size: 12px; color: #999999; margin-top: 20px; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 24px 12px; }
      .email-content { padding: 32px 24px; }
      .email-header { padding: 24px 20px; }
      .email-content h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <img src="${EMAIL_ASSETS_URL}/images/email-logo.png" alt="Local City Places" width="300" height="134" style="width: 300px; max-width: 100%; height: auto;" />
      </div>
      <div class="email-content">
        <p class="eyebrow">Merchant Request Submitted</p>
        <h1>${safeBusinessName}</h1>
        <p>A merchant request was just submitted and is ready for admin review.</p>

        <div class="details-box">
          <div class="detail-row">
            <p class="detail-label">Owner</p>
            <p class="detail-value">${safeOwnerName}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Email</p>
            <p class="detail-value">${safeEmail}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Mobile phone</p>
            <p class="detail-value">${safeMobilePhone}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Requested category</p>
            <p class="detail-value">${safeRequestedCategory}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Address</p>
            <p class="detail-value">${safeAddress}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Website</p>
            <p class="detail-value">${safeWebsite}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Years in business</p>
            <p class="detail-value">${yearsInBusiness ?? "Not provided"}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Uploads</p>
            <p class="detail-value">Logo: ${logoUrl ? "Yes" : "No"} / Photos: ${photoCount}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">Received</p>
            <p class="detail-value">${receivedAt}</p>
          </div>
        </div>

        <div class="description-box">
          <p><strong>Submitted description:</strong><br>${safeShortDescription}</p>
        </div>

        <div class="cta-button">
          <a href="${safeAdminUrl}">Review Merchant Requests</a>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-legal">© 2026 Local City Places. All rights reserved.<br>954 E. County Down Drive, Chandler, AZ 85249</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `New merchant request submitted

Business: ${businessName}
Owner: ${ownerName}
Email: ${email}
Mobile phone: ${mobilePhone}
Requested category: ${requestedCategory}
Address: ${businessAddress1}, ${city}, ${state} ${zipCode}
Website: ${website || "Not provided"}
Years in business: ${yearsInBusiness ?? "Not provided"}
Uploads: Logo ${logoUrl ? "yes" : "no"} / Photos ${photoCount}
Received: ${receivedAt}

Submitted description:
${shortDescription}

Review merchant requests: ${adminUrl}`;

  const results = await Promise.all(
    recipients.map((recipient) =>
      sendEmail({ to: recipient, subject, html, text }),
    ),
  );

  return results.every(Boolean);
}

interface MerchantInviteEmailOptions {
  email: string;
  inviteUrl: string;
  expiresInDays: number;
}

export async function sendMerchantInviteEmail({
  email,
  inviteUrl,
  expiresInDays,
}: MerchantInviteEmailOptions): Promise<boolean> {
  const subject = "You're invited to join Local City Places as a merchant";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${EMAIL_ASSETS_URL}/images/email-logo.png" alt="Local City Places" width="300" height="134" style="width: 300px; max-width: 100%; height: auto;" />
      </div>
      <h2>Welcome, Partner!</h2>
      <p>You've been invited to join Local City Places as a merchant partner.</p>

      <p><strong>What happens next?</strong></p>
      <p style="color: #444;">
        Complete your registration, set up your business profile, and start
        getting discovered by local customers.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Complete Your Registration
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${inviteUrl}" style="color: #ff7a3c;">${inviteUrl}</a>
      </p>

      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        This invitation expires in ${expiresInDays} day${expiresInDays !== 1 ? "s" : ""}.
      </p>
    </div>
  `;

  const text = `Welcome, Partner!

You've been invited to join Local City Places as a merchant partner.

Complete your registration, set up your business profile, and start getting discovered by local customers.

Complete your registration: ${inviteUrl}

This invitation expires in ${expiresInDays} day${expiresInDays !== 1 ? "s" : ""}.`;

  return sendEmail({ to: email, subject, html, text });
}

interface MerchantWelcomeEmailOptions {
  email: string;
  businessName: string;
  loginUrl: string;
}

export async function sendMerchantWelcomeEmail({
  email,
  businessName,
  loginUrl,
}: MerchantWelcomeEmailOptions): Promise<boolean> {
  const subject = `Welcome to Local City Places, ${businessName}!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${EMAIL_ASSETS_URL}/images/email-logo.png" alt="Local City Places" width="300" height="134" style="width: 300px; max-width: 100%; height: auto;" />
      </div>
      <h1 style="color: #ff7a3c;">Welcome to Local City Places!</h1>
      <p>Hi there,</p>
      <p>Your merchant account for <strong>${businessName}</strong> has been created and is ready to go!</p>

      <p><strong>Getting Started:</strong></p>
      <ol style="color: #444; line-height: 1.8;">
        <li>Click the button below to access your dashboard</li>
        <li>Complete your business profile</li>
        <li>Review your public business page</li>
      </ol>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Access Your Dashboard
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${loginUrl}" style="color: #ff7a3c;">${loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

      <p style="color: #666; font-size: 14px;">
        Need help getting started? Reply to this email and our team will be happy to assist.
      </p>
    </div>
  `;

  const text = `Welcome to Local City Places!

Your merchant account for ${businessName} has been created and is ready to go!

Getting Started:
1. Click the link below to access your dashboard
2. Complete your business profile
3. Review your public business page

Access your dashboard: ${loginUrl}

Need help getting started? Reply to this email and our team will be happy to assist.`;

  return sendEmail({ to: email, subject, html, text });
}

interface SweepstakesPrizeEmailOptions {
  recipientEmail: string;
  recipientName: string;
  cycleName: string;
  prizeLabel: string;
  winnerTier: "grand_prize" | "tier1_match" | "tier2_match";
}

export async function sendSweepstakesPrizeEmail({
  recipientEmail,
  recipientName,
  cycleName,
  prizeLabel,
  winnerTier,
}: SweepstakesPrizeEmailOptions): Promise<boolean> {
  const subjectMap = {
    grand_prize: `You won the Favorite Merchant Sweepstakes`,
    tier1_match: `Your referral won and unlocked a matching prize`,
    tier2_match: `Your referral chain unlocked a matching prize`,
  } as const;

  const headlineMap = {
    grand_prize: "You are the grand-prize winner!",
    tier1_match: "You won the direct referral matching prize!",
    tier2_match: "You won the second-tier matching prize!",
  } as const;

  const bodyMap = {
    grand_prize: `Your entries for ${cycleName} were selected for the grand prize.`,
    tier1_match: `Someone you referred was selected as the grand-prize winner for ${cycleName}, so you also won the matching prize.`,
    tier2_match: `Someone in your referral chain was selected as the grand-prize winner for ${cycleName}, so you also won the second-tier matching prize.`,
  } as const;

  const dashboardUrl = `${APP_URL}/member`;
  const subject = subjectMap[winnerTier];
  const headline = headlineMap[winnerTier];
  const body = bodyMap[winnerTier];

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">${headline}</h1>
      <p>Hi ${recipientName},</p>
      <p>${body}</p>

      <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #9a3412; font-weight: bold; font-size: 18px;">Prize: ${prizeLabel}</p>
        <p style="margin: 8px 0 0 0; color: #c2410c;">Cycle: ${cycleName}</p>
      </div>

      <p>We&apos;ll follow up with next steps to confirm and claim your prize.</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Open Your Dashboard
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">If you have questions, reply to this email and our team will help you with the next step.</p>
    </div>
  `;

  const text = `${headline}

Hi ${recipientName},

${body}

Prize: ${prizeLabel}
Cycle: ${cycleName}

We will follow up with next steps to confirm and claim your prize.

Dashboard: ${dashboardUrl}`;

  return sendEmail({ to: recipientEmail, subject, html, text });
}

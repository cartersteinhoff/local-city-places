import * as postmark from "postmark";

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "team@localcityplaces.com";
const FROM_NAME = process.env.POSTMARK_FROM_NAME || "Local City Places";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// Always use production URL for email images (localhost not accessible from email clients)
const EMAIL_ASSETS_URL = "https://localcityplaces.com";

const client = process.env.POSTMARK_API_KEY
  ? new postmark.ServerClient(process.env.POSTMARK_API_KEY)
  : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  messageStream?: string;
}

export async function sendEmail({ to, subject, html, text, messageStream }: SendEmailOptions): Promise<boolean> {
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
      MessageStream: messageStream || process.env.POSTMARK_MESSAGE_STREAM || "outbound",
    });
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Simple sign-in email for existing users
export async function sendMagicLinkEmail(email: string, token: string): Promise<boolean> {
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
        <img src="${EMAIL_ASSETS_URL}/images/logo-horizontal.png" alt="Local City Places" style="max-width: 300px; height: auto;" />
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
export async function sendWelcomeEmail(email: string, token: string): Promise<boolean> {
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
        <img src="${EMAIL_ASSETS_URL}/images/logo-horizontal.png" alt="Local City Places" style="max-width: 300px; height: auto;" />
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

interface GrcIssuedEmailOptions {
  recipientEmail: string;
  recipientName?: string;
  merchantName: string;
  denomination: number;
  totalMonths: number;
  claimUrl: string;
}

export async function sendGrcIssuedEmail({
  recipientEmail,
  recipientName,
  merchantName,
  denomination,
  totalMonths,
  claimUrl,
}: GrcIssuedEmailOptions): Promise<boolean> {
  const greeting = recipientName ? `Hi ${recipientName}` : "Hi there";
  const monthlyRebate = Math.round(denomination / totalMonths);

  const subject = `${merchantName} sent you a $${denomination} Grocery Rebate Certificate!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">You've Received a GRC!</h1>
      <p>${greeting},</p>
      <p><strong>${merchantName}</strong> has sent you a Grocery Rebate Certificate worth <strong>$${denomination}</strong>.</p>

      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Certificate Value</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px;">$${denomination}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">From</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${merchantName}</td>
          </tr>
        </table>
      </div>

      <p><strong>How it works:</strong></p>
      <ol style="color: #444; line-height: 1.8; padding-left: 20px; margin: 8px 0;">
        <li>Click the button below to claim your GRC</li>
        <li>Choose your preferred grocery store</li>
        <li>Upload grocery receipts each month</li>
        <li>Get paid the full rebate amount!</li>
      </ol>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Claim Your GRC
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${claimUrl}" style="color: #ff7a3c;">${claimUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

      <p style="color: #999; font-size: 12px;">
        This GRC was sent to you by ${merchantName} through Local City Places.
        If you weren't expecting this, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `${greeting},

${merchantName} has sent you a $${denomination} Grocery Rebate Certificate!

Certificate Value: $${denomination}
From: ${merchantName}

How it works:
1. Click the link below to claim your GRC
2. Choose your preferred grocery store
3. Upload grocery receipts each month
4. Get paid the full rebate amount!

Claim your GRC: ${claimUrl}

This GRC was sent to you by ${merchantName} through Local City Places.`;

  return sendEmail({ to: recipientEmail, subject, html, text });
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
      <h1 style="color: #ff7a3c;">Local City Places</h1>
      <h2>Welcome, Partner!</h2>
      <p>You've been invited to join Local City Places as a merchant partner.</p>

      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #15803d; font-weight: bold;">
          FREE Trial Grocery Rebate Certificates Included!
        </p>
        <p style="margin: 8px 0 0 0; color: #166534; font-size: 14px;">
          Our team will set up your trial GRCs after you complete registration.
        </p>
      </div>

      <p><strong>What are Grocery Rebate Certificates?</strong></p>
      <p style="color: #444;">
        GRCs are a unique way to reward and retain your customers. When you give a customer a GRC,
        they receive monthly grocery rebates just for shopping at their local grocery store.
        It's a win-win: your customers love the rewards, and you build loyalty.
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
        This invitation expires in ${expiresInDays} day${expiresInDays !== 1 ? 's' : ''}.
      </p>
    </div>
  `;

  const text = `Welcome, Partner!

You've been invited to join Local City Places as a merchant partner.

FREE Trial Grocery Rebate Certificates Included!
Our team will set up your trial GRCs after you complete registration.

What are Grocery Rebate Certificates?
GRCs are a unique way to reward and retain your customers. When you give a customer a GRC, they receive monthly grocery rebates just for shopping at their local grocery store.

Complete your registration: ${inviteUrl}

This invitation expires in ${expiresInDays} day${expiresInDays !== 1 ? 's' : ''}.`;

  return sendEmail({ to: email, subject, html, text });
}

interface MerchantWelcomeEmailOptions {
  email: string;
  businessName: string;
  loginUrl: string;
  trialGrcCount: number;
  trialGrcDenomination: number;
}

export async function sendMerchantWelcomeEmail({
  email,
  businessName,
  loginUrl,
  trialGrcCount,
  trialGrcDenomination,
}: MerchantWelcomeEmailOptions): Promise<boolean> {
  const totalValue = trialGrcCount * trialGrcDenomination;

  const subject = `Welcome to Local City Places, ${businessName}!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">Welcome to Local City Places!</h1>
      <p>Hi there,</p>
      <p>Your merchant account for <strong>${businessName}</strong> has been created and is ready to go!</p>

      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #15803d; font-weight: bold; font-size: 18px;">
          You have ${trialGrcCount} FREE Trial GRCs ready to issue!
        </p>
        <p style="margin: 8px 0 0 0; color: #166534;">
          Each GRC is worth $${trialGrcDenomination} - that's $${totalValue.toLocaleString()} in total value for your customers.
        </p>
      </div>

      <p><strong>Getting Started:</strong></p>
      <ol style="color: #444; line-height: 1.8;">
        <li>Click the button below to access your dashboard</li>
        <li>Complete your business profile</li>
        <li>Start issuing GRCs to your customers</li>
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

You have ${trialGrcCount} FREE Trial GRCs ready to issue!
Each GRC is worth $${trialGrcDenomination} - that's $${totalValue.toLocaleString()} in total value for your customers.

Getting Started:
1. Click the link below to access your dashboard
2. Complete your business profile
3. Start issuing GRCs to your customers

Access your dashboard: ${loginUrl}

Need help getting started? Reply to this email and our team will be happy to assist.`;

  return sendEmail({ to: email, subject, html, text });
}

interface MerchantWelcomeNoTrialEmailOptions {
  email: string;
  businessName: string;
  loginUrl: string;
}

/**
 * Welcome email for merchants who onboard via invite link (no trial GRCs yet)
 */
export async function sendMerchantWelcomeNoTrialEmail({
  email,
  businessName,
  loginUrl,
}: MerchantWelcomeNoTrialEmailOptions): Promise<boolean> {
  const subject = `Welcome to Local City Places, ${businessName}!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">Welcome to Local City Places!</h1>
      <p>Hi there,</p>
      <p>Your merchant account for <strong>${businessName}</strong> has been created and is ready to go!</p>

      <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #1d4ed8; font-weight: bold;">
          Your Trial GRCs Are Coming!
        </p>
        <p style="margin: 8px 0 0 0; color: #1e40af; font-size: 14px;">
          Our team will contact you shortly to set up your free trial Grocery Rebate Certificates.
          We'll send you another email when they're ready to use.
        </p>
      </div>

      <p><strong>In the meantime:</strong></p>
      <ol style="color: #444; line-height: 1.8;">
        <li>Click the button below to access your dashboard</li>
        <li>Complete your business profile</li>
        <li>Explore the platform and see how GRCs work</li>
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

Your Trial GRCs Are Coming!
Our team will contact you shortly to set up your free trial Grocery Rebate Certificates.
We'll send you another email when they're ready to use.

In the meantime:
1. Click the link below to access your dashboard
2. Complete your business profile
3. Explore the platform and see how GRCs work

Access your dashboard: ${loginUrl}

Need help getting started? Reply to this email and our team will be happy to assist.`;

  return sendEmail({ to: email, subject, html, text });
}

interface TrialGrcsActivatedEmailOptions {
  email: string;
  businessName: string;
  loginUrl: string;
  trialGrcCount: number;
  trialGrcDenomination: number;
}

/**
 * Email sent when admin activates trial GRCs for a merchant
 */
export async function sendTrialGrcsActivatedEmail({
  email,
  businessName,
  loginUrl,
  trialGrcCount,
  trialGrcDenomination,
}: TrialGrcsActivatedEmailOptions): Promise<boolean> {
  const totalValue = trialGrcCount * trialGrcDenomination;

  const subject = `Your trial GRCs are ready, ${businessName}!`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">Your Trial GRCs Are Ready!</h1>
      <p>Hi there,</p>
      <p>Great news! Your free trial Grocery Rebate Certificates for <strong>${businessName}</strong> are now activated and ready to use.</p>

      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #15803d; font-weight: bold; font-size: 18px;">
          ${trialGrcCount} Trial GRCs @ $${trialGrcDenomination} each
        </p>
        <p style="margin: 8px 0 0 0; color: #166534;">
          That's $${totalValue.toLocaleString()} in total value to give to your customers!
        </p>
      </div>

      <p><strong>What's next?</strong></p>
      <ol style="color: #444; line-height: 1.8;">
        <li>Click the button below to access your dashboard</li>
        <li>Go to the "Issue GRC" section</li>
        <li>Enter a customer's email to send them a GRC</li>
        <li>Watch your customer engagement grow!</li>
      </ol>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Start Issuing GRCs
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${loginUrl}" style="color: #ff7a3c;">${loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

      <p style="color: #666; font-size: 14px;">
        Questions about how to use your GRCs? Reply to this email and our team will be happy to help.
      </p>
    </div>
  `;

  const text = `Your Trial GRCs Are Ready!

Great news! Your free trial Grocery Rebate Certificates for ${businessName} are now activated and ready to use.

${trialGrcCount} Trial GRCs @ $${trialGrcDenomination} each
That's $${totalValue.toLocaleString()} in total value to give to your customers!

What's next?
1. Click the link below to access your dashboard
2. Go to the "Issue GRC" section
3. Enter a customer's email to send them a GRC
4. Watch your customer engagement grow!

Start issuing GRCs: ${loginUrl}

Questions about how to use your GRCs? Reply to this email and our team will be happy to help.`;

  return sendEmail({ to: email, subject, html, text });
}

interface GrcActivatedEmailOptions {
  recipientEmail: string;
  recipientName: string;
  merchantName: string;
  denomination: number;
  totalMonths: number;
  groceryStore: string;
  dashboardUrl: string;
}

export async function sendGrcActivatedEmail({
  recipientEmail,
  recipientName,
  merchantName,
  denomination,
  totalMonths,
  groceryStore,
  dashboardUrl,
}: GrcActivatedEmailOptions): Promise<boolean> {
  const monthlyRebate = Math.round(denomination / totalMonths);

  const subject = `Welcome to Local City Places! Your GRC from ${merchantName} is active`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your GRC is Active</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f9fafb; }
    .email-wrapper { width: 100%; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); padding: 48px 20px; }
    .email-container { max-width: 700px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); }
    .email-header { background: #ffffff; padding: 24px 32px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .email-content { background-color: #ffffff; padding: 40px 32px; }
    .email-content h2 { color: #1e293b; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; }
    .email-content p { color: #334155; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px; }
    .details-box { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .details-box p { margin: 5px 0; font-size: 14px; color: #166534; }
    .details-box .label { font-weight: bold; color: #15803d; font-size: 16px; margin-bottom: 10px; }
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
        <img src="${EMAIL_ASSETS_URL}/images/logo-horizontal.png" alt="Local City Places" style="max-width: 300px; height: auto;" />
      </div>
      <div class="email-content">
        <h2>Welcome to Local City Places!</h2>
        <p>Hi ${recipientName},</p>
        <p>Your Grocery Rebate Certificate from <strong>${merchantName}</strong> is now active. Here's what you need to do each month to earn your rebate.</p>

        <div class="details-box">
          <p class="label">Your GRC Details</p>
          <p>Certificate Value: <strong>$${denomination}</strong></p>
          <p>Grocery Store: <strong>${groceryStore}</strong></p>
        </div>

        <p><strong>What to do each month:</strong></p>
        <ol style="color: #444; line-height: 1.8;">
          <li>Shop at <strong>${groceryStore}</strong> and spend at least $100</li>
          <li>Upload your grocery receipts to your dashboard</li>
          <li>Complete the monthly survey</li>
          <li>Receive your rebate!</li>
        </ol>

        <div class="cta-button">
          <a href="${dashboardUrl}">Go to Your Dashboard</a>
        </div>
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

  const text = `Welcome to Local City Places!

Hi ${recipientName},

Your Grocery Rebate Certificate from ${merchantName} is now active.

Your GRC Details:
- Certificate Value: $${denomination}
- Grocery Store: ${groceryStore}

What to do each month:
1. Shop at ${groceryStore} and spend at least $100
2. Upload your grocery receipts to your dashboard
3. Complete the monthly survey
4. Receive your rebate!

Go to your dashboard: ${dashboardUrl}

Need help? support@localcityplaces.com

© 2025 Local City Places. All rights reserved.
954 E. County Down Drive, Chandler, AZ 85249`;

  return sendEmail({ to: recipientEmail, subject, html, text });
}

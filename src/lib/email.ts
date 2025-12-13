import * as postmark from "postmark";

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "team@localcityplaces.com";
const FROM_NAME = process.env.POSTMARK_FROM_NAME || "Local City Places";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

export async function sendMagicLinkEmail(email: string, token: string): Promise<boolean> {
  const magicLink = `${APP_URL}/api/auth/verify?token=${token}`;

  const subject = "Sign in to Local City Places";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">Local City Places</h1>
      <p>Click the button below to sign in:</p>
      <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Sign In
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        This link expires in 15 minutes. If you didn't request this, you can ignore this email.
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: ${magicLink}
      </p>
    </div>
  `;
  const text = `Sign in to Local City Places\n\nClick this link to sign in: ${magicLink}\n\nThis link expires in 15 minutes.`;

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
            <td style="padding: 8px 0; color: #666;">Duration</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${totalMonths} months</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Monthly Rebate</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #22c55e;">~$${monthlyRebate}/month</td>
          </tr>
        </table>
      </div>

      <p><strong>How it works:</strong></p>
      <ol style="color: #444; line-height: 1.8;">
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
Duration: ${totalMonths} months
Monthly Rebate: ~$${monthlyRebate}/month

How it works:
1. Click the link below to claim your GRC
2. Choose your preferred grocery store
3. Upload grocery receipts each month
4. Get paid the full rebate amount!

Claim your GRC: ${claimUrl}

This GRC was sent to you by ${merchantName} through Local City Places.`;

  return sendEmail({ to: recipientEmail, subject, html, text });
}

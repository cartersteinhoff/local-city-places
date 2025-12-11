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

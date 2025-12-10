// Email service - placeholder for Postmark integration
// TODO: Replace with actual Postmark implementation

const FROM_EMAIL = "hello@localcityplaces.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  // TODO: Integrate with Postmark
  // For now, log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("=".repeat(50));
    console.log("EMAIL SENT (dev mode - not actually sent)");
    console.log("=".repeat(50));
    console.log(`To: ${to}`);
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`Subject: ${subject}`);
    console.log("-".repeat(50));
    console.log(text || html);
    console.log("=".repeat(50));
    return true;
  }

  // Production: Would use Postmark here
  // const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY!);
  // await client.sendEmail({ From: FROM_EMAIL, To: to, Subject: subject, HtmlBody: html, TextBody: text });

  console.warn("Email sending not configured for production");
  return false;
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

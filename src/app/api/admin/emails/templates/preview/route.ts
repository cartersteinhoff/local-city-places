import { NextRequest, NextResponse } from "next/server";
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
      case "grc-issued":
        html = generateGrcIssuedPreview(params);
        break;
      case "merchant-invite":
        html = generateMerchantInvitePreview(params);
        break;
      case "merchant-welcome":
        html = generateMerchantWelcomePreview(params);
        break;
      case "merchant-welcome-no-trial":
        html = generateMerchantWelcomeNoTrialPreview(params);
        break;
      case "trial-grcs-activated":
        html = generateTrialGrcsActivatedPreview(params);
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

function generateMagicLinkPreview(params: { email: string; token: string }) {
  const magicLink = `${APP_URL}/api/auth/verify?token=${params.token}`;

  return `<!DOCTYPE html>
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
        <img src="${APP_URL}/images/logo-horizontal.png" alt="Local City Places" style="max-width: 300px; height: auto;" />
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
}

function generateWelcomePreview(params: { email: string; token: string }) {
  const magicLink = `${APP_URL}/api/auth/verify?token=${params.token}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to Local City Places</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f9fafb; }
    .email-wrapper { width: 100%; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); padding: 48px 20px; }
    .email-container { max-width: 700px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); }
    .email-header { background: #ffffff; padding: 24px 32px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    .email-content { background-color: #ffffff; padding: 40px 32px; }
    .email-content h2 { color: #1e293b; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; }
    .email-content p { color: #334155; line-height: 1.6; margin: 0 0 16px 0; font-size: 16px; }
    .info-box { padding: 16px; border-radius: 8px; margin: 20px 0; background-color: #e8f4f8; border-left: 4px solid #007bff; }
    .info-box p { color: #333; font-size: 14px; margin: 0; }
    .details-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details-box p { margin: 5px 0; font-size: 14px; }
    .details-box .label { color: #333; font-weight: bold; margin-bottom: 10px; font-size: 16px; }
    .details-box .value { color: #666; }
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
        <img src="${APP_URL}/images/logo-horizontal.png" alt="Local City Places" style="max-width: 300px; height: auto;" />
      </div>
      <div class="email-content">
        <h2>Welcome to Local City Places!</h2>
        <p>Hi there,</p>
        <p>An administrator has created a Member account for you on Local City Places. Click the button below to sign in and access your account.</p>
        <div class="details-box">
          <p class="label">Account Details:</p>
          <p class="value">Email: ${params.email}</p>
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
      <div class="email-footer">
        <p><strong>Need help?</strong><br><a href="mailto:support@localcityplaces.com">support@localcityplaces.com</a></p>
        <div class="footer-divider"></div>
        <p class="footer-legal">© 2025 Local City Places. All rights reserved.<br>954 E. County Down Drive, Chandler, AZ 85249</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateGrcIssuedPreview(params: {
  recipientEmail: string;
  recipientName: string;
  merchantName: string;
  denomination: number;
  totalMonths: number;
  claimUrl: string;
}) {
  const greeting = params.recipientName ? `Hi ${params.recipientName}` : "Hi there";
  const monthlyRebate = Math.round(params.denomination / params.totalMonths);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've received a GRC!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">You've Received a Grocery Rebate Certificate (GRC)!</h1>
      <p>${greeting},</p>
      <p><strong>${params.merchantName}</strong> has sent you a Grocery Rebate Certificate worth <strong>$${params.denomination}</strong>.</p>

      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Certificate Value</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px;">$${params.denomination}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">From</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${params.merchantName}</td>
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
        <a href="${params.claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Claim Your GRC
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${params.claimUrl}" style="color: #ff7a3c;">${params.claimUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

      <p style="color: #999; font-size: 12px;">
        This GRC was sent to you by ${params.merchantName} through Local City Places.
        If you weren't expecting this, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateMerchantInvitePreview(params: {
  email: string;
  inviteUrl: string;
  expiresInDays: number;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to Local City Places</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
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
        <a href="${params.inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Complete Your Registration
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${params.inviteUrl}" style="color: #ff7a3c;">${params.inviteUrl}</a>
      </p>

      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        This invitation expires in ${params.expiresInDays} day${params.expiresInDays !== 1 ? "s" : ""}.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateMerchantWelcomePreview(params: {
  email: string;
  businessName: string;
  loginUrl: string;
  trialGrcCount: number;
  trialGrcDenomination: number;
}) {
  const totalValue = params.trialGrcCount * params.trialGrcDenomination;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Local City Places</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">Welcome to Local City Places!</h1>
      <p>Hi there,</p>
      <p>Your merchant account for <strong>${params.businessName}</strong> has been created and is ready to go!</p>

      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #15803d; font-weight: bold; font-size: 18px;">
          You have ${params.trialGrcCount} FREE Trial GRCs ready to issue!
        </p>
        <p style="margin: 8px 0 0 0; color: #166534;">
          Each GRC is worth $${params.trialGrcDenomination} - that's $${totalValue.toLocaleString()} in total value for your customers.
        </p>
      </div>

      <p><strong>Getting Started:</strong></p>
      <ol style="color: #444; line-height: 1.8;">
        <li>Click the button below to access your dashboard</li>
        <li>Complete your business profile</li>
        <li>Start issuing GRCs to your customers</li>
      </ol>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Access Your Dashboard
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${params.loginUrl}" style="color: #ff7a3c;">${params.loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

      <p style="color: #666; font-size: 14px;">
        Need help getting started? Reply to this email and our team will be happy to assist.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateMerchantWelcomeNoTrialPreview(params: {
  email: string;
  businessName: string;
  loginUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Local City Places</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">Welcome to Local City Places!</h1>
      <p>Hi there,</p>
      <p>Your merchant account for <strong>${params.businessName}</strong> has been created and is ready to go!</p>

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
        <a href="${params.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Access Your Dashboard
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${params.loginUrl}" style="color: #ff7a3c;">${params.loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

      <p style="color: #666; font-size: 14px;">
        Need help getting started? Reply to this email and our team will be happy to assist.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function generateTrialGrcsActivatedPreview(params: {
  email: string;
  businessName: string;
  loginUrl: string;
  trialGrcCount: number;
  trialGrcDenomination: number;
}) {
  const totalValue = params.trialGrcCount * params.trialGrcDenomination;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trial GRCs Are Ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff7a3c;">Your Trial GRCs Are Ready!</h1>
      <p>Hi there,</p>
      <p>Great news! Your free trial Grocery Rebate Certificates for <strong>${params.businessName}</strong> are now activated and ready to use.</p>

      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; color: #15803d; font-weight: bold; font-size: 18px;">
          ${params.trialGrcCount} Trial GRCs @ $${params.trialGrcDenomination} each
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
        <a href="${params.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a3c, #ff9f1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Start Issuing GRCs
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link: <a href="${params.loginUrl}" style="color: #ff7a3c;">${params.loginUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

      <p style="color: #666; font-size: 14px;">
        Questions about how to use your GRCs? Reply to this email and our team will be happy to help.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// Base email template for Local City Places
// Matches the current email design: dark gradient wrapper, logo header, white content

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface BaseTemplateConfig {
  preheaderText?: string;
  showUnsubscribe?: boolean;
  unsubscribeUrl?: string;
}

// Base CSS styles matching current email design
const baseStyles = `
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
  .email-content {
    background-color: #ffffff;
    padding: 40px 32px;
  }
  .email-content h1 {
    color: #1e293b;
    margin: 0 0 16px 0;
    font-size: 28px;
    font-weight: 700;
  }
  .email-content h2 {
    color: #1e293b;
    margin: 24px 0 16px 0;
    font-size: 24px;
    font-weight: 700;
  }
  .email-content h3 {
    color: #1e293b;
    margin: 20px 0 12px 0;
    font-size: 18px;
    font-weight: 600;
  }
  .email-content p {
    color: #334155;
    line-height: 1.6;
    margin: 0 0 16px 0;
    font-size: 16px;
  }
  .email-content ul, .email-content ol {
    color: #334155;
    line-height: 1.8;
    margin: 16px 0;
    padding-left: 24px;
  }
  .email-content li {
    margin-bottom: 8px;
    font-size: 16px;
  }
  .email-content a {
    color: #007bff;
    text-decoration: underline;
  }
  .email-content img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 16px 0;
  }
  .cta-button {
    text-align: center;
    margin: 30px 0;
  }
  .cta-button a {
    display: inline-block;
    background: #007bff;
    color: white !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
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
  .warning-box {
    padding: 16px;
    border-radius: 8px;
    margin: 20px 0;
    background-color: #fef3c7;
    border-left: 4px solid #f59e0b;
  }
  .warning-box p {
    color: #92400e;
    font-size: 14px;
    margin: 0;
  }
  .success-box {
    padding: 16px;
    border-radius: 8px;
    margin: 20px 0;
    background-color: #d1fae5;
    border-left: 4px solid #10b981;
  }
  .success-box p {
    color: #065f46;
    font-size: 14px;
    margin: 0;
  }
  .danger-box {
    padding: 16px;
    border-radius: 8px;
    margin: 20px 0;
    background-color: #fee2e2;
    border-left: 4px solid #ef4444;
  }
  .danger-box p {
    color: #991b1b;
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
  .unsubscribe-link {
    font-size: 12px;
    color: #999999;
    margin-top: 16px;
  }
  .unsubscribe-link a {
    color: #666666;
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
`;

/**
 * Wraps HTML content in the standard email template
 */
export function wrapInBaseTemplate(content: string, config: BaseTemplateConfig = {}): string {
  const {
    preheaderText = "",
    showUnsubscribe = false,
    unsubscribeUrl = `${APP_URL}/unsubscribe`,
  } = config;

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Local City Places</title>
  <style>
    ${baseStyles}
  </style>
</head>
<body>
  ${preheaderText ? `
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheaderText}
    ${"&nbsp;".repeat(100)}
  </div>
  ` : ""}

  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <img src="${APP_URL}/images/logo-horizontal.png" alt="Local City Places" style="max-width: 300px; height: auto;" />
      </div>
      <div class="email-content">
        ${content}
      </div>
      <div class="email-footer">
        <p><strong>Need help?</strong><br><a href="mailto:support@localcityplaces.com">support@localcityplaces.com</a></p>
        <div class="footer-divider"></div>
        <p class="footer-legal">&copy; ${currentYear} Local City Places. All rights reserved.<br>954 E. County Down Drive, Chandler, AZ 85249</p>
        ${showUnsubscribe ? `
        <p class="unsubscribe-link">
          <a href="${unsubscribeUrl}">Unsubscribe</a> from marketing emails
        </p>
        ` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Creates a styled CTA button
 */
export function createButton(text: string, url: string, style: "primary" | "secondary" = "primary"): string {
  const bgColor = style === "primary" ? "#007bff" : "#6c757d";
  return `
<div class="cta-button">
  <a href="${url}" style="background: ${bgColor};">${text}</a>
</div>`;
}

/**
 * Creates an info/alert box
 */
export function createAlertBox(
  message: string,
  type: "info" | "warning" | "success" | "danger" = "info",
  title?: string
): string {
  return `
<div class="${type}-box">
  ${title ? `<p><strong>${title}</strong></p>` : ""}
  <p>${message}</p>
</div>`;
}

/**
 * Creates a details/info box with label-value pairs
 */
export function createDetailList(details: Array<{ label: string; value: string }>): string {
  return `
<div class="details-box">
  ${details.map(item => `<p><span class="label">${item.label}:</span> <span class="value">${item.value}</span></p>`).join("")}
</div>`;
}

/**
 * Converts plain text to HTML with proper paragraph handling
 */
export function textToHtml(text: string): string {
  return text
    .split("\n\n")
    .map(paragraph => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

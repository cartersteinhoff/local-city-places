// Broadcast email sending via Postmark batch API
// Handles large recipient lists with 500-per-batch limit

import { wrapInBaseTemplate } from "./base-template";

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "team@localcityplaces.com";
const FROM_NAME = process.env.POSTMARK_FROM_NAME || "Local City Places";
const BROADCAST_STREAM = process.env.POSTMARK_BROADCAST_STREAM || "localcityplaces";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface BroadcastRecipient {
  email: string;
  name?: string;
  userId?: string;
  variables?: Record<string, string>;
}

export interface BroadcastEmailOptions {
  subject: string;
  htmlContent: string;
  recipients: BroadcastRecipient[];
  previewText?: string;
  campaignId?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
}

export interface BroadcastResult {
  batchId?: string;
  successCount: number;
  failures: Array<{ email: string; error: string }>;
  successes: Array<{ email: string; messageId: string }>;
}

/**
 * Sends broadcast emails to multiple recipients using Postmark batch API
 * Batches recipients into groups of 500 (Postmark limit)
 */
export async function sendBroadcastEmail({
  subject,
  htmlContent,
  recipients,
  previewText,
  campaignId,
  fromEmail = FROM_EMAIL,
  fromName = FROM_NAME,
  replyTo = FROM_EMAIL,
}: BroadcastEmailOptions): Promise<BroadcastResult> {
  if (!POSTMARK_API_KEY) {
    console.log("=".repeat(50));
    console.log("BROADCAST EMAIL (Postmark not configured - logging only)");
    console.log("=".repeat(50));
    console.log(`Subject: ${subject}`);
    console.log(`Recipients: ${recipients.length}`);
    console.log(`Campaign ID: ${campaignId || "none"}`);
    console.log("=".repeat(50));

    // Return mock success for dev
    return {
      successCount: recipients.length,
      failures: [],
      successes: recipients.map(r => ({ email: r.email, messageId: `mock-${Date.now()}` })),
    };
  }

  // Batch recipients into groups of 500 (Postmark limit)
  const batchSize = 500;
  const batches: BroadcastRecipient[][] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  const results: BroadcastResult = {
    successCount: 0,
    failures: [],
    successes: [],
  };

  // Send each batch
  for (const batch of batches) {
    try {
      const messages = batch.map((recipient) => {
        // Generate personalized unsubscribe URL
        const unsubscribeUrl = recipient.userId
          ? `${APP_URL}/unsubscribe?userId=${recipient.userId}`
          : `${APP_URL}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;

        // Personalize subject and content
        const personalizedSubject = personalizeContent(subject, recipient);
        const personalizedHtmlContent = personalizeContent(htmlContent, recipient);

        // Wrap in base template with unsubscribe link
        const wrappedHtml = wrapInBaseTemplate(personalizedHtmlContent, {
          preheaderText: previewText ? personalizeContent(previewText, recipient) : undefined,
          showUnsubscribe: true,
          unsubscribeUrl,
        });

        // Generate plain text version
        const textContent = htmlToText(personalizedHtmlContent);

        return {
          From: `${fromName} <${fromEmail}>`,
          To: recipient.email,
          Subject: personalizedSubject,
          HtmlBody: wrappedHtml,
          TextBody: textContent + `\n\n---\nTo unsubscribe: ${unsubscribeUrl}`,
          ReplyTo: replyTo,
          MessageStream: BROADCAST_STREAM,
          Tag: campaignId ? `campaign_${campaignId}` : undefined,
          Metadata: {
            campaign_id: campaignId || "",
            recipient_email: recipient.email,
            user_id: recipient.userId || "",
          },
          Headers: [
            {
              Name: "List-Unsubscribe",
              Value: `<${unsubscribeUrl}>`,
            },
            {
              Name: "List-Unsubscribe-Post",
              Value: "List-Unsubscribe=One-Click",
            },
          ],
        };
      });

      const response = await fetch("https://api.postmarkapp.com/email/batch", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": POSTMARK_API_KEY,
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Postmark batch send error:", error);

        // Mark all in this batch as failed
        batch.forEach((recipient) => {
          results.failures.push({
            email: recipient.email,
            error: "Batch send failed",
          });
        });
      } else {
        const data = await response.json();

        // Process individual results
        data.forEach(
          (result: { ErrorCode: number; MessageID?: string; Message?: string }, index: number) => {
            if (result.ErrorCode === 0 && result.MessageID) {
              results.successCount++;

              // Store the first MessageID as batchId if not set
              if (!results.batchId) {
                results.batchId = result.MessageID;
              }

              results.successes.push({
                email: batch[index].email,
                messageId: result.MessageID,
              });
            } else {
              results.failures.push({
                email: batch[index].email,
                error: result.Message || "Unknown error",
              });
            }
          }
        );
      }
    } catch (error) {
      console.error("Error sending batch:", error);

      // Mark all in this batch as failed
      batch.forEach((recipient) => {
        results.failures.push({
          email: recipient.email,
          error: "Network error",
        });
      });
    }
  }

  return results;
}

/**
 * Personalizes content with recipient variables
 * Supports: {{name}}, {{firstName}}, {{email}}, and custom variables
 */
function personalizeContent(content: string, recipient: BroadcastRecipient): string {
  let personalized = content;

  // Replace basic variables
  if (recipient.name) {
    personalized = personalized.replace(/\{\{name\}\}/g, recipient.name);
    personalized = personalized.replace(
      /\{\{firstName\}\}/g,
      recipient.name.split(" ")[0]
    );
  } else {
    // Fallback for missing name
    personalized = personalized.replace(/\{\{name\}\}/g, "there");
    personalized = personalized.replace(/\{\{firstName\}\}/g, "there");
  }

  personalized = personalized.replace(/\{\{email\}\}/g, recipient.email);

  // Replace custom variables
  if (recipient.variables) {
    Object.entries(recipient.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      personalized = personalized.replace(regex, value);
    });
  }

  return personalized;
}

/**
 * Converts HTML to plain text (basic version)
 */
function htmlToText(html: string): string {
  return html
    // Remove style and script tags with content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Convert links to text with URL
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Sends a single test email (for previewing campaigns)
 */
export async function sendTestEmail({
  to,
  subject,
  htmlContent,
  previewText,
}: {
  to: string;
  subject: string;
  htmlContent: string;
  previewText?: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await sendBroadcastEmail({
    subject: `[TEST] ${subject}`,
    htmlContent,
    recipients: [{ email: to, name: "Test Recipient" }],
    previewText,
  });

  if (result.successCount > 0) {
    return { success: true };
  } else {
    return { success: false, error: result.failures[0]?.error || "Unknown error" };
  }
}

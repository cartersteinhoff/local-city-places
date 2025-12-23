import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaignRecipients, emailCampaigns } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// Postmark webhook event types
interface PostmarkOpenEvent {
  RecordType: "Open";
  MessageID: string;
  Recipient: string;
  Tag: string;
  ReceivedAt: string;
  MessageStream: string;
  FirstOpen: boolean;
  UserAgent: string;
  Geo: {
    City: string;
    Country: string;
    Region: string;
    IP: string;
  };
}

interface PostmarkClickEvent {
  RecordType: "Click";
  MessageID: string;
  Recipient: string;
  Tag: string;
  ReceivedAt: string;
  MessageStream: string;
  ClickLocation: string;
  OriginalLink: string;
  UserAgent: string;
  Geo: {
    City: string;
    Country: string;
    Region: string;
    IP: string;
  };
}

interface PostmarkBounceEvent {
  RecordType: "Bounce";
  MessageID: string;
  Email: string;
  Tag: string;
  ReceivedAt: string;
  MessageStream: string;
  Type: string;
  TypeCode: number;
  Name: string;
  Description: string;
  BouncedAt: string;
  CanActivate: boolean;
  Subject: string;
  ServerID: number;
}

interface PostmarkSpamComplaintEvent {
  RecordType: "SpamComplaint";
  MessageID: string;
  Email: string;
  Tag: string;
  ReceivedAt: string;
  MessageStream: string;
  BouncedAt: string;
  Subject: string;
  ServerID: number;
}

interface PostmarkDeliveryEvent {
  RecordType: "Delivery";
  MessageID: string;
  Recipient: string;
  Tag: string;
  ReceivedAt: string;
  MessageStream: string;
  DeliveredAt: string;
}

type PostmarkWebhookEvent =
  | PostmarkOpenEvent
  | PostmarkClickEvent
  | PostmarkBounceEvent
  | PostmarkSpamComplaintEvent
  | PostmarkDeliveryEvent;

export async function POST(request: NextRequest) {
  try {
    const event: PostmarkWebhookEvent = await request.json();

    // Log for debugging (remove in production)
    console.log(`Postmark webhook received: ${event.RecordType}`, {
      messageId: event.MessageID,
      recordType: event.RecordType,
    });

    // Find the recipient record by Postmark message ID
    const [recipient] = await db
      .select({
        id: campaignRecipients.id,
        campaignId: campaignRecipients.campaignId,
        openedAt: campaignRecipients.openedAt,
        clickedAt: campaignRecipients.clickedAt,
        bouncedAt: campaignRecipients.bouncedAt,
      })
      .from(campaignRecipients)
      .where(eq(campaignRecipients.postmarkMessageId, event.MessageID))
      .limit(1);

    if (!recipient) {
      // Message ID not found - could be a transactional email, not a campaign
      // Return 200 to acknowledge receipt
      console.log(`Postmark webhook: Message ID ${event.MessageID} not found in campaign recipients`);
      return NextResponse.json({ status: "ok", message: "Not a campaign email" });
    }

    switch (event.RecordType) {
      case "Open": {
        // Only update if this is the first open (for unique opens count)
        if (!recipient.openedAt) {
          await db
            .update(campaignRecipients)
            .set({ openedAt: new Date(event.ReceivedAt) })
            .where(eq(campaignRecipients.id, recipient.id));

          // Update campaign unique opens count
          await updateCampaignStats(recipient.campaignId);
        }
        break;
      }

      case "Click": {
        // Only update if this is the first click (for unique clicks count)
        if (!recipient.clickedAt) {
          await db
            .update(campaignRecipients)
            .set({ clickedAt: new Date(event.ReceivedAt) })
            .where(eq(campaignRecipients.id, recipient.id));

          // Also mark as opened if not already (click implies open)
          if (!recipient.openedAt) {
            await db
              .update(campaignRecipients)
              .set({ openedAt: new Date(event.ReceivedAt) })
              .where(eq(campaignRecipients.id, recipient.id));
          }

          // Update campaign stats
          await updateCampaignStats(recipient.campaignId);
        }
        break;
      }

      case "Bounce": {
        const bounceEvent = event as PostmarkBounceEvent;
        await db
          .update(campaignRecipients)
          .set({
            bouncedAt: new Date(bounceEvent.BouncedAt),
            status: "bounced",
            errorMessage: `${bounceEvent.Type}: ${bounceEvent.Description}`,
          })
          .where(eq(campaignRecipients.id, recipient.id));

        // Update campaign bounce count
        await updateCampaignStats(recipient.campaignId);
        break;
      }

      case "SpamComplaint": {
        const spamEvent = event as PostmarkSpamComplaintEvent;
        await db
          .update(campaignRecipients)
          .set({
            bouncedAt: new Date(spamEvent.BouncedAt),
            status: "bounced",
            errorMessage: "Spam complaint",
          })
          .where(eq(campaignRecipients.id, recipient.id));

        // Update campaign stats
        await updateCampaignStats(recipient.campaignId);
        break;
      }

      case "Delivery": {
        // We already mark as sent when we send, but this confirms delivery
        // Could update status to "delivered" if you want more granularity
        console.log(`Postmark webhook: Email delivered to ${(event as PostmarkDeliveryEvent).Recipient}`);
        break;
      }

      default:
        console.log(`Postmark webhook: Unknown event type`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Postmark webhook error:", error);
    // Return 200 even on error to prevent Postmark from retrying
    // Log the error for investigation
    return NextResponse.json({ status: "error", message: "Internal error" });
  }
}

/**
 * Recalculate and update campaign statistics from recipient records
 */
async function updateCampaignStats(campaignId: string) {
  const [stats] = await db
    .select({
      totalSent: sql<number>`count(*) filter (where ${campaignRecipients.sentAt} is not null)`,
      uniqueOpens: sql<number>`count(*) filter (where ${campaignRecipients.openedAt} is not null)`,
      uniqueClicks: sql<number>`count(*) filter (where ${campaignRecipients.clickedAt} is not null)`,
      totalBounced: sql<number>`count(*) filter (where ${campaignRecipients.bouncedAt} is not null)`,
    })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  await db
    .update(emailCampaigns)
    .set({
      totalSent: Number(stats?.totalSent) || 0,
      uniqueOpens: Number(stats?.uniqueOpens) || 0,
      uniqueClicks: Number(stats?.uniqueClicks) || 0,
      totalBounced: Number(stats?.totalBounced) || 0,
      totalOpened: Number(stats?.uniqueOpens) || 0,
      totalClicked: Number(stats?.uniqueClicks) || 0,
      updatedAt: new Date(),
    })
    .where(eq(emailCampaigns.id, campaignId));
}

// Allow GET for webhook verification if needed
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Postmark webhook endpoint is active",
  });
}

/**
 * Script to set up Postmark webhooks for email tracking
 * Run with: npx tsx scripts/setup-postmark-webhooks.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://localcityplaces.com";
const BROADCAST_STREAM = process.env.POSTMARK_BROADCAST_STREAM || "localcityplaces";

async function setupWebhooks() {
  if (!POSTMARK_API_KEY) {
    console.error("❌ POSTMARK_API_KEY environment variable is required");
    process.exit(1);
  }

  const webhookUrl = `${APP_URL}/api/webhooks/postmark`;

  console.log("🔧 Setting up Postmark webhooks...");
  console.log(`   Stream: ${BROADCAST_STREAM}`);
  console.log(`   URL: ${webhookUrl}`);

  try {
    // Create webhook for the broadcast stream
    const response = await fetch(
      `https://api.postmarkapp.com/webhooks`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": POSTMARK_API_KEY,
        },
        body: JSON.stringify({
          Url: webhookUrl,
          MessageStream: BROADCAST_STREAM,
          HttpAuth: null, // Add { Username, Password } if you want basic auth
          HttpHeaders: [],
          Triggers: {
            Open: {
              Enabled: true,
              PostFirstOpenOnly: false, // Track all opens, not just first
            },
            Click: {
              Enabled: true,
            },
            Delivery: {
              Enabled: true,
            },
            Bounce: {
              Enabled: true,
              IncludeContent: false,
            },
            SpamComplaint: {
              Enabled: true,
              IncludeContent: false,
            },
            SubscriptionChange: {
              Enabled: false,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      // Check if webhook already exists
      if (error.ErrorCode === 701) {
        console.log("⚠️  Webhook already exists for this stream. Fetching existing webhooks...");
        await listWebhooks();
        return;
      }

      console.error("❌ Failed to create webhook:", error);
      process.exit(1);
    }

    const data = await response.json();
    console.log("✅ Webhook created successfully!");
    console.log(`   ID: ${data.ID}`);
    console.log(`   URL: ${data.Url}`);
    console.log(`   Triggers:`);
    console.log(`     - Open: ${data.Triggers?.Open?.Enabled ? "✓" : "✗"}`);
    console.log(`     - Click: ${data.Triggers?.Click?.Enabled ? "✓" : "✗"}`);
    console.log(`     - Delivery: ${data.Triggers?.Delivery?.Enabled ? "✓" : "✗"}`);
    console.log(`     - Bounce: ${data.Triggers?.Bounce?.Enabled ? "✓" : "✗"}`);
    console.log(`     - SpamComplaint: ${data.Triggers?.SpamComplaint?.Enabled ? "✓" : "✗"}`);
  } catch (error) {
    console.error("❌ Error setting up webhook:", error);
    process.exit(1);
  }
}

async function listWebhooks() {
  const response = await fetch(
    `https://api.postmarkapp.com/webhooks?MessageStream=${BROADCAST_STREAM}`,
    {
      headers: {
        Accept: "application/json",
        "X-Postmark-Server-Token": POSTMARK_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    console.error("❌ Failed to list webhooks");
    return;
  }

  const data = await response.json();
  console.log("\n📋 Existing webhooks:");

  if (!data.Webhooks || data.Webhooks.length === 0) {
    console.log("   No webhooks configured");
    return;
  }

  for (const webhook of data.Webhooks) {
    console.log(`\n   ID: ${webhook.ID}`);
    console.log(`   URL: ${webhook.Url}`);
    console.log(`   Stream: ${webhook.MessageStream}`);
    console.log(`   Triggers:`);
    console.log(`     - Open: ${webhook.Triggers?.Open?.Enabled ? "✓" : "✗"}`);
    console.log(`     - Click: ${webhook.Triggers?.Click?.Enabled ? "✓" : "✗"}`);
    console.log(`     - Bounce: ${webhook.Triggers?.Bounce?.Enabled ? "✓" : "✗"}`);
  }
}

setupWebhooks();

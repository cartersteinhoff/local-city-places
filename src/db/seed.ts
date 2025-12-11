import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, categories, members, merchants, grcs, surveys } from "./schema";
import { eq } from "drizzle-orm";

const ADMIN_USERS = [
  {
    email: "cartersteinhoff@gmail.com",
    firstName: "Carter",
    lastName: "Steinhoff",
    businessName: "Carter's Test Shop",
    city: "Denver",
  },
  {
    email: "troy@localcityplaces.com",
    firstName: "Troy",
    lastName: "Warren",
    businessName: "Troy's Local Business",
    city: "Boulder",
  },
];

// Create db connection for seed script
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const queryClient = postgres(connectionString);
const db = drizzle(queryClient);

const STARTER_CATEGORIES = [
  "Auto",
  "Dining",
  "Beauty",
  "Fitness",
  "Retail",
  "Home Services",
  "Health",
  "Entertainment",
];

async function seed() {
  console.log("Starting seed...");

  // Create starter categories first (needed for merchant profiles)
  for (const categoryName of STARTER_CATEGORIES) {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, categoryName))
      .limit(1);

    if (!existing) {
      await db.insert(categories).values({ name: categoryName });
      console.log(`Created category: ${categoryName}`);
    }
  }

  // Create admin users with member and merchant profiles
  for (const admin of ADMIN_USERS) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, admin.email))
      .limit(1);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      if (existingUser.role !== "admin") {
        await db
          .update(users)
          .set({ role: "admin" })
          .where(eq(users.id, existingUser.id));
        console.log(`Updated ${admin.email} to admin role`);
      } else {
        console.log(`Admin ${admin.email} already exists`);
      }
    } else {
      const [newUser] = await db.insert(users).values({
        email: admin.email,
        role: "admin",
      }).returning();
      userId = newUser.id;
      console.log(`Created admin user: ${admin.email}`);
    }

    // Create member profile if it doesn't exist
    const [existingMember] = await db
      .select()
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);

    if (!existingMember) {
      await db.insert(members).values({
        userId,
        firstName: admin.firstName,
        lastName: admin.lastName,
        city: admin.city,
        homeCity: admin.city,
      });
      console.log(`Created member profile for ${admin.email}`);
    }

    // Create merchant profile if it doesn't exist
    const [existingMerchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, userId))
      .limit(1);

    if (!existingMerchant) {
      // Get the first category for test merchant
      const [category] = await db.select().from(categories).limit(1);

      await db.insert(merchants).values({
        userId,
        businessName: admin.businessName,
        city: admin.city,
        categoryId: category?.id,
        verified: true,
      });
      console.log(`Created merchant profile for ${admin.email}`);
    }
  }

  // Create test survey and GRC for Troy's merchant
  const [troyUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "troy@localcityplaces.com"))
    .limit(1);

  if (troyUser) {
    const [troyMerchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, troyUser.id))
      .limit(1);

    if (troyMerchant) {
      // Create test survey if one doesn't exist
      const [existingSurvey] = await db
        .select()
        .from(surveys)
        .where(eq(surveys.merchantId, troyMerchant.id))
        .limit(1);

      if (!existingSurvey) {
        await db.insert(surveys).values({
          merchantId: troyMerchant.id,
          title: "Quick Questions",
          questions: [
            {
              id: "q1",
              type: "single_choice",
              question: "Have you visited our business before?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q2",
              type: "single_choice",
              question: "Would you recommend us to a friend?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q3",
              type: "single_choice",
              question: "Are you a local resident?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q4",
              type: "single_choice",
              question: "Do you shop at local businesses weekly?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q5",
              type: "single_choice",
              question: "Have you used a rebate program before?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q6",
              type: "single_choice",
              question: "Do you prefer shopping local over big box stores?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q7",
              type: "single_choice",
              question: "Would you be interested in exclusive member deals?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q8",
              type: "single_choice",
              question: "Do you follow local businesses on social media?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q9",
              type: "single_choice",
              question: "Have you written an online review for a local business?",
              options: ["Yes", "No"],
              required: true,
            },
            {
              id: "q10",
              type: "single_choice",
              question: "Would you refer friends to our rebate program?",
              options: ["Yes", "No"],
              required: true,
            },
          ],
          isActive: true,
        });
        console.log(`Created test survey for Troy's Local Business`);
      } else {
        console.log(`Test survey already exists for Troy's Local Business`);
      }

      // Check if a pending GRC already exists
      const [existingGrc] = await db
        .select()
        .from(grcs)
        .where(eq(grcs.merchantId, troyMerchant.id))
        .limit(1);

      if (!existingGrc) {
        const [newGrc] = await db.insert(grcs).values({
          merchantId: troyMerchant.id,
          denomination: 100,
          costPerCert: "35.00",
          monthsRemaining: 4,
          status: "pending",
          issuedAt: new Date(),
        }).returning();
        console.log(`Created test GRC: ${newGrc.id}`);
        console.log(`Claim URL: http://localhost:3000/claim/${newGrc.id}`);
      } else {
        console.log(`Test GRC already exists: ${existingGrc.id}`);
        console.log(`Claim URL: http://localhost:3000/claim/${existingGrc.id}`);
      }
    }
  }

  console.log("Seed completed!");
  process.exit(0);
}

// Separate function to create a new test GRC anytime
async function createTestGRC() {
  console.log("Creating test GRC...");

  const [troyUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "troy@localcityplaces.com"))
    .limit(1);

  if (!troyUser) {
    console.error("Troy user not found. Run seed first.");
    process.exit(1);
  }

  const [troyMerchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.userId, troyUser.id))
    .limit(1);

  if (!troyMerchant) {
    console.error("Troy merchant not found. Run seed first.");
    process.exit(1);
  }

  const [newGrc] = await db.insert(grcs).values({
    merchantId: troyMerchant.id,
    denomination: 100,
    costPerCert: "35.00",
    monthsRemaining: 4,
    status: "pending",
    issuedAt: new Date(),
  }).returning();

  console.log(`\n✅ Created test GRC!`);
  console.log(`   GRC ID: ${newGrc.id}`);
  console.log(`   From: Troy's Local Business`);
  console.log(`   Value: $${newGrc.denomination}`);
  console.log(`   Duration: ${newGrc.monthsRemaining} months`);
  console.log(`\n🔗 Share this link to claim:`);
  console.log(`   http://localhost:3000/claim/${newGrc.id}\n`);

  process.exit(0);
}

// Check command line args
const command = process.argv[2];
if (command === "grc") {
  createTestGRC().catch((error) => {
    console.error("Failed to create GRC:", error);
    process.exit(1);
  });
} else {
  seed().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}

import { config } from "dotenv";

config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories, members, merchants, surveys, users } from "./schema";

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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const queryClient = postgres(connectionString);
const db = drizzle(queryClient);

async function seed() {
  console.log("Starting seed...");

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
          .set({
            role: "admin",
            firstName: admin.firstName,
            lastName: admin.lastName,
          })
          .where(eq(users.id, existingUser.id));
        console.log(`Updated ${admin.email} to admin role`);
      } else {
        console.log(`Admin ${admin.email} already exists`);
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: admin.email,
          role: "admin",
          firstName: admin.firstName,
          lastName: admin.lastName,
        })
        .returning();
      userId = newUser.id;
      console.log(`Created admin user: ${admin.email}`);
    }

    const [existingMember] = await db
      .select()
      .from(members)
      .where(eq(members.userId, userId))
      .limit(1);

    if (!existingMember) {
      await db.insert(members).values({
        userId,
        city: admin.city,
        homeCity: admin.city,
      });
      console.log(`Created member profile for ${admin.email}`);
    }

    const [existingMerchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, userId))
      .limit(1);

    let merchantId: string;

    if (!existingMerchant) {
      const [category] = await db.select().from(categories).limit(1);

      const [newMerchant] = await db
        .insert(merchants)
        .values({
          userId,
          businessName: admin.businessName,
          city: admin.city,
          categoryId: category?.id,
          verified: true,
        })
        .returning();
      merchantId = newMerchant.id;
      console.log(`Created merchant profile for ${admin.email}`);
    } else {
      merchantId = existingMerchant.id;
    }

    const [existingSurvey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.merchantId, merchantId))
      .limit(1);

    if (!existingSurvey) {
      await db.insert(surveys).values({
        merchantId,
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
            question: "Would you be interested in exclusive member deals?",
            options: ["Yes", "No"],
            required: true,
          },
        ],
        isActive: true,
      });
      console.log(`Created test survey for ${admin.businessName}`);
    } else {
      console.log(`Test survey already exists for ${admin.businessName}`);
    }
  }

  console.log("Seed completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, categories } from "./schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "cartersteinhoff@gmail.com";

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

  // Create admin user
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (existingAdmin) {
    if (existingAdmin.role !== "admin") {
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.id, existingAdmin.id));
      console.log(`Updated ${ADMIN_EMAIL} to admin role`);
    } else {
      console.log(`Admin ${ADMIN_EMAIL} already exists`);
    }
  } else {
    await db.insert(users).values({
      email: ADMIN_EMAIL,
      role: "admin",
    });
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }

  // Create starter categories
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

  console.log("Seed completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

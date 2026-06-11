import { and, eq, or, type SQL } from "drizzle-orm";
import { db, merchantOwners, merchants } from "@/db";

export function merchantOwnerJoin(userId: string) {
  return and(
    eq(merchantOwners.merchantId, merchants.id),
    eq(merchantOwners.userId, userId),
  );
}

export function merchantOwnerWhere(userId: string): SQL {
  const condition = or(
    eq(merchants.userId, userId),
    eq(merchantOwners.userId, userId),
  );

  if (!condition) {
    throw new Error("Unable to build merchant owner condition");
  }

  return condition;
}

export async function getMerchantForUser(userId: string) {
  const [row] = await db
    .select({ merchant: merchants })
    .from(merchants)
    .leftJoin(merchantOwners, merchantOwnerJoin(userId))
    .where(merchantOwnerWhere(userId))
    .orderBy(merchants.businessName)
    .limit(1);

  return row?.merchant ?? null;
}

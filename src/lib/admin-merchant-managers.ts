import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db, merchantOwners, merchants, users } from "@/db";

export type MerchantManager = {
  id: string;
  email: string;
  role: "member" | "merchant" | "admin";
  name: string | null;
};

export function formatMerchantManager(
  row: typeof users.$inferSelect,
): MerchantManager {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ");

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: name || null,
  };
}

export async function getMerchantManagers(
  merchantId: string,
  legacyUserId?: string | null,
) {
  const ownerRows = await db
    .select({
      user: users,
    })
    .from(merchantOwners)
    .innerJoin(users, eq(merchantOwners.userId, users.id))
    .where(eq(merchantOwners.merchantId, merchantId))
    .orderBy(users.email);

  const owners = ownerRows.map((row) => formatMerchantManager(row.user));
  const ownerIds = new Set(owners.map((owner) => owner.id));

  if (legacyUserId && !ownerIds.has(legacyUserId)) {
    const [legacyUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, legacyUserId))
      .limit(1);

    if (legacyUser) {
      owners.unshift(formatMerchantManager(legacyUser));
    }
  }

  return owners;
}

export async function setMerchantManagers({
  merchantId,
  ownerUserIds,
  createdBy,
}: {
  merchantId: string;
  ownerUserIds: string[];
  createdBy: string;
}) {
  await db.transaction(async (tx) => {
    await tx
      .delete(merchantOwners)
      .where(eq(merchantOwners.merchantId, merchantId));

    await tx
      .delete(merchantOwners)
      .where(
        and(
          ne(merchantOwners.merchantId, merchantId),
          inArray(merchantOwners.userId, ownerUserIds),
        ),
      );

    await tx
      .update(merchants)
      .set({
        userId: sql`(
          select mo.user_id
          from merchant_owners mo
          where mo.merchant_id = ${merchants.id}
          order by mo.created_at asc
          limit 1
        )`,
        updatedAt: new Date(),
      })
      .where(
        and(
          ne(merchants.id, merchantId),
          inArray(merchants.userId, ownerUserIds),
        ),
      );

    await tx.insert(merchantOwners).values(
      ownerUserIds.map((userId) => ({
        merchantId,
        userId,
        createdBy,
      })),
    );

    await tx
      .update(merchants)
      .set({ userId: ownerUserIds[0], updatedAt: new Date() })
      .where(eq(merchants.id, merchantId));
  });
}

export async function addMerchantManager({
  merchantId,
  userId,
  createdBy,
}: {
  merchantId: string;
  userId: string;
  createdBy: string;
}) {
  await db.transaction(async (tx) => {
    await tx
      .delete(merchantOwners)
      .where(
        and(
          ne(merchantOwners.merchantId, merchantId),
          eq(merchantOwners.userId, userId),
        ),
      );

    await tx
      .update(merchants)
      .set({
        userId: sql`(
          select mo.user_id
          from merchant_owners mo
          where mo.merchant_id = ${merchants.id}
          order by mo.created_at asc
          limit 1
        )`,
        updatedAt: new Date(),
      })
      .where(and(ne(merchants.id, merchantId), eq(merchants.userId, userId)));

    const [existingOwner] = await tx
      .select({ id: merchantOwners.id })
      .from(merchantOwners)
      .where(
        and(
          eq(merchantOwners.merchantId, merchantId),
          eq(merchantOwners.userId, userId),
        ),
      )
      .limit(1);

    if (!existingOwner) {
      await tx.insert(merchantOwners).values({
        merchantId,
        userId,
        createdBy,
      });
    }

    const [merchant] = await tx
      .select({ userId: merchants.userId })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant?.userId) {
      await tx
        .update(merchants)
        .set({ userId, updatedAt: new Date() })
        .where(eq(merchants.id, merchantId));
    }
  });
}

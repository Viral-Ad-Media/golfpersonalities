import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { account, user } from "@/db/schema";

export const MIN_PASSWORD_LENGTH = 10;

/** True once at least one admin account exists. */
export async function hasAdmin() {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin")).limit(1);
  return Boolean(row);
}

/** Creates an admin, or promotes an existing user and resets their password. */
export async function upsertAdmin(email: string, name: string, password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  const normalized = email.trim().toLowerCase();
  const hash = await hashPassword(password);

  const [existing] = await db.select().from(user).where(eq(user.email, normalized));
  const userId = existing?.id ?? randomUUID();
  if (existing) {
    await db.update(user).set({ role: "admin", name, updatedAt: new Date() }).where(eq(user.id, userId));
  } else {
    await db.insert(user).values({ id: userId, email: normalized, name, role: "admin", emailVerified: true });
  }

  const [cred] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
  if (cred) {
    await db.update(account).set({ password: hash, updatedAt: new Date() }).where(eq(account.id, cred.id));
  } else {
    await db.insert(account).values({ id: randomUUID(), accountId: userId, providerId: "credential", userId, password: hash });
  }
}

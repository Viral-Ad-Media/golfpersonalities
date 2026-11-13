/**
 * Creates (or resets the password of) an admin user.
 *   npm run create-admin -- you@example.com "Your Name"
 * The password is read from the ADMIN_PASSWORD env var or prompted for.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { account, user } from "../src/db/schema";

async function main() {
  const [email, name = "Admin"] = process.argv.slice(2);
  if (!email) throw new Error('Usage: npm run create-admin -- you@example.com "Your Name"');

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Password (min 10 chars): ");
    rl.close();
  }
  if (password.length < 10) throw new Error("Password must be at least 10 characters");
  const hash = await hashPassword(password);

  const [existing] = await db.select().from(user).where(eq(user.email, email.toLowerCase()));
  const userId = existing?.id ?? randomUUID();
  if (existing) {
    await db.update(user).set({ role: "admin", name, updatedAt: new Date() }).where(eq(user.id, userId));
  } else {
    await db.insert(user).values({ id: userId, email: email.toLowerCase(), name, role: "admin", emailVerified: true });
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
  console.log(`Admin ready: ${email}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

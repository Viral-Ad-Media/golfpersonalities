/**
 * Creates (or resets the password of) an admin user.
 *   npm run create-admin -- you@example.com "Your Name"
 * The password is read from the ADMIN_PASSWORD env var or prompted for.
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { upsertAdmin } from "../src/lib/admin-user";

async function main() {
  const [email, name = "Admin"] = process.argv.slice(2);
  if (!email) throw new Error('Usage: npm run create-admin -- you@example.com "Your Name"');

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("Password (min 10 chars): ");
    rl.close();
  }
  await upsertAdmin(email, name, password);
  console.log(`Admin ready: ${email}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

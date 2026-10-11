// Usage: node scripts/hash-password.mjs '<password>'   (or omit to be prompted)
// Prints an AUTH_PASSWORD_HASH value (scrypt) for .env.
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

async function readPassword() {
  if (process.argv[2]) return process.argv[2];
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => rl.question("Password: ", (a) => (rl.close(), resolve(a))));
}

const password = await readPassword();
if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}
const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
const key = scryptSync(password, salt, 64, { N, r, p });
console.log(["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$"));

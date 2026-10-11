import fs from "node:fs";

export default function globalSetup() {
  if (!fs.existsSync(".next/standalone/server.js")) {
    throw new Error("Run `npm run build` before the E2E tests.");
  }
}

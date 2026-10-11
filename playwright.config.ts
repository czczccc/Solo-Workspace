import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// E2E runs against the production standalone build (`npm run build` first) with a throwaway database.
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "solo-e2e-"));
// scrypt hash of the test password in tests/e2e/helpers.ts (made with scripts/hash-password.mjs)
const E2E_HASH = process.env.E2E_PASSWORD_HASH ?? "scrypt$16384$8$1$e20pb9BwNBViBfK0q9QUHQ==$nOZ+xOuSc+iQm6RDT/lkh1xIVkzU87BP8tzadDpjBsd06j6601IUoxSTMYJa/8Zu3JpO5lew5ir1ejAPl+rRNw==";

const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions }, testIgnore: /mobile\.spec\.ts/ },
    { name: "iphone", use: { ...devices["iPhone 15"], browserName: "chromium", launchOptions }, testMatch: /mobile\.spec\.ts/ },
  ],
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: {
    command: "./scripts/start-standalone.sh",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: "3100",
      HOSTNAME: "127.0.0.1",
      AUTH_USERNAME: "admin",
      AUTH_PASSWORD_HASH: E2E_HASH,
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
      DATABASE_PATH: path.join(dataDir, "solo.db"),
      BACKUP_DIR: path.join(dataDir, "backups"),
      COOKIE_SECURE: "false",
      AUTO_BACKUP_HOURS: "0",
      TZ: "Asia/Shanghai",
    },
  },
});

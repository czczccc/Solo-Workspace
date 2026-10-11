import { expect, test } from "@playwright/test";
import { login, USER } from "./helpers";

test("protected pages redirect to login and APIs return 401", async ({ page, request }) => {
  await page.goto("/kanban");
  await expect(page).toHaveURL(/\/login\?next=%2Fkanban/);
  expect((await request.get("/api/export")).status()).toBe(401);
  expect((await request.get("/api/backup")).status()).toBe(401);
  expect((await request.get("/api/health")).status()).toBe(200);
});

test("rejects a wrong password and has no registration", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/注册|sign up/i)).toHaveCount(0);
  await page.getByLabel("用户名").fill(USER);
  await page.getByLabel("密码").fill("wrong-password");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "用户名或密码错误" })).toBeVisible();
});

test("logs in, returns to the requested page and logs out", async ({ page }) => {
  await login(page, "/projects");
  await expect(page).toHaveURL(/\/projects$/);
  const cookie = (await page.context().cookies()).find((c) => c.name === "sw_session");
  expect(cookie?.httpOnly).toBe(true);
  await page.goto("/settings");
  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

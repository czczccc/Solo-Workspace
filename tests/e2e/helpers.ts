import { expect, type Page } from "@playwright/test";

export const USER = "admin";
export const PASSWORD = "e2e-password-123";

export async function login(page: Page, next = "/") {
  await page.goto(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("用户名").fill(USER);
  await page.getByLabel("密码").fill(PASSWORD);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

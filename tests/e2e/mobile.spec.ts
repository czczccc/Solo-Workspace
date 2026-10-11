import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("phone layout: bottom tabs and one kanban column at a time", async ({ page }) => {
  await login(page);
  const tabbar = page.locator("nav.fixed");
  await expect(tabbar).toBeVisible();
  await page.screenshot({ path: "test-results/screens/mobile-dashboard.png", fullPage: true });
  await tabbar.getByRole("link", { name: "看板" }).click();
  await expect(page).toHaveURL(/\/kanban/);
  await expect(page.getByTestId("column-todo")).toBeVisible();
  await expect(page.getByTestId("column-doing")).toBeHidden();
  await page.getByRole("tab", { name: /进行中/ }).click();
  await expect(page.getByTestId("column-doing")).toBeVisible();
  await page.screenshot({ path: "test-results/screens/mobile-kanban.png", fullPage: true });
  await tabbar.getByRole("link", { name: "周报" }).click();
  await expect(page).toHaveURL(/\/review/);
  await page.screenshot({ path: "test-results/screens/mobile-review.png", fullPage: true });
  // No horizontal overflow on a phone.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

import { expect, test } from "@playwright/test";
import { login, uid } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("dashboard shows the three projects", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /今天专注/ })).toBeVisible();
  for (const name of ["AI Drama Overseas", "AI Science Content", "Free LLM API"]) {
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
  }
  await page.screenshot({ path: "test-results/screens/desktop-dashboard.png", fullPage: true });
});

test("task lifecycle: create on kanban, move, star, complete from dashboard, see it in the review", async ({ page }) => {
  const title = uid("剪辑第一集");
  await page.goto("/kanban");
  await page.getByRole("button", { name: "在待办新建任务" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("标题").fill(title);
  await dialog.getByLabel("项目", { exact: true }).selectOption({ label: "AI Drama Overseas" });
  await dialog.getByLabel("优先级").selectOption("high");
  await dialog.getByLabel("新子任务").fill("写分镜");
  await dialog.getByRole("button", { name: "添加子任务" }).click();
  await dialog.getByLabel("新子任务").fill("配音");
  await dialog.getByLabel("新子任务").press("Enter");
  await dialog.getByRole("button", { name: "创建" }).click();

  const card = page.getByTestId("task-card").filter({ hasText: title });
  await expect(page.getByTestId("column-todo").getByText(title)).toBeVisible();
  await expect(card.getByText("0/2")).toBeVisible();

  // Move to "进行中" with the card menu (works on touch screens too).
  await card.getByRole("button", { name: "任务操作" }).click();
  await page.getByRole("menuitem", { name: "进行中" }).click();
  await expect(page.getByTestId("column-doing").getByText(title)).toBeVisible();

  // Tick one subtask in the editor.
  await card.getByRole("button", { name: title }).click();
  await page.getByRole("dialog").getByLabel("完成 写分镜").click();
  await expect(page.getByRole("dialog").getByLabel("完成 写分镜")).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(card.getByText("1/2")).toBeVisible();
  await page.screenshot({ path: "test-results/screens/desktop-kanban.png", fullPage: true });

  // Filter by project and priority.
  await page.getByLabel("按项目筛选").selectOption({ label: "AI Science Content" });
  await expect(page).toHaveURL(/project=ai-science/);
  await expect(page.getByText(title)).toHaveCount(0);
  await page.getByLabel("按项目筛选").selectOption({ label: "AI Drama Overseas" });
  await page.getByLabel("按优先级筛选").selectOption("high");
  await expect(page.getByText(title)).toBeVisible();

  // Star it so it becomes today's focus.
  await page.getByTestId("task-card").filter({ hasText: title }).getByRole("button", { name: "设为今日重点" }).click();
  await expect(page.getByTestId("task-card").filter({ hasText: title }).getByRole("button", { name: "取消今日重点" })).toBeVisible();
  await page.goto("/");
  const focus = page.getByTestId("focus-list");
  await expect(focus.getByText(title)).toBeVisible();
  await focus.getByLabel(`完成 ${title}`).click();
  await expect(focus.getByText(title)).toHaveCount(0);

  await page.goto("/review");
  await expect(page.getByText(title)).toBeVisible();
});

test("drag and drop moves a card between columns on desktop", async ({ page }) => {
  const title = uid("拖拽");
  await page.goto("/kanban");
  await page.getByRole("button", { name: "在待办新建任务" }).click();
  await page.getByRole("dialog").getByLabel("标题").fill(title);
  await page.getByRole("dialog").getByRole("button", { name: "创建" }).click();
  const card = page.getByTestId("column-todo").getByTestId("task-card").filter({ hasText: title });
  await expect(card).toBeVisible();
  await card.dragTo(page.getByTestId("column-blocked"));
  await expect(page.getByTestId("column-blocked").getByText(title)).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("column-blocked").getByText(title)).toBeVisible();
});

test("inbox idea becomes a task", async ({ page }) => {
  const idea = uid("做一个 API 状态页");
  await page.getByLabel("快速记录").fill(idea);
  await page.getByLabel("快速记录").press("Enter");
  await expect(page.getByText("已放入收集箱")).toBeVisible();

  await page.goto("/inbox");
  const item = page.getByTestId("inbox-list").locator("li").filter({ hasText: idea });
  await item.getByRole("button", { name: "转任务" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("项目").selectOption({ label: "Free LLM API" });
  await dialog.getByRole("button", { name: "转为任务" }).click();
  await expect(page.getByTestId("inbox-list").getByText(idea)).toHaveCount(0);

  await page.goto("/kanban?project=free-llm-api");
  await expect(page.getByTestId("column-todo").getByText(idea)).toBeVisible();
});

test("project milestones and weekly review numbers persist", async ({ page }) => {
  await page.goto("/projects/ai-science");
  await page.getByLabel("里程碑标题").fill("日更 30 天");
  await page.getByRole("button", { name: "添加", exact: true }).click();
  await expect(page.getByText("日更 30 天")).toBeVisible();

  await page.goto("/review");
  await page.getByLabel("收入").first().fill("1,200.50");
  await page.getByLabel("成本").first().fill("200");
  await page.getByLabel("AI Science Content 产出").fill("发布 5 条视频");
  await page.getByLabel("本周亮点").fill("第一条视频破万播放");
  await page.getByRole("button", { name: "保存周报" }).click();
  await expect(page.getByText("周报已保存")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("total-利润")).toContainText("1,000.5");
  await expect(page.getByLabel("本周亮点")).toHaveValue("第一条视频破万播放");
  await expect(page.getByText("历史周报")).toBeVisible();
  await page.screenshot({ path: "test-results/screens/desktop-review.png", fullPage: true });
});

test("export, backup and theme", async ({ page }) => {
  const exp = await page.request.get("/api/export");
  expect(exp.status()).toBe(200);
  const body = await exp.json();
  expect(body.app).toBe("solo-workspace");
  expect(body.data.projects).toHaveLength(3);

  const bk = await page.request.get("/api/backup");
  expect(bk.status()).toBe(200);
  expect((await bk.body()).subarray(0, 15).toString()).toBe("SQLite format 3");

  await page.goto("/settings");
  await page.getByRole("radio", { name: "暗色" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/");
  await page.screenshot({ path: "test-results/screens/desktop-dashboard-dark.png", fullPage: true });
  await page.goto("/settings");
  await page.getByRole("radio", { name: "亮色" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("PWA manifest and iOS meta are served", async ({ page }) => {
  const res = await page.request.get("/manifest.webmanifest");
  const manifest = await res.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"], meta[name="mobile-web-app-capable"]')).not.toHaveCount(0);
  expect((await page.request.get("/sw.js")).status()).toBe(200);
});

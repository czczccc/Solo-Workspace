import { count } from "drizzle-orm";
import type { DB } from "./index";
import { projects } from "./schema";

export const DEFAULT_PROJECTS = [
  {
    slug: "ai-drama",
    name: "AI Drama Overseas",
    description: "海外 AI 短剧制作与发布",
    goal: "稳定产出 AI 短剧并在海外平台持续发布、积累粉丝与收入",
    color: "#ec4899",
    sortOrder: 0,
  },
  {
    slug: "ai-science",
    name: "AI Science Content",
    description: "抖音 AI 科普视频运营",
    goal: "保持稳定更新节奏，提升播放与粉丝增长",
    color: "#0ea5e9",
    sortOrder: 1,
  },
  {
    slug: "free-llm-api",
    name: "Free LLM API",
    description: "免费模型 API 服务",
    goal: "保证服务稳定可用，增长活跃用户并控制成本",
    color: "#22c55e",
    sortOrder: 2,
  },
];

/** Insert the three default projects into an empty database. */
export function seedDefaults(db: DB) {
  const [{ n }] = db.select({ n: count() }).from(projects).all();
  if (n > 0) return;
  db.insert(projects).values(DEFAULT_PROJECTS).run();
}

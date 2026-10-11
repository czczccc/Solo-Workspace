import type { Milestone } from "@/lib/db/schema";
import type { TaskWithMeta } from "@/lib/data/tasks";

export type ProjectOption = { id: number; name: string; color: string };
export type MilestoneOption = Pick<Milestone, "id" | "projectId" | "title" | "status">;
export type { TaskWithMeta };

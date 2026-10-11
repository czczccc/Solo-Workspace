import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const TASK_STATUSES = ["todo", "doing", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const MILESTONE_STATUSES = ["planned", "active", "done"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const INBOX_STATUSES = ["open", "converted", "archived"] as const;
export type InboxStatus = (typeof INBOX_STATUSES)[number];

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  goal: text("goal").notNull().default(""),
  color: text("color").notNull().default("#6366f1"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const milestones = sqliteTable(
  "milestones",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    dueDate: text("due_date"),
    status: text("status", { enum: MILESTONE_STATUSES })
      .notNull()
      .default("planned"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (t) => [index("milestones_project_idx").on(t.projectId)],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    milestoneId: integer("milestone_id").references(() => milestones.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: TASK_STATUSES }).notNull().default("todo"),
    priority: text("priority", { enum: TASK_PRIORITIES })
      .notNull()
      .default("medium"),
    dueDate: text("due_date"),
    isFocus: integer("is_focus", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("tasks_status_sort_idx").on(t.status, t.sortOrder),
    index("tasks_project_idx").on(t.projectId),
    index("tasks_due_idx").on(t.dueDate),
    index("tasks_completed_idx").on(t.completedAt),
  ],
);

export const subtasks = sqliteTable(
  "subtasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("subtasks_task_idx").on(t.taskId)],
);

export const inboxItems = sqliteTable("inbox_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  status: text("status", { enum: INBOX_STATUSES }).notNull().default("open"),
  taskId: integer("task_id").references(() => tasks.id, {
    onDelete: "set null",
  }),
  createdAt: createdAt(),
  processedAt: integer("processed_at", { mode: "timestamp" }),
});

export const weeklyReviews = sqliteTable("weekly_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start").notNull().unique(),
  highlights: text("highlights").notNull().default(""),
  lessons: text("lessons").notNull().default(""),
  nextFocus: text("next_focus").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const weeklyProjectMetrics = sqliteTable(
  "weekly_project_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reviewId: integer("review_id")
      .notNull()
      .references(() => weeklyReviews.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    outputs: text("outputs").notNull().default(""),
    revenueCents: integer("revenue_cents").notNull().default(0),
    costCents: integer("cost_cents").notNull().default(0),
  },
  (t) => [uniqueIndex("metrics_review_project_uq").on(t.reviewId, t.projectId)],
);

export type Project = typeof projects.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Subtask = typeof subtasks.$inferSelect;
export type InboxItem = typeof inboxItems.$inferSelect;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;
export type WeeklyProjectMetric = typeof weeklyProjectMetrics.$inferSelect;

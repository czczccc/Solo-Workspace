import type { InboxStatus, MilestoneStatus, TaskPriority, TaskStatus } from "@/lib/db/schema";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "待办",
  doing: "进行中",
  blocked: "阻塞",
  done: "完成",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

export const PRIORITY_CLASS: Record<TaskPriority, string> = {
  urgent: "bg-destructive/15 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
};

export const MILESTONE_LABEL: Record<MilestoneStatus, string> = {
  planned: "计划中",
  active: "进行中",
  done: "已完成",
};

export const INBOX_LABEL: Record<InboxStatus, string> = {
  open: "待处理",
  converted: "已转任务",
  archived: "已归档",
};

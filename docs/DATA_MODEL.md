# 数据模型

SQLite + Drizzle ORM，定义见 `src/lib/db/schema.ts`，迁移在 `drizzle/`。所有 id 为自增整数；时间为 Unix 秒（`integer`，mode timestamp）；纯日期（截止日、周一）为 `YYYY-MM-DD` 文本，按服务器时区（`TZ`）解释；金额以“分”为单位的整数。

```
projects 1──* milestones
projects 1──* tasks *──1 milestones (可空)
tasks    1──* subtasks
projects 1──* inbox_items (可空) ──1 tasks (转换后)
weekly_reviews 1──* weekly_project_metrics *──1 projects
```

## projects
| 列 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| slug | text unique | URL 标识 |
| name | text | |
| description | text | |
| goal | text | 阶段目标 |
| color | text | 色标（hex） |
| archived | bool | 归档后不在筛选/看板出现 |
| sort_order | int | |
| created_at / updated_at | int | |

## milestones
| 列 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| project_id | int FK → projects (cascade) | |
| title | text | |
| due_date | text? | YYYY-MM-DD |
| status | text | `planned` / `active` / `done` |
| sort_order | int | |
| created_at / completed_at | int / int? | |

## tasks
| 列 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| project_id | int? FK → projects (set null) | |
| milestone_id | int? FK → milestones (set null) | |
| title | text | |
| description | text | |
| status | text | `todo` / `doing` / `blocked` / `done` |
| priority | text | `urgent` / `high` / `medium` / `low` |
| due_date | text? | YYYY-MM-DD |
| is_focus | bool | 今日重点（标星） |
| sort_order | int | 列内排序 |
| completed_at | int? | 进入 done 时写入，离开时清空；周报据此统计 |
| created_at / updated_at | int | |

索引：`(status, sort_order)`、`(project_id)`、`(due_date)`、`(completed_at)`。

## subtasks
| 列 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| task_id | int FK → tasks (cascade) | |
| title | text | |
| done | bool | |
| sort_order | int | |

## inbox_items
| 列 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| content | text | |
| status | text | `open` / `converted` / `archived` |
| task_id | int? FK → tasks (set null) | 转换出的任务 |
| created_at / processed_at | int / int? | |

## weekly_reviews
| 列 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| week_start | text unique | 周一 YYYY-MM-DD |
| highlights | text | 本周亮点 |
| lessons | text | 问题与教训 |
| next_focus | text | 下周重点 |
| created_at / updated_at | int | |

## weekly_project_metrics
| 列 | 类型 | 说明 |
| --- | --- | --- |
| id | int PK | |
| review_id | int FK → weekly_reviews (cascade) | |
| project_id | int FK → projects (cascade) | |
| outputs | text | 本周产出 |
| revenue_cents | int | 收入（分） |
| cost_cents | int | 成本（分） |

唯一：`(review_id, project_id)`。

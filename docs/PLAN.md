# 实现计划与验收

每个阶段结束时运行 `npm run lint && npm run typecheck && npm test`，关键阶段加 E2E。

| 阶段 | 内容 | 测试 / 验收 |
| --- | --- | --- |
| P0 文档 | PRD、数据模型、计划 | 评审 |
| P1 基础 | Next.js 16 + TS + Tailwind 4 + CZ Design System（shadcn/ui 方式）；Drizzle schema、迁移、自动建库与种子数据 | 单测：迁移可在内存库运行，种子三项目 |
| P2 安全 | scrypt 密码校验、HMAC 会话、`proxy.ts` 拦截、登录页、限流、退出 | 单测：哈希/签名/过期/篡改/限流；E2E：未登录跳转、错误密码、登录成功 |
| P3 数据层 | tasks / projects / milestones / inbox / reviews 查询与 Server Actions（zod 校验 + 会话校验） | 单测：状态流转写 completed_at、今日重点、周统计、Inbox 转任务、周报 upsert |
| P4 页面 | 应用壳（侧边栏/底部导航）、Dashboard、Kanban、Projects、Weekly Review、Inbox、设置 | E2E：创建任务→看板换列→Dashboard 可见；Inbox 转任务；周报保存 |
| P5 PWA 与数据 | manifest、图标、iOS meta、Service Worker、离线页；主题；JSON 导出、备份下载、定时自动备份 | 单测：导出结构、备份文件生成；E2E：导出/备份接口 200 |
| P6 部署 | Dockerfile（standalone）、Compose + Caddy HTTPS、健康检查、部署文档 | `docker compose build`；容器内 `/api/health` 正常 |
| P7 验收 | 按 PRD §6 清单逐条验证，移动视口截图 | 验收记录写入 README |

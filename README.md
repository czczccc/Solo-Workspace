# Solo Workspace

单人、移动优先的创业工作台 PWA：每天打开就知道今天做什么、三个项目进展如何、这周完成了什么。

- **今日**：今日重点（标星或今天及之前到期的未完成任务）、快速记录、本周进度
- **看板**：待办 / 进行中 / 阻塞 / 完成，桌面拖拽、手机按列切换；项目与优先级筛选、截止日期、子任务
- **项目**：目标、里程碑、任务
- **周报**：自动汇总本周完成任务，按项目记录产出、收入、成本，写复盘
- **收集箱**：随手记录想法，一键转任务
- **设置**：亮色 / 暗色 / 跟随系统，JSON 导出，数据库备份下载（服务器同时定时自动备份）

技术栈：Next.js 16 App Router · TypeScript · Tailwind CSS 4 · [CZ Design System](https://github.com/czczccc/cz-design-system)（shadcn/ui 方式的 Radix 组件 + 设计 token，源码在 `src/design-system`）· SQLite + Drizzle ORM · Docker Compose + Caddy（自动 HTTPS）。

文档：[PRD](docs/PRD.md) · [数据模型](docs/DATA_MODEL.md) · [实现计划](docs/PLAN.md)

## 部署（Docker + HTTPS）

前提：一台有公网 IP 的服务器，已安装 Docker；域名 A 记录指向该服务器；80 和 443 端口开放。

```bash
git clone https://github.com/czczccc/Solo-Workspace.git && cd Solo-Workspace
cp .env.example .env

# 生成密码哈希，填入 .env 的 AUTH_PASSWORD_HASH（保留单引号）
docker run --rm -v "$PWD/scripts:/s" node:22-slim node /s/hash-password.mjs '你的强密码'
# 生成会话密钥，填入 SESSION_SECRET
openssl rand -base64 48
# 把 DOMAIN 改成你的域名

docker compose up -d --build
```

打开 `https://你的域名`，用 `AUTH_USERNAME` 和密码登录。Caddy 会自动申请并续期证书。

| 变量 | 说明 |
| --- | --- |
| `AUTH_USERNAME` / `AUTH_PASSWORD_HASH` | 唯一账号；哈希用 `scripts/hash-password.mjs` 生成。没有注册入口 |
| `SESSION_SECRET` | ≥ 32 字符，修改后所有设备需重新登录 |
| `DOMAIN` | Caddy 申请证书的域名 |
| `TZ` | “今天”和周一的判定时区，默认 `Asia/Shanghai` |
| `AUTO_BACKUP_HOURS` / `BACKUP_KEEP` | 自动备份间隔（小时，0 关闭）与保留份数 |
| `NEXT_PUBLIC_CURRENCY` | 周报货币，默认 `CNY` |

### 数据与备份

数据库在 Docker 卷 `solo-data` 的 `/data/solo.db`，自动备份在 `/data/backups`。

```bash
# 取出最新备份到当前目录
docker compose cp app:/data/backups ./backups
# 从备份恢复：停止应用，替换数据库后再启动
docker compose stop app
docker compose cp ./backups/solo-workspace-YYYYMMDD-HHMMSS.sqlite app:/data/solo.db
docker compose start app
```

设置页也可以直接下载 JSON 导出和数据库备份。

### 安装到手机和桌面

- **iPhone**：Safari 打开站点 → 分享 → 添加到主屏幕。以独立窗口运行，适配刘海与底部安全区。
- **Windows**：Edge / Chrome 地址栏点“安装应用”。

## 本地开发

```bash
npm install
cp .env.example .env.local   # 填 AUTH_PASSWORD_HASH 和 SESSION_SECRET，COOKIE_SECURE=false
npm run dev
```

| 命令 | 作用 |
| --- | --- |
| `npm run check` | lint + 类型检查 + 单元测试 |
| `npm run build && npm run test:e2e` | 生产构建后跑 Playwright E2E（桌面 + iPhone 视口） |
| `npm run db:generate` | 修改 `src/lib/db/schema.ts` 后生成迁移；应用启动时自动执行迁移 |
| `npm run icons` | 重新生成 PWA 图标 |

样式只用设计系统的语义类（`bg-surface`、`text-fg-muted`、`rounded-control`、`text-body`…）。Tailwind 默认色板、字号、圆角已被清空，`text-sm`、`bg-zinc-100` 不会生效，详见 `src/design-system/README.md`。

## 验收记录

按 [PRD §6](docs/PRD.md#6-验收标准) 逐条验证：

| # | 标准 | 验证方式 |
| --- | --- | --- |
| 1 | 未登录跳转 / 401，错误密码限流 | E2E `auth.spec.ts`；单测 `auth.test.ts`（5 次失败锁定 15 分钟） |
| 2 | 跨设备同步 | 所有数据存服务端 SQLite，页面动态渲染；E2E 刷新后数据仍在 |
| 3 | 看板换列、筛选、子任务进度 | E2E 菜单换列、桌面拖拽、筛选、子任务 1/2 |
| 4 | 今日重点与本周完成 | E2E 标星后出现在今日，完成后进入周报；单测今日排序与周统计 |
| 5 | Inbox 转任务 | E2E 记录 → 转任务 → 看板可见 |
| 6 | 周报收支与复盘 | E2E 保存后刷新，利润 ¥1,000.50；单测 upsert 与合计 |
| 7 | 主题、导出、备份 | E2E 暗色切换并持久；导出 JSON、备份文件头 `SQLite format 3` |
| 8 | iOS 主屏 | manifest（standalone、maskable）、apple-touch-icon、safe-area；iPhone 视口 E2E 无横向溢出 |
| 9 | Docker + HTTPS | 本地 `docker compose up` 验证：HTTP 308 跳 HTTPS、HSTS、登录后 Cookie 为 Secure + HttpOnly、备份写入卷 |

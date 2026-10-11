import type { Metadata } from "next";
import fs from "node:fs";
import { Database, Download, LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { PageHeader } from "@/components/page-header";
import { ThemeSelect } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guard";
import { backupDir } from "@/lib/data/export";

export const metadata: Metadata = { title: "设置" };

function recentBackups() {
  try {
    return fs
      .readdirSync(/*turbopackIgnore: true*/ backupDir())
      .filter((f) => f.endsWith(".sqlite"))
      .sort()
      .reverse()
      .slice(0, 5);
  } catch {
    return [];
  }
}

export default async function SettingsPage() {
  const session = await requireSession();
  const backups = recentBackups();
  const autoHours = Number(process.env.AUTO_BACKUP_HOURS ?? 24);

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <PageHeader title="设置" description={`已登录：${session.u}`} className="mb-0" />

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
          <div>
            <CardTitle>外观</CardTitle>
            <CardDescription className="mt-1.5">亮色、暗色或跟随系统</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ThemeSelect />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
          <div>
            <CardTitle>数据</CardTitle>
            <CardDescription className="mt-1.5">
              导出全部数据为 JSON，或下载 SQLite 数据库备份。
              {autoHours > 0 ? ` 服务器每 ${autoHours} 小时自动备份一次。` : " 自动备份已关闭。"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <a href="/api/export" className={buttonVariants({ variant: "secondary" })} download>
              <Download /> 导出 JSON
            </a>
            <a href="/api/backup" className={buttonVariants({ variant: "secondary" })} download>
              <Database /> 备份数据库
            </a>
          </div>
          {backups.length > 0 && (
            <div>
              <p className="mb-1 text-caption font-medium text-fg-muted">服务器上最近的备份</p>
              <ul className="grid gap-0.5 font-mono text-caption text-fg-muted">
                {backups.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
          <div>
            <CardTitle>添加到主屏幕</CardTitle>
            <CardDescription className="mt-1.5">
              iPhone：用 Safari 打开本站，点分享按钮，选择“添加到主屏幕”。Windows：在 Edge 或 Chrome 地址栏点击“安装应用”。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <form action={logout}>
        <Button variant="secondary" className="w-full text-danger-fg" type="submit">
          <LogOut /> 退出登录
        </Button>
      </form>
    </div>
  );
}

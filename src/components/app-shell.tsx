import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScrollText,
  Wrench,
  Inbox,
  Building,
  ShieldQuestion,
  FileOutput,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { enterprise } from "@/data/compliance";
import { usePlatform } from "@/components/platform-store";
import { WorkerShell } from "@/components/worker-shell";
import { reviewers } from "@/data/cases";

/**
 * 主要作業：合規人員每天真正會走的四步，順序就是工作流。
 * 其他頁面不是不重要，而是從這四步的內文連過去更自然
 * （中間商從風險排行進去、返還從總覽的 KPI 進去、查驗從舉證包進去）。
 */
const primaryNav = [
  { to: "/dashboard", label: "合規總覽", icon: LayoutDashboard },
  { to: "/assurance", label: "舉證覆蓋", icon: ShieldQuestion },
  { to: "/cases", label: "案件審核", icon: Inbox },
  { to: "/pack", label: "舉證包", icon: FileOutput },
];

/** 參考與追蹤用，不是每天都會開。 */
const secondaryNav = [
  { to: "/vendors", label: "中間商合規", icon: Building },
  { to: "/remediation", label: "改善與返還", icon: Wrench },
  { to: "/audit", label: "稽核紀錄", icon: ScrollText },
];

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

function NavLink({
  item,
  pathname,
  badge = 0,
  muted = false,
}: {
  item: NavItem;
  pathname: string;
  badge?: number;
  muted?: boolean;
}) {
  const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors",
        muted ? "text-[13px]" : "text-sm",
        active
          ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
          : muted
            ? "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            : "text-sidebar-foreground/85 hover:bg-sidebar-accent",
      )}
    >
      <item.icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {badge > 0 && (
        <span className="num rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-danger-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { cases, reviewer, setReviewer } = usePlatform();
  const pending = cases.filter((c) => c.state === "pending_review").length;

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
      <Link to="/" className="border-b border-sidebar-border px-5 py-5">
        <div className="text-lg font-bold tracking-tight text-white">TrustRBA</div>
        <div className="mt-1 text-xs text-sidebar-foreground/70">企業合規平台</div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-0.5">
          {primaryNav.map((item) => (
            <li key={item.to}>
              <NavLink item={item} pathname={pathname} badge={item.to === "/cases" ? pending : 0} />
            </li>
          ))}
        </ul>

        <ul className="mt-6 space-y-0.5 border-t border-sidebar-border pt-5">
          {secondaryNav.map((item) => (
            <li key={item.to}>
              <NavLink item={item} pathname={pathname} muted />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="text-sm font-semibold text-white">{enterprise.name}</div>
        <label className="mt-2 block">
          <span className="text-[11px] text-sidebar-foreground/60">目前登入的審核人</span>
          <select
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            className="mt-1 w-full rounded border border-sidebar-border bg-sidebar-accent px-2 py-1.5 text-xs text-white outline-none"
          >
            {reviewers.map((r) => (
              <option key={r} value={r} className="text-primary-deep">
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}

function TopBar() {
  const { cases } = usePlatform();
  const pending = cases.filter((c) => c.state === "pending_review").length;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-8 backdrop-blur">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{enterprise.industry}</span>
        {pending > 0 && (
          <span className="rounded border border-warning/35 bg-warning-soft px-2 py-1 text-warning-foreground">
            {pending} 件待審核
          </span>
        )}
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // 移工端有自己的外殼：單欄、大字、可切換語言。
  if (pathname.startsWith("/worker")) {
    return <WorkerShell>{children}</WorkerShell>;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-60">
        <TopBar />
        <main className="mx-auto max-w-[1440px] px-8 py-10 lg:px-12">{children}</main>
      </div>
    </div>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanSearch,
  Layers,
  BadgeCheck,
  ScrollText,
  RotateCcw,
  ShieldCheck,
  Wrench,
  Users,
  Inbox,
  Building,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { enterprise } from "@/data/compliance";
import { useSession } from "@/components/session-state";
import { usePlatform } from "@/components/platform-store";
import { WorkerShell } from "@/components/worker-shell";
import { reviewers } from "@/data/cases";

const nav = [
  { group: "總覽", items: [{ to: "/dashboard", label: "合規總覽", icon: LayoutDashboard }] },
  {
    group: "審核作業",
    items: [
      { to: "/cases", label: "案件審核佇列", icon: Inbox },
      { to: "/vendors", label: "中間商合規", icon: Building },
      { to: "/remediation", label: "改善與返還", icon: Wrench },
    ],
  },
  {
    group: "AI 驗證",
    items: [
      { to: "/verification", label: "AI 驗證中心", icon: ScanSearch },
      { to: "/evidence", label: "證據鏈", icon: Layers },
    ],
  },
  {
    group: "合規憑證",
    items: [
      { to: "/credential", label: "合規憑證", icon: BadgeCheck },
      { to: "/verify", label: "第三方驗證", icon: ShieldCheck },
    ],
  },
  { group: "治理", items: [{ to: "/audit", label: "稽核紀錄", icon: ScrollText }] },
];

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
        {nav.map((section) => (
          <div key={section.group} className="mb-5">
            <div className="px-2 pb-2 text-[11px] font-medium tracking-wider text-sidebar-foreground/50">
              {section.group}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.to === "/cases" && pending > 0 && (
                        <span className="num rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-danger-foreground">
                          {pending}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mb-2">
          <div className="px-2 pb-2 text-[11px] font-medium tracking-wider text-sidebar-foreground/50">
            移工端
          </div>
          <Link
            to="/worker"
            className="flex items-center gap-2.5 rounded-md border border-sidebar-border px-2.5 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent"
          >
            <Users className="size-4 shrink-0" />
            <span className="truncate">移工申報平台</span>
          </Link>
        </div>
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
  const { resetSession } = useSession();
  const { resetPlatform, cases } = usePlatform();
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
      <div className="flex items-center gap-2">
        <Link
          to="/worker"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          <Users className="size-3.5" /> 移工端
        </Link>
        <button
          onClick={() => {
            resetSession();
            resetPlatform();
          }}
          title="把案件與稽核紀錄回復到初始狀態"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          <RotateCcw className="size-3.5" /> 重設資料
        </button>
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

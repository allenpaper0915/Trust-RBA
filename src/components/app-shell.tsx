import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScrollText,
  GitCompareArrows,
  Building,
  ClipboardCheck,
  BadgeCheck,
  BriefcaseBusiness,
  FileUp,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { DemoRoleSwitcher } from "@/components/demo-role-switcher";
import { usePlatform } from "@/components/platform-store";
import type { Role } from "@/components/platform-store";
import { WorkerShell } from "@/components/worker-shell";
import { reviewers } from "@/data/cases";

const governmentPrimaryNav = [
  { to: "/dashboard", label: "狀態總覽", icon: LayoutDashboard },
  { to: "/cases", label: "事件與衝突", icon: GitCompareArrows },
  { to: "/vendors", label: "仲介監理", icon: Building },
  { to: "/inspections", label: "訪查與抽樣", icon: ClipboardCheck },
];

const governmentSecondaryNav = [
  { to: "/audit", label: "稽核紀錄", icon: ScrollText },
  { to: "/verification", label: "對外驗證", icon: BadgeCheck },
];

const agencyPrimaryNav = [{ to: "/agency", label: "我的案件與補件", icon: FileUp }];

const enterprisePrimaryNav = [
  { to: "/enterprise", label: "聘僱工作台", icon: BriefcaseBusiness },
  { to: "/assurance", label: "舉證覆蓋", icon: ShieldCheck },
  { to: "/credential", label: "RBA 合規憑證", icon: BadgeCheck },
];

const enterpriseSecondaryNav = [
  { to: "/verification", label: "驗證中心", icon: ShieldCheck },
  { to: "/pack", label: "對外舉證包", icon: ScrollText },
];

const roleMeta: Record<
  Role,
  {
    title: string;
    subtitle: string;
    organization: string;
    primary: NavItem[];
    secondary: NavItem[];
  }
> = {
  government: {
    title: "移工狀態雷達",
    subtitle: "跨機關證據衝突監理",
    organization: "臺北市政府勞動局",
    primary: governmentPrimaryNav,
    secondary: governmentSecondaryNav,
  },
  agency: {
    title: "仲介協作入口",
    subtitle: "申請、補件與狀態回報",
    organization: "ABC Recruitment Agency",
    primary: agencyPrimaryNav,
    secondary: [],
  },
  worker: {
    title: "移工本人入口",
    subtitle: "近況回報與資料補充",
    organization: "匿名移工 #031",
    primary: [],
    secondary: [],
  },
  enterprise: {
    title: "聘僱與合規驗證",
    subtitle: "聘僱程序與 RBA 舉證",
    organization: "ABC Electronics",
    primary: enterprisePrimaryNav,
    secondary: enterpriseSecondaryNav,
  },
};

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
  const { cases, role, reviewer, setReviewer } = usePlatform();
  const meta = roleMeta[role];
  const home =
    role === "government"
      ? "/dashboard"
      : role === "agency"
        ? "/agency"
        : role === "enterprise"
          ? "/enterprise"
          : "/worker";
  const pending = cases.filter((c) => c.state === "pending_review").length;

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
      <Link to={home} className="border-b border-sidebar-border px-5 py-5">
        <div className="text-lg font-bold tracking-tight text-white">{meta.title}</div>
        <div className="mt-1 text-xs text-sidebar-foreground/70">{meta.subtitle}</div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-0.5">
          {meta.primary.map((item) => (
            <li key={item.to}>
              <NavLink
                item={item}
                pathname={pathname}
                badge={role === "government" && item.to === "/cases" ? pending : 0}
              />
            </li>
          ))}
        </ul>

        {meta.secondary.length > 0 && (
          <ul className="mt-6 space-y-0.5 border-t border-sidebar-border pt-5">
            {meta.secondary.map((item) => (
              <li key={item.to}>
                <NavLink item={item} pathname={pathname} muted />
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border px-4 py-4">
        <div className="text-sm font-semibold text-white">{meta.organization}</div>
        <DemoRoleSwitcher />
        {role === "government" && (
          <label className="block border-t border-sidebar-border pt-3">
            <span className="text-[11px] text-sidebar-foreground/60">目前登入的承辦角色</span>
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
        )}
      </div>
    </aside>
  );
}

function TopBar() {
  const { cases, role } = usePlatform();
  const pending = cases.filter((c) => c.state === "pending_review").length;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-8 backdrop-blur">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {role === "government"
            ? "政府示範環境 · 資料僅供決策輔助"
            : role === "agency"
              ? "仲介示範環境 · 僅顯示本機構承辦案件"
              : "企業示範環境 · 僅顯示已授權或組織範圍資料"}
        </span>
        {role === "government" && pending > 0 && (
          <span className="rounded border border-warning/35 bg-warning-soft px-2 py-1 text-warning-foreground">
            {pending} 件事件待人工複核
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

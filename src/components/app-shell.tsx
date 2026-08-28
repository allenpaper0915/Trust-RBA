import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanSearch,
  Layers,
  AlertTriangle,
  BadgeCheck,
  ScrollText,
  Clapperboard,
  Presentation,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { enterprise, presentationSteps } from "@/data/demo";
import { useDemo } from "@/components/demo-state";

const nav = [
  { group: "總覽", items: [{ to: "/dashboard", label: "合規總覽", icon: LayoutDashboard }] },
  { group: "AI 驗證", items: [{ to: "/verification", label: "AI 驗證中心", icon: ScanSearch }] },
  { group: "證據中心", items: [{ to: "/cases", label: "證據鏈", icon: Layers }] },
  { group: "風險案件", items: [{ to: "/cases/2026-024", label: "風險案件", icon: AlertTriangle }] },
  { group: "合規憑證", items: [{ to: "/credential", label: "Verifiable Credential", icon: BadgeCheck }, { to: "/verify", label: "憑證驗證", icon: ShieldCheck }] },
  { group: "稽核紀錄", items: [{ to: "/audit", label: "AI Audit Log", icon: ScrollText }] },
];

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
      <Link to="/" className="border-b border-sidebar-border px-5 py-6">
        <div className="text-lg font-bold tracking-tight text-white">TrustRBA</div>
        <div className="mt-1 text-xs text-sidebar-foreground/70">可信 AI × 供應鏈合規</div>
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
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <div className="text-sm font-semibold text-white">{enterprise.name}</div>
        <div className="text-xs text-sidebar-foreground/70">{enterprise.role}</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-sidebar-foreground/80">
          <span className="size-1.5 rounded-full bg-success" />
          系統已連線
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const { demoMode, presentation, toggleDemoMode, togglePresentation, resetDemo } = useDemo();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-8 backdrop-blur">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded border border-border bg-card px-2 py-1">
          示範企業｜Synthetic Enterprise Data
        </span>
        {demoMode && (
          <span className="rounded border border-primary/25 bg-primary-soft px-2 py-1 text-primary">
            Demo Environment
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={resetDemo}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          <RotateCcw className="size-3.5" /> 重設 Demo
        </button>
        <button
          onClick={toggleDemoMode}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
            demoMode
              ? "border-primary/30 bg-primary-soft text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <Clapperboard className="size-3.5" /> Demo Mode
        </button>
        <button
          onClick={togglePresentation}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
            presentation
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <Presentation className="size-3.5" /> 簡報模式
        </button>
      </div>
    </header>
  );
}

function PresentationBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeIndex = pathname.startsWith("/verify")
    ? 5
    : pathname.startsWith("/credential")
      ? 4
      : pathname.startsWith("/cases")
        ? 3
        : pathname.startsWith("/verification")
          ? 2
          : pathname.startsWith("/dashboard")
            ? 1
            : 0;

  return (
    <div className="border-b border-border bg-primary-deep px-8 py-3">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-white/60">
        {presentationSteps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded px-2.5 py-1",
                i === activeIndex ? "bg-white font-semibold text-primary-deep" : "",
              )}
            >
              {step}
            </span>
            {i < presentationSteps.length - 1 && <span className="text-white/35">→</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { presentation, togglePresentation } = useDemo();

  if (presentation) {
    return (
      <div className="min-h-screen">
        <PresentationBar />
        <div className="flex justify-end px-8 pt-3">
          <button
            onClick={togglePresentation}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
          >
            離開簡報模式
          </button>
        </div>
        <main className="mx-auto max-w-[1200px] px-8 py-8 text-[1.05rem]">{children}</main>
      </div>
    );
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

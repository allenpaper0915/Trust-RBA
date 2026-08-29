import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { workflowSteps } from "@/data/compliance";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  aside,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[11px] font-medium tracking-widest text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-bold text-primary-deep">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Demo 主線的上一步／下一步，讓錄影時不需要回到 sidebar 找頁面。 */
export function WorkflowNav({ current }: { current: string }) {
  const i = workflowSteps.findIndex((s) => s.to === current);
  if (i < 0) return null;
  const prev = i > 0 ? workflowSteps[i - 1] : undefined;
  const next = i < workflowSteps.length - 1 ? workflowSteps[i + 1] : undefined;

  return (
    <nav className="flex flex-wrap items-stretch justify-between gap-4 border-t border-border pt-8">
      {prev ? (
        <Link
          to={prev.to}
          className="group flex min-w-[240px] flex-1 items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:border-border-strong hover:bg-muted"
        >
          <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-left">
            <span className="block text-[11px] tracking-wider text-muted-foreground">上一步</span>
            <span className="block text-sm font-medium text-primary-deep">{prev.caption}</span>
          </span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
      {next && (
        <Link
          to={next.to}
          className="group flex min-w-[240px] flex-1 items-center justify-end gap-3 rounded-lg border border-primary/25 bg-primary-soft px-5 py-4 transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <span className="text-right">
            <span className="block text-[11px] tracking-wider text-primary/70 group-hover:text-primary-foreground/70">
              下一步 · {next.title}
            </span>
            <span className="block text-sm font-medium text-primary group-hover:text-primary-foreground">
              {next.caption}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-primary group-hover:text-primary-foreground" />
        </Link>
      )}
    </nav>
  );
}

/** 資料來源標籤：清楚區分真實基準與 Demo 合成資料。 */
export function SourceTag({
  kind,
  className,
}: {
  kind: "real" | "policy" | "synthetic";
  className?: string;
}) {
  const map = {
    real: { label: "Real-world Benchmark", cls: "border-primary/25 bg-primary-soft text-primary" },
    policy: {
      label: "Policy Knowledge Base",
      cls: "border-border-strong bg-secondary text-secondary-foreground",
    },
    synthetic: {
      label: "Synthetic Enterprise Evidence",
      cls: "border-border bg-muted text-muted-foreground",
    },
  }[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium",
        map.cls,
        className,
      )}
    >
      {map.label}
    </span>
  );
}

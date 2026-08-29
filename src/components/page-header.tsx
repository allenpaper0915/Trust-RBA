import type { ReactNode } from "react";

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

/** 資料來源標籤：清楚區分真實基準與示範資料。 */
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
      label: "示範企業資料",
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

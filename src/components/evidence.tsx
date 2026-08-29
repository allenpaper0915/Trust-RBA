import { AlertTriangle, CheckCircle2, CircleDashed, FileText } from "lucide-react";

import type { EvidenceNode, EvidenceStatus } from "@/data/compliance";
import { sourceLabel } from "@/data/compliance";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const statusTone: Record<EvidenceStatus, "success" | "warning" | "danger" | "neutral"> = {
  verified: "success",
  obtained: "neutral",
  conflict: "warning",
  missing: "neutral",
};

export const statusIcon: Record<EvidenceStatus, typeof CheckCircle2> = {
  verified: CheckCircle2,
  obtained: FileText,
  conflict: AlertTriangle,
  missing: CircleDashed,
};

/** 證據鏈上的節點按鈕。 */
export function EvidenceChainStep({
  node,
  index,
  active,
  onSelect,
}: {
  node: EvidenceNode;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = statusIcon[node.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active}
      className={cn(
        "w-full rounded-lg border px-5 py-4 text-left transition-all",
        active
          ? "border-primary bg-primary-soft/50 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-border-strong hover:bg-muted",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "num flex size-5 items-center justify-center rounded text-[10px]",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span className="truncate text-sm font-semibold text-primary-deep">{node.title}</span>
          </div>
          <div className="mt-1.5 pl-7 text-xs text-muted-foreground">{node.subtitle}</div>
        </div>
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            node.status === "verified"
              ? "text-success"
              : node.status === "conflict"
                ? "text-warning"
                : "text-muted-foreground",
          )}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 pl-7">
        <span className="num text-sm text-primary-deep">{node.amount}</span>
        <span
          className={cn(
            "text-[11px]",
            node.status === "conflict" ? "text-warning-foreground" : "text-muted-foreground",
          )}
        >
          {node.statusLabel}
        </span>
      </div>
    </button>
  );
}

/** 示範收據：刻意做成文件感，並標明為示範文件。 */
export function ReceiptDocument({
  amount,
  payee,
  date,
  verifiedBy,
}: {
  amount: string;
  payee: string;
  date: string;
  verifiedBy: string;
}) {
  return (
    <figure className="rounded-lg border border-border-strong bg-secondary p-1.5">
      <div className="rounded-md border border-dashed border-border-strong bg-card px-7 py-6">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="text-[11px] tracking-widest text-muted-foreground">RECEIPT</div>
            <div className="mt-1 text-sm font-bold text-primary-deep">收據（示範文件）</div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            No. RC-{date.replace(/[^0-9]/g, "").slice(2)}
          </div>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">付款金額</dt>
            <dd className="num text-xl text-primary-deep">{amount}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">收款方</dt>
            <dd className="text-primary-deep">{payee}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">日期</dt>
            <dd className="num text-primary-deep">{date}</dd>
          </div>
        </dl>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <StatusPill tone="success">{verifiedBy}</StatusPill>
          <span className="text-[11px] text-muted-foreground">Synthetic Demo Document</span>
        </div>
      </div>
    </figure>
  );
}

export function EvidenceDetail({ node }: { node: EvidenceNode }) {
  return (
    <div className="card-surface p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-primary-deep">{node.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{node.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill tone={statusTone[node.status]}>{node.statusLabel}</StatusPill>
          <span className="text-[11px] text-muted-foreground">{sourceLabel[node.source]}</span>
        </div>
      </div>

      <dl className="mt-7 grid gap-x-8 gap-y-4 border-t border-border pt-6 sm:grid-cols-2">
        {node.body.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium text-primary-deep">{row.value}</dd>
          </div>
        ))}
      </dl>

      {node.interview && (
        <div className="mt-7 space-y-3 rounded-lg border border-border bg-secondary p-6">
          <div className="text-[11px] tracking-wider text-muted-foreground">訪談問題</div>
          <p className="text-sm leading-loose text-primary-deep">「{node.interview.question}」</p>
          <div className="border-t border-border pt-3 text-[11px] tracking-wider text-muted-foreground">
            移工回答
          </div>
          <p className="text-sm leading-loose font-medium text-primary-deep">
            「{node.interview.answer}」
          </p>
        </div>
      )}

      {node.receipt && (
        <div className="mt-7">
          <ReceiptDocument {...node.receipt} />
        </div>
      )}

      {node.note && (
        <p className="mt-6 flex items-start gap-2 rounded-md bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
          {node.note}
        </p>
      )}
    </div>
  );
}

export function ChainArrow() {
  return (
    <div className="flex justify-center py-1.5" aria-hidden>
      <span className="h-4 w-px bg-border-strong" />
    </div>
  );
}

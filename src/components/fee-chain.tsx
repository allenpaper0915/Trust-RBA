import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, FileWarning, ShieldAlert } from "lucide-react";

import { money } from "@/data/compliance";
import type { FeeItem } from "@/data/cases";
import { feeCategoryMeta, type FeeCategory } from "@/data/vendors";
import { assessFeeChain } from "@/lib/analysis";
import { cn } from "@/lib/utils";

type Text = {
  payee: string;
  category: string;
  amount: string;
  status: string;
  notAllowed: string;
  allowed: string;
  noDocument: string;
  total: string;
  disallowedTotal: string;
  unregistered: string;
  empty: string;
};

const zh: Text = {
  payee: "收款方",
  category: "費用項目",
  amount: "金額",
  status: "RBA 判定",
  notAllowed: "不得由移工負擔",
  allowed: "可由移工負擔",
  noDocument: "無憑證",
  total: "移工實付總額",
  disallowedTotal: "不該由移工負擔的金額",
  unregistered: "名單外中間商",
  empty: "這件申報沒有填寫費用明細。",
};

/**
 * 費用鏈。把「一筆看起來不高的招聘費」攤開成一條付款鏈，
 * 並逐筆標示依 RBA 是否可以由移工負擔。
 */
export function FeeChain({
  items,
  text,
  categoryLabel,
  linkVendors = false,
}: {
  items: FeeItem[];
  text?: Partial<Text>;
  categoryLabel?: (c: FeeCategory) => string;
  /** 企業端可以點進中間商頁；移工端不需要 */
  linkVendors?: boolean;
}) {
  const t = { ...zh, ...text };
  const label = categoryLabel ?? ((c: FeeCategory) => feeCategoryMeta[c].label);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.empty}</p>;
  }

  const chain = assessFeeChain(items);
  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const meta = feeCategoryMeta[item.category];
          return (
            <li key={item.id} className="py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-sm font-medium text-primary-deep">
                  {label(item.category)}
                </span>
                <span className="num text-sm text-primary-deep">{money(item.amount)}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded bg-muted">
                <div
                  className={cn("h-1.5 rounded", meta.workerPayable ? "bg-success" : "bg-danger")}
                  style={{ width: `${(item.amount / max) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">
                  {t.payee}：
                  {linkVendors && item.vendorId ? (
                    <Link
                      to="/vendors/$id"
                      params={{ id: item.vendorId }}
                      className="text-primary hover:underline"
                    >
                      {item.payee}
                    </Link>
                  ) : (
                    <span className="text-primary-deep">{item.payee}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded border px-1.5 py-0.5",
                    meta.workerPayable
                      ? "border-success/30 bg-success-soft text-success"
                      : "border-danger/25 bg-danger-soft text-danger",
                  )}
                >
                  {meta.workerPayable ? (
                    <Check className="size-3" />
                  ) : (
                    <ShieldAlert className="size-3" />
                  )}
                  {meta.workerPayable ? t.allowed : t.notAllowed}
                </span>
                {!item.hasDocument && (
                  <span className="inline-flex items-center gap-1 rounded border border-warning/35 bg-warning-soft px-1.5 py-0.5 text-warning-foreground">
                    <FileWarning className="size-3" /> {t.noDocument}
                  </span>
                )}
                {!item.vendorId && !meta.workerPayable && (
                  <span className="inline-flex items-center gap-1 rounded border border-border-strong bg-muted px-1.5 py-0.5 text-muted-foreground">
                    <AlertTriangle className="size-3" /> {t.unregistered}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <div>
          <div className="text-xs text-muted-foreground">{t.total}</div>
          <div className="num mt-1 text-2xl text-primary-deep">{money(chain.total)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{t.disallowedTotal}</div>
          <div className="num mt-1 text-2xl text-danger">{money(chain.disallowed)}</div>
        </div>
      </div>
    </div>
  );
}

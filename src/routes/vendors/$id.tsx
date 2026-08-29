import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Building, ScrollText } from "lucide-react";

import { money } from "@/data/compliance";
import { feeCategoryMeta, vendorTypeLabel, type FeeCategory } from "@/data/vendors";
import { statusMeta } from "@/data/cases";
import { usePlatform } from "@/components/platform-store";
import { vendorStats, vendorStatusMeta } from "@/lib/vendor-stats";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { assessCase } from "@/lib/risk-engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendors/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `中間商 ${params.id}｜TrustRBA` },
      {
        name: "description",
        content: "單一中間商的收費項目、涉及案件、不當收費金額與對應的 RBA 條款。",
      },
    ],
  }),
  component: VendorDetail,
});

function VendorDetail() {
  const { id } = Route.useParams();
  const { cases } = usePlatform();
  const stat = useMemo(() => vendorStats(cases).find((s) => s.vendor.id === id), [cases, id]);

  if (!stat) {
    return (
      <div className="space-y-6">
        <PageHeader title="找不到這家中間商" subtitle={`代號 ${id} 不存在。`} />
        <Link to="/vendors" className="text-sm text-primary hover:underline">
          ← 回到中間商合規
        </Link>
      </div>
    );
  }

  const { vendor } = stat;
  const meta = vendorStatusMeta[stat.status];
  const related = cases.filter((c) => stat.caseIds.includes(c.id));

  // 依費用項目彙總，讓「這家收的是哪一種錢」一眼看得出來。
  const byCategory = new Map<FeeCategory, number>();
  for (const c of related) {
    for (const item of c.feeItems) {
      const belongs = item.vendorId === vendor.id || (!item.vendorId && item.payee === vendor.name);
      if (!belongs) continue;
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount);
    }
  }
  const categoryRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(...categoryRows.map(([, v]) => v), 1);
  const brokenRules = [...byCategory.keys()].filter((c) => !feeCategoryMeta[c].workerPayable);

  return (
    <div className="space-y-10">
      <div>
        <Link
          to="/vendors"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> 中間商合規
        </Link>
      </div>

      <PageHeader
        eyebrow={`${vendorTypeLabel[vendor.type]} · ${vendor.country}`}
        title={vendor.name}
        subtitle={
          vendor.registered
            ? `合作起始 ${vendor.since}${vendor.workers > 0 ? ` · 目前在職移工 ${vendor.workers} 名` : ""}`
            : "這家公司出現在移工的申報中，但不在企業的合約名單上。"
        }
        aside={<StatusPill tone={meta.tone}>{meta.label}</StatusPill>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "涉及案件", v: String(stat.caseCount) },
          { k: "未結案", v: String(stat.openCases) },
          { k: "移工實付合計", v: money(stat.collected) },
          { k: "不當收費合計", v: money(stat.disallowed), tone: "text-danger" },
        ].map((c) => (
          <div key={c.k} className="card-surface p-5">
            <div className="text-xs text-muted-foreground">{c.k}</div>
            <div className={cn("num mt-1.5 text-2xl text-primary-deep", c.tone)}>{c.v}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card-surface p-7">
          <h2 className="flex items-center gap-2 text-base font-bold text-primary-deep">
            <Building className="size-4 text-primary" /> 收費項目分布
          </h2>
          {categoryRows.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">目前沒有指向這家中間商的付款紀錄。</p>
          ) : (
            <ul className="mt-5 space-y-4 border-t border-border pt-5">
              {categoryRows.map(([cat, amount]) => (
                <li key={cat}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-primary-deep">{feeCategoryMeta[cat].label}</span>
                    <span className="num text-primary-deep">{money(amount)}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded bg-muted">
                    <div
                      className={cn(
                        "h-2 rounded",
                        feeCategoryMeta[cat].workerPayable ? "bg-success" : "bg-danger",
                      )}
                      style={{ width: `${(amount / maxCategory) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {stat.undocumented > 0 && (
            <p className="mt-5 rounded-md border border-warning/35 bg-warning-soft px-4 py-3 text-xs leading-relaxed text-warning-foreground">
              其中 <span className="num">{money(stat.undocumented)}</span>{" "}
              沒有任何收據或匯款憑證，需要向這家中間商調閱紀錄。
            </p>
          )}
        </div>

        <div className="card-surface p-7">
          <h2 className="flex items-center gap-2 text-base font-bold text-primary-deep">
            <ScrollText className="size-4 text-primary" /> 對應的 RBA 條款
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{meta.detail}</p>
          {brokenRules.length === 0 ? (
            <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
              目前沒有違反 Employer Pays Principle 的收費項目。
            </p>
          ) : (
            <ul className="mt-5 space-y-4 border-t border-border pt-5">
              {brokenRules.map((c) => (
                <li key={c}>
                  <div className="text-sm font-medium text-danger">{feeCategoryMeta[c].label}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {feeCategoryMeta[c].rule}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card-surface overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-primary-deep">涉及案件</h2>
        </div>
        {related.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">沒有相關案件。</p>
        ) : (
          <ul className="divide-y divide-border">
            {related.map((c) => {
              const a = assessCase(c);
              return (
                <li key={c.id}>
                  <Link
                    to="/cases/$id"
                    params={{ id: c.id }}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="num text-sm text-primary">#{c.id}</span>
                        <span className="text-sm text-primary-deep">{c.worker}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {c.origin} · {c.submittedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="num text-sm text-primary-deep">{money(c.fee)}</span>
                      <StatusPill tone={a.tone}>{a.riskScore}</StatusPill>
                      <StatusPill tone={statusMeta[c.state].tone}>
                        {statusMeta[c.state].short}
                      </StatusPill>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

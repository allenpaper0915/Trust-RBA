import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

import { benchmark, enterprise, money } from "@/data/compliance";
import { statusMeta } from "@/data/cases";
import { assessCase } from "@/lib/risk-engine";
import { assessFeeChain, benchmarkFor } from "@/lib/analysis";
import { vendorStats, vendorStatusMeta } from "@/lib/vendor-stats";
import { coverage } from "@/lib/assurance";
import { buildPack, daysUntil } from "@/lib/evidence-pack";
import { buyer, commercialStakes, ncMeta } from "@/data/buyer";
import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "合規總覽｜TrustRBA" },
      {
        name: "description",
        content:
          "ABC Electronics 的 RBA 移工招聘合規總覽：客戶稽核請求、舉證覆蓋率、審核佇列與中間商風險排行。",
      },
      { property: "og:title", content: "合規總覽｜TrustRBA" },
      { property: "og:description", content: "舉證覆蓋率、待審案件與中間商風險，一頁掌握。" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { cases } = usePlatform();

  const stats = useMemo(() => {
    const pending = cases.filter((c) => c.state === "pending_review");
    const confirmed = cases.filter((c) => c.state === "confirmed" || c.state === "remediated");
    const refundTotal = confirmed.reduce((s, c) => s + (c.review?.refund ?? 0), 0);
    const outstanding = cases.filter((c) => c.state === "confirmed").length;
    const workerCases = cases.filter((c) => c.source === "worker");
    // 舉證覆蓋率取代「合規分數」：RBA 看的是能證明多少，不是有多少人申訴。
    const cov = coverage(cases);
    // RBA 的核心指標：不該由移工負擔、卻由移工付掉的錢總共有多少。
    const disallowed = cases
      .filter((c) => c.state !== "dismissed")
      .reduce((s, c) => s + assessFeeChain(c.feeItems).disallowed, 0);
    return { pending, confirmed, refundTotal, outstanding, workerCases, cov, disallowed };
  }, [cases]);

  /** 中間商風險排行：把散落的案件收斂成「該找哪一家談」。 */
  const topVendors = useMemo(
    () =>
      vendorStats(cases)
        .filter((v) => v.disallowed > 0)
        .slice(0, 5),
    [cases],
  );

  const recent = useMemo(
    () => [...cases].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 5),
    [cases],
  );

  const maxValue = Math.max(...benchmark.corridors.map((c) => c.enterprise));
  // 客戶稽核請求：這才是企業非做不可的理由。
  const pack = useMemo(() => buildPack(cases), [cases]);
  const remaining = daysUntil(buyer.dueDate);
  const nc = ncMeta[pack.level];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-primary-deep">合規總覽</h1>
        <p className="mt-1 text-sm text-muted-foreground">{enterprise.name} · RBA 移工招聘合規</p>
      </div>

      {/* 客戶稽核請求：先講後果，再講數字 */}
      <section
        className={cn(
          "rounded-lg border p-7",
          nc.tone === "danger"
            ? "border-danger/30 bg-danger-soft"
            : nc.tone === "warning"
              ? "border-warning/35 bg-warning-soft"
              : "border-success/30 bg-success-soft",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill tone={nc.tone}>{nc.label}</StatusPill>
              <span className="num text-xs text-muted-foreground">
                {buyer.program} · {buyer.requestId}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold text-primary-deep">
              {buyer.name} 要求提出「未向移工收取招聘費」的證據
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{nc.consequence}</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted-foreground">回覆期限</div>
              <div className="num mt-1 text-2xl text-primary-deep">{remaining} 天</div>
              <div className="text-[11px] text-muted-foreground">{buyer.due}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">受影響年度訂單</div>
              <div className="num mt-1 text-2xl text-danger">
                {money(commercialStakes.annualOrders)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                占營收 {Math.round(commercialStakes.shareOfRevenue * 100)}%
              </div>
            </div>
            <Link
              to="/assurance"
              className="inline-flex h-fit items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              查看舉證覆蓋 <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card-surface p-6">
          <div className="text-sm text-muted-foreground">舉證覆蓋率</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="num text-4xl text-primary-deep">
              {Math.round(stats.cov.rate * 100)}
            </span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className={cn(
                "h-1.5 rounded-full",
                stats.cov.rate >= 0.9 ? "bg-success" : "bg-warning",
              )}
              style={{ width: `${Math.round(stats.cov.rate * 100)}%` }}
            />
          </div>
          <Link to="/assurance" className="mt-4 inline-block text-xs text-primary hover:underline">
            {stats.cov.proven} / {stats.cov.workers} 名已證明未收費 →
          </Link>
        </div>

        <div className="card-surface border-warning/35 p-6">
          <div className="text-sm text-muted-foreground">拿不出證據</div>
          <div className="num mt-2 text-4xl text-warning-foreground">{stats.cov.unproven}</div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            其中 {stats.cov.cash} 名以現金支付，金流本身沒有軌跡。
          </p>
        </div>

        <div className="card-surface border-warning/35 p-6">
          <div className="text-sm text-muted-foreground">待人工審核</div>
          <div className="num mt-2 text-4xl text-warning-foreground">{stats.pending.length}</div>
          <Link to="/cases" className="mt-4 inline-block text-xs text-primary hover:underline">
            開始審核 →
          </Link>
        </div>

        <div className="card-surface border-danger/25 p-6">
          <div className="text-sm text-muted-foreground">不當收費曝險</div>
          <div className="num mt-2 text-3xl text-danger">{money(stats.disallowed)}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            已核定返還 {money(stats.refundTotal)}
          </div>
          <Link
            to="/remediation"
            className="mt-3 inline-block text-xs text-primary hover:underline"
          >
            改善與返還 →
          </Link>
        </div>
      </section>

      {/* 佇列 + 仲介風險 */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card-surface">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-bold text-primary-deep">最新案件</h2>
            <Link to="/cases" className="text-xs text-primary hover:underline">
              查看全部 →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((c) => {
              const a = assessCase(c);
              const meta = statusMeta[c.state];
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
                        {c.source === "worker" && (
                          <span className="rounded border border-primary/25 bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">
                            移工申報
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {c.origin} · {c.agency} · {c.submittedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="num text-sm text-primary-deep">{money(c.fee)}</span>
                      <StatusPill tone={a.tone}>{a.riskScore}</StatusPill>
                      <StatusPill tone={meta.tone}>{meta.short}</StatusPill>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-primary-deep">中間商風險排行</h2>
            <Link to="/vendors" className="text-xs text-primary hover:underline">
              全部中間商 →
            </Link>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            依「RBA 不得由移工負擔、卻由移工支付」的累計金額排序。
          </p>
          <ul className="mt-6 space-y-4 border-t border-border pt-5">
            {topVendors.map((v) => (
              <li key={v.vendor.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link
                    to="/vendors/$id"
                    params={{ id: v.vendor.id }}
                    className="min-w-0 truncate text-primary hover:underline"
                  >
                    {v.vendor.name}
                  </Link>
                  <span className="num shrink-0 text-danger">{money(v.disallowed)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-danger"
                    style={{
                      width: `${Math.round((v.disallowed / Math.max(topVendors[0]?.disallowed ?? 1, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {v.caseCount} 件 · {vendorStatusMeta[v.status].label}
                  {!v.vendor.registered && " · 不在合約名單上"}
                </div>
              </li>
            ))}
            {topVendors.length === 0 && (
              <li className="text-sm text-muted-foreground">目前沒有偵測到不當收費。</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

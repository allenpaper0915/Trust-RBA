import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, Info, Users } from "lucide-react";

import { benchmark, enterprise, money } from "@/data/compliance";
import { statusMeta } from "@/data/cases";
import { assessCase } from "@/lib/risk-engine";
import { assessFeeChain, benchmarkFor } from "@/lib/analysis";
import { vendorStats, vendorStatusMeta } from "@/lib/vendor-stats";
import { usePlatform } from "@/components/platform-store";
import { SectionHeading, StatusPill } from "@/components/status-pill";
import { WorkflowNav } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "合規總覽｜TrustRBA" },
      {
        name: "description",
        content:
          "ABC Electronics 的 RBA 移工招聘合規總覽：審核佇列、移工自主申報、仲介風險排行與全球招聘費基準比較。",
      },
      { property: "og:title", content: "合規總覽｜TrustRBA" },
      { property: "og:description", content: "待審案件、確認超收金額與仲介風險，一頁掌握。" },
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
    // 合規分數：以未結案的高風險比例扣分，讓分數會隨審核動作變動。
    const openHigh = cases.filter(
      (c) => assessCase(c).riskScore >= 60 && !["dismissed", "remediated"].includes(c.state),
    ).length;
    const score = Math.max(40, 100 - openHigh * 4);
    // RBA 的核心指標：不該由移工負擔、卻由移工付掉的錢總共有多少。
    const disallowed = cases
      .filter((c) => c.state !== "dismissed")
      .reduce((s, c) => s + assessFeeChain(c.feeItems).disallowed, 0);
    return { pending, confirmed, refundTotal, outstanding, workerCases, score, disallowed };
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

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-deep">合規總覽</h1>
          <p className="mt-1 text-sm text-muted-foreground">{enterprise.name} · RBA 移工招聘合規</p>
        </div>
        <Link
          to="/cases"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
        >
          進入審核佇列 <ArrowRight className="size-4" />
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card-surface p-6">
          <div className="text-sm text-muted-foreground">合規分數</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="num text-4xl text-primary-deep">{stats.score}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className={cn("h-1.5 rounded-full", stats.score >= 85 ? "bg-success" : "bg-warning")}
              style={{ width: `${stats.score}%` }}
            />
          </div>
          <div className="mt-4">
            <StatusPill tone={stats.score >= 85 ? "success" : "warning"}>
              {stats.score >= 85 ? "狀態良好" : "需要注意"}
            </StatusPill>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            未結案的高風險案件每件扣 4 分，結案後自動回補。
          </p>
        </div>

        <div className="card-surface border-warning/35 p-6">
          <div className="text-sm text-muted-foreground">待人工審核</div>
          <div className="num mt-2 text-4xl text-warning-foreground">{stats.pending.length}</div>
          <Link to="/cases" className="mt-4 inline-block text-xs text-primary hover:underline">
            開始審核 →
          </Link>
        </div>

        <div className="card-surface p-6">
          <div className="text-sm text-muted-foreground">移工自主申報</div>
          <div className="num mt-2 text-4xl text-primary-deep">{stats.workerCases.length}</div>
          <Link
            to="/worker"
            className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Users className="size-3" /> 查看移工端 →
          </Link>
        </div>

        <div className="card-surface border-danger/25 p-6">
          <div className="text-sm text-muted-foreground">已確認不當收費</div>
          <div className="num mt-2 text-4xl text-danger">{stats.confirmed.length}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            其中 {stats.outstanding} 件尚未完成返還
          </div>
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

      <section>
        <SectionHeading
          title="全球招聘費基準"
          subtitle={`參考 ${benchmark.sources}`}
          aside={
            <StatusPill tone="primary" dot={false}>
              Real-world Benchmark
            </StatusPill>
          }
        />
        <div className="card-surface p-8">
          <p className="max-w-3xl text-sm leading-loose text-muted-foreground">
            TrustRBA 使用公開的全球移工招聘成本資料，建立 Migration Cost
            Benchmark，做為每一件申報的比較基準。
          </p>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              {benchmark.corridors.map((c) => {
                const flagged = c.corridor === benchmark.corridor;
                return (
                  <div key={c.corridor}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-primary-deep">{c.corridor}</span>
                      <span className="text-xs text-muted-foreground">
                        企業 {money(c.enterprise)}／基準 {money(c.benchmark)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-[11px] text-muted-foreground">企業資料</span>
                        <div className="h-3 flex-1 rounded bg-muted">
                          <div
                            className={flagged ? "h-3 rounded bg-danger" : "h-3 rounded bg-primary"}
                            style={{ width: `${(c.enterprise / maxValue) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-[11px] text-muted-foreground">Benchmark</span>
                        <div className="h-3 flex-1 rounded bg-muted">
                          <div
                            className="h-3 rounded bg-primary-deep/35"
                            style={{ width: `${(c.benchmark / maxValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-border bg-secondary p-6">
              <div className="text-sm font-medium text-primary-deep">{benchmark.corridor}</div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">企業資料</dt>
                  <dd className="num text-primary-deep">{money(benchmark.enterpriseFee)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Benchmark</dt>
                  <dd className="num text-primary-deep">{money(benchmark.benchmarkFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-muted-foreground">差異</dt>
                  <dd className="num text-danger">+{benchmark.deltaPercent}%</dd>
                </div>
              </dl>
              <div className="mt-3 text-xs text-muted-foreground">高於歷史基準</div>
              <div className="mt-4">
                <StatusPill tone="warning">風險訊號</StatusPill>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-2 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            {benchmark.disclaimer}
          </div>
        </div>
      </section>

      <WorkflowNav current="/dashboard" />
    </div>
  );
}

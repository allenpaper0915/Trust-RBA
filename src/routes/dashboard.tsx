import { createFileRoute, Link } from "@tanstack/react-router";
import { Info } from "lucide-react";

import { benchmark, enterprise } from "@/data/demo";
import { SectionHeading, StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "合規總覽｜TrustRBA" },
      {
        name: "description",
        content:
          "ABC Electronics 的 RBA 移工招聘合規總覽：合規分數、移工與仲介數量、證據紀錄與全球招聘費基準比較。",
      },
      { property: "og:title", content: "合規總覽｜TrustRBA" },
      { property: "og:description", content: "合規分數 87 / 100，5 件高風險案件待人工審核。" },
    ],
  }),
  component: Dashboard,
});

const money = (n: number) => `NT$${n.toLocaleString("en-US")}`;

function Dashboard() {
  const maxValue = Math.max(...benchmark.corridors.map((c) => c.enterprise));

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-primary-deep">合規總覽</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {enterprise.name} · RBA 移工招聘合規
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card-surface p-6 xl:col-span-1">
          <div className="text-sm text-muted-foreground">合規分數</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="num text-4xl text-primary-deep">{enterprise.complianceScore}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-warning"
              style={{ width: `${enterprise.complianceScore}%` }}
            />
          </div>
          <div className="mt-4">
            <StatusPill tone="warning">需要注意</StatusPill>
          </div>
        </div>

        {[
          { label: "移工人數", value: enterprise.workers },
          { label: "招聘仲介", value: enterprise.agencies },
          { label: "證據紀錄", value: enterprise.evidence },
        ].map((c) => (
          <div key={c.label} className="card-surface p-6">
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="num mt-2 text-4xl text-primary-deep">{c.value}</div>
          </div>
        ))}

        <div className="card-surface border-danger/25 p-6">
          <div className="text-sm text-muted-foreground">高風險案件</div>
          <div className="num mt-2 text-4xl text-danger">{enterprise.highRiskCases}</div>
          <Link to="/cases" className="mt-4 inline-block text-xs text-primary hover:underline">
            查看風險案件 →
          </Link>
        </div>
      </section>

      <section>
        <SectionHeading
          title="全球招聘費基準"
          subtitle={`參考 ${benchmark.sources}`}
          aside={<StatusPill tone="primary" dot={false}>Real-world Benchmark</StatusPill>}
        />
        <div className="card-surface p-8">
          <p className="max-w-3xl text-sm leading-loose text-muted-foreground">
            TrustRBA 使用公開的全球移工招聘成本資料，建立 Migration Cost
            Benchmark，協助企業辨識異常模式。
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
    </div>
  );
}

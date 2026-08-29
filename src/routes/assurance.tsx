import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Check,
  CircleSlash,
  Info,
  Minus,
  UserCheck,
  X,
} from "lucide-react";

import { provenRule, workforceSegments } from "@/data/assurance";
import { usePlatform } from "@/components/platform-store";
import { coverage, assuranceMeta, type AssuranceState } from "@/lib/assurance";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";
import {
  outcomeMeta,
  runTests,
  segmentVerdict,
  testSpecs,
  type TestOutcome,
} from "@/lib/verification-tests";

export const Route = createFileRoute("/assurance")({
  head: () => ({
    meta: [
      { title: "舉證覆蓋｜TrustRBA" },
      {
        name: "description",
        content:
          "RBA 稽核要的不是「沒有人申訴」，而是「證明沒有收費」。這一頁回答：328 名移工中，有多少人的未被收費是有證據支撐的。",
      },
      { property: "og:title", content: "舉證覆蓋｜TrustRBA" },
      { property: "og:description", content: "零申訴不是證據，只是沒有資料。" },
    ],
  }),
  component: AssurancePage,
});

const order: AssuranceState[] = ["proven", "review", "confirmed", "cash", "insufficient"];

const barColor: Record<AssuranceState, string> = {
  proven: "bg-success",
  review: "bg-primary",
  confirmed: "bg-danger",
  cash: "bg-warning",
  insufficient: "bg-border-strong",
};

function CoverageBar({
  counts,
  total,
  height = "h-4",
}: {
  counts: Record<AssuranceState, number>;
  total: number;
  height?: string;
}) {
  return (
    <div className={cn("flex gap-[2px] overflow-hidden rounded", height)}>
      {order.map((k) =>
        counts[k] > 0 ? (
          <div
            key={k}
            className={cn(barColor[k], "first:rounded-l last:rounded-r")}
            style={{ width: `${(counts[k] / total) * 100}%` }}
            title={`${assuranceMeta[k].label} ${counts[k]} 人`}
          />
        ) : null,
      )}
    </div>
  );
}

function OutcomeIcon({ outcome }: { outcome: TestOutcome }) {
  if (outcome === "pass") return <Check className="size-3.5 text-success" />;
  if (outcome === "fail") return <X className="size-3.5 text-danger" />;
  if (outcome === "partial") return <AlertTriangle className="size-3.5 text-warning" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

/**
 * 六項測試 × 四個來源國的矩陣。
 * 稽核員讀的就是這張表：哪一格沒過、為什麼沒過、要補什麼才會過。
 */
function TestMatrix() {
  const { cases } = usePlatform();
  const [open, setOpen] = useState<string | null>("T1");

  const columns = useMemo(
    () => workforceSegments.map((seg) => ({ seg, results: runTests(seg, cases) })),
    [cases],
  );

  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary text-left text-xs text-muted-foreground">
            <th className="px-5 py-3.5 font-medium">對帳測試</th>
            <th className="px-3 py-3.5 text-center font-medium">
              需移工
              <br />
              配合
            </th>
            <th className="px-3 py-3.5 text-center font-medium">
              需仲介
              <br />
              配合
            </th>
            {columns.map((c) => (
              <th key={c.seg.id} className="px-3 py-3.5 text-center font-medium">
                {c.seg.origin}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {testSpecs.map((spec, row) => {
            const isOpen = open === spec.id;
            return (
              <Fragment key={spec.id}>
                <tr
                  onClick={() => setOpen(isOpen ? null : spec.id)}
                  className="cursor-pointer transition-colors hover:bg-muted"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-baseline gap-2.5">
                      <span className="num text-xs text-primary">{spec.id}</span>
                      <span className="font-medium text-primary-deep">{spec.label}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{spec.question}</div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {spec.needsWorker ? (
                      <UserCheck className="mx-auto size-3.5 text-warning" />
                    ) : (
                      <span className="text-xs text-success">不需要</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-center">
                    {spec.needsAgency ? (
                      <UserCheck className="mx-auto size-3.5 text-warning" />
                    ) : (
                      <span className="text-xs text-success">不需要</span>
                    )}
                  </td>
                  {columns.map((c) => (
                    <td key={c.seg.id} className="px-3 py-4">
                      <span className="mx-auto flex w-fit items-center gap-1.5">
                        <OutcomeIcon outcome={c.results[row]!.outcome} />
                        <span className="text-xs text-muted-foreground">
                          {outcomeMeta[c.results[row]!.outcome].label}
                        </span>
                      </span>
                    </td>
                  ))}
                </tr>

                {isOpen && (
                  <tr className="bg-secondary/60">
                    <td colSpan={3 + columns.length} className="px-5 py-5">
                      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                        <div>
                          <div className="text-xs font-semibold text-primary-deep">怎麼做</div>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {spec.method}
                          </p>
                          <div className="mt-3 text-xs font-semibold text-primary-deep">
                            資料來源
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{spec.source}</p>
                          <div className="mt-3 text-xs font-semibold text-primary-deep">
                            涵蓋哪些管道
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{spec.channel}</p>
                        </div>

                        <ul className="space-y-3">
                          {columns.map((c) => {
                            const r = c.results[row]!;
                            return (
                              <li
                                key={c.seg.id}
                                className="rounded-md border border-border bg-card p-3.5"
                              >
                                <div className="flex items-center gap-2">
                                  <OutcomeIcon outcome={r.outcome} />
                                  <span className="text-xs font-medium text-primary-deep">
                                    {c.seg.corridor}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                  {r.detail}
                                </p>
                                {r.figures && (
                                  <dl className="mt-2.5 grid gap-x-5 gap-y-1 border-t border-border pt-2.5 sm:grid-cols-2">
                                    {r.figures.map((f) => (
                                      <div key={f.label} className="flex justify-between gap-3">
                                        <dt className="text-[11px] text-muted-foreground">
                                          {f.label}
                                        </dt>
                                        <dd className="num text-[11px] text-primary-deep">
                                          {f.value}
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}

          <tr className="border-t-2 border-border-strong bg-secondary">
            <td className="px-5 py-4 font-bold text-primary-deep" colSpan={3}>
              來源國結論（任一項未通過即不得宣稱已舉證）
            </td>
            {columns.map((c) => {
              const v = segmentVerdict(c.results);
              return (
                <td key={c.seg.id} className="px-3 py-4 text-center">
                  <StatusPill tone={outcomeMeta[v].tone}>{outcomeMeta[v].label}</StatusPill>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AssurancePage() {
  const { cases } = usePlatform();
  const cov = useMemo(() => coverage(cases), [cases]);
  const pct = Math.round(cov.rate * 100);

  const totals: Record<AssuranceState, number> = {
    proven: cov.proven,
    review: cov.review,
    confirmed: cov.confirmed,
    cash: cov.cash,
    insufficient: cov.insufficient,
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="ASSURANCE COVERAGE"
        title="舉證覆蓋"
        subtitle={`在職移工 ${cov.workers} 名 · 統計截至今日`}
        aside={<StatusPill tone={pct >= 90 ? "success" : "warning"}>舉證覆蓋率 {pct}%</StatusPill>}
      />

      {/* 頭條：一句話講完 RBA 的舉證責任 */}
      <section className="card-surface p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-sm text-muted-foreground">在職移工 {cov.workers} 名，其中</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="num text-5xl text-success">{cov.proven}</span>
              <span className="text-lg text-muted-foreground">名已證明未被收費</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="num text-3xl text-danger">{cov.unproven}</span>
              <span className="text-sm text-muted-foreground">名尚無法提出證據</span>
            </div>
          </div>

          <div>
            <CoverageBar counts={totals} total={cov.workers} height="h-6" />
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {order.map((k) => (
                <li key={k} className="flex items-start gap-2.5">
                  <span className={cn("mt-1 size-2.5 shrink-0 rounded-sm", barColor[k])} />
                  <span className="min-w-0">
                    <span className="block text-sm text-primary-deep">
                      {assuranceMeta[k].label}
                    </span>
                    <span className="num block text-xs text-muted-foreground">
                      {totals[k]} 名 · {Math.round((totals[k] / cov.workers) * 100)}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-7 flex items-start gap-2 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <b className="text-primary-deep">成立條件：</b>
            {provenRule}
          </span>
        </p>
      </section>

      {/* 各來源國：哪一塊是黑的 */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-primary-deep">各來源國</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">來源國 × 承辦仲介</p>
          </div>
        </div>

        <div className="card-surface divide-y divide-border">
          {cov.segments.map((seg) => {
            const counts: Record<AssuranceState, number> = {
              proven: seg.proven,
              review: seg.review,
              confirmed: seg.confirmed,
              cash: seg.cash,
              insufficient: seg.insufficient,
            };
            const rate = Math.round(seg.rate * 100);
            return (
              <div key={seg.segment.id} className="px-6 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <span className="text-base font-semibold text-primary-deep">
                      {seg.segment.corridor}
                    </span>
                    <span className="ml-3 text-xs text-muted-foreground">
                      {seg.segment.originAgency ?? seg.segment.destAgency} · {seg.workers} 名
                    </span>
                  </div>
                  <span
                    className={cn(
                      "num text-sm font-semibold",
                      rate >= 90
                        ? "text-success"
                        : rate >= 60
                          ? "text-warning-foreground"
                          : "text-danger",
                    )}
                  >
                    {rate}%
                  </span>
                </div>
                <div className="mt-3">
                  <CoverageBar counts={counts} total={seg.workers} height="h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 驗證程序：六項對帳測試 */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-primary-deep">六項對帳測試</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            檢驗移工可能被收費的每一條路徑。點任一列展開作法與各來源國結果。
          </p>
        </div>

        <TestMatrix />
      </section>

      <p className="rounded-md border border-border bg-muted px-5 py-4 text-sm leading-relaxed text-muted-foreground">
        其中 <span className="num text-warning-foreground">{cov.cash}</span>{" "}
        名回報以現金支付，金流本身沒有紀錄，無法以金流佐證有或沒有。
      </p>
    </div>
  );
}

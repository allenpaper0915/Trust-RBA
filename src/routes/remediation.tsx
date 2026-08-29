import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { money, remediationSteps } from "@/data/compliance";
import { statusMeta } from "@/data/cases";
import { benchmarkFor } from "@/lib/analysis";
import { usePlatform } from "@/components/platform-store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/remediation")({
  head: () => ({
    meta: [
      { title: "建議改善方案｜TrustRBA" },
      {
        name: "description",
        content:
          "人工核准調查後，AI 提出七項可執行的改善步驟；改善完成並重新驗證後才能重新發行合規憑證。",
      },
      { property: "og:title", content: "建議改善方案｜TrustRBA" },
      { property: "og:description", content: "AI 負責建議，執行與確認仍由企業合規人員完成。" },
    ],
  }),
  component: Remediation,
});

function Remediation() {
  const { cases, markRemediated } = usePlatform();
  const [done, setDone] = useState<string[]>([]);
  const toggle = (no: string) =>
    setDone((d) => (d.includes(no) ? d.filter((x) => x !== no) : [...d, no]));

  const progress = Math.round((done.length / remediationSteps.length) * 100);

  // 進入返還程序的案件：已確認不當收費，或已完成返還。
  const refundCases = cases.filter((c) => c.state === "confirmed" || c.state === "remediated");
  const outstanding = refundCases.filter((c) => c.state === "confirmed");
  const refundTotal = refundCases.reduce((s, c) => s + (c.review?.refund ?? 0), 0);
  const outstandingTotal = outstanding.reduce((s, c) => s + (c.review?.refund ?? 0), 0);
  // 尚未核定金額時，以「實付 − 該國基準」提供估算區間。
  const estimate = cases
    .filter((c) => c.state === "pending_review" || c.state === "investigating")
    .reduce((s, c) => s + Math.max(0, c.fee - benchmarkFor(c.origin)), 0);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="REMEDIATION"
        title="改善與返還"
        subtitle="已確認不當收費的案件在這裡完成返還，並記錄改善步驟。"
        aside={
          <StatusPill tone={outstanding.length > 0 ? "danger" : "success"}>
            {outstanding.length > 0 ? `${outstanding.length} 件待返還` : "無待返還案件"}
          </StatusPill>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-7">
          <div className="text-sm text-muted-foreground">改善進度</div>
          <div className="num mt-2 text-3xl text-primary-deep">
            {done.length}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / {remediationSteps.length}
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="card-surface p-7">
          <div className="text-sm text-muted-foreground">已核定返還金額</div>
          <div className="num mt-2 text-2xl text-primary-deep">{money(refundTotal)}</div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            其中 <span className="num text-danger">{money(outstandingTotal)}</span> 尚未完成返還。
          </p>
        </div>
        <div className="card-surface p-7">
          <div className="text-sm text-muted-foreground">審核中案件的潛在返還</div>
          <div className="num mt-2 text-2xl text-primary-deep">{money(estimate)}</div>
          <Link to="/cases" className="mt-3 inline-block text-xs text-primary hover:underline">
            以實付與基準差額估算，僅供參考 →
          </Link>
        </div>
      </section>

      <section className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h2 className="text-base font-bold text-primary-deep">返還追蹤</h2>
          <span className="text-xs text-muted-foreground">
            只有經過人工審核並確認不當收費的案件才會進入返還程序。
          </span>
        </div>
        {refundCases.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            目前沒有已確認不當收費的案件。到
            <Link to="/cases" className="mx-1 text-primary hover:underline">
              審核佇列
            </Link>
            完成審核後，案件會出現在這裡。
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {refundCases.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Link
                      to="/cases/$id"
                      params={{ id: c.id }}
                      className="num text-sm text-primary hover:underline"
                    >
                      #{c.id}
                    </Link>
                    <span className="text-sm text-primary-deep">{c.worker}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {c.agency} · 實付 {money(c.fee)} · 基準 {money(benchmarkFor(c.origin))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="num text-sm text-danger">
                    {c.review?.refund ? money(c.review.refund) : "未核定"}
                  </span>
                  <StatusPill tone={statusMeta[c.state].tone}>
                    {statusMeta[c.state].label}
                  </StatusPill>
                  {c.state === "confirmed" && (
                    <button
                      onClick={() => markRemediated(c.id)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-success px-4 py-2 text-xs font-medium text-success-foreground hover:opacity-90"
                    >
                      <Check className="size-3.5" /> 確認返還完成
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-base font-bold text-primary-deep">AI 建議的七項步驟</h2>
        </div>
        <ol className="space-y-3">
          {remediationSteps.map((s) => {
            const checked = done.includes(s.no);
            return (
              <li key={s.no}>
                <button
                  type="button"
                  onClick={() => toggle(s.no)}
                  aria-pressed={checked}
                  className={cn(
                    "flex w-full items-start gap-5 rounded-lg border px-6 py-5 text-left transition-colors",
                    checked
                      ? "border-success/30 bg-success-soft/60"
                      : "border-border bg-card hover:border-border-strong hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "num mt-0.5 flex size-8 shrink-0 items-center justify-center rounded text-xs",
                      checked ? "bg-success text-success-foreground" : "bg-secondary text-primary",
                    )}
                  >
                    {checked ? <Check className="size-4" /> : s.no}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-primary-deep">{s.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {s.detail}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 rounded-md border border-border bg-muted px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          AI 只負責建議與整理。每一項改善是否完成，由企業合規人員確認並留下證據；憑證不會因為 AI
          認為「已改善」而重新發行。
        </p>
      </section>

      <section className="rounded-lg border border-primary/25 bg-primary-soft px-8 py-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-primary-deep">改善完成後，重新發行合規憑證</h2>
            <p className="mt-2 text-sm text-primary-deep/75">
              改善結果納入證據鏈並重跑驗證後，未解決高風險案件歸零，才會產生新的合規憑證。
            </p>
          </div>
          <Link
            to="/credential"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            查看合規憑證 <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, Download, Search, Users, ClipboardList } from "lucide-react";

import { enterprise, money } from "@/data/compliance";
import { statusMeta, type CaseStatus } from "@/data/cases";
import { assessCase, riskBands, weightTable } from "@/lib/risk-engine";
import { benchmarkFor } from "@/lib/analysis";
import { usePlatform } from "@/components/platform-store";
import { WorkflowNav, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: "案件審核佇列｜TrustRBA" },
      {
        name: "description",
        content:
          "移工申報與合規抽樣進入同一個審核佇列，依風險分數排序，每一件都必須由合規人員做出決定。",
      },
      { property: "og:title", content: "案件審核佇列｜TrustRBA" },
      { property: "og:description", content: "每一件高風險案件都必須經過人工審核才會結案。" },
    ],
  }),
  component: CaseQueue,
});

const stateFilters: { key: CaseStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending_review", label: statusMeta.pending_review.label },
  { key: "investigating", label: statusMeta.investigating.label },
  { key: "need_more", label: statusMeta.need_more.label },
  { key: "confirmed", label: statusMeta.confirmed.label },
  { key: "dismissed", label: statusMeta.dismissed.label },
  { key: "remediated", label: statusMeta.remediated.label },
];

function CaseQueue() {
  const { cases } = usePlatform();
  const [state, setState] = useState<CaseStatus | "all">("all");
  const [source, setSource] = useState<"all" | "worker" | "audit">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"risk" | "recent" | "amount">("risk");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = cases.filter((c) => {
      if (state !== "all" && c.state !== state) return false;
      if (source !== "all" && c.source !== source) return false;
      if (!term) return true;
      return [c.id, c.agency, c.worker, c.origin, c.code ?? "", c.assignee]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
    return filtered.sort((a, b) => {
      if (sort === "amount") return b.fee - a.fee;
      if (sort === "recent") return b.submittedAt.localeCompare(a.submittedAt);
      return assessCase(b).riskScore - assessCase(a).riskScore;
    });
  }, [cases, state, source, q, sort]);

  const counts = useMemo(() => {
    const by = (s: CaseStatus) => cases.filter((c) => c.state === s).length;
    return {
      pending: by("pending_review"),
      investigating: by("investigating"),
      needMore: by("need_more"),
      confirmed: by("confirmed") + by("remediated"),
      fromWorker: cases.filter((c) => c.source === "worker").length,
    };
  }, [cases]);

  /** 匯出目前篩選結果，讓合規人員可以帶進既有的稽核流程。 */
  const exportCsv = () => {
    const head = ["案件編號", "來源", "來源國", "仲介", "實付", "基準", "風險分數", "狀態", "指派"];
    const body = rows.map((c) => [
      c.id,
      c.source === "worker" ? "移工申報" : "稽核抽樣",
      c.origin,
      c.agency,
      c.fee,
      benchmarkFor(c.origin),
      assessCase(c).riskScore,
      statusMeta[c.state].label,
      c.assignee,
    ]);
    const csv = [head, ...body].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustrba-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="REVIEW QUEUE"
        title="案件審核佇列"
        subtitle={`${enterprise.name} · 移工申報與合規抽樣共用同一條審核流程`}
        aside={
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-card px-4 py-2 text-sm text-primary-deep transition-colors hover:bg-muted"
          >
            <Download className="size-4" /> 匯出 CSV
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "待人工審核", value: counts.pending, tone: "text-warning-foreground" },
          { label: "調查中", value: counts.investigating, tone: "text-primary" },
          { label: "需補件", value: counts.needMore, tone: "text-muted-foreground" },
          { label: "已確認不當收費", value: counts.confirmed, tone: "text-danger" },
          { label: "來自移工自主申報", value: counts.fromWorker, tone: "text-primary-deep" },
        ].map((c) => (
          <div key={c.label} className="card-surface p-5">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className={cn("num mt-1.5 text-3xl", c.tone)}>{c.value}</div>
          </div>
        ))}
      </section>

      {/* 篩選 */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {stateFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setState(f.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                state === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋案件編號、仲介、查詢碼或審核人"
              className="w-full rounded-md border border-border bg-card py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as typeof source)}
            className="rounded-md border border-border bg-card px-3 py-2.5 text-sm text-primary-deep outline-none"
          >
            <option value="all">全部來源</option>
            <option value="worker">移工自主申報</option>
            <option value="audit">合規抽樣</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-border bg-card px-3 py-2.5 text-sm text-primary-deep outline-none"
          >
            <option value="risk">依風險分數排序</option>
            <option value="recent">依申報時間排序</option>
            <option value="amount">依金額排序</option>
          </select>
        </div>
      </section>

      <section className="card-surface overflow-x-auto">
        <table className="w-full min-w-[1120px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-xs text-muted-foreground">
              <th className="px-5 py-3.5 font-medium">案件</th>
              <th className="px-5 py-3.5 font-medium">來源</th>
              <th className="px-5 py-3.5 font-medium">走廊 / 仲介</th>
              <th className="px-5 py-3.5 text-right font-medium">實付</th>
              <th className="px-5 py-3.5 text-right font-medium">高於基準</th>
              <th className="px-5 py-3.5 text-right font-medium">證據</th>
              <th className="px-5 py-3.5 text-right font-medium">風險</th>
              <th className="px-5 py-3.5 font-medium">狀態</th>
              <th className="px-5 py-3.5 font-medium">指派</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => {
              const a = assessCase(c);
              const base = benchmarkFor(c.origin);
              const delta = base > 0 ? Math.round(((c.fee - base) / base) * 100) : 0;
              const meta = statusMeta[c.state];
              return (
                <tr key={c.id} className="transition-colors hover:bg-muted">
                  <td className="px-5 py-4">
                    <Link
                      to="/cases/$id"
                      params={{ id: c.id }}
                      className="num text-primary hover:underline"
                    >
                      #{c.id}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.worker}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px]",
                        c.source === "worker"
                          ? "border-primary/25 bg-primary-soft text-primary"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {c.source === "worker" ? (
                        <Users className="size-3" />
                      ) : (
                        <ClipboardList className="size-3" />
                      )}
                      {c.source === "worker" ? "移工申報" : "稽核抽樣"}
                    </span>
                    <div className="mt-1 text-[11px] text-muted-foreground">{c.submittedAt}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-primary-deep">
                      {c.origin} → {c.workplace}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.agency}</div>
                  </td>
                  <td className="num px-5 py-4 text-right text-primary-deep">{money(c.fee)}</td>
                  <td className="num px-5 py-4 text-right">
                    <span className={delta > 15 ? "text-danger" : "text-muted-foreground"}>
                      {delta > 0 ? `+${delta}%` : "—"}
                    </span>
                  </td>
                  <td className="num px-5 py-4 text-right text-muted-foreground">
                    {a.evidenceScore}
                  </td>
                  <td className="num px-5 py-4 text-right">
                    <span className={a.riskScore >= 60 ? "text-danger" : "text-primary-deep"}>
                      {a.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill tone={meta.tone}>{meta.short}</StatusPill>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{c.assignee}</td>
                  <td className="px-5 py-4 text-right">
                    <Link to="/cases/$id" params={{ id: c.id }} aria-label={`檢視案件 ${c.id}`}>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  沒有符合條件的案件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 計分規則公開 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-8">
          <h2 className="text-base font-bold text-primary-deep">證據權重表</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">系統預設的固定值，不由 LLM 產生。</p>
          <ul className="mt-6 space-y-3 border-t border-border pt-5">
            {weightTable.map((w) => (
              <li key={w.key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{w.label}</span>
                <span className="num text-primary-deep">+{w.points}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface p-8">
          <h2 className="text-base font-bold text-primary-deep">風險級距</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            風險分數 = 與仲介聲明衝突之證據權重總和。
          </p>
          <ul className="mt-6 space-y-3 border-t border-border pt-5">
            {riskBands.map((b) => (
              <li key={b.range} className="flex items-center justify-between text-sm">
                <span className="num text-muted-foreground">{b.range}</span>
                <span
                  className={cn(
                    "font-medium",
                    b.tone === "success"
                      ? "text-success"
                      : b.tone === "warning"
                        ? "text-warning-foreground"
                        : "text-danger",
                  )}
                >
                  {b.level}風險
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <WorkflowNav current="/cases" />
    </div>
  );
}

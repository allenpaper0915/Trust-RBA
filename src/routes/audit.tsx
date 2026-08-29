import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, ShieldCheck, User, Users } from "lucide-react";

import { credential, revocationAuditLog } from "@/data/compliance";
import { usePlatform } from "@/components/platform-store";
import { WorkflowNav, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { useSession } from "@/components/session-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "AI 稽核紀錄｜TrustRBA" },
      {
        name: "description",
        content:
          "每一筆 AI 行動都留下時間、執行者、行動、證據、授權與結果，讓 AI 的決策過程可以被事後審查。",
      },
      { property: "og:title", content: "AI 稽核紀錄｜TrustRBA" },
      { property: "og:description", content: "AI Audit Log：可追溯性是信任的前提。" },
    ],
  }),
  component: AuditPage,
});

/** 可信 AI 的八項要求，並標示在平台的哪一頁被實際落實。 */
const requirements: { title: string; body: string; to: string; where: string }[] = [
  {
    title: "Evidence First",
    body: "沒有證據，不允許 AI 做高風險結論。",
    to: "/evidence",
    where: "證據鏈",
  },
  {
    title: "Explainability",
    body: "每個 AI 結論都可以追溯到證據。",
    to: "/cases/2026-024",
    where: "AI 判斷依據",
  },
  {
    title: "Human-in-the-loop",
    body: "高風險案件一定需要人工確認。",
    to: "/cases/2026-024",
    where: "人工審核",
  },
  {
    title: "Authorization",
    body: "AI Agent 只能執行被授權的工具與行動。",
    to: "/verification",
    where: "AI 驗證中心",
  },
  {
    title: "Auditability",
    body: "所有 AI 行動都留下紀錄。",
    to: "/audit",
    where: "本頁",
  },
  {
    title: "Privacy",
    body: "第三方驗證時不需要取得完整移工資料。",
    to: "/credential",
    where: "隱私保護",
  },
  {
    title: "Expiry",
    body: "憑證有有效期限。",
    to: "/credential",
    where: "合規憑證",
  },
  {
    title: "Revocation",
    body: "新的高風險證據出現後可以撤銷憑證。",
    to: "/verify",
    where: "第三方驗證",
  },
];

const actorLabel = {
  worker: "移工",
  ai: "AI Agent",
  reviewer: "合規人員",
  system: "系統",
} as const;

function ActorIcon({ actor }: { actor: string }) {
  if (actor === "AI Agent") return <Bot className="size-3.5" />;
  if (actor === "合規人員" || actor === "合規管理員") return <User className="size-3.5" />;
  if (actor === "移工") return <Users className="size-3.5" />;
  return <ShieldCheck className="size-3.5" />;
}

function AuditPage() {
  const { revoked } = useSession();
  const { events, cases } = usePlatform();
  const [caseFilter, setCaseFilter] = useState("all");

  /** 平台事件是真正發生過的行動；撤銷情境的紀錄只在憑證被撤銷時附加。 */
  const entries = useMemo(() => {
    const base = events
      .filter((e) => caseFilter === "all" || e.caseId === caseFilter)
      .map((e) => ({
        time: e.at,
        actor: actorLabel[e.actor],
        action: e.action,
        evidence: e.evidence,
        auth: e.auth,
        result: e.result,
        caseId: e.caseId,
        revocation: false,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    if (revoked && caseFilter === "all") {
      return [
        ...base,
        ...revocationAuditLog.map((e) => ({
          time: e.time,
          actor: e.actor === "系統" ? "系統" : e.actor,
          action: e.action,
          evidence: e.evidence,
          auth: e.auth,
          result: e.result,
          caseId: undefined as string | undefined,
          revocation: true,
        })),
      ];
    }
    return base;
  }, [events, revoked, caseFilter]);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="AI AUDIT LOG"
        title="稽核紀錄"
        subtitle={`平台上每一筆 AI 與人工行動 · Credential ${credential.id}`}
        aside={<StatusPill tone="primary">{entries.length} 筆行動紀錄</StatusPill>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-muted-foreground">
          篩選案件
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="ml-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-primary-deep outline-none"
          >
            <option value="all">全部案件</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} · {c.agency}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="card-surface overflow-x-auto">
        <div className="grid min-w-[1040px] grid-cols-[150px_110px_1fr_1fr_150px_140px] gap-4 border-b border-border bg-secondary px-7 py-3.5 text-xs font-medium text-muted-foreground">
          <span>時間</span>
          <span>執行者</span>
          <span>行動</span>
          <span>證據</span>
          <span>授權</span>
          <span>結果</span>
        </div>

        <ol className="divide-y divide-border">
          {entries.map((e, i) => (
            <li
              key={`${e.time}-${e.action}-${i}`}
              className={cn(
                "grid min-w-[1040px] grid-cols-[150px_110px_1fr_1fr_150px_140px] items-start gap-4 px-7 py-4 text-sm transition-colors hover:bg-muted/60",
                e.revocation && "bg-danger-soft/40",
              )}
            >
              <span className="num text-xs text-muted-foreground">
                {e.time}
                {e.caseId && (
                  <Link
                    to="/cases/$id"
                    params={{ id: e.caseId }}
                    className="mt-0.5 block text-[11px] text-primary hover:underline"
                  >
                    #{e.caseId}
                  </Link>
                )}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 self-start rounded border px-2 py-0.5 text-[11px]",
                  e.actor === "合規人員"
                    ? "border-success/30 bg-success-soft text-success"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <ActorIcon actor={e.actor} />
                {e.actor}
              </span>
              <span className="font-medium text-primary-deep">{e.action}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{e.evidence}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{e.auth}</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  e.revocation ? "text-danger" : "text-primary-deep",
                )}
              >
                {e.result}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="rounded-md border border-border bg-muted px-5 py-4 text-sm leading-relaxed text-muted-foreground">
        稽核紀錄同時記錄「AI 做了什麼」與「人做了什麼」。移工送出申報、系統去識別化、AI
        計分、合規人員的決定與憑證撤銷，都出現在同一條時間線上，因此任何結論都能被事後重建。
      </p>

      {/* 可信 AI 八項要求 */}
      <section>
        <div className="mb-6 border-t border-border pt-10">
          <h2 className="text-xl font-bold text-primary-deep">可信 AI 的八項要求</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Trustworthy AI 不是要求人相信 AI，而是讓 AI 的決策有證據、有治理、可追溯、可驗證。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {requirements.map((r) => (
            <Link
              key={r.title}
              to={r.to}
              className="card-surface group p-6 transition-colors hover:border-border-strong hover:bg-muted"
            >
              <div className="text-sm font-bold text-primary-deep">{r.title}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.body}</p>
              <div className="mt-4 text-[11px] text-primary group-hover:underline">
                展示於：{r.where} →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <WorkflowNav current="/audit" />
    </div>
  );
}

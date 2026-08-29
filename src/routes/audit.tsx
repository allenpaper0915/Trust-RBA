import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Fingerprint,
  Link2,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Wrench,
} from "lucide-react";

import { credential, revocationAuditLog } from "@/data/compliance";
import { usePlatform } from "@/components/platform-store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { useSession } from "@/components/session-state";
import { cn } from "@/lib/utils";
import {
  buildChain,
  verifyChain,
  shortHash,
  type ChainedRecord,
  type ChainVerdict,
} from "@/lib/proof";

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

  // 雜湊鏈：每一筆紀錄含前一筆的雜湊，事後改動任何一筆都會讓後面全部對不上。
  const [chain, setChain] = useState<ChainedRecord<unknown>[]>([]);
  const [verdict, setVerdict] = useState<ChainVerdict | null>(null);
  const [tampered, setTampered] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let live = true;
    void buildChain(entries as unknown[]).then((c) => {
      if (!live) return;
      setChain(c);
      setVerdict(null);
      setTampered(false);
    });
    return () => {
      live = false;
    };
  }, [entries]);

  const runCheck = async (records: ChainedRecord<unknown>[]) => {
    setChecking(true);
    setVerdict(await verifyChain(records));
    setChecking(false);
  };

  /** 直接改掉中間一筆的內容但不重算雜湊——正是事後竄改的樣子。 */
  const tamper = () => {
    if (chain.length < 3) return;
    const i = Math.floor(chain.length / 2);
    const next = chain.map((r, k) =>
      k === i
        ? { ...r, data: { ...(r.data as Record<string, unknown>), result: "（已被改寫）" } }
        : r,
    );
    setChain(next);
    setTampered(true);
    void runCheck(next);
  };

  const restore = () => {
    void buildChain(entries as unknown[]).then((c) => {
      setChain(c);
      setTampered(false);
      setVerdict(null);
    });
  };

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

      {/* 完整性：紀錄能不能被事後改掉，是稽核的另一半問題 */}
      <section
        className={cn(
          "rounded-lg border p-7",
          verdict && !verdict.ok
            ? "border-danger/30 bg-danger-soft"
            : verdict?.ok
              ? "border-success/30 bg-success-soft"
              : "border-border bg-card",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2.5 text-base font-bold text-primary-deep">
              <Link2 className="size-4 text-primary" /> 紀錄完整性
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              每一筆紀錄都含前一筆的 SHA-256 雜湊，改動任一筆之後的雜湊都會對不上。
            </p>

            {verdict && (
              <div
                className={cn(
                  "mt-4 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm",
                  verdict.ok
                    ? "border-success/30 bg-card text-success"
                    : "border-danger/30 bg-card text-danger",
                )}
              >
                {verdict.ok ? (
                  <>
                    <ShieldCheck className="size-4" /> 全部 {chain.length} 筆雜湊一致，未被竄改
                  </>
                ) : (
                  <>
                    <ShieldAlert className="size-4" /> 第 {verdict.brokenAt + 1}{" "}
                    筆起雜湊對不上，紀錄已遭改動
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void runCheck(chain)}
              disabled={checking || chain.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              <Fingerprint className="size-4" /> 驗證完整性
            </button>
            {tampered ? (
              <button
                onClick={restore}
                className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-card px-4 py-2.5 text-sm text-primary-deep hover:bg-muted"
              >
                還原紀錄
              </button>
            ) : (
              <button
                onClick={tamper}
                className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
              >
                <Wrench className="size-4" /> 模擬竄改一筆
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card-surface overflow-x-auto">
        <div className="grid min-w-[1180px] grid-cols-[150px_110px_1fr_1fr_150px_140px_130px] gap-4 border-b border-border bg-secondary px-7 py-3.5 text-xs font-medium text-muted-foreground">
          <span>時間</span>
          <span>執行者</span>
          <span>行動</span>
          <span>證據</span>
          <span>授權</span>
          <span>結果</span>
          <span>雜湊</span>
        </div>

        <ol className="divide-y divide-border">
          {entries.map((e, i) => (
            <li
              key={`${e.time}-${e.action}-${i}`}
              className={cn(
                "grid min-w-[1180px] grid-cols-[150px_110px_1fr_1fr_150px_140px_130px] items-start gap-4 px-7 py-4 text-sm transition-colors hover:bg-muted/60",
                e.revocation && "bg-danger-soft/40",
                verdict && !verdict.ok && i >= verdict.brokenAt && "bg-danger-soft/60",
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
              <span
                className={cn(
                  "num text-[11px] break-all",
                  verdict && !verdict.ok && i >= verdict.brokenAt
                    ? "text-danger"
                    : "text-muted-foreground/70",
                )}
                title={chain[i]?.hash}
              >
                {chain[i] ? shortHash(chain[i]!.hash) : "…"}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2, Play, RotateCcw, ShieldAlert } from "lucide-react";

import { enterprise, sourceLabel, verificationLog, verificationStages } from "@/data/compliance";
import { usePlatform } from "@/components/platform-store";
import { assessCase, engineNote } from "@/lib/risk-engine";
import { WorkflowNav, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { useSession } from "@/components/session-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "AI 驗證中心｜TrustRBA" },
      {
        name: "description",
        content:
          "AI 不直接下結論，而是交叉驗證證據：資料蒐集、標準化、交叉驗證、政策比對、風險解釋、人工審核。",
      },
      { property: "og:title", content: "AI 驗證中心｜TrustRBA" },
      { property: "og:description", content: "六階段可解釋驗證流程，高風險結論一律交由人工審核。" },
    ],
  }),
  component: VerificationCenter,
});

const STEP_MS = 1150;

function VerificationCenter() {
  const { verified, setVerified } = useSession();
  const { cases } = usePlatform();
  // 驗證結果直接來自平台案件，因此包含移工剛剛送出的申報。
  const openCases = cases.filter((c) => !["dismissed", "remediated"].includes(c.state));
  const [phase, setPhase] = useState<"idle" | "running" | "done">(verified ? "done" : "idle");
  const [step, setStep] = useState(verified ? verificationLog.length : 0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "running") return;
    timer.current = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= verificationLog.length) {
          if (timer.current) clearInterval(timer.current);
          setPhase("done");
          setVerified(true);
          return verificationLog.length;
        }
        return s + 1;
      });
    }, STEP_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [phase, setVerified]);

  const run = () => {
    setStep(0);
    setPhase("running");
  };
  const reset = () => {
    setPhase("idle");
    setStep(0);
    setVerified(false);
  };

  const highRisk = openCases.filter((c) => assessCase(c).riskScore >= 60).length;
  const activeStage = phase === "done" ? verificationStages.length - 1 : step;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="AI VERIFICATION"
        title="AI 驗證中心"
        subtitle="AI 不直接下結論，而是交叉驗證證據。"
        aside={
          <StatusPill
            tone={phase === "done" ? "success" : phase === "running" ? "primary" : "neutral"}
          >
            {phase === "done" ? "驗證完成" : phase === "running" ? "驗證進行中" : "尚未執行"}
          </StatusPill>
        }
      />

      {/* 六階段流程 */}
      <section>
        <ol className="grid gap-3 lg:grid-cols-6">
          {verificationStages.map((stage, i) => {
            const done = phase === "done" || i < step;
            const current = phase === "running" && i === step;
            return (
              <li
                key={stage.key}
                className={cn(
                  "relative rounded-lg border p-5 transition-colors",
                  current
                    ? "border-primary bg-primary-soft"
                    : done
                      ? "border-success/30 bg-success-soft/50"
                      : "border-border bg-card",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "num flex size-5 items-center justify-center rounded-full text-[10px]",
                      current
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className="text-sm font-semibold text-primary-deep">{stage.label}</span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  {stage.detail}
                </p>
                {i < verificationStages.length - 1 && (
                  <span
                    className="absolute top-1/2 -right-3 hidden text-border-strong lg:block"
                    aria-hidden
                  >
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          目前階段：
          <span className="ml-1 font-medium text-primary-deep">
            {verificationStages[activeStage]?.label}
          </span>
        </p>
      </section>

      {/* 執行區 */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card-surface flex flex-col justify-between p-8">
          <div>
            <h2 className="text-lg font-bold text-primary-deep">執行 AI 驗證</h2>
            <p className="mt-2 text-sm leading-loose text-muted-foreground">
              驗證範圍：{enterprise.name} 共 {enterprise.workers} 名移工、{enterprise.agencies}{" "}
              家仲介、{enterprise.evidence} 筆證據。
            </p>
            <dl className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
              {[
                { k: "授權範圍", v: "RBA 招聘合規驗證（唯讀）" },
                { k: "政策來源", v: "RBA / ILO / IOM" },
                { k: "計分方式", v: "deterministic 權重表" },
                { k: "最終決定", v: "人工合規人員" },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">{r.k}</dt>
                  <dd className="font-medium text-primary-deep">{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={run}
              disabled={phase === "running"}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              {phase === "running" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {phase === "running"
                ? "驗證進行中…"
                : phase === "done"
                  ? "重新執行 AI 驗證"
                  : "執行 AI 驗證"}
            </button>
            {phase === "done" && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw className="size-4" /> 清除結果
              </button>
            )}
          </div>
        </div>

        {/* 執行紀錄 */}
        <div className="card-surface p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary-deep">執行紀錄</h2>
            <span className="num text-xs text-muted-foreground">
              {Math.min(phase === "done" ? verificationLog.length : step, verificationLog.length)} /{" "}
              {verificationLog.length}
            </span>
          </div>

          <ol className="mt-5 space-y-1">
            {verificationLog.map((entry, i) => {
              const done = phase === "done" || i < step;
              const current = phase === "running" && i === step;
              const shown = done || current;
              return (
                <li
                  key={entry.text}
                  className={cn(
                    "flex items-start gap-3 rounded-md px-3 py-3 transition-all duration-500",
                    shown ? "opacity-100" : "opacity-30",
                    current && "bg-primary-soft",
                  )}
                >
                  <span className="mt-0.5 shrink-0">
                    {done ? (
                      <Check className="size-4 text-success" />
                    ) : current ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <span className="block size-4 rounded-full border border-border" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-primary-deep">
                      {entry.text}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {shown ? entry.detail : "—"}
                    </span>
                    {shown && (
                      <span className="mt-1.5 inline-block text-[11px] text-muted-foreground/80">
                        {sourceLabel[entry.source]}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          {phase === "idle" && (
            <p className="mt-5 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              {engineNote}
            </p>
          )}
        </div>
      </section>

      {/* 結果 */}
      {phase === "done" && (
        <section className="rounded-lg border border-danger/25 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-8 py-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 text-danger" />
              <div>
                <h2 className="text-xl font-bold text-primary-deep">驗證完成</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  發現 <span className="num text-danger">{highRisk}</span>{" "}
                  個高風險案件，全部進入人工審核。
                </p>
              </div>
            </div>
            <Link
              to="/evidence"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              查看證據鏈 <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="divide-y divide-border">
            {openCases.map((seed) => {
              const a = assessCase(seed);
              return (
                <li key={seed.id}>
                  <Link
                    to="/cases/$id"
                    params={{ id: seed.id }}
                    className="flex flex-wrap items-center justify-between gap-4 px-8 py-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="num text-sm text-primary">#{seed.id}</span>
                      <span className="text-sm text-primary-deep">{seed.worker}</span>
                      <span className="text-xs text-muted-foreground">
                        {seed.origin} · {seed.agency}
                      </span>
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="text-xs text-muted-foreground">
                        風險分數 <span className="num text-primary-deep">{a.riskScore}</span>
                      </span>
                      <StatusPill tone={a.tone}>{a.label}</StatusPill>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <WorkflowNav current="/verification" />
    </div>
  );
}

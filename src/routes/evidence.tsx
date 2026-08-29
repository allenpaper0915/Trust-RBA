import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { evidenceChain, money, primaryCase } from "@/data/compliance";
import { assessCase } from "@/lib/risk-engine";
import { WorkflowNav, PageHeader, SourceTag } from "@/components/page-header";
import { ChainArrow, EvidenceChainStep, EvidenceDetail } from "@/components/evidence";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "證據鏈｜TrustRBA" },
      {
        name: "description",
        content:
          "仲介聲明、移工訪談、付款收據、付款紀錄與 AI 交叉驗證組成完整證據鏈，每一項證據都可以點擊追溯。",
      },
      { property: "og:title", content: "證據鏈｜TrustRBA" },
      { property: "og:description", content: "仲介聲明 NT$0，三項獨立證據皆指向 NT$60,000。" },
    ],
  }),
  component: EvidencePage,
});

/** 交叉驗證的四張大卡片：同一件事，四個來源，兩個答案。 */
function ConflictCards() {
  const cards = [
    {
      label: "仲介聲明",
      value: money(primaryCase.agencyClaim),
      tone: "claim" as const,
      note: "自我聲明",
    },
    {
      label: "移工訪談",
      value: money(primaryCase.fee),
      tone: "evidence" as const,
      note: "匿名訪談",
    },
    { label: "收據", value: money(primaryCase.fee), tone: "evidence" as const, note: "OCR 驗證" },
    {
      label: "付款紀錄",
      value: money(primaryCase.fee),
      tone: "evidence" as const,
      note: "銀行轉帳",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={cn(
            "relative rounded-lg border p-7",
            c.tone === "claim" ? "border-danger/30 bg-danger-soft" : "border-success/25 bg-card",
          )}
        >
          <div className="text-sm text-muted-foreground">{c.label}</div>
          <div
            className={cn(
              "num mt-3 text-3xl",
              c.tone === "claim" ? "text-danger" : "text-primary-deep",
            )}
          >
            {c.value}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{c.note}</span>
            <span
              className={cn(
                "text-[11px] font-medium",
                c.tone === "claim" ? "text-danger" : "text-success",
              )}
            >
              {c.tone === "claim" ? "單一來源" : "獨立證據"}
            </span>
          </div>
          {i < cards.length - 1 && (
            <span
              className="absolute top-1/2 -right-3 z-10 hidden text-border-strong xl:block"
              aria-hidden
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function EvidencePage() {
  const [selected, setSelected] = useState(0);
  const node = evidenceChain[selected]!;
  const assessment = assessCase(primaryCase);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="EVIDENCE CHAIN"
        title="證據鏈"
        subtitle={`案件 #${primaryCase.id} · ${primaryCase.worker} · ${primaryCase.origin} → ${primaryCase.workplace}`}
        aside={
          <div className="flex flex-col items-end gap-2">
            <StatusPill tone="danger">高風險</StatusPill>
            <SourceTag kind="synthetic" />
          </div>
        }
      />

      <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="mb-4 text-xs tracking-wider text-muted-foreground">
            點擊任一節點檢視原始證據
          </div>
          <ol>
            {evidenceChain.map((n, i) => (
              <li key={n.id}>
                <EvidenceChainStep
                  node={n}
                  index={i}
                  active={i === selected}
                  onSelect={() => setSelected(i)}
                />
                {i < evidenceChain.length - 1 && <ChainArrow />}
              </li>
            ))}
          </ol>
        </div>

        <EvidenceDetail node={node} />
      </section>

      {/* 交叉驗證 */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-10">
          <div>
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-primary-deep">
              <AlertTriangle className="size-5 text-danger" />
              發現證據衝突
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              同一筆招聘費，四個來源給出兩種答案。
            </p>
          </div>
          <Link
            to="/cases/$id"
            params={{ id: primaryCase.id }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            查看 AI 判斷依據 <ArrowRight className="size-4" />
          </Link>
        </div>

        <ConflictCards />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              label: "證據一致性",
              value: `${primaryCase.consistency}%`,
              bar: primaryCase.consistency,
              tone: "success" as const,
            },
            {
              label: "政策符合度",
              value: `${primaryCase.policyMatch}%`,
              bar: primaryCase.policyMatch,
              tone: "warning" as const,
            },
          ].map((m) => (
            <div key={m.label} className="card-surface p-7">
              <div className="text-sm text-muted-foreground">{m.label}</div>
              <div className="num mt-2 text-3xl text-primary-deep">{m.value}</div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-muted">
                <div
                  className={cn(
                    "h-1.5 rounded-full",
                    m.tone === "success" ? "bg-success" : "bg-warning",
                  )}
                  style={{ width: `${m.bar}%` }}
                />
              </div>
            </div>
          ))}
          <div className="card-surface border-danger/25 p-7">
            <div className="text-sm text-muted-foreground">風險等級</div>
            <div className="num mt-2 text-3xl text-danger">{assessment.label}</div>
            <div className="mt-4 text-xs text-muted-foreground">
              風險分數 <span className="num text-primary-deep">{assessment.riskScore}</span> /
              100（deterministic 計分）
            </div>
          </div>
        </div>

        <p className="mt-6 rounded-md border border-border bg-muted px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          證據衝突本身不是違規判定。TrustRBA
          只確認「仲介聲明與獨立證據不一致」這個事實，是否構成違規由人工合規人員認定。
        </p>
      </section>

      <WorkflowNav current="/evidence" />
    </div>
  );
}

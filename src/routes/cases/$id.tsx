import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bot,
  Check,
  CircleDashed,
  ClipboardList,
  FileText,
  Gavel,
  Send,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { buildEvidenceChain, caseReasons, money, trustPillars } from "@/data/compliance";
import {
  decisionMeta,
  docKindMeta,
  statusMeta,
  reviewers,
  type ReviewDecision,
} from "@/data/cases";
import { assessCase, engineNote, scoreDisclaimer } from "@/lib/risk-engine";
import { assessFeeChain, benchmarkFor } from "@/lib/analysis";
import { FeeChain } from "@/components/fee-chain";
import { usePlatform } from "@/components/platform-store";
import { WorkflowNav, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cases/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `案件 #${params.id}｜TrustRBA` },
      {
        name: "description",
        content:
          "AI 判斷依據、可解釋 Evidence Score 與人工審核決定。AI 只整理證據與風險，不自行判定企業違法。",
      },
      { property: "og:title", content: `案件 #${params.id}｜TrustRBA` },
      { property: "og:description", content: "每一條 AI 結論都對應一項可查證的證據。" },
    ],
  }),
  component: CaseDetail,
});

const actorMeta = {
  worker: { label: "移工", icon: Users, cls: "text-primary" },
  ai: { label: "AI Agent", icon: Bot, cls: "text-primary" },
  reviewer: { label: "合規人員", icon: User, cls: "text-success" },
  system: { label: "系統", icon: ShieldCheck, cls: "text-muted-foreground" },
} as const;

function CaseDetail() {
  const { id } = Route.useParams();
  const { getCase, caseEvents, decide, assign, markRemediated, reviewer } = usePlatform();
  const record = getCase(id);

  const [decision, setDecision] = useState<ReviewDecision>("investigating");
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [refund, setRefund] = useState("");

  if (!record) {
    return (
      <div className="space-y-6">
        <PageHeader title="找不到這件案件" subtitle={`案件編號 ${id} 不存在或已被移除。`} />
        <Link to="/cases" className="text-sm text-primary hover:underline">
          ← 回到審核佇列
        </Link>
      </div>
    );
  }

  const a = assessCase(record);
  const evidence = buildEvidenceChain(record);
  const reasons = caseReasons(record);
  const base = benchmarkFor(record.origin);
  const delta = base > 0 ? Math.round(((record.fee - base) / base) * 100) : 0;
  const meta = statusMeta[record.state];
  const chain = assessFeeChain(record.feeItems);
  const events = caseEvents(record.id);
  const decided = Boolean(record.review);

  const submitDecision = () => {
    decide(record.id, {
      decision,
      note: note.trim(),
      reply: reply.trim() || decisionMeta[decision].detail,
      refund:
        decision === "confirmed" ? Number(refund.replace(/[^\d]/g, "")) || undefined : undefined,
    });
    setNote("");
    setReply("");
    setRefund("");
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={`${record.source === "worker" ? "移工自主申報" : "合規抽樣"} · ${record.submittedAt}`}
        title={`案件 #${record.id}`}
        subtitle={`${record.worker} · ${record.origin} → ${record.workplace} · ${record.agency}`}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
            <StatusPill tone={a.tone}>{a.label}</StatusPill>
          </div>
        }
      />

      {/* 案件基本資料 + 指派 */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "抵達年月", v: record.arrivedAt },
          { k: "支付方式", v: record.paymentMethod },
          { k: "查詢碼", v: record.code ?? "（無，屬稽核建案）" },
          { k: "文件數", v: `${record.docs.length} 份` },
        ].map((c) => (
          <div key={c.k} className="card-surface p-5">
            <div className="text-xs text-muted-foreground">{c.k}</div>
            <div className="mt-1.5 text-sm font-semibold break-all text-primary-deep">{c.v}</div>
          </div>
        ))}
      </section>

      {/* 金額對照 */}
      <section className="card-surface p-8">
        <h2 className="text-base font-bold text-primary-deep">招聘費金額對照</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { k: "仲介／合約聲明", v: money(record.agencyClaim), conflict: true },
            { k: "移工實付合計", v: money(record.fee), conflict: false },
            { k: "RBA 不得由移工負擔", v: money(chain.disallowed), conflict: true },
            { k: "走廊基準", v: money(base), conflict: false },
          ].map((c) => (
            <div
              key={c.k}
              className={cn(
                "rounded-lg border p-6",
                c.conflict ? "border-danger/30 bg-danger-soft" : "border-border bg-secondary",
              )}
            >
              <div className="text-xs text-muted-foreground">{c.k}</div>
              <div
                className={cn(
                  "num mt-2 text-2xl",
                  c.conflict ? "text-danger" : "text-primary-deep",
                )}
              >
                {c.v}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-5 text-sm">
          <span className="text-muted-foreground">
            高於基準 <span className="num ml-1 text-danger">{delta > 0 ? `+${delta}%` : "—"}</span>
          </span>
          <span className="text-muted-foreground">
            證據一致性 <span className="num ml-1 text-primary-deep">{record.consistency}%</span>
          </span>
          <span className="text-muted-foreground">
            政策符合度 <span className="num ml-1 text-primary-deep">{record.policyMatch}%</span>
          </span>
          <Link to="/evidence" className="text-primary hover:underline">
            檢視完整證據鏈 →
          </Link>
        </div>
      </section>

      {/* 費用鏈 */}
      <section className="card-surface p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-primary-deep">費用鏈</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              招聘費被拆給 {chain.byVendor.length} 個收款方。單筆金額都不高，加總後才超出基準。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {chain.undocumented > 0 && (
              <StatusPill tone="warning">無憑證 {money(chain.undocumented)}</StatusPill>
            )}
            {chain.unregistered > 0 && (
              <StatusPill tone="danger">名單外中間商 {money(chain.unregistered)}</StatusPill>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <FeeChain items={record.feeItems} linkVendors />

          <div className="rounded-lg border border-border bg-secondary p-6">
            <h3 className="text-sm font-semibold text-primary-deep">依收款方彙總</h3>
            <ul className="mt-4 space-y-4 border-t border-border pt-4">
              {chain.byVendor.map((v) => (
                <li key={v.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    {v.vendorId ? (
                      <Link
                        to="/vendors/$id"
                        params={{ id: v.vendorId }}
                        className="text-primary hover:underline"
                      >
                        {v.name}
                      </Link>
                    ) : (
                      <span className="text-primary-deep">{v.name}</span>
                    )}
                    <span className="num text-primary-deep">{money(v.amount)}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {v.typeLabel} · {v.categories.join("、")}
                    {!v.registered && (
                      <span className="ml-1.5 text-warning-foreground">· 不在合約名單上</span>
                    )}
                  </div>
                </li>
              ))}
              {chain.byVendor.length === 0 && (
                <li className="text-sm text-muted-foreground">此案件沒有費用明細。</li>
              )}
            </ul>
            <Link
              to="/vendors"
              className="mt-5 inline-block border-t border-border pt-4 text-xs text-primary hover:underline"
            >
              查看中間商合規總表 →
            </Link>
          </div>
        </div>
      </section>

      {/* 移工提交的文件（已去識別化） */}
      <section className="card-surface p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-primary-deep">申報文件</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              所有文件在離開移工端之前已完成去識別化，企業端看不到姓名、證件號、電話與帳號。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {record.identityVerified && <StatusPill tone="success">身分已核驗</StatusPill>}
            <StatusPill tone="primary" dot={false}>
              已遮蔽 {record.docs.reduce((s, d) => s + d.redactedCount, 0)} 個個資欄位
            </StatusPill>
          </div>
        </div>

        {record.docs.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">此案件沒有附加文件。</p>
        ) : (
          <ul className="mt-6 divide-y divide-border border-t border-border">
            {record.docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <span className="flex min-w-0 items-center gap-3">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-primary-deep">{d.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {docKindMeta[d.kind].label} · {(d.size / 1024).toFixed(0)} KB · 遮蔽{" "}
                      {d.redactedCount} 欄
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <span className="num text-sm text-primary-deep">
                    {d.ocrAmount ? money(d.ocrAmount) : "—"}
                  </span>
                  <StatusPill
                    tone={
                      d.status === "verified"
                        ? "success"
                        : d.status === "processing"
                          ? "primary"
                          : "warning"
                    }
                  >
                    {d.status === "verified"
                      ? "已驗證"
                      : d.status === "processing"
                        ? "處理中"
                        : "無法辨識"}
                  </StatusPill>
                </span>
              </li>
            ))}
          </ul>
        )}

        {record.workerNote && (
          <div className="mt-6 rounded-md border border-border bg-secondary px-4 py-3.5">
            <div className="text-xs text-muted-foreground">移工補充說明（已去識別化）</div>
            <p className="mt-1.5 text-sm leading-relaxed text-primary-deep">{record.workerNote}</p>
          </div>
        )}
      </section>

      {/* AI 判斷依據 + Evidence Score */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface p-8">
          <h2 className="text-xl font-bold text-primary-deep">為什麼 AI 判定{a.label}？</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">AI 判斷依據</p>
          <ol className="mt-6 space-y-4 border-t border-border pt-6">
            {reasons.map((r, i) => (
              <li key={r} className="flex gap-4">
                <span className="num flex size-6 shrink-0 items-center justify-center rounded bg-primary-soft text-[11px] text-primary">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-primary-deep">{r}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 rounded-lg border border-danger/25 bg-danger-soft p-6">
            <div className="text-xs tracking-wider text-muted-foreground">AI 結論</div>
            <p className="mt-2 text-lg font-bold text-danger">疑似 RBA 招聘費合規風險</p>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              需要人工合規審核，不由 AI 自動判定違法。
            </p>
          </div>
        </div>

        <div className="card-surface p-8">
          <h2 className="text-base font-bold text-primary-deep">可解釋 Evidence Score</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">證據完整度：每一分都可追溯來源。</p>

          <ul className="mt-6 space-y-3 border-t border-border pt-6">
            {a.weights.map((w) => (
              <li
                key={w.key}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2.5 text-sm",
                  w.present ? "bg-secondary" : "bg-transparent",
                )}
              >
                <span className="flex items-center gap-2.5">
                  {w.present ? (
                    <Check className="size-3.5 text-success" />
                  ) : (
                    <CircleDashed className="size-3.5 text-muted-foreground" />
                  )}
                  <span className={w.present ? "text-primary-deep" : "text-muted-foreground"}>
                    {w.label}
                  </span>
                  {w.present && w.conflicting && (
                    <span className="rounded bg-danger-soft px-1.5 py-0.5 text-[10px] text-danger">
                      衝突證據
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "num",
                    w.present ? "text-primary-deep" : "text-muted-foreground/60",
                  )}
                >
                  {w.present ? `+${w.points}` : "—"}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-3 border-t border-border pt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">證據完整度分數</span>
              <span className="num text-3xl text-primary-deep">
                {a.evidenceScore}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">風險分數（衝突證據權重）</span>
              <span className="num text-2xl text-danger">
                {a.riskScore}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
              </span>
            </div>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{scoreDisclaimer}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{engineNote}</p>
        </div>
      </section>

      {/* 人工審核 */}
      <section className="rounded-lg border border-primary/25 bg-primary-soft p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-primary-deep">
              <Gavel className="size-5 text-primary" />
              人工審核決定
            </h2>
            <p className="mt-3 text-sm leading-loose text-primary-deep/80">
              AI 可以發現風險與整理證據，但不能自行宣布企業違法，也不能自行執行不可逆的處置。
              以下決定會寫入稽核紀錄，並同步顯示給提出申報的移工。
            </p>
          </div>
          <label className="text-xs text-primary-deep/70">
            指派審核人
            <select
              value={record.assignee}
              onChange={(e) => assign(record.id, e.target.value)}
              className="mt-1.5 block w-56 rounded-md border border-border bg-card px-3 py-2 text-sm text-primary-deep outline-none"
            >
              <option value="尚未指派">尚未指派</option>
              {reviewers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        {decided && record.review && (
          <div className="mt-7 rounded-lg border border-success/30 bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-primary-deep">
                {decisionMeta[record.review.decision].label}
              </span>
              <span className="text-xs text-muted-foreground">
                {record.review.reviewer} · {record.review.at}
              </span>
            </div>
            {record.review.note && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {record.review.note}
              </p>
            )}
            {record.review.refund ? (
              <p className="mt-3 text-sm text-primary-deep">
                核定應返還金額
                <span className="num ml-2 text-danger">{money(record.review.refund)}</span>
              </p>
            ) : null}
            {record.state === "confirmed" && (
              <button
                onClick={() => markRemediated(record.id)}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-success px-5 py-2.5 text-sm font-medium text-success-foreground hover:opacity-90"
              >
                <Check className="size-4" /> 確認返還完成
              </button>
            )}
          </div>
        )}

        <div className="mt-7 grid gap-6 border-t border-primary/15 pt-6 lg:grid-cols-2">
          <div>
            <div className="text-xs tracking-wider text-primary-deep/70">選擇處置</div>
            <div className="mt-3 space-y-2">
              {(Object.keys(decisionMeta) as ReviewDecision[]).map((d) => (
                <label
                  key={d}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-md border p-3.5 transition-colors",
                    decision === d ? "border-primary bg-card" : "border-border bg-card/60",
                  )}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === d}
                    onChange={() => setDecision(d)}
                    className="mt-1 size-4 shrink-0 accent-[oklch(0.475_0.128_254)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-primary-deep">
                      {decisionMeta[d].label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {decisionMeta[d].detail}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs tracking-wider text-primary-deep/70">
                審核理由（內部紀錄）
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="說明依據哪些證據做出這個決定。"
                className="mt-1.5 w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>

            {decision === "confirmed" && (
              <label className="block">
                <span className="text-xs tracking-wider text-primary-deep/70">
                  核定應返還金額（新台幣）
                </span>
                <input
                  inputMode="numeric"
                  value={refund}
                  onChange={(e) => setRefund(e.target.value)}
                  placeholder={String(Math.max(record.fee - base, 0))}
                  className="mt-1.5 w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            )}

            <label className="block">
              <span className="text-xs tracking-wider text-primary-deep/70">
                給移工的回覆（會顯示在移工端）
              </span>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder={decisionMeta[decision].detail}
                className="mt-1.5 w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>

            <button
              onClick={submitDecision}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              <Send className="size-4" /> 以「{reviewer}」的身分送出決定
            </button>
          </div>
        </div>
      </section>

      {/* 案件時間線 */}
      <section className="card-surface p-8">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-primary-deep">
          <ClipboardList className="size-4 text-primary" /> 案件時間線
        </h2>
        <ol className="mt-6 space-y-4 border-t border-border pt-6">
          {events.map((e) => {
            const m = actorMeta[e.actor];
            return (
              <li key={e.id} className="flex gap-4">
                <m.icon className={cn("mt-0.5 size-4 shrink-0", m.cls)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-primary-deep">
                      {m.label} · {e.action}
                    </span>
                    <span className="num text-xs text-muted-foreground">{e.at}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {e.evidence} · 授權：{e.auth} · 結果：{e.result}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Trustworthy AI */}
      <section>
        <div className="mb-6 border-t border-border pt-10">
          <h2 className="flex items-center gap-2.5 text-xl font-bold text-primary-deep">
            <ShieldCheck className="size-5 text-primary" />
            為什麼可以信任 AI？
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            信任不是靠模型自我聲明，而是靠授權範圍、證據來源與可追溯性。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trustPillars.map((p) => (
            <div key={p.q} className="card-surface p-7">
              <div className="text-xs tracking-wider text-muted-foreground">{p.q}</div>
              <div className="mt-2 text-sm font-semibold text-primary-deep">{p.a}</div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          本案件共 {evidence.length} 項證據納入判斷。
        </p>
      </section>

      <WorkflowNav current={`/cases/${record.id}`} />
    </div>
  );
}

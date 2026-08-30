import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  Building,
  Check,
  ClipboardList,
  FileText,
  Gavel,
  MessageSquareText,
  Send,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";
import {
  decisionMeta,
  docKindMeta,
  reviewers,
  statusMeta,
  type ReviewDecision,
} from "@/data/cases";
import { monitoringFor, signalMeta, type EvidenceState } from "@/data/monitoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cases/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `案件 #${params.id}｜移工狀態雷達` },
      {
        name: "description",
        content: "以事件、法定義務與跨機關證據呈現資料衝突，供政府承辦人複核。",
      },
    ],
  }),
  component: CaseDetail,
});

const evidenceStateMeta: Record<
  EvidenceState,
  { label: string; tone: "success" | "primary" | "danger" | "neutral" }
> = {
  complete: { label: "已取得", tone: "success" },
  pending: { label: "等待中", tone: "primary" },
  conflict: { label: "衝突", tone: "danger" },
  missing: { label: "缺件", tone: "neutral" },
};

const actorMeta = {
  agency: { label: "仲介機構", icon: Building, cls: "text-warning-foreground" },
  enterprise: { label: "聘僱企業", icon: BriefcaseBusiness, cls: "text-primary" },
  worker: { label: "移工本人", icon: Users, cls: "text-primary" },
  ai: { label: "規則引擎", icon: Bot, cls: "text-primary" },
  reviewer: { label: "政府承辦", icon: User, cls: "text-success" },
  system: { label: "系統", icon: ShieldCheck, cls: "text-muted-foreground" },
} as const;

type ChatMessage = {
  caseId: string;
  role: "user" | "agent";
  text: string;
};

type AgentTab = "summary" | "chat";
type CaseDrawer = "evidence" | "audit" | "decision" | null;

function CaseDetail() {
  const { id } = Route.useParams();
  const { getCase, caseEvents, decide, assign, markRemediated, reviewer } = usePlatform();
  const record = getCase(id);
  const [decision, setDecision] = useState<ReviewDecision>("investigating");
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [refund, setRefund] = useState("");
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentTab, setAgentTab] = useState<AgentTab>("summary");
  const [drawer, setDrawer] = useState<CaseDrawer>(null);

  if (!record) {
    return (
      <div className="space-y-6">
        <PageHeader title="找不到這件案件" subtitle={`案件編號 ${id} 不存在或已被移除。`} />
        <Link
          to="/cases"
          search={{ view: "conflicts" }}
          className="text-sm text-primary hover:underline"
        >
          ← 回到事件與衝突群組
        </Link>
      </div>
    );
  }

  const profile = monitoringFor(record);
  const signal = signalMeta[profile.tone];
  const events = caseEvents(record.id);
  const meta = statusMeta[record.state];
  const chatInput = chatDrafts[record.id] ?? "";
  const caseChat = chatMessages.filter((message) => message.caseId === record.id);

  const askAgent = (suggestedQuestion?: string) => {
    const question = (suggestedQuestion ?? chatInput).trim();
    if (!question) return;

    let answer: string;
    if (/[缺補]|需要.*證據/.test(question)) {
      answer = `目前尚缺：${profile.missing.length ? profile.missing.join("、") : "沒有待補證據"}。`;
    } else if (/下一步|怎麼查|如何處理/.test(question)) {
      answer = profile.nextAction;
    } else if (/事實|確認/.test(question)) {
      answer = `目前可確認：${profile.facts.join("、")}。`;
    } else if (/解釋|原因|可能/.test(question)) {
      answer = `現階段仍有這些合理解釋：${profile.explanations.join("、")}。尚不能只憑衝突訊號做違法認定。`;
    } else {
      answer = `${profile.summary} 建議優先確認「${profile.missing[0] ?? "最新程序狀態"}」。`;
    }

    setChatMessages((current) => [
      ...current,
      { caseId: record.id, role: "user", text: question },
      { caseId: record.id, role: "agent", text: answer },
    ]);
    setChatDrafts((current) => ({ ...current, [record.id]: "" }));
  };

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
    setDrawer(null);
  };

  return (
    <div className="space-y-8">
      <Link
        to="/cases"
        search={{ view: "conflicts" }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> 事件與衝突群組
      </Link>

      <PageHeader
        eyebrow={`個案 #${record.id} · ${record.source === "worker" ? "本人通報" : "政府抽樣"} · ${record.submittedAt}`}
        title="聘僱關係事件紀錄"
        subtitle={`${record.worker} · ${record.origin}籍 · ${record.workplace} · 關係機構 ${record.agency}`}
        aside={
          <div className="space-y-3">
            <div className="flex flex-wrap justify-end gap-2">
              <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                  signal.className,
                )}
              >
                <span className={cn("size-2 rounded-full", signal.dotClass)} />
                {signal.label}
              </span>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDrawer("evidence")}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-primary-deep hover:bg-muted"
              >
                <FileText className="size-3.5 text-primary" /> 原始證據 {record.docs.length}
              </button>
              <button
                type="button"
                onClick={() => setDrawer("audit")}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-primary-deep hover:bg-muted"
              >
                <ClipboardList className="size-3.5 text-primary" /> 稽核軌跡 {events.length}
              </button>
              <button
                type="button"
                onClick={() => setDrawer("decision")}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-deep"
              >
                <Gavel className="size-3.5" /> 承辦處置
              </button>
            </div>
          </div>
        }
      />

      <section className="grid items-start gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="card-surface overflow-hidden">
          <div className={cn("border-b border-border px-6 py-5", signal.className)}>
            <div className="text-xs font-semibold tracking-wider">案件判讀主軸</div>
            <h2 className="mt-2 text-xl font-bold text-primary-deep">{profile.trigger}</h2>
            <p className="mt-2 text-sm leading-6 text-primary-deep/75">{profile.summary}</p>
            <dl className="mt-5 grid gap-3 border-t border-current/15 pt-4 text-xs sm:grid-cols-3">
              <div>
                <dt className="opacity-65">處理期限</dt>
                <dd className="mt-1 font-semibold">{profile.due}</dd>
              </div>
              <div>
                <dt className="opacity-65">負責角色</dt>
                <dd className="mt-1 font-semibold">{profile.owner}</dd>
              </div>
              <div>
                <dt className="opacity-65">證據信心</dt>
                <dd className="mt-1 font-semibold">{profile.confidence}</dd>
              </div>
            </dl>
          </div>
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-bold text-primary-deep">事件—義務—證據鏈</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              對照事件、依法應發生的義務，以及目前取得的跨機關證據。
            </p>
          </div>
          <ol className="divide-y divide-border">
            {profile.steps.map((step, index) => {
              const state = evidenceStateMeta[step.state];
              return (
                <li
                  key={`${step.at}-${step.event}`}
                  className="grid gap-4 px-6 py-5 md:grid-cols-[80px_1fr_1fr_1fr_auto] md:items-start"
                >
                  <div className="num text-xs text-muted-foreground">{step.at}</div>
                  <div>
                    <div className="mb-1 text-[10px] tracking-wider text-muted-foreground">
                      事件 {index + 1}
                    </div>
                    <div className="text-sm font-medium text-primary-deep">{step.event}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] tracking-wider text-muted-foreground">
                      應發生的義務
                    </div>
                    <div className="text-xs leading-relaxed text-primary-deep">
                      {step.obligation}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] tracking-wider text-muted-foreground">
                      取得的證據
                    </div>
                    <div className="text-xs leading-relaxed text-primary-deep">{step.evidence}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{step.source}</div>
                  </div>
                  <StatusPill tone={state.tone}>{state.label}</StatusPill>
                </li>
              );
            })}
          </ol>
        </div>

        <section className="card-surface flex h-[620px] min-h-0 flex-col overflow-hidden xl:sticky xl:top-20">
          <div className="grid grid-cols-2 border-b border-border bg-secondary/40">
            <button
              type="button"
              onClick={() => setAgentTab("summary")}
              className={cn(
                "flex items-center justify-center gap-2 border-r border-border px-4 py-3 text-sm",
                agentTab === "summary"
                  ? "bg-card font-semibold text-primary-deep"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Bot className="size-4" /> 摘要報告
            </button>
            <button
              type="button"
              onClick={() => setAgentTab("chat")}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 text-sm",
                agentTab === "chat"
                  ? "bg-card font-semibold text-primary-deep"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <MessageSquareText className="size-4" /> 詢問 Agent
            </button>
          </div>

          {agentTab === "summary" ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="rounded-md border border-danger/20 bg-danger-soft p-4">
                <div className="text-xs font-semibold text-danger">目前判讀</div>
                <p className="mt-1.5 text-sm font-medium leading-6 text-primary-deep">
                  {profile.summary}
                </p>
              </div>
              <div className="mt-5">
                <h3 className="text-xs font-semibold text-primary-deep">衝突核心</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {profile.facts.slice(0, 2).join("；")}。兩項紀錄在同一期間無法完整解釋現況。
                </p>
              </div>
              <div className="mt-5">
                <h3 className="text-xs font-semibold text-primary-deep">尚待確認</h3>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-muted-foreground">
                  {(profile.missing.length ? profile.missing : ["目前無待確認資料"]).map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 rounded-md border border-primary/20 bg-primary-soft p-4">
                <div className="text-xs font-semibold text-primary-deep">建議下一步</div>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {profile.nextAction}
                </p>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                本報告只整理本案已取得的證據、衝突與缺口；處置仍由承辦人決定。
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-secondary/35 px-5 py-4">
                <div className="max-w-[92%] rounded-lg border border-border bg-card px-3.5 py-3 text-xs leading-5 text-muted-foreground">
                  只依本案已載入的事件與證據回答，不代替行政判斷。
                </div>
                {caseChat.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      "max-w-[92%] rounded-lg px-3.5 py-3 text-xs leading-5",
                      message.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "border border-border bg-card text-primary-deep",
                    )}
                  >
                    {message.text}
                  </div>
                ))}
              </div>
              <div className="shrink-0 border-t border-border p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {["還缺哪些證據？", "下一步怎麼查？"].map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => askAgent(question)}
                      className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    askAgent();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={chatInput}
                    onChange={(event) =>
                      setChatDrafts((current) => ({
                        ...current,
                        [record.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="詢問這個案件的證據與判讀…"
                    className="min-h-16 flex-1 resize-none rounded-md border border-border bg-card px-3 py-2.5 text-sm text-primary-deep outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    aria-label="送出問題"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </section>

      {drawer === "evidence" && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="關閉原始證據"
            onClick={() => setDrawer(null)}
            className="absolute inset-0 bg-primary-deep/25"
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(34rem,100vw)] flex-col bg-card shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-primary-deep">
                  <FileText className="size-5 text-primary" /> 原始證據
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  文件內容受權限與個資遮蔽規則控管，不改變主工作區位置。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                aria-label="關閉"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={record.identityVerified ? "success" : "neutral"}>
                  {record.identityVerified ? "身分已核驗" : "身分待核驗"}
                </StatusPill>
                <StatusPill tone="primary" dot={false}>
                  {record.docs.length} 份文件
                </StatusPill>
              </div>
              <ul className="mt-5 divide-y divide-border border-y border-border">
                {record.docs.map((doc) => (
                  <li key={doc.id} className="py-4">
                    <div className="text-sm font-medium text-primary-deep">{doc.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {docKindMeta[doc.kind].label} ·{" "}
                      {doc.status === "verified" ? "已驗證" : "待辨識"} · 上傳於 {doc.uploadedAt}
                    </div>
                  </li>
                ))}
                {record.docs.length === 0 && (
                  <li className="py-8 text-center text-sm text-muted-foreground">尚無附件。</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      )}

      {drawer === "decision" && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="關閉承辦處置"
            onClick={() => setDrawer(null)}
            className="absolute inset-0 bg-primary-deep/25"
          />
          <aside className="absolute inset-y-0 right-0 w-[min(48rem,100vw)] overflow-y-auto bg-primary-soft shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawer(null)}
              aria-label="關閉"
              className="absolute top-4 right-4 z-10 rounded-md bg-card p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
            <section className="p-7 pr-16">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-primary-deep">
                    <Gavel className="size-5 text-primary" /> 承辦處置
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    所有決定都會寫入稽核紀錄；紅燈本身不會自動觸發裁罰。
                  </p>
                </div>
                <label className="text-xs text-muted-foreground">
                  指派承辦人
                  <select
                    value={record.assignee}
                    onChange={(e) => assign(record.id, e.target.value)}
                    className="mt-1.5 block w-60 rounded-md border border-border bg-card px-3 py-2 text-sm text-primary-deep"
                  >
                    <option value="尚未指派">尚未指派</option>
                    {reviewers.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {record.review && (
                <div className="mt-6 rounded-md border border-success/30 bg-card p-5">
                  <div className="flex flex-wrap justify-between gap-3 text-sm">
                    <strong className="text-primary-deep">
                      {decisionMeta[record.review.decision].label}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {record.review.reviewer} · {record.review.at}
                    </span>
                  </div>
                  {record.review.note && (
                    <p className="mt-2 text-sm text-muted-foreground">{record.review.note}</p>
                  )}
                  {record.state === "confirmed" && (
                    <button
                      onClick={() => markRemediated(record.id)}
                      className="mt-4 inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground"
                    >
                      <Check className="size-4" /> 確認改善完成
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-6 border-t border-primary/15 pt-6 lg:grid-cols-2">
                <div className="space-y-2">
                  {(Object.keys(decisionMeta) as ReviewDecision[]).map((item) => (
                    <label
                      key={item}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-md border bg-card p-3.5",
                        decision === item ? "border-primary" : "border-border",
                      )}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === item}
                        onChange={() => setDecision(item)}
                        className="mt-1 size-4 accent-[oklch(0.475_0.128_254)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-primary-deep">
                          {decisionMeta[item].label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {decisionMeta[item].detail}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="space-y-4">
                  <label className="block text-xs text-muted-foreground">
                    處置理由
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="指出採用的證據、排除的合理解釋與法律依據。"
                      className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-primary-deep outline-none focus:border-primary"
                    />
                  </label>
                  {decision === "confirmed" && (
                    <label className="block text-xs text-muted-foreground">
                      改善／返還金額（選填）
                      <input
                        inputMode="numeric"
                        value={refund}
                        onChange={(e) => setRefund(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-primary-deep outline-none focus:border-primary"
                      />
                    </label>
                  )}
                  <label className="block text-xs text-muted-foreground">
                    給當事人的程序通知
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder={decisionMeta[decision].detail}
                      className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-primary-deep outline-none focus:border-primary"
                    />
                  </label>
                  <button
                    onClick={submitDecision}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
                  >
                    <Send className="size-4" /> 以「{reviewer}」送出
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}

      {drawer === "audit" && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="關閉稽核軌跡"
            onClick={() => setDrawer(null)}
            className="absolute inset-0 bg-primary-deep/25"
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(44rem,100vw)] flex-col bg-card shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-primary-deep">
                  <ClipboardList className="size-5 text-primary" /> 個案稽核軌跡
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  誰在何時查看、比對或處置，以及當時採用的授權依據。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawer(null)}
                aria-label="關閉"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </header>
            <ol className="min-h-0 flex-1 divide-y divide-border overflow-y-auto px-6">
              {events.map((event) => {
                const actor = actorMeta[event.actor];
                return (
                  <li key={event.id} className="flex gap-4 py-5">
                    <actor.icon className={cn("mt-0.5 size-4 shrink-0", actor.cls)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="text-sm font-medium text-primary-deep">
                          {actor.label} · {event.action}
                        </span>
                        <span className="num text-xs text-muted-foreground">{event.at}</span>
                      </div>
                      <div className="mt-1.5 text-xs leading-5 text-muted-foreground">
                        {event.evidence} · 授權：{event.auth} · 結果：{event.result}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}
    </div>
  );
}

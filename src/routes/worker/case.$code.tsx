import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
} from "lucide-react";

import { usePlatform, useT } from "@/components/platform-store";
import { statusMeta, docKindMeta, type CaseDoc } from "@/data/cases";
import { BigButton } from "@/components/worker-shell";
import { StatusPill } from "@/components/status-pill";
import { assessCase } from "@/lib/risk-engine";
import { benchmarkFor, guessDocKind } from "@/lib/analysis";
import { money } from "@/data/compliance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/worker/case/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `申報 ${params.code}｜TrustRBA 移工端` },
      {
        name: "description",
        content: "以查詢碼查看申報進度：基準比對結果、證據完整度、企業審核狀態與回覆。",
      },
    ],
  }),
  component: WorkerCase,
});

/** 隱私對照表：企業看得到什麼、看不到什麼。 */
const shown = [
  { zh: "支付金額與幣別", en: "Amount and currency" },
  { zh: "支付日期", en: "Payment date" },
  { zh: "來源國與工作地", en: "Origin and destination" },
  { zh: "仲介／收款方名稱", en: "Agency or payee name" },
  { zh: "匿名代號", en: "Anonymous reference" },
];
const hidden = [
  { zh: "你的姓名", en: "Your name" },
  { zh: "護照與居留證號", en: "Passport and ID number" },
  { zh: "電話號碼", en: "Phone number" },
  { zh: "銀行帳號", en: "Bank account number" },
  { zh: "居住地址", en: "Home address" },
  { zh: "原始未遮蔽文件", en: "Original unmasked documents" },
];

function WorkerCase() {
  const { code } = Route.useParams();
  const { getByCode, addDocs, locale } = usePlatform();
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const record = getByCode(code);
  const label = (x: { zh: string; en: string }) => (locale === "zh" ? x.zh : x.en);

  if (!record) {
    return (
      <div className="space-y-6">
        <p className="rounded-lg border border-danger/25 bg-danger-soft px-5 py-4 text-sm text-danger">
          {t("portal.codeNotFound")}
        </p>
        <Link
          to="/worker"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> {t("portal.name")}
        </Link>
      </div>
    );
  }

  const a = assessCase(record);
  const base = benchmarkFor(record.origin);
  const over = Math.max(0, record.fee - base);
  const deltaPercent = base > 0 ? Math.round((over / base) * 100) : 0;
  const suspected = over > 0 && deltaPercent >= 15;
  const max = Math.max(record.fee, base);
  const meta = statusMeta[record.state];

  const timeline = [
    { label: t("wiz.submit"), at: record.submittedAt, done: true },
    { label: t("portal.how3"), at: record.submittedAt, done: true },
    { label: t("portal.how4"), at: record.submittedAt, done: true },
    {
      label: t("res.status"),
      at: record.review?.at ?? "—",
      done: record.state !== "pending_review",
    },
  ];

  const upload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const docs: CaseDoc[] = [...files].map((f, i) => ({
      id: `A-${Date.now()}-${i}`,
      kind: guessDocKind(f.name),
      name: f.name,
      size: f.size,
      uploadedAt: new Date().toISOString().slice(0, 10).replace(/-/g, " / "),
      ocrAmount: null,
      redactedCount: 0,
      status: "processing",
    }));
    window.setTimeout(() => {
      addDocs(
        record.id,
        docs.map((d) => ({ ...d, status: "verified" as const })),
      );
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }, 900);
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/worker"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> {t("portal.name")}
        </Link>
        <h1 className="mt-3 text-xl font-bold text-primary-deep">{t("res.title")}</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {record.code} · {record.submittedAt}
        </p>
      </div>

      {/* 狀態 */}
      <section
        className={cn(
          "rounded-lg border p-6",
          meta.tone === "danger"
            ? "border-danger/30 bg-danger-soft"
            : meta.tone === "success"
              ? "border-success/30 bg-success-soft"
              : "border-primary/25 bg-primary-soft",
        )}
      >
        <div className="text-xs tracking-wider text-muted-foreground">{t("res.status")}</div>
        <div className="mt-1.5 text-lg font-bold text-primary-deep">{t(`st.${record.state}`)}</div>
        {record.review?.refund ? (
          <div className="mt-3 text-sm text-primary-deep">
            {t("res.overchargeAmount")}：
            <span className="num ml-1 text-danger">{money(record.review.refund)}</span>
          </div>
        ) : null}
      </section>

      {/* 基準比對 */}
      <section className="card-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-primary-deep">
            {suspected ? t("res.suspected") : t("res.withinRange")}
          </h2>
          <StatusPill tone={suspected ? "danger" : "success"}>
            {suspected ? `+${deltaPercent}% ${t("res.gap")}` : "OK"}
          </StatusPill>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">{t("res.youPaid")}</span>
              <span className="num text-primary-deep">{money(record.fee)}</span>
            </div>
            <div className="mt-1.5 h-3 rounded bg-muted">
              <div
                className={cn("h-3 rounded", suspected ? "bg-danger" : "bg-primary")}
                style={{ width: `${(record.fee / max) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">{t("res.benchmark")}</span>
              <span className="num text-primary-deep">{money(base)}</span>
            </div>
            <div className="mt-1.5 h-3 rounded bg-muted">
              <div
                className="h-3 rounded bg-primary-deep/35"
                style={{ width: `${(base / max) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {suspected && (
          <div className="mt-6 rounded-md border border-danger/25 bg-danger-soft px-4 py-3">
            <div className="text-xs text-muted-foreground">{t("res.overchargeAmount")}</div>
            <div className="num mt-1 text-2xl text-danger">{money(over)}</div>
          </div>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("res.estimate")}</p>
      </section>

      {/* 證據完整度 */}
      <section className="card-surface p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-primary-deep">{t("res.evidence")}</h2>
          <span className="num text-2xl text-primary-deep">
            {a.evidenceScore}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/ 100</span>
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${Math.min(a.evidenceScore, 100)}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("res.evidenceHint")}
        </p>

        <ul className="mt-5 space-y-2 border-t border-border pt-5">
          {record.docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="size-3.5 shrink-0 text-primary" />
                <span className="truncate text-primary-deep">{d.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {docKindMeta[d.kind].label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <BigButton variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> …
              </>
            ) : (
              <>
                <Paperclip className="size-4" /> {t("res.addDoc")}
              </>
            )}
          </BigButton>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </div>
      </section>

      {/* 進度 */}
      <section className="card-surface p-6">
        <h2 className="text-base font-bold text-primary-deep">{t("res.timeline")}</h2>
        <ol className="mt-5 space-y-4">
          {timeline.map((s) => (
            <li key={s.label} className="flex gap-3.5">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  s.done ? "bg-success text-success-foreground" : "border border-border bg-card",
                )}
              >
                {s.done && <Check className="size-3" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-primary-deep">{s.label}</span>
                <span className="block text-xs text-muted-foreground">{s.at}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 企業回覆 */}
      <section className="card-surface p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-primary-deep">
          <MessageSquare className="size-4 text-primary" /> {t("res.reply")}
        </h2>
        {record.workerReply ? (
          <p className="mt-4 rounded-md border border-border bg-secondary px-4 py-3.5 text-sm leading-relaxed text-primary-deep">
            {record.workerReply}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t("res.noReply")}</p>
        )}
      </section>

      {/* 隱私對照 */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-deep">
            <Eye className="size-3.5 text-primary" /> {t("res.privacyShown")}
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {shown.map((s) => (
              <li key={s.en}>· {label(s)}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-success/25 bg-success-soft p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-success">
            <EyeOff className="size-3.5" /> {t("res.privacyHidden")}
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-primary-deep/75">
            {hidden.map((s) => (
              <li key={s.en}>· {label(s)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-primary-deep">{t("res.next")}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {[t("res.next1"), t("res.next2"), t("res.next3")].map((x) => (
            <li key={x}>· {x}</li>
          ))}
        </ul>
      </section>

      <p className="flex gap-2 rounded-md border border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
        {t("res.notLegal")}
      </p>
    </div>
  );
}

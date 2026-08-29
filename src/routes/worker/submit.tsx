import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Paperclip,
  Trash2,
} from "lucide-react";

import { BigButton, Field, inputClass } from "@/components/worker-shell";
import { usePlatform, useT } from "@/components/platform-store";
import { docKindMeta, type CaseDoc, type DocKind } from "@/data/cases";
import {
  analyse,
  currencies,
  guessDocKind,
  originOptions,
  paymentMethods,
  toTWD,
  workplaceOptions,
  type CurrencyCode,
} from "@/lib/analysis";
import { deidentify, retainedFields } from "@/lib/deidentify";
import { money } from "@/data/compliance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/worker/submit")({
  head: () => ({
    meta: [
      { title: "上傳我的資料｜TrustRBA 移工端" },
      {
        name: "description",
        content: "四個步驟完成申報：填寫基本資料、上傳文件、確認去識別化、送出並取得查詢碼。",
      },
    ],
  }),
  component: SubmitWizard,
});

type LocalDoc = CaseDoc & { text: string; scanning: boolean };

/** 依文件類型產生一段可編輯的 OCR 文字，讓去識別化步驟有真實的內容可以遮蔽。 */
function sampleOcrText(kind: DocKind, agency: string, amount: string): string {
  const head = `姓名：Nguyễn Văn Hùng\n護照號碼：C1234567\n電話：0912-345-678\n地址：桃園市中壢區中央西路二段 100 號`;
  switch (kind) {
    case "receipt":
      return `收據 / BIÊN LAI\n${head}\n收款單位：${agency || "ABC Recruitment Agency"}\n項目：仲介服務費、訓練費、體檢費\n金額：NT$${amount}\n日期：2025/11/03`;
    case "transfer":
      return `匯款申請書\n${head}\n帳號：0123456789012\n收款人：${agency || "ABC Recruitment Agency"}\n匯款金額：NT$${amount}\n匯款日期：2025/11/05`;
    case "contract":
      return `招聘服務契約\n${head}\n出生：1996/04/22\nEmail：hung.nguyen@example.com\n乙方：${agency || "ABC Recruitment Agency"}\n服務費：NT$0\n契約期間：2025/11 – 2028/11`;
    case "payslip":
      return `薪資明細\n${head}\n本月扣款：仲介借款攤還 NT$${amount}\n實發金額：NT$21,500\n期間：2025/12`;
    case "message":
      return `對話紀錄\n${head}\n仲介：出國前要先繳 NT$${amount}，收據之後再給你\n我：好，我明天匯過去`;
    default:
      return `${head}\n金額：NT$${amount}`;
  }
}

const emptyForm = {
  origin: "越南",
  workplace: "台灣",
  agency: "",
  arrivedAt: "",
  amount: "",
  currency: "TWD" as CurrencyCode,
  paymentMethod: paymentMethods[0]!,
  note: "",
};

const analysisStages = [
  "檢查文件是否可讀取…",
  "遮蔽個人資料…",
  "與 ILO / KNOMAD 招聘費基準比對…",
  "計算證據完整度與風險分數…",
];

function SubmitWizard() {
  const t = useT();
  const navigate = useNavigate();
  const { addSubmission } = usePlatform();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [docs, setDocs] = useState<LocalDoc[]>([]);
  const [errors, setErrors] = useState<{ agency?: string; arrivedAt?: string; amount?: string }>(
    {},
  );
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<{ code: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const amountNumber = Number(form.amount.replace(/[^\d.]/g, "")) || 0;
  const paidTWD = toTWD(amountNumber, form.currency);

  /** 待送出的完整文字：申報說明 + 每份文件的 OCR 文字。 */
  const rawText = useMemo(
    () =>
      [form.note, ...docs.map((d) => `【${docKindMeta[d.kind].label}】\n${d.text}`)]
        .filter(Boolean)
        .join("\n\n"),
    [form.note, docs],
  );
  const deid = useMemo(() => deidentify(rawText), [rawText]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: LocalDoc[] = [...files].map((f, i) => {
      const kind = guessDocKind(f.name);
      return {
        id: `L-${Date.now()}-${i}`,
        kind,
        name: f.name,
        size: f.size,
        uploadedAt: new Date().toISOString().slice(0, 10).replace(/-/g, " / "),
        ocrAmount: null,
        redactedCount: 0,
        status: "processing",
        text: "",
        scanning: true,
      };
    });
    setDocs((d) => [...d, ...next]);

    // 模擬掃描：實際產品在此呼叫 OCR 服務，結果一律讓使用者確認後才採用。
    next.forEach((doc, i) => {
      window.setTimeout(
        () => {
          setDocs((prev) =>
            prev.map((d) =>
              d.id === doc.id
                ? {
                    ...d,
                    scanning: false,
                    status: "verified",
                    // 合約列出的是「聲明金額」，示範文件刻意寫 NT$0，與實付形成對照。
                    ocrAmount: d.kind === "contract" ? 0 : amountNumber || null,
                    text: sampleOcrText(
                      d.kind,
                      form.agency,
                      (amountNumber || 45000).toLocaleString("en-US"),
                    ),
                  }
                : d,
            ),
          );
        },
        700 + i * 350,
      );
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateDoc = (id: string, patch: Partial<LocalDoc>) =>
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const validateStep1 = () => {
    const e: { agency?: string; arrivedAt?: string; amount?: string } = {};
    if (!form.agency.trim()) e.agency = t("wiz.required");
    if (!form.arrivedAt.trim()) e.arrivedAt = t("wiz.required");
    if (amountNumber <= 0) e.amount = t("wiz.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    setStage(0);
    const run = (i: number) => {
      if (i >= analysisStages.length) {
        const finalDocs: CaseDoc[] = docs.map((d) => {
          const { text, scanning, ...rest } = d;
          void text;
          void scanning;
          return { ...rest, redactedCount: deid.findings.length };
        });
        const input = {
          origin: form.origin,
          workplace: form.workplace,
          agency: form.agency.trim(),
          arrivedAt: form.arrivedAt.trim(),
          amount: amountNumber,
          currency: form.currency,
          paymentMethod: form.paymentMethod,
          note: deidentify(form.note).redacted,
          docs: finalDocs,
        };
        const analysis = analyse(input);
        const record = addSubmission(input, analysis, deid.findings.length);
        setResult({ code: record.code!, id: record.id });
        setStep(5);
        return;
      }
      setStage(i);
      window.setTimeout(() => run(i + 1), 720);
    };
    run(0);
  };

  const stepLabels = [t("wiz.step1"), t("wiz.step2"), t("wiz.step3"), t("wiz.step4")];

  if (step === 5 && result) {
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-success/30 bg-success-soft p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="size-6" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-primary-deep">{t("wiz.doneTitle")}</h1>
          <p className="mt-6 text-xs tracking-wider text-muted-foreground">{t("wiz.yourCode")}</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="num font-mono text-2xl tracking-widest text-primary-deep">
              {result.code}
            </span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(result.code);
                setCopied(true);
              }}
              className="rounded-md border border-border bg-card p-2 text-muted-foreground hover:bg-muted"
              aria-label="複製查詢碼"
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </button>
          </div>
          <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-muted-foreground">
            {t("wiz.saveCode")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <BigButton
            onClick={() => navigate({ to: "/worker/case/$code", params: { code: result.code } })}
          >
            {t("wiz.viewResult")} <ArrowRight className="size-4" />
          </BigButton>
          <Link
            to="/worker"
            className="inline-flex items-center justify-center rounded-lg border border-border-strong bg-card px-6 py-3.5 text-sm font-semibold text-primary-deep hover:bg-muted"
          >
            {t("portal.name")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 步驟指示 */}
      <ol className="flex items-center gap-1.5">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          return (
            <li key={label} className="flex flex-1 items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "h-1 rounded-full",
                    n < step ? "bg-success" : n === step ? "bg-primary" : "bg-border",
                  )}
                />
                <div
                  className={cn(
                    "mt-2 truncate text-[11px]",
                    n === step ? "font-semibold text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <section className="space-y-5">
          <h1 className="text-xl font-bold text-primary-deep">{t("wiz.step1")}</h1>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("wiz.origin")}>
              <select
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                className={inputClass}
              >
                {originOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label={t("wiz.workplace")}>
              <select
                value={form.workplace}
                onChange={(e) => set("workplace", e.target.value)}
                className={inputClass}
              >
                {workplaceOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t("wiz.agency")} hint={t("wiz.agencyHint")} error={errors.agency}>
            <input
              value={form.agency}
              onChange={(e) => set("agency", e.target.value)}
              placeholder="ABC Recruitment Agency"
              className={inputClass}
            />
          </Field>

          <Field label={t("wiz.arrived")} error={errors.arrivedAt}>
            <input
              value={form.arrivedAt}
              onChange={(e) => set("arrivedAt", e.target.value)}
              placeholder="2025 / 11"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
            <Field label={t("wiz.amount")} hint={t("wiz.amountHint")} error={errors.amount}>
              <input
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="60000"
                className={inputClass}
              />
            </Field>
            <Field label={t("wiz.currency")}>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className={inputClass}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {amountNumber > 0 && form.currency !== "TWD" && (
            <p className="text-xs text-muted-foreground">
              換算後約 <span className="num text-primary-deep">{money(paidTWD)}</span>
            </p>
          )}

          <Field label={t("wiz.method")}>
            <select
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
              className={inputClass}
            >
              {paymentMethods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label={t("wiz.note")} hint={t("wiz.noteHint")}>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <h1 className="text-xl font-bold text-primary-deep">{t("wiz.upload")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("wiz.uploadHint")}</p>

          <div className="rounded-lg border border-dashed border-border-strong bg-card p-8 text-center">
            <Paperclip className="mx-auto size-6 text-muted-foreground" />
            <div className="mt-4">
              <BigButton variant="ghost" onClick={() => fileRef.current?.click()}>
                {t("wiz.uploadChoose")}
              </BigButton>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {docs.length === 0 ? (
            <p className="rounded-md border border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {t("wiz.uploadEmpty")}
            </p>
          ) : (
            <ul className="space-y-4">
              {docs.map((d) => (
                <li key={d.id} className="card-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-primary-deep">
                          {d.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(d.size / 1024).toFixed(0)} KB
                          {d.scanning && (
                            <span className="ml-2 inline-flex items-center gap-1 text-primary">
                              <Loader2 className="size-3 animate-spin" /> 辨識中…
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDocs((prev) => prev.filter((x) => x.id !== d.id))}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-3.5" /> {t("wiz.remove")}
                    </button>
                  </div>

                  {!d.scanning && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-xs text-muted-foreground">
                            {t("wiz.uploadKind")}
                          </span>
                          <select
                            value={d.kind}
                            onChange={(e) => {
                              const kind = e.target.value as DocKind;
                              updateDoc(d.id, {
                                kind,
                                ocrAmount: kind === "contract" ? 0 : amountNumber || null,
                                text: sampleOcrText(
                                  kind,
                                  form.agency,
                                  (amountNumber || 45000).toLocaleString("en-US"),
                                ),
                              });
                            }}
                            className={`${inputClass} mt-1.5 py-2`}
                          >
                            {Object.entries(docKindMeta).map(([k, m]) => (
                              <option key={k} value={k}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs text-muted-foreground">
                            文件上的金額（OCR，請確認）
                          </span>
                          <input
                            inputMode="numeric"
                            value={d.ocrAmount ?? ""}
                            onChange={(e) =>
                              updateDoc(d.id, {
                                ocrAmount: Number(e.target.value.replace(/[^\d]/g, "")) || null,
                              })
                            }
                            className={`${inputClass} mt-1.5 py-2`}
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-xs text-muted-foreground">
                          文件文字（OCR 擷取，可修改；下一步會遮蔽個資）
                        </span>
                        <textarea
                          value={d.text}
                          onChange={(e) => updateDoc(d.id, { text: e.target.value })}
                          rows={5}
                          className={`${inputClass} mt-1.5 font-mono text-xs leading-relaxed`}
                        />
                      </label>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <h1 className="text-xl font-bold text-primary-deep">{t("wiz.deidTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("wiz.deidIntro")}</p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <EyeOff className="size-3.5" />
              {deid.findings.length > 0
                ? t("wiz.deidFound", { n: deid.findings.length })
                : t("wiz.deidNone")}
            </span>
          </div>

          {deid.findings.length > 0 && (
            <ul className="card-surface divide-y divide-border">
              {deid.findings.map((f) => (
                <li key={`${f.kind}-${f.original}`} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-medium text-primary-deep">{f.label}</span>
                    <span className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-muted-foreground line-through">{f.original}</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className="text-success">{f.masked}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{f.reason}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted p-5">
              <div className="text-xs font-medium text-muted-foreground">{t("wiz.deidBefore")}</div>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground">
                {rawText || "—"}
              </pre>
            </div>
            <div className="rounded-lg border border-success/30 bg-success-soft p-5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                <Lock className="size-3.5" /> {t("wiz.deidAfter")}
              </div>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-primary-deep">
                {deid.redacted || "—"}
              </pre>
            </div>
          </div>

          <div className="card-surface p-5">
            <div className="text-xs font-medium text-primary-deep">{t("wiz.deidRetain")}</div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {retainedFields.map((f) => (
                <li key={f.label} className="text-xs text-muted-foreground">
                  <span className="font-medium text-primary-deep">{f.label}</span> — {f.reason}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-5">
          <h1 className="text-xl font-bold text-primary-deep">{t("wiz.step4")}</h1>

          <dl className="card-surface divide-y divide-border text-sm">
            {[
              { k: t("wiz.origin"), v: `${form.origin} → ${form.workplace}` },
              { k: t("wiz.agency"), v: form.agency },
              { k: t("wiz.arrived"), v: form.arrivedAt },
              { k: t("wiz.amount"), v: money(paidTWD) },
              { k: t("wiz.method"), v: form.paymentMethod },
              { k: t("wiz.upload"), v: `${docs.length}` },
              { k: t("wiz.deidAfter"), v: `${deid.findings.length}` },
            ].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-4 px-5 py-3">
                <dt className="text-muted-foreground">{r.k}</dt>
                <dd className="text-right font-medium text-primary-deep">{r.v}</dd>
              </div>
            ))}
          </dl>

          <div className="space-y-3">
            {[
              { checked: consent1, set: setConsent1, label: t("wiz.consent1") },
              { checked: consent2, set: setConsent2, label: t("wiz.consent2") },
            ].map((c) => (
              <label
                key={c.label}
                className="flex cursor-pointer gap-3 rounded-lg border border-border bg-card p-4"
              >
                <input
                  type="checkbox"
                  checked={c.checked}
                  onChange={(e) => c.set(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[oklch(0.475_0.128_254)]"
                />
                <span className="text-sm leading-relaxed text-primary-deep">{c.label}</span>
              </label>
            ))}
          </div>

          {stage >= 0 && (
            <ol className="card-surface space-y-2 p-5">
              {analysisStages.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  {i < stage ? (
                    <Check className="size-4 shrink-0 text-success" />
                  ) : i === stage ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <span className="size-4 shrink-0 rounded-full border border-border" />
                  )}
                  <span className={i <= stage ? "text-primary-deep" : "text-muted-foreground/50"}>
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <p className="flex gap-2 rounded-md border border-border bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            {t("res.notLegal")}
          </p>
        </section>
      )}

      {/* 導航 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        {step > 1 ? (
          <BigButton variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={stage >= 0}>
            <ArrowLeft className="size-4" /> {t("wiz.back")}
          </BigButton>
        ) : (
          <Link
            to="/worker"
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-card px-6 py-3.5 text-sm font-semibold text-primary-deep hover:bg-muted"
          >
            <ArrowLeft className="size-4" /> {t("wiz.back")}
          </Link>
        )}

        {step < 4 ? (
          <BigButton
            onClick={() => {
              if (step === 1 && !validateStep1()) return;
              setStep((s) => s + 1);
            }}
          >
            {t("wiz.next")} <ArrowRight className="size-4" />
          </BigButton>
        ) : (
          <BigButton onClick={submit} disabled={!consent1 || !consent2 || stage >= 0}>
            {stage >= 0 ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("wiz.submitting")}
              </>
            ) : (
              <>
                {t("wiz.submit")} <ArrowRight className="size-4" />
              </>
            )}
          </BigButton>
        )}
      </div>
    </div>
  );
}

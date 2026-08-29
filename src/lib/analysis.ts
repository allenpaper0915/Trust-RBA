/**
 * 移工申報 → 合規分析。
 *
 * 全部使用固定的匯率表、基準表與權重表計算，LLM 不參與，
 * 因此同一份申報在任何時候重算都會得到相同結果。
 */

import { benchmark } from "@/data/compliance";
import type { EvidenceKey } from "@/data/compliance";
import { docKindMeta, type CaseDoc, type DocKind } from "@/data/cases";
import { assessCase } from "@/lib/risk-engine";
import type { CaseSeed } from "@/data/compliance";

/** 固定匯率表（示範用；正式環境應改為每日匯率服務）。 */
export const currencies = [
  { code: "TWD", label: "新台幣 TWD", rate: 1 },
  { code: "VND", label: "越南盾 VND", rate: 0.00125 },
  { code: "IDR", label: "印尼盾 IDR", rate: 0.0019 },
  { code: "PHP", label: "披索 PHP", rate: 0.55 },
  { code: "THB", label: "泰銖 THB", rate: 0.88 },
  { code: "USD", label: "美元 USD", rate: 31.8 },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];

export function toTWD(amount: number, code: CurrencyCode): number {
  const c = currencies.find((x) => x.code === code) ?? currencies[0];
  return Math.round(amount * c.rate);
}

export const originOptions = ["越南", "印尼", "菲律賓", "泰國"];
export const workplaceOptions = ["台灣"];
export const paymentMethods = [
  "現金",
  "銀行轉帳",
  "薪資扣款",
  "向親友借款後轉帳",
  "現金 + 薪資扣款",
];

/** 取得該移工走廊的基準招聘費（新台幣）。 */
export function benchmarkFor(origin: string): number {
  const row = benchmark.corridors.find((c) => c.corridor.startsWith(origin));
  return row?.benchmark ?? benchmark.benchmarkFee;
}

/** 文件類型 → 證據權重類型。 */
export function evidenceKeysFromDocs(docs: { kind: DocKind }[]): EvidenceKey[] {
  const keys = new Set<EvidenceKey>();
  for (const d of docs) keys.add(docKindMeta[d.kind].weight);
  return [...keys];
}

export type SubmissionInput = {
  origin: string;
  workplace: string;
  agency: string;
  arrivedAt: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod: string;
  note: string;
  docs: CaseDoc[];
};

export type AnalysisResult = {
  /** 換算後的實付金額（新台幣） */
  paid: number;
  /** 該走廊的基準 */
  benchmark: number;
  /** 高於基準的百分比，低於基準則為 0 */
  deltaPercent: number;
  /** 疑似超收金額，未超收則為 0 */
  overcharge: number;
  suspected: boolean;
  evidenceScore: number;
  riskScore: number;
  level: string;
  label: string;
  tone: "success" | "warning" | "danger";
  present: EvidenceKey[];
  conflicting: EvidenceKey[];
  /** 文件之間金額是否一致 */
  consistency: number;
  policyMatch: number;
};

/**
 * 分析一筆申報。
 *
 * 「衝突證據」的定義：文件金額與仲介／合約聲明金額不一致，
 * 且該文件屬於可獨立佐證付款事實的類型。
 */
export function analyse(input: SubmissionInput): AnalysisResult {
  const paid = toTWD(input.amount, input.currency);
  const base = benchmarkFor(input.origin);
  const over = Math.max(0, paid - base);
  const deltaPercent = base > 0 ? Math.round((over / base) * 100) : 0;
  const suspected = over > 0 && deltaPercent >= 15;

  // 訪談＝移工自己的申報，永遠存在；仲介資料需有合約文件才算取得。
  const present: EvidenceKey[] = ["interview", ...evidenceKeysFromDocs(input.docs)];
  const uniquePresent = [...new Set(present)];

  // 合約金額（OCR 讀到 0 或缺漏視為未聲明），用來判斷衝突。
  const contractDoc = input.docs.find((d) => d.kind === "contract");
  const claimed = contractDoc?.ocrAmount ?? 0;
  const conflicting: EvidenceKey[] = suspected
    ? uniquePresent.filter((k) => k === "interview" || k === "receipt" || k === "payment")
    : [];
  // 合約聲明與實付差距超過一成即視為衝突證據；聲明 NT$0 而實際有付款也算。
  if (suspected && contractDoc && Math.abs(claimed - paid) > paid * 0.1) {
    conflicting.push("agency");
  }

  // 證據一致性：每一份可讀文件的金額與申報金額的吻合度平均。
  // 合約屬「聲明」而非「佐證」，OCR 金額為 0 時自然被排除在外。
  const readable = input.docs.filter(
    (d) => d.kind !== "contract" && d.ocrAmount !== null && d.ocrAmount > 0,
  );
  const closeness = readable.map((d) => {
    const amount = d.ocrAmount ?? 0;
    return Math.min(amount, paid) / Math.max(amount, paid, 1);
  });
  const consistency = closeness.length
    ? Math.round(40 + 59 * (closeness.reduce((s, c) => s + c, 0) / closeness.length))
    : 60;

  const pseudo = {
    present: uniquePresent,
    conflicting: [...new Set(conflicting)],
  } as unknown as CaseSeed;
  const a = assessCase(pseudo);

  return {
    paid,
    benchmark: base,
    deltaPercent,
    overcharge: over,
    suspected,
    evidenceScore: a.evidenceScore,
    riskScore: a.riskScore,
    level: a.level,
    label: a.label,
    tone: a.tone,
    present: uniquePresent,
    conflicting: [...new Set(conflicting)],
    consistency: Math.min(consistency, 99),
    policyMatch: suspected ? 90 : 96,
  };
}

/** 依副檔名與檔名關鍵字猜測文件類型，讓上傳流程少一次點擊。 */
export function guessDocKind(filename: string): DocKind {
  const n = filename.toLowerCase();
  if (/(receipt|kwitansi|bien ?lai|收據|发票|發票)/.test(n)) return "receipt";
  if (/(transfer|remit|匯款|转账|轉帳|slip)/.test(n)) return "transfer";
  if (/(contract|hop ?dong|kontrak|合約|合同)/.test(n)) return "contract";
  if (/(payslip|gaji|薪資|薪资|salary)/.test(n)) return "payslip";
  if (/(chat|message|screenshot|對話|截圖)/.test(n)) return "message";
  return "other";
}

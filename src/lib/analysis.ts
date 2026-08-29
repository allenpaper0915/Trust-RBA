/**
 * 移工申報 → 合規分析。
 *
 * 全部使用固定的匯率表、基準表與權重表計算，LLM 不參與，
 * 因此同一份申報在任何時候重算都會得到相同結果。
 */

import { benchmark } from "@/data/compliance";
import type { EvidenceKey } from "@/data/compliance";
import { docKindMeta, type CaseDoc, type DocKind, type FeeItem } from "@/data/cases";
import { feeCategoryMeta, findVendor, vendorTypeLabel } from "@/data/vendors";
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

/** 取得該來源國的基準招聘費（新台幣）。 */
export function benchmarkFor(origin: string): number {
  const row = benchmark.corridors.find((c) => c.corridor.startsWith(origin));
  return row?.benchmark ?? benchmark.benchmarkFee;
}

/** 文件類型 → 證據權重類型。身分證明不計入費用證據。 */
export function evidenceKeysFromDocs(docs: { kind: DocKind }[]): EvidenceKey[] {
  const keys = new Set<EvidenceKey>();
  for (const d of docs) {
    const w = docKindMeta[d.kind].weight;
    if (w) keys.add(w);
  }
  return [...keys];
}

export type VendorBreakdown = {
  key: string;
  name: string;
  vendorId?: string | undefined;
  typeLabel: string;
  registered: boolean;
  amount: number;
  disallowed: number;
  categories: string[];
};

export type FeeChainResult = {
  total: number;
  /** RBA 規定不得由移工負擔、卻由移工支付的合計 */
  disallowed: number;
  /** 依當地法規可由移工負擔的合計（例如護照規費） */
  allowed: number;
  /** 沒有任何憑證的付款合計 */
  undocumented: number;
  /** 付給企業合約名單外中間商的合計 */
  unregistered: number;
  byVendor: VendorBreakdown[];
};

/**
 * 拆解費用鏈：一次回答三個問題 ——
 * 錢總共去了哪裡、哪幾筆依 RBA 不該由移工出、哪幾家是企業名單外的中間商。
 */
/**
 * 是否為「付給中間商」的款項。
 * 護照與簽證規費是繳給政府的，沒有對應的中間商，也不該被當成名單外廠商。
 */
function isVendorPayment(item: FeeItem): boolean {
  return Boolean(item.vendorId) || !feeCategoryMeta[item.category].workerPayable;
}

export function assessFeeChain(items: FeeItem[]): FeeChainResult {
  const byVendor = new Map<string, VendorBreakdown>();
  let total = 0;
  let disallowed = 0;
  let allowed = 0;
  let undocumented = 0;
  let unregistered = 0;

  for (const item of items) {
    const meta = feeCategoryMeta[item.category];
    const vendor = item.vendorId ? findVendor(item.vendorId) : undefined;
    const isVendor = isVendorPayment(item);
    // 政府規費視為「已知收款方」，只有查無登記的中間商才算名單外。
    const registered = vendor ? vendor.registered : !isVendor;

    total += item.amount;
    if (meta.workerPayable) allowed += item.amount;
    else disallowed += item.amount;
    if (!item.hasDocument) undocumented += item.amount;
    if (!registered) unregistered += item.amount;

    const key = vendor?.id ?? item.payee;
    const row = byVendor.get(key) ?? {
      key,
      name: vendor?.name ?? item.payee,
      vendorId: vendor?.id,
      typeLabel: vendor ? vendorTypeLabel[vendor.type] : isVendor ? "名單外／未登錄" : "政府規費",
      registered,
      amount: 0,
      disallowed: 0,
      categories: [],
    };
    row.amount += item.amount;
    if (!meta.workerPayable) row.disallowed += item.amount;
    if (!row.categories.includes(meta.label)) row.categories.push(meta.label);
    byVendor.set(key, row);
  }

  return {
    total,
    disallowed,
    allowed,
    undocumented,
    unregistered,
    byVendor: [...byVendor.values()].sort((a, b) => b.amount - a.amount),
  };
}

export type SubmissionInput = {
  origin: string;
  workplace: string;
  agency: string;
  arrivedAt: string;
  /** 移工填寫時使用的幣別，僅供顯示；feeItems 的金額一律已換算為新台幣 */
  currency: CurrencyCode;
  paymentMethod: string;
  note: string;
  feeItems: FeeItem[];
  docs: CaseDoc[];
};

export type AnalysisResult = {
  /** 費用鏈加總後的實付金額（新台幣） */
  paid: number;
  chain: FeeChainResult;
  /** 該來源國的基準 */
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
  const chain = assessFeeChain(input.feeItems);
  const paid = chain.total;
  const base = benchmarkFor(input.origin);
  const over = Math.max(0, paid - base);
  const deltaPercent = base > 0 ? Math.round((over / base) * 100) : 0;
  // 兩條獨立的判斷線：相對國際基準偏高，或有 RBA 明文不得由移工負擔的費用。
  const suspected = deltaPercent >= 15 || chain.disallowed > 0;

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
    chain,
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

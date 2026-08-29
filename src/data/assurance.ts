/**
 * 舉證覆蓋（Assurance Coverage）。
 *
 * RBA 稽核問的不是「有沒有人申訴」，而是「你能不能證明沒有收費」。
 * 舉證責任在企業身上，所以「零申訴」不是證據，只是沒有資料。
 *
 * 錢一定有軌跡——除非付的是現金。因此每一名移工的狀態只有四種：
 *   已證明未收費 / 證據不足 / 現金風險 / 已確認收費
 * 而「證據不足」才是 RBA 稽核真正會被打回票的那一塊。
 */

/** 可以拿來證明「沒有向移工收費」的文件。 */
export type EvidenceDocKey =
  | "employer_invoice"
  | "employer_transfer"
  | "agency_ledger"
  | "agency_bank"
  | "worker_bank"
  | "payroll_check"
  | "attestation";

export const evidenceDocs: Record<
  EvidenceDocKey,
  {
    label: string;
    /** 這份文件能證明什麼 */
    proves: string;
    /** 取得難度 */
    access: "internal" | "contract" | "consent";
    accessLabel: string;
    /** 單獨是否足以構成舉證 */
    sufficientAlone: boolean;
  }
> = {
  employer_invoice: {
    label: "雇主付給仲介的發票",
    proves: "招聘成本確實由雇主承擔，而非轉嫁移工。",
    access: "internal",
    accessLabel: "企業內部帳務，立即可得",
    sufficientAlone: false,
  },
  employer_transfer: {
    label: "雇主付款的匯款憑證",
    proves: "款項確實支付、金額與發票可逐筆對帳。",
    access: "internal",
    accessLabel: "企業內部帳務，立即可得",
    sufficientAlone: false,
  },
  agency_ledger: {
    label: "仲介的逐人費用明細",
    proves: "仲介向雇主收了多少、有沒有另外向移工收。",
    access: "contract",
    accessLabel: "合約可要求，需仲介配合",
    sufficientAlone: false,
  },
  agency_bank: {
    label: "仲介帳戶的入帳明細",
    proves: "仲介有沒有從移工個人帳戶收到錢。移工付現金時，這是少數還驗得到的一條。",
    access: "contract",
    accessLabel: "需合約載明查核權，仲介配合",
    sufficientAlone: false,
  },
  worker_bank: {
    label: "移工出國前後的銀行流水",
    proves: "移工「沒有」把錢付給任何一家中間商——證明否定事實的關鍵。",
    access: "consent",
    accessLabel: "需移工授權，來源國銀行",
    sufficientAlone: false,
  },
  payroll_check: {
    label: "薪資帳戶無扣款查核",
    proves: "沒有以薪資扣款的方式回收招聘費或還款。",
    access: "internal",
    accessLabel: "企業內部薪資系統，立即可得",
    sufficientAlone: false,
  },
  attestation: {
    label: "移工具結或匿名訪談",
    proves: "移工本人的陳述。屬主觀證據，單獨不足以構成舉證。",
    access: "consent",
    accessLabel: "高可得性、低證據力",
    sufficientAlone: false,
  },
};

/**
 * 「已證明未收費」的成立條件：
 * 至少一項雇主端的客觀金流證據（發票 + 匯款），
 * 加上一項移工端的客觀金流證據（銀行流水或薪資無扣款）。
 * 只有具結不算——這與平台一貫的立場一致：自我聲明是單一來源。
 */
export const provenRule =
  "雇主端金流憑證（發票＋匯款）＋ 移工端金流佐證（銀行流水或薪資無扣款），兩端都齊備才算已證明。只有具結不算。";

export type DocStatus = {
  key: EvidenceDocKey;
  status: "have" | "partial" | "missing";
  note: string;
};

export type WorkforceSegment = {
  id: string;
  corridor: string;
  /** 對應案件的 origin 欄位 */
  origin: string;
  destAgency: string;
  originAgency: string | null;
  workers: number;
  /** 已具備雙端金流證據的人數（不含案件動態變化） */
  baselineProven: number;
  /** 回報以現金支付、金流本身就沒有軌跡的人數 */
  baselineCash: number;
  docs: DocStatus[];
};

/** 328 名在職移工，依來源國與承辦仲介分群——這也是稽核抽樣的單位。 */
export const workforceSegments: WorkforceSegment[] = [
  {
    id: "SEG-VN",
    corridor: "越南 → 台灣",
    origin: "越南",
    destAgency: "ABC Recruitment Agency",
    originAgency: "Nam Viet Manpower",
    workers: 142,
    baselineProven: 58,
    baselineCash: 31,
    docs: [
      { key: "employer_invoice", status: "have", note: "2024 – 2026 共 11 期發票齊備" },
      { key: "employer_transfer", status: "have", note: "與發票逐筆對帳一致" },
      { key: "payroll_check", status: "have", note: "薪資系統查核無招聘費相關扣款" },
      { key: "agency_ledger", status: "missing", note: "Nam Viet Manpower 拒絕提供逐人費用明細" },
      { key: "agency_bank", status: "missing", note: "合約未載明查核權，無法調閱仲介帳戶入帳" },
      { key: "worker_bank", status: "partial", note: "142 人中 58 人已授權調閱來源國銀行流水" },
      { key: "attestation", status: "partial", note: "匿名訪談 41 份" },
    ],
  },
  {
    id: "SEG-ID",
    corridor: "印尼 → 台灣",
    origin: "印尼",
    destAgency: "ABC Recruitment Agency",
    originAgency: "Sentosa Placement",
    workers: 78,
    baselineProven: 41,
    baselineCash: 9,
    docs: [
      { key: "employer_invoice", status: "have", note: "發票齊備" },
      { key: "employer_transfer", status: "have", note: "與發票逐筆對帳一致" },
      { key: "payroll_check", status: "have", note: "薪資系統查核無相關扣款" },
      { key: "agency_ledger", status: "partial", note: "Sentosa 僅提供彙總金額，未拆到人" },
      { key: "agency_bank", status: "partial", note: "僅提供 2025 下半年入帳明細" },
      { key: "worker_bank", status: "partial", note: "78 人中 41 人已授權調閱" },
      { key: "attestation", status: "have", note: "訪談覆蓋率 100%" },
    ],
  },
  {
    id: "SEG-PH",
    corridor: "菲律賓 → 台灣",
    origin: "菲律賓",
    destAgency: "ABC Recruitment Agency",
    originAgency: "Manila Bridge Placement",
    workers: 41,
    baselineProven: 33,
    baselineCash: 2,
    docs: [
      { key: "employer_invoice", status: "have", note: "發票齊備" },
      { key: "employer_transfer", status: "have", note: "與發票逐筆對帳一致" },
      { key: "payroll_check", status: "have", note: "薪資系統查核無相關扣款" },
      { key: "agency_ledger", status: "have", note: "Manila Bridge 提供逐人明細，零向移工收費" },
      { key: "agency_bank", status: "have", note: "入帳明細顯示零筆來自移工個人帳戶" },
      { key: "worker_bank", status: "partial", note: "41 人中 33 人已授權調閱" },
      { key: "attestation", status: "have", note: "訪談覆蓋率 100%" },
    ],
  },
  {
    id: "SEG-TH",
    corridor: "泰國 → 台灣",
    origin: "泰國",
    destAgency: "直接聘僱（無仲介）",
    originAgency: null,
    workers: 67,
    baselineProven: 67,
    baselineCash: 0,
    docs: [
      { key: "employer_invoice", status: "have", note: "無中間商，招聘成本全由雇主直接支付" },
      { key: "employer_transfer", status: "have", note: "機票、體檢、簽證均由企業付款" },
      { key: "payroll_check", status: "have", note: "薪資系統查核無相關扣款" },
      { key: "agency_ledger", status: "have", note: "無中間商，不適用" },
      { key: "agency_bank", status: "have", note: "無中間商，不適用" },
      { key: "worker_bank", status: "have", note: "67 人全數授權調閱，無對外招聘相關付款" },
      { key: "attestation", status: "have", note: "訪談覆蓋率 100%" },
    ],
  },
];

/**
 * 雇主已經付給仲介的錢。
 * 這是企業手上最容易取得、卻幾乎從來不拿出來的證據：
 * 如果同一段招聘服務雇主已經付過，仲介再向移工收一次，就是重複收費。
 */
/**
 * 各來源國的「真實招聘成本」參考值：把一名移工從當地招募到抵達工作地，
 * 依市場行情實際需要花掉多少（服務費、行前訓練、體檢、機票、簽證與文件）。
 *
 * 這是成本缺口測試的分母。雇主付掉的如果少於這個數，
 * 差額一定有人付了——而唯一的候選人就是移工本人。
 * 這條測試不需要移工配合，也不需要仲介配合，只要企業自己的應付帳款。
 */
export const trueRecruitmentCost: Record<string, { amount: number; basis: string }> = {
  越南: {
    amount: 52_000,
    basis: "ILO 越南—台灣招聘成本調查 ＋ 三家同業報價中位數（2025）",
  },
  印尼: {
    amount: 46_000,
    basis: "IOM 印尼移工招聘成本估算 ＋ 同業報價中位數（2025）",
  },
  菲律賓: {
    amount: 26_000,
    basis: "POEA 公告費率上限 ＋ 同業報價中位數（2025）",
  },
  泰國: {
    amount: 23_000,
    basis: "直聘實際支出（機票、體檢、簽證）逐項加總",
  },
};

export type EmployerPayment = {
  id: string;
  agency: string;
  origin: string;
  period: string;
  workers: number;
  /** 該期總付款（新台幣） */
  amount: number;
  /** 每人分攤 */
  perWorker: number;
  invoiceRef: string;
  transferRef: string;
  /** 是否已與銀行對帳 */
  reconciled: boolean;
};

export const employerPayments: EmployerPayment[] = [
  {
    id: "EP-VN-2025H2",
    agency: "ABC Recruitment Agency",
    origin: "越南",
    period: "2025 H2",
    workers: 46,
    amount: 1_472_000,
    perWorker: 32_000,
    invoiceRef: "INV-2025-0842",
    transferRef: "TXN-20251118-006",
    reconciled: true,
  },
  {
    id: "EP-ID-2025H1",
    agency: "ABC Recruitment Agency",
    origin: "印尼",
    period: "2025 H1",
    workers: 28,
    amount: 812_000,
    perWorker: 29_000,
    invoiceRef: "INV-2025-0311",
    transferRef: "TXN-20250520-002",
    reconciled: true,
  },
  {
    id: "EP-PH-2025H2",
    agency: "ABC Recruitment Agency",
    origin: "菲律賓",
    period: "2025 H2",
    workers: 19,
    amount: 503_500,
    perWorker: 26_500,
    invoiceRef: "INV-2025-0907",
    transferRef: "TXN-20251203-001",
    reconciled: true,
  },
  {
    id: "EP-TH-2025H2",
    agency: "直接聘僱（無仲介）",
    origin: "泰國",
    period: "2025 H2",
    workers: 67,
    amount: 1_608_000,
    perWorker: 24_000,
    invoiceRef: "—（直接支付各服務商）",
    transferRef: "TXN-20250902-011 等 4 筆",
    reconciled: true,
  },
];

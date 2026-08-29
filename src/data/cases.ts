/**
 * 平台層的案件模型。
 *
 * 一筆「案件」可能有兩種來源：
 *   worker —— 移工自己從移工端上傳資料而產生
 *   audit  —— 企業合規團隊抽樣稽核而產生
 * 兩者進入同一個審核佇列，使用同一套 deterministic 計分。
 */

import type { CaseSeed, EvidenceKey } from "@/data/compliance";
import { caseSeeds } from "@/data/compliance";
import type { FeeCategory } from "@/data/vendors";

export type CaseStatus =
  "pending_review" | "investigating" | "need_more" | "confirmed" | "dismissed" | "remediated";

export type CaseSource = "worker" | "audit";

export type DocKind =
  "identity" | "offer" | "receipt" | "contract" | "payslip" | "transfer" | "message" | "other";

/** 費用鏈的一筆付款：付給誰、為了什麼、有沒有憑證。 */
export type FeeItem = {
  id: string;
  category: FeeCategory;
  /** 移工填寫的收款方名稱 */
  payee: string;
  /** 比對到企業合約名單時的中間商 id；比對不到代表是名單外的次級中間商 */
  vendorId?: string | undefined;
  /** 新台幣 */
  amount: number;
  hasDocument: boolean;
};

export type CaseDoc = {
  id: string;
  kind: DocKind;
  name: string;
  size: number;
  uploadedAt: string;
  /** OCR 讀到的金額（新台幣），讀不到則為 null */
  ocrAmount: number | null;
  /** 這份文件被遮蔽掉的個資欄位數 */
  redactedCount: number;
  status: "verified" | "processing" | "unreadable";
};

export type ReviewDecision = "investigating" | "need_more" | "confirmed" | "dismissed";

export type ReviewRecord = {
  decision: ReviewDecision;
  note: string;
  reviewer: string;
  at: string;
  /** 核定應返還金額（新台幣） */
  refund?: number | undefined;
};

export type CaseRecord = CaseSeed & {
  /** 移工查詢碼；audit 來源的案件沒有 */
  code?: string;
  source: CaseSource;
  submittedAt: string;
  arrivedAt: string;
  paymentMethod: string;
  docs: CaseDoc[];
  assignee: string;
  state: CaseStatus;
  /** 費用鏈：招聘費被拆給哪幾家中間商 */
  feeItems: FeeItem[];
  /** 身分證明是否已核驗（企業只看得到這個布林值，看不到證件） */
  identityVerified: boolean;
  review?: ReviewRecord;
  /** 移工自己補充的說明（已去識別化） */
  workerNote?: string;
  /** 企業回覆給移工的訊息 */
  workerReply?: string;
};

export const statusMeta: Record<
  CaseStatus,
  { label: string; short: string; tone: "neutral" | "primary" | "warning" | "danger" | "success" }
> = {
  pending_review: { label: "待人工審核", short: "待審", tone: "warning" },
  investigating: { label: "調查中", short: "調查中", tone: "primary" },
  need_more: { label: "需補件", short: "補件", tone: "neutral" },
  confirmed: { label: "已確認不當收費", short: "已確認", tone: "danger" },
  dismissed: { label: "已排除風險", short: "已排除", tone: "success" },
  remediated: { label: "已完成返還", short: "已返還", tone: "success" },
};

export const decisionMeta: Record<
  ReviewDecision,
  { label: string; detail: string; next: CaseStatus }
> = {
  investigating: {
    label: "受理並展開調查",
    detail: "證據足以啟動內部調查，通知仲介提供對應紀錄。",
    next: "investigating",
  },
  need_more: {
    label: "要求補件",
    detail: "證據不足以支撐結論，請申報人或仲介補充特定文件。",
    next: "need_more",
  },
  confirmed: {
    label: "確認不當收費",
    detail: "證據充分且相互佐證，認定違反 RBA 招聘費規範，進入返還程序。",
    next: "confirmed",
  },
  dismissed: {
    label: "排除風險",
    detail: "經查證後屬合法收費或誤報，結案並記錄理由。",
    next: "dismissed",
  },
};

/**
 * `weight` 為 null 代表這份文件不加計費用證據分數：
 * 身分證明用來確認申報人確實是這批移工，聘僱文件用來確認僱用關係，
 * 兩者都不能證明「付了多少錢」。
 */
export const docKindMeta: Record<
  DocKind,
  { label: string; hint: string; weight: EvidenceKey | null }
> = {
  identity: {
    label: "身分證明",
    hint: "護照或居留證。上傳後會遮蔽姓名與證件號，企業只會看到「已核驗」。",
    weight: null,
  },
  offer: {
    label: "聘僱文件",
    hint: "錄取通知、勞動契約，用來確認你的雇主與職務。",
    weight: "agency",
  },
  receipt: { label: "付款收據", hint: "仲介或訓練中心開立的收據、明細", weight: "receipt" },
  transfer: { label: "匯款／轉帳紀錄", hint: "銀行、郵局或匯款公司的轉帳單", weight: "payment" },
  contract: { label: "仲介合約", hint: "服務契約、費用同意書", weight: "agency" },
  payslip: { label: "薪資單", hint: "薪資扣款、借款攤還的紀錄", weight: "independent" },
  message: {
    label: "通訊紀錄",
    hint: "與仲介的對話截圖（會遮蔽姓名與電話）",
    weight: "independent",
  },
  other: { label: "其他文件", hint: "任何你認為與收費有關的文件", weight: "independent" },
};

/** 企業端的合規人員，供指派使用。 */
export const reviewers = [
  "林郁婷（合規主管）",
  "陳彥廷（合規專員）",
  "Nguyen Thi Mai（越南語專員）",
];

/**
 * 各案件的費用鏈。刻意讓每一筆單獨看都「不算離譜」，
 * 加總後才超出走廊基準——這是單一份仲介聲明查不出來的樣態。
 */
const feeChains: Record<string, FeeItem[]> = {
  "2026-024": [
    {
      id: "F-024-1",
      category: "agency_service",
      payee: "ABC Recruitment Agency",
      vendorId: "V-ABC",
      amount: 28000,
      hasDocument: true,
    },
    {
      id: "F-024-2",
      category: "agency_service",
      payee: "Nam Viet Manpower",
      vendorId: "V-NAMVIET",
      amount: 15000,
      hasDocument: true,
    },
    {
      id: "F-024-3",
      category: "training",
      payee: "Viet Skill Training Center",
      vendorId: "V-VTRAIN",
      amount: 9000,
      hasDocument: true,
    },
    {
      id: "F-024-4",
      category: "medical",
      payee: "Saigon Health Check",
      vendorId: "V-HEALTH",
      amount: 3500,
      hasDocument: false,
    },
    {
      id: "F-024-5",
      category: "airfare",
      payee: "Truong Travel",
      amount: 3000,
      hasDocument: false,
    },
    {
      id: "F-024-6",
      category: "document",
      payee: "越南外交部（護照規費）",
      amount: 1500,
      hasDocument: true,
    },
  ],
  "2026-031": [
    {
      id: "F-031-1",
      category: "agency_service",
      payee: "ABC Recruitment Agency",
      vendorId: "V-ABC",
      amount: 25000,
      hasDocument: true,
    },
    {
      id: "F-031-2",
      category: "agency_service",
      payee: "Nam Viet Manpower",
      vendorId: "V-NAMVIET",
      amount: 18000,
      hasDocument: true,
    },
    {
      id: "F-031-3",
      category: "training",
      payee: "Viet Skill Training Center",
      vendorId: "V-VTRAIN",
      amount: 8000,
      hasDocument: true,
    },
    {
      id: "F-031-4",
      category: "medical",
      payee: "Saigon Health Check",
      vendorId: "V-HEALTH",
      amount: 2500,
      hasDocument: false,
    },
    {
      id: "F-031-5",
      category: "document",
      payee: "越南外交部（護照規費）",
      amount: 1500,
      hasDocument: true,
    },
  ],
  "2026-047": [
    {
      id: "F-047-1",
      category: "agency_service",
      payee: "Nam Viet Manpower",
      vendorId: "V-NAMVIET",
      amount: 30000,
      hasDocument: true,
    },
    {
      id: "F-047-2",
      category: "training",
      payee: "Viet Skill Training Center",
      vendorId: "V-VTRAIN",
      amount: 12000,
      hasDocument: false,
    },
    {
      id: "F-047-3",
      category: "medical",
      payee: "Saigon Health Check",
      vendorId: "V-HEALTH",
      amount: 4000,
      hasDocument: false,
    },
    {
      id: "F-047-4",
      category: "document",
      payee: "越南外交部（護照規費）",
      amount: 2000,
      hasDocument: true,
    },
  ],
  "2026-088": [
    {
      id: "F-088-1",
      category: "agency_service",
      payee: "Sentosa Placement",
      vendorId: "V-SENTOSA",
      amount: 24000,
      hasDocument: true,
    },
    {
      id: "F-088-2",
      category: "training",
      payee: "Sentosa Placement",
      vendorId: "V-SENTOSA",
      amount: 9000,
      hasDocument: false,
    },
    {
      id: "F-088-3",
      category: "medical",
      payee: "Sentosa Placement",
      vendorId: "V-SENTOSA",
      amount: 3500,
      hasDocument: false,
    },
    {
      id: "F-088-4",
      category: "document",
      payee: "印尼移民局（護照規費）",
      amount: 1500,
      hasDocument: true,
    },
  ],
  "2026-119": [
    {
      id: "F-119-1",
      category: "agency_service",
      payee: "ABC Recruitment Agency",
      vendorId: "V-ABC",
      amount: 26000,
      hasDocument: false,
    },
    {
      id: "F-119-2",
      category: "agency_service",
      payee: "Nam Viet Manpower",
      vendorId: "V-NAMVIET",
      amount: 12000,
      hasDocument: false,
    },
    {
      id: "F-119-3",
      category: "training",
      payee: "Viet Skill Training Center",
      vendorId: "V-VTRAIN",
      amount: 5000,
      hasDocument: true,
    },
    {
      id: "F-119-4",
      category: "document",
      payee: "越南外交部（護照規費）",
      amount: 2000,
      hasDocument: true,
    },
  ],
  "2026-006": [
    {
      id: "F-006-1",
      category: "document",
      payee: "菲律賓外交部（護照規費）",
      amount: 1800,
      hasDocument: true,
    },
    {
      id: "F-006-2",
      category: "document",
      payee: "駐台北馬尼拉經濟文化辦事處（簽證規費）",
      amount: 2500,
      hasDocument: true,
    },
  ],
  "2026-012": [
    {
      id: "F-012-1",
      category: "agency_service",
      payee: "Sentosa Placement",
      vendorId: "V-SENTOSA",
      amount: 30000,
      hasDocument: true,
    },
    {
      id: "F-012-2",
      category: "training",
      payee: "Sentosa Placement",
      vendorId: "V-SENTOSA",
      amount: 14000,
      hasDocument: true,
    },
    {
      id: "F-012-3",
      category: "medical",
      payee: "Sentosa Placement",
      vendorId: "V-SENTOSA",
      amount: 5000,
      hasDocument: true,
    },
    {
      id: "F-012-4",
      category: "document",
      payee: "印尼移民局（護照規費）",
      amount: 3000,
      hasDocument: true,
    },
  ],
};

/** 哪些案件已完成身分核驗（企業只看到布林值，看不到證件本身）。 */
const identityVerifiedIds = new Set(["2026-024", "2026-031", "2026-119", "2026-006", "2026-012"]);

type Meta = Omit<CaseRecord, keyof CaseSeed | "feeItems" | "identityVerified">;

const metaById: Record<string, Meta> = {
  "2026-024": {
    source: "worker",
    code: "TRB-K7M3QX",
    submittedAt: "2026 / 05 / 16",
    arrivedAt: "2025 / 11",
    paymentMethod: "現金 + 銀行轉帳",
    assignee: reviewers[0]!,
    state: "pending_review",
    workerNote: "出國前在仲介辦公室付了大部分費用，剩下的從薪水裡扣。",
    docs: [
      {
        id: "D-024-1",
        kind: "receipt",
        name: "receipt_2025_11.jpg",
        size: 842_000,
        uploadedAt: "2026 / 05 / 16",
        ocrAmount: 45000,
        redactedCount: 4,
        status: "verified",
      },
      {
        id: "D-024-2",
        kind: "transfer",
        name: "bank_transfer.pdf",
        size: 331_000,
        uploadedAt: "2026 / 05 / 16",
        ocrAmount: 15000,
        redactedCount: 3,
        status: "verified",
      },
      {
        id: "D-024-3",
        kind: "contract",
        name: "agency_contract.pdf",
        size: 1_204_000,
        uploadedAt: "2026 / 05 / 16",
        ocrAmount: 0,
        redactedCount: 6,
        status: "verified",
      },
    ],
  },
  "2026-031": {
    source: "worker",
    code: "TRB-P4WD98",
    submittedAt: "2026 / 04 / 30",
    arrivedAt: "2025 / 08",
    paymentMethod: "銀行轉帳",
    assignee: reviewers[2]!,
    state: "investigating",
    docs: [
      {
        id: "D-031-1",
        kind: "transfer",
        name: "remittance_slip.png",
        size: 620_000,
        uploadedAt: "2026 / 04 / 30",
        ocrAmount: 55000,
        redactedCount: 5,
        status: "verified",
      },
      {
        id: "D-031-2",
        kind: "receipt",
        name: "training_fee_receipt.jpg",
        size: 410_000,
        uploadedAt: "2026 / 04 / 30",
        ocrAmount: 55000,
        redactedCount: 2,
        status: "verified",
      },
    ],
  },
  "2026-047": {
    source: "audit",
    submittedAt: "2026 / 03 / 11",
    arrivedAt: "2025 / 06",
    paymentMethod: "現金",
    assignee: reviewers[1]!,
    state: "pending_review",
    docs: [
      {
        id: "D-047-1",
        kind: "receipt",
        name: "cash_receipt_scan.pdf",
        size: 288_000,
        uploadedAt: "2026 / 03 / 11",
        ocrAmount: 48000,
        redactedCount: 3,
        status: "verified",
      },
    ],
  },
  "2026-088": {
    source: "audit",
    submittedAt: "2026 / 02 / 22",
    arrivedAt: "2025 / 03",
    paymentMethod: "薪資扣款",
    assignee: reviewers[1]!,
    state: "need_more",
    docs: [
      {
        id: "D-088-1",
        kind: "payslip",
        name: "payslip_2025_q4.pdf",
        size: 190_000,
        uploadedAt: "2026 / 02 / 22",
        ocrAmount: 38000,
        redactedCount: 4,
        status: "verified",
      },
    ],
  },
  "2026-119": {
    source: "worker",
    code: "TRB-3HJ7YT",
    submittedAt: "2026 / 06 / 03",
    arrivedAt: "2026 / 01",
    paymentMethod: "現金",
    assignee: reviewers[0]!,
    state: "pending_review",
    workerNote: "仲介說這是「服務費」，沒有給我完整的收據。",
    docs: [
      {
        id: "D-119-1",
        kind: "message",
        name: "chat_screenshot.png",
        size: 980_000,
        uploadedAt: "2026 / 06 / 03",
        ocrAmount: 45000,
        redactedCount: 7,
        status: "verified",
      },
      {
        id: "D-119-2",
        kind: "receipt",
        name: "handwritten_note.jpg",
        size: 512_000,
        uploadedAt: "2026 / 06 / 03",
        ocrAmount: null,
        redactedCount: 1,
        status: "unreadable",
      },
    ],
  },
};

/** 已結案的案件，讓平台一開始就像一個運作中的系統，而不是空資料庫。 */
const extraSeeds: Omit<CaseRecord, "feeItems" | "identityVerified">[] = [
  {
    id: "2026-006",
    worker: "匿名申報人 #206",
    origin: "菲律賓",
    workplace: "台灣",
    agency: "Manila Bridge Placement",
    fee: 4300,
    agencyClaim: 4300,
    date: "2025 / 12 / 08",
    language: "英語",
    present: ["agency", "interview", "receipt", "payment"],
    conflicting: [],
    consistency: 97,
    policyMatch: 96,
    status: "調查中",
    source: "worker",
    code: "TRB-8NQR2C",
    submittedAt: "2025 / 12 / 09",
    arrivedAt: "2025 / 09",
    paymentMethod: "銀行轉帳",
    assignee: reviewers[1]!,
    state: "dismissed",
    workerReply:
      "經查證後，您支付的兩筆都是護照與簽證規費，屬個人證件費用，仲介費、體檢費與機票均由雇主負擔，未構成不當收費。",
    review: {
      decision: "dismissed",
      note: "兩筆皆為政府規費且有正式收據；仲介服務費、體檢與機票由雇主支付，符合 Employer Pays Principle。",
      reviewer: reviewers[1]!,
      at: "2025 / 12 / 15 14:02",
    },
    docs: [
      {
        id: "D-006-1",
        kind: "receipt",
        name: "medical_and_ticket.pdf",
        size: 260_000,
        uploadedAt: "2025 / 12 / 09",
        ocrAmount: 4300,
        redactedCount: 3,
        status: "verified",
      },
    ],
  },
  {
    id: "2026-012",
    worker: "匿名申報人 #212",
    origin: "印尼",
    workplace: "台灣",
    agency: "Sentosa Placement",
    fee: 52000,
    agencyClaim: 11000,
    date: "2025 / 10 / 21",
    language: "印尼語（逐字翻譯）",
    present: ["agency", "interview", "receipt", "payment", "independent"],
    conflicting: ["interview", "receipt", "payment"],
    consistency: 95,
    policyMatch: 92,
    status: "調查中",
    source: "worker",
    code: "TRB-6VXK4D",
    submittedAt: "2025 / 10 / 22",
    arrivedAt: "2025 / 04",
    paymentMethod: "現金 + 薪資扣款",
    assignee: reviewers[0]!,
    state: "remediated",
    workerReply: "已確認超收，仲介已於 2026/01/30 返還 NT$41,000，返還憑證已存入本案件。",
    review: {
      decision: "confirmed",
      note: "三項獨立證據一致指向 NT$52,000，仲介合約僅列 NT$11,000，認定超收並要求全額返還。",
      reviewer: reviewers[0]!,
      at: "2025 / 11 / 04 10:26",
      refund: 41000,
    },
    docs: [
      {
        id: "D-012-1",
        kind: "receipt",
        name: "kwitansi.jpg",
        size: 700_000,
        uploadedAt: "2025 / 10 / 22",
        ocrAmount: 52000,
        redactedCount: 5,
        status: "verified",
      },
      {
        id: "D-012-2",
        kind: "payslip",
        name: "slip_gaji.pdf",
        size: 150_000,
        uploadedAt: "2025 / 10 / 22",
        ocrAmount: 52000,
        redactedCount: 2,
        status: "verified",
      },
    ],
  },
];

/** 平台初始案件：既有稽核案件 + 已經進來的移工申報。 */
export const seedCases: CaseRecord[] = [
  ...caseSeeds.map((seed) => ({
    ...seed,
    ...(metaById[seed.id] as Meta),
    feeItems: feeChains[seed.id] ?? [],
    identityVerified: identityVerifiedIds.has(seed.id),
  })),
  ...extraSeeds.map((c) => ({
    ...c,
    feeItems: feeChains[c.id] ?? [],
    identityVerified: identityVerifiedIds.has(c.id),
  })),
];

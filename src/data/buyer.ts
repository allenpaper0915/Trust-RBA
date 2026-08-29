/**
 * 客戶稽核請求。
 *
 * 移工被收取不當費用，受害的是移工；但被追究責任、承擔商業後果的是**企業**。
 * 品牌客戶要求供應商符合 RBA，供應商拿不出證據，後果是訂單、是名單、是出口。
 *
 * 這一層讓整個平台有了「為什麼非做不可」的答案：
 * 不是為了做好事，是因為不做就接不到單。
 */

export const buyer = {
  /** 示範用的虛構品牌客戶。實務上即為 RBA 會員品牌（Apple、Dell、HP、Intel 等）。 */
  name: "Aurora Devices Inc.",
  note: "示範用虛構品牌。實務情境即為 Apple、Dell、HP 等 RBA 會員品牌對下游供應商的合規要求。",
  program: "RBA Validated Assessment Program (VAP)",
  requestId: "VAP-2026-TW-0417",
  issued: "2026 / 08 / 15",
  due: "2026 / 09 / 30",
  dueDate: "2026-09-30",
  scope: "2025 / 01 / 01 – 2026 / 06 / 30 期間所有在職外籍移工",
  /** 客戶要求供應商回答的那一句話 */
  ask: "請提出證據，證明貴公司所僱用的外籍移工未被收取任何招聘相關費用。",
  /** 客戶明確拒絕接受的東西 */
  notAccepted: [
    "仲介出具的自我聲明",
    "「未接獲申訴」的說明",
    "移工簽署的空白具結書",
    "無法追溯到個別付款的彙總數字",
  ],
};

/** 這張單子背後真正的賭注。 */
export const commercialStakes = {
  annualOrders: 48_000_000,
  shareOfRevenue: 0.34,
  customers: 3,
  items: [
    {
      title: "新訂單暫停核發",
      detail: "Priority 等級不符合事項成立後，客戶依採購政策暫停新機種導入與追加訂單。",
      severity: "immediate" as const,
    },
    {
      title: "移出合格供應商名單",
      detail: "矯正措施逾期未結案，供應商資格由「條件通過」降為「不合格」，需重新認證。",
      severity: "high" as const,
    },
    {
      title: "出口遭海關扣押",
      detail:
        "招聘費構成 ILO 強迫勞動指標之一（債務約束）。美國 UFLPA 與各國強迫勞動禁令下，貨品可能於通關時被扣，舉證責任在出口商。",
      severity: "high" as const,
    },
    {
      title: "第三方複查費用由供應商負擔",
      detail: "客戶要求委任獨立稽核機構複查，費用與停線損失由供應商承擔。",
      severity: "medium" as const,
    },
  ],
};

/** RBA VAP 的不符合事項分級。招聘費屬最高等級，這是這件事真正的牙齒。 */
export type NCLevel = "conform" | "minor" | "major" | "priority";

export const ncMeta: Record<
  NCLevel,
  {
    label: string;
    tone: "success" | "neutral" | "warning" | "danger";
    consequence: string;
    days: number;
  }
> = {
  conform: {
    label: "符合",
    tone: "success",
    consequence: "可正常出貨與接單。",
    days: 0,
  },
  minor: {
    label: "輕微不符合",
    tone: "neutral",
    consequence: "不影響訂單，於下次稽核前補正即可。",
    days: 180,
  },
  major: {
    label: "重大不符合",
    tone: "warning",
    consequence: "列入觀察名單，新機種導入暫緩，須於期限內完成矯正。",
    days: 90,
  },
  priority: {
    label: "優先不符合",
    tone: "danger",
    consequence:
      "RBA 將招聘費列為強迫勞動指標，屬最高等級。新訂單立即暫停，須完成全額返還並重新驗證，逾期移出合格供應商名單。",
    days: 30,
  },
};

/** 客戶會逐項核對的 RBA 條款。 */
export const rbaClauses = {
  A1: {
    code: "RBA Code A1",
    title: "自由選擇職業（Freely Chosen Employment）",
    requirement:
      "不得向移工收取任何招聘相關費用。所有招聘成本由雇主承擔（Employer Pays Principle）。已收取者須全額返還。",
  },
  A1_3: {
    code: "RBA Code A1.3",
    title: "招聘費用之揭露與返還",
    requirement: "須能逐人證明費用流向，並保存可供稽核的付款憑證。",
  },
  D1: {
    code: "RBA Code D1",
    title: "管理承諾與問責",
    requirement: "須建立可追溯的紀錄制度，供客戶與第三方稽核查核。",
  },
};

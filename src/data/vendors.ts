/**
 * 中間商（vendor）與費用分類。
 *
 * 招聘費很少一次付清給一家公司。實務上會拆成「來源國仲介 + 台灣仲介 +
 * 訓練中心 + 體檢機構 + 機票代辦」好幾筆，每一筆單獨看都不高，
 * 加起來才會超過國際基準——這正是企業用單一份仲介聲明查不出來的原因。
 */

export type VendorType =
  "origin_agency" | "destination_agency" | "training" | "medical" | "transport" | "other";

export const vendorTypeLabel: Record<VendorType, string> = {
  origin_agency: "來源國仲介",
  destination_agency: "台灣仲介",
  training: "訓練中心",
  medical: "體檢機構",
  transport: "機票／交通代辦",
  other: "其他",
};

export type Vendor = {
  id: string;
  name: string;
  type: VendorType;
  country: string;
  /** 與企業的合作起始 */
  since: string;
  /** 目前透過這家中間商在職的移工數 */
  workers: number;
  /** 是否為企業合約名單上的中間商 */
  registered: boolean;
};

/** 企業合約名單上的中間商。移工申報若指向名單外的公司，本身就是一個風險訊號。 */
export const vendors: Vendor[] = [
  {
    id: "V-ABC",
    name: "ABC Recruitment Agency",
    type: "destination_agency",
    country: "台灣",
    since: "2021 / 03",
    workers: 261,
    registered: true,
  },
  {
    id: "V-NAMVIET",
    name: "Nam Viet Manpower",
    type: "origin_agency",
    country: "越南",
    since: "2021 / 05",
    workers: 142,
    registered: true,
  },
  {
    id: "V-SENTOSA",
    name: "Sentosa Placement",
    type: "origin_agency",
    country: "印尼",
    since: "2022 / 01",
    workers: 78,
    registered: true,
  },
  {
    id: "V-MANILA",
    name: "Manila Bridge Placement",
    type: "origin_agency",
    country: "菲律賓",
    since: "2023 / 09",
    workers: 41,
    registered: true,
  },
  {
    id: "V-VTRAIN",
    name: "Viet Skill Training Center",
    type: "training",
    country: "越南",
    since: "2022 / 06",
    workers: 0,
    registered: true,
  },
  {
    id: "V-HEALTH",
    name: "Saigon Health Check",
    type: "medical",
    country: "越南",
    since: "2022 / 06",
    workers: 0,
    registered: true,
  },
  {
    id: "V-AIR",
    name: "Truong Travel",
    type: "transport",
    country: "越南",
    since: "—",
    workers: 0,
    // 名單外：移工申報時才第一次出現在企業的視野裡。
    registered: false,
  },
];

export function findVendor(id: string): Vendor | undefined {
  return vendors.find((v) => v.id === id);
}

/** 以名稱比對合約名單；比對不到代表這是企業不知道的次級中間商。 */
export function resolveVendorByName(name: string): Vendor | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return vendors.find((v) => v.name.toLowerCase() === n || n.includes(v.name.toLowerCase()));
}

export type FeeCategory =
  "agency_service" | "training" | "medical" | "airfare" | "deposit" | "document" | "other";

/**
 * RBA Code of Conduct 採 Employer Pays Principle：招聘相關費用原則上由雇主負擔。
 * `workerPayable` 為 false 者，只要由移工支付就構成不當收費，與金額大小無關。
 */
export const feeCategoryMeta: Record<
  FeeCategory,
  { label: string; workerPayable: boolean; rule: string }
> = {
  agency_service: {
    label: "仲介服務費",
    workerPayable: false,
    rule: "RBA Code of Conduct A3：招聘費用不得由移工負擔。",
  },
  training: {
    label: "行前訓練費",
    workerPayable: false,
    rule: "RBA A3 / ILO C181：職業訓練屬招聘成本，不得轉嫁移工。",
  },
  medical: {
    label: "體檢費",
    workerPayable: false,
    rule: "RBA A3：受僱前健康檢查屬雇主成本。",
  },
  airfare: {
    label: "機票與交通費",
    workerPayable: false,
    rule: "RBA A3：抵達工作地的交通費由雇主負擔。",
  },
  deposit: {
    label: "保證金／押金",
    workerPayable: false,
    rule: "RBA A2：不得收取保證金，構成強迫勞動風險指標。",
  },
  document: {
    label: "護照／簽證規費",
    workerPayable: true,
    rule: "個人證件規費，依當地法規可由移工負擔，但須有正式收據。",
  },
  other: {
    label: "其他費用",
    workerPayable: false,
    rule: "未歸類費用一律先視為不得由移工負擔，由人工審核判定。",
  },
};

export const feeCategories = Object.keys(feeCategoryMeta) as FeeCategory[];

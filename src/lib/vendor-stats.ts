/**
 * 中間商彙總。
 *
 * 企業真正要回答的問題不是「這位移工被收了多少」，而是
 * 「哪一家中間商在系統性地收錢」。把所有案件的費用鏈依收款方重新聚合，
 * 就能從個案跳到廠商層級。
 */

import type { CaseRecord } from "@/data/cases";
import { feeCategoryMeta, vendors, type FeeCategory, type Vendor } from "@/data/vendors";

export type VendorStatus = "violation" | "watch" | "clear" | "unlisted";

export const vendorStatusMeta: Record<
  VendorStatus,
  { label: string; tone: "danger" | "warning" | "success" | "neutral"; detail: string }
> = {
  violation: {
    label: "確認違規",
    tone: "danger",
    detail: "已有經人工審核確認的不當收費案件。",
  },
  watch: {
    label: "調查中",
    tone: "warning",
    detail: "有尚未結案的申報指向這家中間商。",
  },
  clear: {
    label: "目前無異常",
    tone: "success",
    detail: "沒有未結案的申報，或申報經審核後未成立。",
  },
  unlisted: {
    label: "名單外",
    tone: "neutral",
    detail: "移工申報中出現、但不在企業合約名單上的中間商。",
  },
};

export type VendorStat = {
  vendor: Vendor;
  status: VendorStatus;
  caseCount: number;
  openCases: number;
  /** 移工付給這家中間商的合計 */
  collected: number;
  /** 其中依 RBA 不得由移工負擔的合計 */
  disallowed: number;
  /** 沒有憑證的付款合計 */
  undocumented: number;
  categories: FeeCategory[];
  caseIds: string[];
};

const UNLISTED_PREFIX = "unlisted:";

/** 名單外中間商沒有 vendor 資料，就地產生一筆，讓它也能被追蹤。 */
function syntheticVendor(name: string): Vendor {
  return {
    id: `${UNLISTED_PREFIX}${name}`,
    name,
    type: "other",
    country: "—",
    since: "—",
    workers: 0,
    registered: false,
  };
}

export function vendorStats(cases: CaseRecord[]): VendorStat[] {
  const map = new Map<string, VendorStat>();
  const ensure = (vendor: Vendor) => {
    const existing = map.get(vendor.id);
    if (existing) return existing;
    const created: VendorStat = {
      vendor,
      status: vendor.registered ? "clear" : "unlisted",
      caseCount: 0,
      openCases: 0,
      collected: 0,
      disallowed: 0,
      undocumented: 0,
      categories: [],
      caseIds: [],
    };
    map.set(vendor.id, created);
    return created;
  };

  for (const v of vendors) ensure(v);

  for (const c of cases) {
    // 招聘仲介即使一毛錢都沒向移工收，也要出現在它負責的案件裡——
    // 「有承辦、零收費」正是合規的樣子，看得到才有對照。
    const agencyVendor = vendors.find((v) => v.name === c.agency);
    if (agencyVendor) {
      const stat = ensure(agencyVendor);
      if (!stat.caseIds.includes(c.id)) {
        stat.caseIds.push(c.id);
        stat.caseCount += 1;
        if (!["dismissed", "remediated"].includes(c.state)) stat.openCases += 1;
      }
    }

    for (const item of c.feeItems) {
      // 護照／簽證規費繳給政府，不屬於中間商，不列入廠商彙總。
      if (!item.vendorId && feeCategoryMeta[item.category].workerPayable) continue;

      const vendor = item.vendorId
        ? (vendors.find((v) => v.id === item.vendorId) ?? syntheticVendor(item.payee))
        : syntheticVendor(item.payee);
      const stat = ensure(vendor);

      stat.collected += item.amount;
      if (!feeCategoryMeta[item.category].workerPayable) stat.disallowed += item.amount;
      if (!item.hasDocument) stat.undocumented += item.amount;
      if (!stat.categories.includes(item.category)) stat.categories.push(item.category);
      if (!stat.caseIds.includes(c.id)) {
        stat.caseIds.push(c.id);
        stat.caseCount += 1;
        if (!["dismissed", "remediated"].includes(c.state)) stat.openCases += 1;
      }
      const improper = !feeCategoryMeta[item.category].workerPayable;
      if (improper && (c.state === "confirmed" || c.state === "remediated")) {
        stat.status = "violation";
      } else if (improper && stat.status !== "violation" && c.state !== "dismissed") {
        stat.status = vendor.registered ? "watch" : "unlisted";
      }
    }
  }

  return [...map.values()].sort((a, b) => b.disallowed - a.disallowed || b.collected - a.collected);
}

export function vendorStatFor(cases: CaseRecord[], id: string): VendorStat | undefined {
  return vendorStats(cases).find((s) => s.vendor.id === id);
}

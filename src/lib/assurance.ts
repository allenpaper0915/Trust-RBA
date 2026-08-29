/**
 * 舉證引擎。
 *
 * 平台原本回答的是「誰被收了錢」（偵測）。
 * RBA 稽核要的是相反的一件事：「證明沒有人被收錢」（舉證）。
 * 這兩者不是同一個問題——零申訴不等於零收費，只等於沒有資料。
 *
 * 所有計算都是固定規則，與風險計分引擎一樣不經過 LLM。
 */

import type { CaseRecord } from "@/data/cases";
import { payMethodMeta } from "@/data/cases";
import { employerPayments, workforceSegments, type WorkforceSegment } from "@/data/assurance";
import { feeCategoryMeta } from "@/data/vendors";

export type AssuranceState = "proven" | "insufficient" | "cash" | "confirmed" | "review";

export const assuranceMeta: Record<
  AssuranceState,
  {
    label: string;
    short: string;
    tone: "success" | "neutral" | "warning" | "danger" | "primary";
    detail: string;
  }
> = {
  proven: {
    label: "已證明未收費",
    short: "已證明",
    tone: "success",
    detail: "雇主端與移工端都有客觀金流證據，可直接回應稽核。",
  },
  insufficient: {
    label: "無法證明",
    short: "無法證明",
    tone: "neutral",
    detail: "沒有相反證據，但也沒有正面證據。RBA 稽核會被打回票的就是這一塊。",
  },
  cash: {
    label: "現金風險",
    short: "現金",
    tone: "warning",
    detail: "回報以現金支付，金流本身沒有軌跡，無法用金流證明有或沒有。",
  },
  confirmed: {
    label: "已確認收費",
    short: "已確認",
    tone: "danger",
    detail: "經人工審核確認向移工收取了不當費用，須完成返還。",
  },
  review: {
    label: "審核中",
    short: "審核中",
    tone: "primary",
    detail: "已有申報進入審核程序，結論未定。",
  },
};

export type SegmentCoverage = {
  segment: WorkforceSegment;
  workers: number;
  proven: number;
  insufficient: number;
  cash: number;
  confirmed: number;
  review: number;
  /** 已證明未收費的比例 */
  rate: number;
};

const CLOSED_CLEAN = ["dismissed"];
const CLOSED_BAD = ["confirmed", "remediated"];

/**
 * 單一來源國的舉證覆蓋。
 *
 * 案件會即時改變數字：審核後判定未成立的移入「已證明」，
 * 確認收費的移入「已確認」，尚未結案的留在「審核中」。
 */
export function segmentCoverage(segment: WorkforceSegment, cases: CaseRecord[]): SegmentCoverage {
  const mine = cases.filter((c) => c.origin === segment.origin);
  const confirmed = mine.filter((c) => CLOSED_BAD.includes(c.state)).length;
  const dismissed = mine.filter((c) => CLOSED_CLEAN.includes(c.state)).length;
  const review = mine.length - confirmed - dismissed;

  const proven = segment.baselineProven + dismissed;
  const cash = segment.baselineCash;
  const insufficient = Math.max(0, segment.workers - proven - cash - confirmed - review);

  return {
    segment,
    workers: segment.workers,
    proven,
    insufficient,
    cash,
    confirmed,
    review,
    rate: segment.workers > 0 ? proven / segment.workers : 0,
  };
}

export type Coverage = {
  segments: SegmentCoverage[];
  workers: number;
  proven: number;
  insufficient: number;
  cash: number;
  confirmed: number;
  review: number;
  /** 舉證覆蓋率：已證明未收費 ÷ 在職移工 */
  rate: number;
  /** 尚無法證明的人數（無法證明 + 現金風險） */
  unproven: number;
};

export function coverage(cases: CaseRecord[]): Coverage {
  const segments = workforceSegments.map((s) => segmentCoverage(s, cases));
  const sum = (k: keyof SegmentCoverage) => segments.reduce((n, s) => n + (s[k] as number), 0);
  const workers = sum("workers");
  const proven = sum("proven");
  const insufficient = sum("insufficient");
  const cash = sum("cash");
  return {
    segments,
    workers,
    proven,
    insufficient,
    cash,
    confirmed: sum("confirmed"),
    review: sum("review"),
    rate: workers > 0 ? proven / workers : 0,
    unproven: insufficient + cash,
  };
}

/** 金流可追溯性：可追查的錢有多少，現金有多少。 */
export function traceability(record: CaseRecord) {
  let traceable = 0;
  let untraceable = 0;
  for (const item of record.feeItems) {
    if (payMethodMeta[item.method].traceable) traceable += item.amount;
    else untraceable += item.amount;
  }
  const total = traceable + untraceable;
  return {
    traceable,
    untraceable,
    total,
    ratio: total > 0 ? traceable / total : 0,
  };
}

export type DoubleCharge = {
  /** 雇主為同一段招聘服務已經付過的款 */
  payment: (typeof employerPayments)[number];
  /** 移工又付給同一批中間商的金額 */
  workerPaid: number;
  /** 移工付給誰 */
  payees: string[];
};

/**
 * 重複收費比對。
 *
 * 企業自己的應付帳款就能證明「這段招聘服務我已經付過錢了」。
 * 如果移工又付了一次給同一批中間商，那不是價格爭議，是收了兩次。
 */
export function doubleCharge(record: CaseRecord): DoubleCharge | null {
  const payment = employerPayments.find((p) => p.origin === record.origin);
  if (!payment) return null;

  const recruitmentItems = record.feeItems.filter(
    (i) => !feeCategoryMeta[i.category].workerPayable,
  );
  if (recruitmentItems.length === 0) return null;

  return {
    payment,
    workerPaid: recruitmentItems.reduce((s, i) => s + i.amount, 0),
    payees: [...new Set(recruitmentItems.map((i) => i.payee))],
  };
}

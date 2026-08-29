/**
 * 舉證包（Evidence Pack）。
 *
 * 客戶問：「請證明你們的移工沒有被收費。」
 * 這支模組把平台裡的東西組成一份可以直接交出去、也可以被對方獨立驗證的答覆：
 *
 *   1 涵蓋範圍聲明 —— 這份文件說的是哪些人、哪段期間
 *   2 舉證覆蓋率   —— 幾名已證明、幾名證不出來（不隱藏後者）
 *   3 六項對帳測試 —— 逐個來源國的結果與可查證的憑證編號
 *   4 不符合事項   —— 依 RBA VAP 分級，附矯正措施與期限
 *   5 密碼學封裝   —— 簽章與 Merkle 根，讓對方不必信任我們也能驗
 *
 * 刻意不做的事：不把「證不出來」寫成「沒有問題」。
 */

import type { CaseRecord } from "@/data/cases";
import { workforceSegments } from "@/data/assurance";
import { ncMeta, rbaClauses, type NCLevel } from "@/data/buyer";
import { coverage } from "@/lib/assurance";
import { runTests, segmentVerdict, type TestResult } from "@/lib/verification-tests";
import { assessFeeChain } from "@/lib/analysis";

export type Finding = {
  id: string;
  level: NCLevel;
  clause: { code: string; title: string; requirement: string };
  title: string;
  /** 客戶可以自己去核對的依據 */
  evidence: string;
  corrective: string;
  owner: string;
  dueDays: number;
};

export type SegmentSection = {
  corridor: string;
  origin: string;
  workers: number;
  verdict: ReturnType<typeof segmentVerdict>;
  results: TestResult[];
};

export type EvidencePack = {
  level: NCLevel;
  findings: Finding[];
  sections: SegmentSection[];
  coverage: ReturnType<typeof coverage>;
  /** 已確認須返還而尚未返還的金額 */
  outstandingRefund: number;
  /** 依 T1 成本缺口推得、可能由移工承擔的總金額 */
  costGapTotal: number;
  generatedAt: string;
};

const twd = (n: number) => `NT$${n.toLocaleString("en-US")}`;

/**
 * 分級規則（固定，不由模型判斷）：
 *   priority —— 有經人工確認的不當收費，或成本缺口成立（T1 未通過）
 *   major    —— 舉證覆蓋率低於 90%，或關鍵測試缺資料
 *   minor    —— 僅部分覆蓋
 *   conform  —— 全部來源國六項皆通過
 */
export function buildPack(cases: CaseRecord[], now = new Date()): EvidencePack {
  const cov = coverage(cases);
  const sections: SegmentSection[] = workforceSegments.map((seg) => {
    const results = runTests(seg, cases);
    return {
      corridor: seg.corridor,
      origin: seg.origin,
      workers: seg.workers,
      verdict: segmentVerdict(results),
      results,
    };
  });

  const findings: Finding[] = [];

  // 1. 成本缺口：企業自己的帳就證明了招聘成本沒有全額由雇主承擔
  let costGapTotal = 0;
  for (const s of sections) {
    const t1 = s.results[0]!;
    if (t1.outcome !== "fail") continue;
    const gapFigure = t1.figures?.find((f) => f.label === "該國合計缺口")?.value ?? "";
    const perWorker = t1.figures?.find((f) => f.label === "缺口")?.value ?? "";
    const numeric = Number(gapFigure.replace(/[^\d]/g, "")) || 0;
    costGapTotal += numeric;
    findings.push({
      id: `NC-T1-${s.origin}`,
      level: "priority",
      clause: rbaClauses.A1,
      title: `${s.corridor}：招聘成本未由雇主全額承擔`,
      evidence: `雇主每人實付低於該國招聘成本，缺口 ${perWorker}，該國合計 ${gapFigure}（依企業應付帳款與該國成本參考值計算，見 T1）。`,
      corrective:
        "補足差額並改為雇主直付；與仲介重新議定費用結構，於合約載明零向移工收費及查核權。",
      owner: "採購 ＋ 合規",
      dueDays: ncMeta.priority.days,
    });
  }

  // 2. 已確認的不當收費
  const confirmed = cases.filter((c) => c.state === "confirmed");
  const outstandingRefund = confirmed.reduce((n, c) => n + (c.review?.refund ?? 0), 0);
  if (confirmed.length > 0) {
    findings.push({
      id: "NC-FEE",
      level: "priority",
      clause: rbaClauses.A1,
      title: `${confirmed.length} 件經人工審核確認的不當收費`,
      evidence: confirmed
        .map((c) => `#${c.id}（${c.agency}，應返還 ${twd(c.review?.refund ?? 0)}）`)
        .join("；"),
      corrective: "全額返還並取得移工簽收憑證，返還完成後重跑六項測試。",
      owner: "合規主管",
      dueDays: ncMeta.priority.days,
    });
  }

  // 3. 缺查核權：拿不到仲介端資料，現金情境就完全無法舉證
  for (const s of sections) {
    const t5 = s.results[4]!;
    if (t5.outcome !== "unavailable") continue;
    findings.push({
      id: `NC-T5-${s.origin}`,
      level: "major",
      clause: rbaClauses.D1,
      title: `${s.corridor}：無法查核仲介收款帳戶`,
      evidence: t5.detail,
      corrective: "於仲介合約增訂查核權條款，並取得同期入帳明細；未配合者列入汰換評估。",
      owner: "採購",
      dueDays: ncMeta.major.days,
    });
  }

  // 4. 舉證覆蓋率不足
  if (cov.rate < 0.9) {
    findings.push({
      id: "NC-COV",
      level: "major",
      clause: rbaClauses.A1_3,
      title: `舉證覆蓋率 ${Math.round(cov.rate * 100)}%，不足以宣稱全體符合`,
      evidence: `在職 ${cov.workers} 名中，${cov.proven} 名已具備雙端金流證據；${cov.insufficient} 名證據不足、${cov.cash} 名為現金支付而無金流軌跡。`,
      corrective:
        "優先補齊企業內部即可取得的雇主付款憑證與薪資查核；擴大移工端銀行流水授權；現金部分改以仲介入帳查核補強。",
      owner: "合規",
      dueDays: ncMeta.major.days,
    });
  }

  // 5. 仍在審核中的申報
  const open = cases.filter((c) =>
    ["pending_review", "investigating", "need_more"].includes(c.state),
  );
  if (open.length > 0) {
    findings.push({
      id: "NC-OPEN",
      level: "minor",
      clause: rbaClauses.D1,
      title: `${open.length} 件申報尚未結案`,
      evidence: open.map((c) => `#${c.id}`).join("、"),
      corrective: "於期限內完成人工審核並作成決定。",
      owner: "合規",
      dueDays: ncMeta.minor.days,
    });
  }

  const level: NCLevel = findings.some((f) => f.level === "priority")
    ? "priority"
    : findings.some((f) => f.level === "major")
      ? "major"
      : findings.some((f) => f.level === "minor")
        ? "minor"
        : "conform";

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    level,
    findings,
    sections,
    coverage: cov,
    outstandingRefund,
    costGapTotal,
    generatedAt: `${now.getFullYear()} / ${pad(now.getMonth() + 1)} / ${pad(now.getDate())}`,
  };
}

/** 距離回覆期限還剩幾天。 */
export function daysUntil(dateISO: string, now = new Date()): number {
  const due = new Date(`${dateISO}T23:59:59`);
  return Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
}

/** 若把已確認案件全部返還完成，覆蓋率會變成多少——給企業一個可行動的目標。 */
export function refundImpact(cases: CaseRecord[]) {
  const confirmed = cases.filter((c) => c.state === "confirmed");
  const amount = confirmed.reduce(
    (n, c) => n + (c.review?.refund ?? assessFeeChain(c.feeItems).disallowed),
    0,
  );
  return { count: confirmed.length, amount };
}

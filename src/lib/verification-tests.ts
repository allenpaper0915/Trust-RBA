/**
 * 六項對帳測試。
 *
 * 「證明沒有超收」不是直接證明一個否定命題——那做不到。
 * 做得到的是：逐條檢驗移工可能被收錢的每一條管道，
 * 每一條都拿出資料說明「這條沒有錢流過」或「這條流的是雇主的錢」。
 *
 * 管道有七條：
 *   1 出國前現金  2 移工匯款  3 薪資扣款  4 借貸還款
 *   5 押金／扣證  6 家人代付  7 企業不知道的次級中間商
 *
 * 下面六項測試就是用來檢驗這七條的。每一項都是固定算式或文件核對，
 * 結果可重現、可被稽核員重跑。
 *
 * 特別注意「需要誰配合」這一欄：T1、T2、T4、T5 完全不需要移工出面，
 * 所以當移工付的是現金（管道 1）時，還驗得到的就是這四項。
 */

import type { CaseRecord } from "@/data/cases";
import { employerPayments, trueRecruitmentCost, type WorkforceSegment } from "@/data/assurance";
import { segmentCoverage } from "@/lib/assurance";

export type TestOutcome = "pass" | "fail" | "partial" | "unavailable";

export const outcomeMeta: Record<
  TestOutcome,
  { label: string; tone: "success" | "danger" | "warning" | "neutral" }
> = {
  pass: { label: "通過", tone: "success" },
  fail: { label: "未通過", tone: "danger" },
  partial: { label: "部分覆蓋", tone: "warning" },
  unavailable: { label: "缺資料", tone: "neutral" },
};

export type TestSpec = {
  id: string;
  label: string;
  /** 這項測試在問什麼 */
  question: string;
  /** 具體怎麼做 */
  method: string;
  /** 資料從哪裡來 */
  source: string;
  /** 涵蓋哪幾條收費管道 */
  channel: string;
  needsWorker: boolean;
  needsAgency: boolean;
};

export const testSpecs: TestSpec[] = [
  {
    id: "T1",
    label: "成本缺口測試",
    question: "雇主付掉的招聘成本，夠不夠？",
    method:
      "以該國真實招聘成本為分母，減去雇主每人實付。差額為正，代表這筆錢有人替雇主付了——唯一的候選人是移工。差額為零或負值才算通過。",
    source: "企業應付帳款（發票＋匯款）÷ 涵蓋人數，對照該國成本參考值",
    channel: "涵蓋 ①現金 ⑥家人代付 ⑦次級中間商——不管誰付、怎麼付，缺口都會顯現",
    needsWorker: false,
    needsAgency: false,
  },
  {
    id: "T2",
    label: "三方金額對帳",
    question: "發票、銀行扣款、仲介認列，三個數字對得起來嗎？",
    method:
      "同一期的雇主發票金額 = 銀行實際扣款金額 = 仲介帳上認列的收入。任一邊對不上，代表帳外還有一段金流。",
    source: "企業發票與匯款憑證 ＋ 仲介逐人費用明細",
    channel: "涵蓋 ⑦次級中間商——雇主付的錢有沒有被中途分掉",
    needsWorker: false,
    needsAgency: true,
  },
  {
    id: "T3",
    label: "移工金流流出查核",
    question: "移工的帳戶，有沒有錢流向任何一家中間商？",
    method:
      "調閱出國前 12 個月至抵達後 6 個月的銀行與電子錢包紀錄，篩出流向合作名單上任一家的轉帳、以及金額異常的不明轉出與大額提領。",
    source: "移工本人授權調閱的來源國銀行對帳單",
    channel: "涵蓋 ②移工匯款 ④借貸還款（借款入帳後隨即轉出的樣態）",
    needsWorker: true,
    needsAgency: false,
  },
  {
    id: "T4",
    label: "薪資扣款查核",
    question: "抵達之後，有沒有從薪水裡把錢扣回去？",
    method:
      "逐期檢查薪資明細有無仲介費、服務費、借款攤還等扣款項目，並確認實發金額每期都不低於法定最低工資。再比對薪資帳戶實際入帳金額與雇主匯出金額是否一致。",
    source: "企業薪資系統（內部資料，立即可得）",
    channel: "涵蓋 ③薪資扣款 ④借貸還款",
    needsWorker: false,
    needsAgency: false,
  },
  {
    id: "T5",
    label: "仲介入帳查核",
    question: "仲介的帳戶，有沒有收到來自移工個人的錢？",
    method:
      "調閱仲介收款帳戶同期入帳明細，確認零筆來自這批移工或其家屬的個人帳戶。合約須事先載明查核權。",
    source: "仲介收款帳戶入帳明細（依合約查核權取得）",
    channel: "涵蓋 ①現金 ⑥家人代付——移工付現金時，這是少數還驗得到的一條",
    needsWorker: false,
    needsAgency: true,
  },
  {
    id: "T6",
    label: "訪談一致性",
    question: "移工自己怎麼說，和前五項對得起來嗎？",
    method:
      "在雇主與仲介都不在場的環境、以母語進行匿名訪談，同時詢問是否押證件、是否有押金。訪談結論須與 T1–T5 相符；不符時以文件為準並轉入調查，不得用訪談結果覆蓋文件。",
    source: "第三方匿名訪談或移工端申報",
    channel: "涵蓋 ⑤押金／扣證，並交叉驗證其餘各項",
    needsWorker: true,
    needsAgency: false,
  },
];

export type TestResult = {
  spec: TestSpec;
  outcome: TestOutcome;
  /** 這一項在這個來源國上的實際結果 */
  detail: string;
  /** 可引用的數字，供稽核員重算 */
  figures?: { label: string; value: string }[] | undefined;
};

const docStatus = (segment: WorkforceSegment, key: string) =>
  segment.docs.find((d) => d.key === key)?.status ?? "missing";

const docNote = (segment: WorkforceSegment, key: string) =>
  segment.docs.find((d) => d.key === key)?.note ?? "";

const twd = (n: number) => `NT$${n.toLocaleString("en-US")}`;

/** 對一個來源國跑完六項測試。 */
export function runTests(segment: WorkforceSegment, cases: CaseRecord[]): TestResult[] {
  const payment = employerPayments.find((p) => p.origin === segment.origin);
  const trueCost = trueRecruitmentCost[segment.origin];
  const cov = segmentCoverage(segment, cases);

  // T1 成本缺口
  const paid = payment?.perWorker ?? 0;
  const reference = trueCost?.amount ?? 0;
  const gap = Math.max(0, reference - paid);
  const t1: TestResult = {
    spec: testSpecs[0]!,
    outcome: !payment || !trueCost ? "unavailable" : gap === 0 ? "pass" : "fail",
    detail:
      !payment || !trueCost
        ? "缺少雇主付款紀錄或該國成本參考值。"
        : gap === 0
          ? `雇主每人實付 ${twd(paid)}，已覆蓋該國招聘成本 ${twd(reference)}，無缺口。`
          : `雇主每人實付 ${twd(paid)}，低於該國招聘成本 ${twd(reference)}，缺口 ${twd(gap)}／人。這筆錢有人付了，而移工是唯一的候選人。`,
    figures: payment &&
      trueCost && [
        { label: "雇主每人實付", value: twd(paid) },
        { label: "該國招聘成本", value: twd(reference) },
        { label: "缺口", value: gap > 0 ? `${twd(gap)}／人` : "無" },
        { label: "該國合計缺口", value: gap > 0 ? twd(gap * segment.workers) : "無" },
        { label: "成本基準來源", value: trueCost.basis },
      ],
  };

  // T2 三方對帳
  const ledger = docStatus(segment, "agency_ledger");
  const t2: TestResult = {
    spec: testSpecs[1]!,
    outcome: !payment?.reconciled
      ? "fail"
      : ledger === "have"
        ? "pass"
        : ledger === "partial"
          ? "partial"
          : "unavailable",
    detail: !payment?.reconciled
      ? "雇主發票與銀行扣款尚未完成對帳。"
      : ledger === "have"
        ? `發票 ${payment.invoiceRef} 與匯款 ${payment.transferRef} 已對帳，仲介逐人明細亦相符。`
        : ledger === "partial"
          ? `雇主端兩造已對帳，但${docNote(segment, "agency_ledger")}，第三方無法拆到人。`
          : `雇主端兩造已對帳，但${docNote(segment, "agency_ledger")}，缺第三方。`,
    figures: payment && [
      { label: "發票", value: payment.invoiceRef },
      { label: "匯款", value: payment.transferRef },
      { label: "涵蓋人數", value: `${payment.workers} 名` },
    ],
  };

  // T3 移工金流
  const bank = docStatus(segment, "worker_bank");
  const t3: TestResult = {
    spec: testSpecs[2]!,
    outcome: bank === "have" ? "pass" : bank === "partial" ? "partial" : "unavailable",
    detail:
      bank === "have"
        ? `${docNote(segment, "worker_bank")}。全數可以金流佐證。`
        : `${docNote(segment, "worker_bank")}。未授權的 ${segment.workers - cov.proven} 名無法以金流佐證，其中 ${cov.cash} 名回報現金支付，即使取得流水也驗不出來。`,
    figures: [
      { label: "已授權調閱", value: `${cov.proven} / ${segment.workers} 名` },
      { label: "回報現金支付", value: `${cov.cash} 名（此測試對其無效）` },
    ],
  };

  // T4 薪資扣款
  const payroll = docStatus(segment, "payroll_check");
  const t4: TestResult = {
    spec: testSpecs[3]!,
    outcome: payroll === "have" ? "pass" : payroll === "partial" ? "partial" : "unavailable",
    detail: `${docNote(segment, "payroll_check")}。此項為企業內部資料，覆蓋全部 ${segment.workers} 名，不需任何外部配合。`,
    figures: [{ label: "覆蓋人數", value: `${segment.workers} / ${segment.workers} 名` }],
  };

  // T5 仲介入帳
  const agencyBank = docStatus(segment, "agency_bank");
  const t5: TestResult = {
    spec: testSpecs[4]!,
    outcome: agencyBank === "have" ? "pass" : agencyBank === "partial" ? "partial" : "unavailable",
    detail:
      agencyBank === "missing"
        ? `${docNote(segment, "agency_bank")}。這是現金情境下唯一還驗得到的一條，缺了它，現金那一段就完全無法舉證。`
        : segment.originAgency === null
          ? "無中間商，不存在向移工收費的收款方。"
          : `${docNote(segment, "agency_bank")}`,
  };

  // T6 訪談一致性
  const attestation = docStatus(segment, "attestation");
  const conflicts = cases.filter(
    (c) => c.origin === segment.origin && !["dismissed"].includes(c.state),
  ).length;
  const t6: TestResult = {
    spec: testSpecs[5]!,
    outcome:
      attestation === "missing"
        ? "unavailable"
        : conflicts > 0
          ? "fail"
          : attestation === "partial"
            ? "partial"
            : "pass",
    detail:
      conflicts > 0
        ? `${docNote(segment, "attestation")}，但有 ${conflicts} 件申報與 T1–T5 的結論衝突，已轉入調查。訪談結果不得覆蓋文件。`
        : `${docNote(segment, "attestation")}，與 T1–T5 無衝突。`,
    figures: [{ label: "衝突申報", value: conflicts > 0 ? `${conflicts} 件` : "無" }],
  };

  return [t1, t2, t3, t4, t5, t6];
}

/**
 * 一個來源國是否「通過舉證」。
 * 規則刻意嚴格：只要有任何一項 fail，整個來源國就不能宣稱已舉證——
 * 而不是拿通過的幾項去平均掉沒通過的那幾項。
 */
export function segmentVerdict(results: TestResult[]): TestOutcome {
  if (results.some((r) => r.outcome === "fail")) return "fail";
  if (results.some((r) => r.outcome === "unavailable")) return "unavailable";
  if (results.some((r) => r.outcome === "partial")) return "partial";
  return "pass";
}

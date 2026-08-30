import type { CaseRecord } from "@/data/cases";

export type SignalTone = "red" | "yellow" | "blue" | "gray" | "green";
export type EvidenceState = "complete" | "pending" | "conflict" | "missing";

export type EvidenceStep = {
  at: string;
  event: string;
  obligation: string;
  evidence: string;
  source: string;
  state: EvidenceState;
};

export type MonitoringProfile = {
  tone: SignalTone;
  trigger: string;
  summary: string;
  due: string;
  owner: string;
  confidence: "高" | "中" | "低";
  facts: string[];
  explanations: string[];
  missing: string[];
  nextAction: string;
  steps: EvidenceStep[];
};

export const signalMeta: Record<
  SignalTone,
  { label: string; className: string; dotClass: string; priority: number }
> = {
  red: {
    label: "紅燈｜證據明確衝突",
    className: "border-danger/30 bg-danger-soft text-danger",
    dotClass: "bg-danger",
    priority: 5,
  },
  yellow: {
    label: "黃燈｜逾期或待確認",
    className: "border-warning/35 bg-warning-soft text-warning-foreground",
    dotClass: "bg-warning",
    priority: 4,
  },
  blue: {
    label: "藍燈｜合法程序進行中",
    className: "border-primary/25 bg-primary-soft text-primary",
    dotClass: "bg-primary",
    priority: 3,
  },
  gray: {
    label: "灰燈｜資料不足",
    className: "border-border bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground",
    priority: 2,
  },
  green: {
    label: "綠燈｜目前無異常",
    className: "border-success/30 bg-success-soft text-success",
    dotClass: "bg-success",
    priority: 1,
  },
};

const profiles: Record<string, MonitoringProfile> = {
  "2026-031": {
    tone: "red",
    trigger: "轉換雇主狀態與失聯通報互相衝突",
    summary:
      "移工已提出轉換雇主申請，但原雇主在同一期間通報失聯；兩項政府紀錄不能同時代表完整現況。",
    due: "今日 17:00 前",
    owner: "案件承辦人",
    confidence: "高",
    facts: ["勞動部系統有轉換雇主申請", "原雇主於申請後提出失聯通報", "居留狀態仍有效"],
    explanations: ["雇主未即時得知轉換程序", "移工離開原工作地但仍在合法轉換期間"],
    missing: ["轉換核准或駁回結果", "移工本人近 72 小時確認", "地方政府訪查紀錄"],
    nextAction: "先向勞動力發展署確認轉換程序，再由地方承辦聯繫本人；確認前不得直接標記非法失聯。",
    steps: [
      {
        at: "08/21 09:14",
        event: "移工提出轉換雇主申請",
        obligation: "中央機關應於期限內受理並更新程序狀態",
        evidence: "轉換申請案號 TW-88421",
        source: "勞動力發展署",
        state: "complete",
      },
      {
        at: "08/22 18:40",
        event: "移工離開原工作地",
        obligation: "雇主應確認原因後依法通報",
        evidence: "雇主失聯通報 N-3328",
        source: "雇主申報",
        state: "conflict",
      },
      {
        at: "08/23 06:00",
        event: "居留狀態批次同步",
        obligation: "居留效期應反映最新許可狀態",
        evidence: "居留有效至 2027/01/12",
        source: "移民署",
        state: "complete",
      },
      {
        at: "待完成",
        event: "本人狀況確認",
        obligation: "紅燈案件應完成人工複核",
        evidence: "尚無聯繫或訪查紀錄",
        source: "地方政府",
        state: "missing",
      },
    ],
  },
  "2026-024": {
    tone: "yellow",
    trigger: "聘僱許可與投保單位超過寬限期仍不一致",
    summary:
      "系統已收到雇主異動，但勞保投保單位尚未同步；可能是行政時間差，也可能是實際未完成轉換。",
    due: "2 日內",
    owner: "案件承辦人",
    confidence: "中",
    facts: ["新聘僱許可已生效", "投保單位仍為原雇主", "薪資入帳未中斷"],
    explanations: ["跨機關批次更新延遲", "新雇主尚未完成加保"],
    missing: ["新雇主加保送件時間", "實際到職確認"],
    nextAction: "先調閱勞保異動送件時間；若超過法定期限，再轉地方政府查證，不先推定違法。",
    steps: [
      {
        at: "08/18 14:20",
        event: "新聘僱許可生效",
        obligation: "新雇主應依法辦理加保與到職通報",
        evidence: "聘僱許可 E-24018",
        source: "勞動力發展署",
        state: "complete",
      },
      {
        at: "08/25 06:00",
        event: "投保資料同步",
        obligation: "投保單位應與現行雇主一致",
        evidence: "仍列原雇主",
        source: "勞保局",
        state: "conflict",
      },
      {
        at: "08/28 10:00",
        event: "薪資證據更新",
        obligation: "聘僱關係存續期間應有合理薪資軌跡",
        evidence: "本月薪資已入帳",
        source: "本人授權銀行摘要",
        state: "complete",
      },
      {
        at: "09/01 前",
        event: "寬限期到期",
        obligation: "承辦人應確認是否為系統更新延遲",
        evidence: "待調閱加保送件紀錄",
        source: "地方政府",
        state: "pending",
      },
    ],
  },
  "2026-047": {
    tone: "gray",
    trigger: "關鍵薪資與工作地證據不可得",
    summary: "既有系統沒有收到足以判讀聘僱關係是否正常履行的近期證據，無異常不等於正常。",
    due: "本週抽樣",
    owner: "訪查小組",
    confidence: "低",
    facts: ["聘僱許可仍有效", "三個月內沒有案件通報"],
    explanations: ["狀態確實穩定", "資料來源未更新或未授權"],
    missing: ["近兩月薪資摘要", "工作地確認", "本人定期回饋"],
    nextAction: "納入灰燈抽樣；先以低侵入的本人多語確認，未回覆再評估訪查。",
    steps: [
      {
        at: "05/12 09:30",
        event: "聘僱許可展延",
        obligation: "雇主應持續履行聘僱與生活照顧責任",
        evidence: "展延許可 E-47012",
        source: "勞動力發展署",
        state: "complete",
      },
      {
        at: "06/05 06:00",
        event: "最近一次投保同步",
        obligation: "投保狀態應持續有效",
        evidence: "在保中",
        source: "勞保局",
        state: "complete",
      },
      {
        at: "近 8 週",
        event: "無新狀態事件",
        obligation: "長期靜默案件仍應接受週期抽樣",
        evidence: "沒有可交叉比對的新資料",
        source: "狀態記錄器",
        state: "missing",
      },
      {
        at: "本週",
        event: "多語關懷確認",
        obligation: "灰燈案件先採低侵入確認",
        evidence: "待排程",
        source: "地方政府",
        state: "pending",
      },
    ],
  },
  "2026-088": {
    tone: "blue",
    trigger: "轉換雇主程序仍在法定處理期間",
    summary:
      "工作地與投保資料暫時不一致，但已存在可解釋的合法程序，系統持續追蹤期限而不升級為紅燈。",
    due: "09/05 到期",
    owner: "系統追蹤",
    confidence: "高",
    facts: ["轉換申請已受理", "目前仍在程序期限內", "本人已回覆安全"],
    explanations: ["等待新雇主承接", "跨系統資料尚未完成同步"],
    missing: ["最終核准結果"],
    nextAction: "維持藍燈；期限屆滿仍無結果時自動轉黃燈並派入承辦佇列。",
    steps: [
      {
        at: "08/17 11:05",
        event: "轉換雇主申請受理",
        obligation: "受理後應在期限內完成審查",
        evidence: "受理案號 T-88102",
        source: "勞動力發展署",
        state: "complete",
      },
      {
        at: "08/19 15:22",
        event: "本人狀況確認",
        obligation: "程序期間應可確認本人安全",
        evidence: "多語簡訊回覆：安全",
        source: "移工本人",
        state: "complete",
      },
      {
        at: "09/05 前",
        event: "等待審查結果",
        obligation: "期限屆滿應產生狀態事件",
        evidence: "尚在法定期限內",
        source: "狀態記錄器",
        state: "pending",
      },
    ],
  },
  "2026-119": {
    tone: "red",
    trigger: "本人付款證據與仲介申報費用不一致",
    summary:
      "本人提供的通訊紀錄與付款影像指向新臺幣 45,000 元服務費，但仲介申報資料沒有相符的收費項目與完整收據。",
    due: "待人工介入",
    owner: "移工科股長",
    confidence: "中",
    facts: ["本人陳述支付 45,000 元", "通訊截圖可辨識相同金額", "手寫收據無法完整辨識"],
    explanations: ["款項可能包含個人依法負擔的規費", "收款方可能是未登記的次級仲介"],
    missing: ["仲介完整費用明細", "可辨識的付款憑證", "收款方身分資料"],
    nextAction: "向仲介調閱費用明細與收款紀錄；未能對應時，再聯繫本人確認付款對象與用途。",
    steps: [
      {
        at: "06/03 09:12",
        event: "本人提交通訊截圖",
        obligation: "通報資料應保留原始證據並完成去識別化",
        evidence: "對話截圖 D-119-1：出現 NT$45,000",
        source: "移工本人",
        state: "conflict",
      },
      {
        at: "06/03 09:12",
        event: "本人提交手寫收據",
        obligation: "收費應有可辨識的收款方、項目與金額",
        evidence: "手寫收據 D-119-2：OCR 無法辨識",
        source: "移工本人",
        state: "missing",
      },
      {
        at: "待完成",
        event: "仲介費用資料調閱",
        obligation: "仲介應提供可核對的完整收費紀錄",
        evidence: "尚未取得仲介端費用明細",
        source: "仲介機構",
        state: "missing",
      },
    ],
  },
};

function fallback(record: CaseRecord): MonitoringProfile {
  const resolved = record.state === "dismissed" || record.state === "remediated";
  return {
    tone: resolved ? "green" : record.state === "confirmed" ? "red" : "yellow",
    trigger: resolved ? "近期跨機關資料未發現衝突" : "既有案件資料等待人工確認",
    summary: resolved
      ? "目前可取得的許可、投保與案件紀錄一致；仍會依週期接受隨機抽樣。"
      : "申報內容與既有紀錄需要承辦人確認，燈號只代表處理優先序。",
    due: resolved ? "例行抽樣" : "3 日內",
    owner: resolved ? "系統追蹤" : record.assignee,
    confidence: resolved ? "高" : "中",
    facts: ["案件已進入政府追蹤佇列", `目前程序狀態：${record.state}`],
    explanations: ["行政更新時間差", "申報資料仍待權責機關確認"],
    missing: resolved ? [] : ["權責資料最新狀態", "必要時的本人確認"],
    nextAction: resolved
      ? "維持週期監測並保留隨機抽樣。"
      : "依事件期限調閱權責資料，再由承辦人決定是否訪查。",
    steps: [
      {
        at: record.submittedAt,
        event: record.source === "worker" ? "本人提出通報" : "系統抽樣產生案件",
        obligation: "案件應進入可追溯的人工複核流程",
        evidence: `案件 #${record.id}`,
        source: record.source === "worker" ? "移工本人" : "狀態記錄器",
        state: "complete",
      },
      {
        at: "目前",
        event: "等待程序更新",
        obligation: "承辦人應在期限內確認資料一致性",
        evidence: resolved ? "已完成查證" : "待調閱權責資料",
        source: "地方政府",
        state: resolved ? "complete" : "pending",
      },
    ],
  };
}

export function monitoringFor(record: CaseRecord): MonitoringProfile {
  return profiles[record.id] ?? fallback(record);
}

export const inspectionTasks = [
  {
    id: "VIS-260831",
    caseId: "2026-031",
    kind: "衝突訪查",
    reason: "轉換申請與失聯通報衝突",
    assignee: "北區訪查小組",
    due: "今日",
    state: "待指派",
    tone: "red" as const,
  },
  {
    id: "VIS-260902",
    caseId: "2026-024",
    kind: "限期查證",
    reason: "聘僱許可與投保單位逾期不一致",
    assignee: "陳彥廷",
    due: "09/02",
    state: "已排程",
    tone: "yellow" as const,
  },
  {
    id: "SAM-260904",
    caseId: "2026-047",
    kind: "灰燈抽樣",
    reason: "長期無事件且關鍵證據不足",
    assignee: "多語關懷中心",
    due: "09/04",
    state: "待聯繫",
    tone: "gray" as const,
  },
  {
    id: "SAM-260906",
    caseId: "2026-006",
    kind: "綠燈隨機抽樣",
    reason: "避免只監測有事件的案件",
    assignee: "尚未指派",
    due: "09/06",
    state: "待指派",
    tone: "green" as const,
  },
];

/** 首頁只使用聚合資料；個案與文件維持在事件群組及案件層。 */
export const overviewSnapshot = {
  relationships: 24860,
  weeklyEvents: 326,
  conflicts: 18,
  blindSpots: 42,
  sampleCases: 7,
};

export type DailyEventSummary = {
  key: string;
  day: string;
  date: string;
  total: number;
  conflicts: number;
  breakdown: { label: string; value: number }[];
  conflictBreakdown: { label: string; value: number }[];
};

export const eventWeek: DailyEventSummary[] = [
  {
    key: "0824",
    day: "一",
    date: "8/24",
    total: 38,
    conflicts: 1,
    breakdown: [
      { label: "新聘僱", value: 12 },
      { label: "轉換雇主", value: 9 },
      { label: "投保異動", value: 7 },
      { label: "失聯通報", value: 2 },
      { label: "本人通報", value: 4 },
      { label: "其他", value: 4 },
    ],
    conflictBreakdown: [{ label: "許可 × 投保未更新", value: 1 }],
  },
  {
    key: "0825",
    day: "二",
    date: "8/25",
    total: 44,
    conflicts: 2,
    breakdown: [
      { label: "新聘僱", value: 14 },
      { label: "轉換雇主", value: 10 },
      { label: "投保異動", value: 8 },
      { label: "失聯通報", value: 3 },
      { label: "本人通報", value: 5 },
      { label: "其他", value: 4 },
    ],
    conflictBreakdown: [
      { label: "轉換 × 失聯通報", value: 1 },
      { label: "許可 × 投保未更新", value: 1 },
    ],
  },
  {
    key: "0826",
    day: "三",
    date: "8/26",
    total: 51,
    conflicts: 4,
    breakdown: [
      { label: "新聘僱", value: 15 },
      { label: "轉換雇主", value: 12 },
      { label: "投保異動", value: 10 },
      { label: "失聯通報", value: 4 },
      { label: "本人通報", value: 6 },
      { label: "其他", value: 4 },
    ],
    conflictBreakdown: [
      { label: "轉換 × 失聯通報", value: 2 },
      { label: "許可 × 投保未更新", value: 1 },
      { label: "聘僱有效 × 薪資中斷", value: 1 },
    ],
  },
  {
    key: "0827",
    day: "四",
    date: "8/27",
    total: 36,
    conflicts: 1,
    breakdown: [
      { label: "新聘僱", value: 11 },
      { label: "轉換雇主", value: 8 },
      { label: "投保異動", value: 7 },
      { label: "失聯通報", value: 3 },
      { label: "本人通報", value: 4 },
      { label: "其他", value: 3 },
    ],
    conflictBreakdown: [{ label: "轉換 × 失聯通報", value: 1 }],
  },
  {
    key: "0828",
    day: "五",
    date: "8/28",
    total: 55,
    conflicts: 3,
    breakdown: [
      { label: "新聘僱", value: 16 },
      { label: "轉換雇主", value: 13 },
      { label: "投保異動", value: 11 },
      { label: "失聯通報", value: 5 },
      { label: "本人通報", value: 6 },
      { label: "其他", value: 4 },
    ],
    conflictBreakdown: [
      { label: "轉換 × 失聯通報", value: 1 },
      { label: "許可 × 投保未更新", value: 1 },
      { label: "聘僱有效 × 薪資中斷", value: 1 },
    ],
  },
  {
    key: "0829",
    day: "六",
    date: "8/29",
    total: 49,
    conflicts: 3,
    breakdown: [
      { label: "新聘僱", value: 9 },
      { label: "轉換雇主", value: 9 },
      { label: "投保異動", value: 9 },
      { label: "失聯通報", value: 8 },
      { label: "本人通報", value: 7 },
      { label: "其他", value: 7 },
    ],
    conflictBreakdown: [
      { label: "轉換 × 失聯通報", value: 1 },
      { label: "許可 × 投保未更新", value: 1 },
      { label: "離境 × 關係帳戶異常", value: 1 },
    ],
  },
  {
    key: "0830",
    day: "日",
    date: "8/30",
    total: 53,
    conflicts: 4,
    breakdown: [
      { label: "新聘僱", value: 14 },
      { label: "轉換雇主", value: 13 },
      { label: "投保異動", value: 10 },
      { label: "失聯通報", value: 6 },
      { label: "本人通報", value: 5 },
      { label: "其他", value: 5 },
    ],
    conflictBreakdown: [
      { label: "轉換 × 失聯通報", value: 2 },
      { label: "許可 × 投保未更新", value: 1 },
      { label: "聘僱有效 × 薪資中斷", value: 1 },
    ],
  },
];

export const eventTypeTrends = [
  { label: "新聘僱", count: 91, change: 8, conflicts: 1 },
  { label: "轉換雇主", count: 74, change: 18, conflicts: 8 },
  { label: "投保異動", count: 62, change: -4, conflicts: 6 },
  { label: "失聯通報", count: 31, change: 24, conflicts: 2 },
  { label: "本人通報", count: 38, change: 6, conflicts: 1 },
  { label: "其他狀態事件", count: 30, change: -2, conflicts: 0 },
];

export const conflictPatterns = [
  {
    label: "轉換雇主申請 × 原雇主失聯通報",
    count: 8,
    change: "+3",
    note: "程序狀態與雇主申報重疊",
    tone: "danger" as const,
  },
  {
    label: "新聘僱許可 × 投保單位未更新",
    count: 6,
    change: "+1",
    note: "超過資料更新寬限期",
    tone: "warning" as const,
  },
  {
    label: "聘僱關係有效 × 連續薪資證據中斷",
    count: 3,
    change: "—",
    note: "需先排除未授權或資料延遲",
    tone: "warning" as const,
  },
  {
    label: "離境紀錄 × 關係帳戶持續異常使用",
    count: 1,
    change: "新增",
    note: "目前僅有單一來源，尚待查證",
    tone: "neutral" as const,
  },
];

export const monitoringBlindSpots = [
  { label: "近期薪資證據不可得", count: 16 },
  { label: "工作地長期未確認", count: 11 },
  { label: "本人定期回饋缺失", count: 8 },
  { label: "只有單一資料來源", count: 7 },
];

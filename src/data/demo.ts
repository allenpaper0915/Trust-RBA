export type DataSource =
  | "real-benchmark"
  | "policy-knowledge"
  | "synthetic-enterprise";

export const sourceLabel: Record<DataSource, string> = {
  "real-benchmark": "Real-world Benchmark",
  "policy-knowledge": "Policy Knowledge Base",
  "synthetic-enterprise": "Synthetic Enterprise Evidence",
};

export const enterprise = {
  name: "ABC Electronics",
  role: "合規管理員",
  industry: "台灣電子製造供應商",
  workers: 328,
  agencies: 5,
  evidence: 914,
  highRiskCases: 5,
  complianceScore: 87,
};

export const benchmark = {
  corridor: "越南 → 台灣",
  enterpriseFee: 42000,
  benchmarkFee: 18000,
  deltaPercent: 133,
  sources: "ILO / World Bank / KNOMAD 公開資料",
  disclaimer: "基準異常不代表違規，僅代表需要進一步驗證。",
  corridors: [
    { corridor: "越南 → 台灣", enterprise: 42000, benchmark: 18000 },
    { corridor: "印尼 → 台灣", enterprise: 21000, benchmark: 19500 },
    { corridor: "菲律賓 → 台灣", enterprise: 16800, benchmark: 15200 },
    { corridor: "泰國 → 台灣", enterprise: 14200, benchmark: 13800 },
  ],
};

export const verificationStages = [
  { key: "collect", label: "資料蒐集", detail: "彙整企業提供的移工、仲介與付款資料" },
  { key: "normalize", label: "資料標準化", detail: "統一幣別、期間與招聘費用定義" },
  { key: "cross", label: "交叉驗證", detail: "比對多方獨立證據，而非單一來源" },
  { key: "policy", label: "政策比對", detail: "對照 RBA / ILO / IOM 招聘費規範" },
  { key: "explain", label: "風險解釋", detail: "產生可追溯至證據的風險說明" },
  { key: "human", label: "人工審核", detail: "高風險結論交由合規人員決定" },
] as const;

export const verificationLog = [
  "正在蒐集企業資料…",
  "正在比對 ILO / KNOMAD 基準…",
  "正在分析移工訪談…",
  "正在驗證付款證據…",
  "正在套用 RBA 政策…",
  "正在產生可解釋風險評估…",
];

export type EvidenceStatus = "verified" | "conflict" | "obtained";

export type EvidenceNode = {
  id: string;
  title: string;
  subtitle: string;
  status: EvidenceStatus;
  statusLabel: string;
  amount: string;
  source: DataSource;
  body: { label: string; value: string }[];
  note?: string;
  interview?: { question: string; answer: string };
  receipt?: { amount: string; payee: string; date: string; verifiedBy: string };
};

export const evidenceChain: EvidenceNode[] = [
  {
    id: "agency",
    title: "仲介聲明",
    subtitle: "招聘費聲明",
    status: "obtained",
    statusLabel: "已取得",
    amount: "NT$0",
    source: "synthetic-enterprise",
    body: [
      { label: "聲明單位", value: "ABC Recruitment Agency" },
      { label: "招聘費", value: "NT$0" },
      { label: "聲明期間", value: "2026 / 01 – 2026 / 06" },
      { label: "取得方式", value: "企業合規問卷" },
    ],
    note: "仲介自我聲明屬單一來源，需由獨立證據佐證。",
  },
  {
    id: "interview",
    title: "移工訪談",
    subtitle: "匿名 AI 訪談",
    status: "conflict",
    statusLabel: "與仲介資料不一致",
    amount: "NT$60,000",
    source: "synthetic-enterprise",
    body: [
      { label: "受訪者", value: "匿名移工 #024" },
      { label: "訪談語言", value: "越南語（逐字翻譯）" },
      { label: "回報金額", value: "NT$60,000" },
    ],
    interview: {
      question: "您來台灣工作之前，是否曾支付任何招聘相關費用？",
      answer: "有，我大約支付了 NT$60,000 給招聘仲介。",
    },
  },
  {
    id: "receipt",
    title: "付款收據",
    subtitle: "OCR 已驗證",
    status: "verified",
    statusLabel: "OCR 已驗證",
    amount: "NT$60,000",
    source: "synthetic-enterprise",
    body: [
      { label: "文件類型", value: "現金收據（示範文件）" },
      { label: "辨識信心", value: "97%" },
    ],
    receipt: {
      amount: "NT$60,000",
      payee: "ABC Recruitment Agency",
      date: "2026 / 05 / 14",
      verifiedBy: "OCR 已驗證",
    },
  },
  {
    id: "payment",
    title: "付款紀錄",
    subtitle: "銀行轉帳摘要",
    status: "verified",
    statusLabel: "已驗證",
    amount: "NT$60,000",
    source: "synthetic-enterprise",
    body: [
      { label: "付款金額", value: "NT$60,000" },
      { label: "付款日期", value: "2026 / 05 / 14" },
      { label: "與收據一致", value: "是" },
    ],
  },
  {
    id: "cross",
    title: "AI 交叉驗證",
    subtitle: "多方證據比對",
    status: "conflict",
    statusLabel: "發現證據衝突",
    amount: "衝突",
    source: "policy-knowledge",
    body: [
      { label: "證據一致性", value: "94%" },
      { label: "政策符合度", value: "90%" },
      { label: "風險等級", value: "高風險" },
    ],
    note: "仲介聲明與三項獨立證據不一致。",
  },
];

export const riskCase = {
  id: "2026-024",
  title: "案件 #2026-024",
  worker: "匿名移工 #024",
  origin: "越南",
  workplace: "台灣",
  agency: "ABC Recruitment Agency",
  riskLabel: "高風險",
  consistency: 94,
  policyMatch: 90,
  reasons: [
    "移工主動回報支付招聘費。",
    "收據確認支付金額。",
    "付款紀錄與收據金額一致。",
    "仲介聲明與獨立證據存在衝突。",
    "多個證據來源指向相同事件。",
    "達到預先設定的高風險門檻。",
  ],
  conclusion: "疑似 RBA 招聘費合規風險",
  conclusionNote: "需要人工合規審核，不由 AI 自動判定違法。",
};

export const caseList = [
  { id: "2026-024", worker: "匿名移工 #024", origin: "越南", agency: "ABC Recruitment Agency", fee: "NT$60,000", score: 100, level: "高風險" },
  { id: "2026-031", worker: "匿名移工 #031", origin: "越南", agency: "ABC Recruitment Agency", fee: "NT$55,000", score: 85, level: "極高風險" },
  { id: "2026-047", worker: "匿名移工 #047", origin: "越南", agency: "Nam Viet Manpower", fee: "NT$48,000", score: 75, level: "高風險" },
  { id: "2026-088", worker: "匿名移工 #088", origin: "印尼", agency: "Sentosa Placement", fee: "NT$38,000", score: 70, level: "高風險" },
  { id: "2026-119", worker: "匿名移工 #119", origin: "越南", agency: "ABC Recruitment Agency", fee: "NT$45,000", score: 65, level: "高風險" },
];

export const trustPillars = [
  { q: "代表誰？", a: "ABC Electronics 合規管理員" },
  { q: "AI 被授權做什麼？", a: "RBA 招聘合規驗證" },
  { q: "使用什麼政策？", a: "RBA / ILO / IOM" },
  { q: "使用什麼證據？", a: "移工、仲介、付款資料" },
  { q: "誰負責最後決定？", a: "人工合規人員" },
  { q: "是否可以追溯？", a: "所有 AI 行動均留下稽核紀錄" },
];

export const remediationSteps = [
  "確認移工付款紀錄",
  "確認相關招聘仲介",
  "計算可能的返還金額",
  "調查相同仲介招聘的其他移工",
  "重新審查仲介合約",
  "記錄改善結果",
  "重新進行合規驗證",
];

export const credential = {
  brand: "TRUSTRBA",
  subject: "ABC Electronics",
  scope: "招聘費合規",
  workers: 328,
  agencies: 5,
  evidenceCompleteness: 94,
  unresolved: 0,
  issued: "2026 / 08 / 28",
  expires: "2027 / 02 / 28",
  id: "TRUST-RBA-8F92A1",
};

export const privacyDisclosure = {
  visible: ["合規狀態", "驗證範圍", "發行者", "有效期限", "Credential Status"],
  hidden: ["移工姓名", "身分證 / 護照", "銀行帳戶", "私人聊天紀錄", "完整收據"],
};

export const newEvidence = {
  worker: "Worker #182",
  fee: "NT$70,000",
  headline: "發現新的高風險證據。",
  reason: "發現新的未解決合規證據，需要重新調查。",
};

export const auditLog = [
  { time: "14:32:04", actor: "AI Agent", action: "啟動驗證", evidence: "驗證任務 #V-2026-0828", auth: "合規管理員授權", result: "已啟動" },
  { time: "14:32:06", actor: "AI Agent", action: "取得 ILO / KNOMAD 基準", evidence: "Migration Cost Benchmark", auth: "唯讀資料存取", result: "成功" },
  { time: "14:32:08", actor: "AI Agent", action: "分析移工證據", evidence: "匿名訪談 #024", auth: "匿名化資料", result: "發現回報付款" },
  { time: "14:32:10", actor: "AI Agent", action: "付款紀錄驗證完成", evidence: "收據 + 轉帳紀錄", auth: "唯讀資料存取", result: "金額一致" },
  { time: "14:32:12", actor: "AI Agent", action: "發現證據衝突", evidence: "仲介聲明 vs 獨立證據", auth: "驗證授權", result: "衝突成立" },
  { time: "14:32:14", actor: "AI Agent", action: "產生風險評估", evidence: "Evidence Score 100 / 100", auth: "deterministic 計分", result: "高風險" },
  { time: "14:32:17", actor: "AI Agent", action: "要求人工審核", evidence: "案件 #2026-024", auth: "禁止自動判定", result: "已送審" },
  { time: "14:33:02", actor: "合規管理員", action: "核准調查", evidence: "案件 #2026-024", auth: "人工權限", result: "調查啟動" },
  { time: "14:34:21", actor: "系統", action: "合規憑證建立", evidence: "TRUST-RBA-8F92A1", auth: "人工審核完成", result: "已發行" },
];

export const presentationSteps = [
  "問題",
  "偵測",
  "驗證",
  "人工審核",
  "憑證",
  "第三方驗證",
];

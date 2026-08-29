export type DataSource = "real-benchmark" | "policy-knowledge" | "synthetic-enterprise";

export const sourceLabel: Record<DataSource, string> = {
  "real-benchmark": "Real-world Benchmark",
  "policy-knowledge": "Policy Knowledge Base",
  "synthetic-enterprise": "示範企業資料",
};

export const money = (n: number) => `NT$${n.toLocaleString("en-US")}`;

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

/** 驗證動畫的逐步訊息，對應 verificationStages 的六個階段。 */
export const verificationLog = [
  {
    text: "正在蒐集企業資料…",
    detail: "328 名移工 · 5 家仲介 · 914 筆證據",
    source: "synthetic-enterprise" as DataSource,
  },
  {
    text: "正在比對 ILO / KNOMAD 基準…",
    detail: "越南 → 台灣：企業 NT$42,000／基準 NT$18,000",
    source: "real-benchmark" as DataSource,
  },
  {
    text: "正在分析移工訪談…",
    detail: "匿名訪談 41 份，12 份提及招聘相關費用",
    source: "synthetic-enterprise" as DataSource,
  },
  {
    text: "正在驗證付款證據…",
    detail: "收據 OCR 與銀行轉帳紀錄逐筆比對",
    source: "synthetic-enterprise" as DataSource,
  },
  {
    text: "正在套用 RBA 政策…",
    detail: "RBA Code of Conduct · ILO 公約 · IOM 指引",
    source: "policy-knowledge" as DataSource,
  },
  {
    text: "正在產生可解釋風險評估…",
    detail: "deterministic 計分，LLM 僅負責文字說明",
    source: "policy-knowledge" as DataSource,
  },
];

export type EvidenceStatus = "verified" | "conflict" | "obtained" | "missing";

export type EvidenceKey = "agency" | "interview" | "receipt" | "payment" | "independent";

export type EvidenceNode = {
  id: EvidenceKey | "cross";
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

export type CaseSeed = {
  id: string;
  worker: string;
  origin: string;
  workplace: string;
  agency: string;
  /** 移工回報／收據／付款紀錄一致的金額 */
  fee: number;
  /** 仲介聲明金額 */
  agencyClaim: number;
  date: string;
  language: string;
  /** 已取得的證據類型 */
  present: EvidenceKey[];
  /** 與仲介聲明衝突、直接指向招聘費支付的證據類型 */
  conflicting: EvidenceKey[];
  consistency: number;
  policyMatch: number;
  status: "待人工審核" | "調查中";
};

export const caseSeeds: CaseSeed[] = [
  {
    id: "2026-024",
    worker: "匿名移工 #024",
    origin: "越南",
    workplace: "台灣",
    agency: "ABC Recruitment Agency",
    fee: 60000,
    agencyClaim: 0,
    date: "2026 / 05 / 14",
    language: "越南語（逐字翻譯）",
    present: ["agency", "interview", "receipt", "payment", "independent"],
    conflicting: ["interview", "receipt", "payment"],
    consistency: 94,
    policyMatch: 90,
    status: "待人工審核",
  },
  {
    id: "2026-031",
    worker: "匿名移工 #031",
    origin: "越南",
    workplace: "台灣",
    agency: "ABC Recruitment Agency",
    fee: 55000,
    agencyClaim: 0,
    date: "2026 / 04 / 28",
    language: "越南語（逐字翻譯）",
    present: ["agency", "interview", "receipt", "payment", "independent"],
    conflicting: ["interview", "receipt", "payment", "agency"],
    consistency: 96,
    policyMatch: 84,
    status: "待人工審核",
  },
  {
    id: "2026-047",
    worker: "匿名移工 #047",
    origin: "越南",
    workplace: "台灣",
    agency: "Nam Viet Manpower",
    fee: 48000,
    agencyClaim: 12000,
    date: "2026 / 03 / 09",
    language: "越南語（逐字翻譯）",
    present: ["agency", "interview", "receipt", "payment", "independent"],
    conflicting: ["interview", "receipt", "payment"],
    consistency: 91,
    policyMatch: 88,
    status: "待人工審核",
  },
  {
    id: "2026-088",
    worker: "匿名移工 #088",
    origin: "印尼",
    workplace: "台灣",
    agency: "Sentosa Placement",
    fee: 38000,
    agencyClaim: 9500,
    date: "2026 / 02 / 21",
    language: "印尼語（逐字翻譯）",
    present: ["agency", "interview", "payment", "independent"],
    conflicting: ["interview", "payment", "independent"],
    consistency: 82,
    policyMatch: 86,
    status: "待人工審核",
  },
  {
    id: "2026-119",
    worker: "匿名移工 #119",
    origin: "越南",
    workplace: "台灣",
    agency: "ABC Recruitment Agency",
    fee: 45000,
    agencyClaim: 0,
    date: "2026 / 06 / 02",
    language: "越南語（逐字翻譯）",
    present: ["agency", "interview", "receipt", "independent"],
    conflicting: ["interview", "receipt", "independent"],
    consistency: 79,
    policyMatch: 87,
    status: "待人工審核",
  },
];

/** 主線案件 */
export const primaryCase: CaseSeed = caseSeeds[0]!;

export function buildEvidenceChain(seed: CaseSeed): EvidenceNode[] {
  const has = (k: EvidenceKey) => seed.present.includes(k);
  const conflicts = (k: EvidenceKey) => seed.conflicting.includes(k);

  const nodes: EvidenceNode[] = [
    {
      id: "agency",
      title: "仲介聲明",
      subtitle: "招聘費聲明",
      status: conflicts("agency") ? "conflict" : "obtained",
      statusLabel: conflicts("agency") ? "與合約條款不一致" : "已取得",
      amount: money(seed.agencyClaim),
      source: "synthetic-enterprise",
      body: [
        { label: "聲明單位", value: seed.agency },
        { label: "招聘費", value: money(seed.agencyClaim) },
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
      amount: money(seed.fee),
      source: "synthetic-enterprise",
      body: [
        { label: "受訪者", value: seed.worker },
        { label: "訪談語言", value: seed.language },
        { label: "回報金額", value: money(seed.fee) },
        { label: "訪談方式", value: "匿名、可拒答、不記錄身分" },
      ],
      interview: {
        question: "您來台灣工作之前，是否曾支付任何招聘相關費用？",
        answer: `有，我大約支付了 ${money(seed.fee)} 給招聘仲介。`,
      },
    },
    has("receipt")
      ? {
          id: "receipt" as const,
          title: "付款收據",
          subtitle: "OCR 已驗證",
          status: "verified" as const,
          statusLabel: "OCR 已驗證",
          amount: money(seed.fee),
          source: "synthetic-enterprise" as DataSource,
          body: [
            { label: "文件類型", value: "現金收據（示範文件）" },
            { label: "辨識信心", value: "97%" },
            { label: "金額欄位", value: money(seed.fee) },
          ],
          receipt: {
            amount: money(seed.fee),
            payee: seed.agency,
            date: seed.date,
            verifiedBy: "OCR 已驗證",
          },
        }
      : {
          id: "receipt" as const,
          title: "付款收據",
          subtitle: "尚未取得",
          status: "missing" as const,
          statusLabel: "尚未取得",
          amount: "—",
          source: "synthetic-enterprise" as DataSource,
          body: [
            { label: "文件類型", value: "現金收據" },
            { label: "取得狀態", value: "移工表示未取得收據" },
          ],
          note: "缺少收據會降低證據完整度，AI 不得以推測補足。",
        },
    has("payment")
      ? {
          id: "payment" as const,
          title: "付款紀錄",
          subtitle: "銀行轉帳摘要",
          status: "verified" as const,
          statusLabel: "已驗證",
          amount: money(seed.fee),
          source: "synthetic-enterprise" as DataSource,
          body: [
            { label: "付款金額", value: money(seed.fee) },
            { label: "付款日期", value: seed.date },
            { label: "收款方", value: seed.agency },
            { label: "與收據一致", value: has("receipt") ? "是" : "無收據可比對" },
          ],
        }
      : {
          id: "payment" as const,
          title: "付款紀錄",
          subtitle: "尚未取得",
          status: "missing" as const,
          statusLabel: "尚未取得",
          amount: "—",
          source: "synthetic-enterprise" as DataSource,
          body: [
            { label: "付款方式", value: "移工表示為現金支付" },
            { label: "取得狀態", value: "無銀行轉帳紀錄" },
          ],
          note: "現金支付常見於招聘費爭議，需以其他獨立證據交叉驗證。",
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
        { label: "證據一致性", value: `${seed.consistency}%` },
        { label: "政策符合度", value: `${seed.policyMatch}%` },
        {
          label: "衝突方向",
          value: `仲介 ${money(seed.agencyClaim)} vs 獨立證據 ${money(seed.fee)}`,
        },
      ],
      note: `仲介聲明與 ${seed.conflicting.filter((k) => k !== "agency").length} 項獨立證據不一致。`,
    },
  ];

  return nodes;
}

export const caseReasons = (seed: CaseSeed) =>
  [
    "移工主動回報支付招聘費。",
    seed.present.includes("receipt") ? "收據確認支付金額。" : "移工陳述為現金支付，無收據可佐證。",
    seed.present.includes("payment") && seed.present.includes("receipt")
      ? "付款紀錄與收據金額一致。"
      : seed.present.includes("payment")
        ? "付款紀錄金額與移工陳述一致。"
        : "無銀行付款紀錄，僅以訪談與收據佐證。",
    "仲介聲明與獨立證據存在衝突。",
    "多個證據來源指向相同事件。",
    "達到預先設定的高風險門檻。",
  ] as string[];

export function getCase(id: string) {
  const seed = caseSeeds.find((c) => c.id === id) ?? primaryCase;
  return {
    seed,
    title: `案件 #${seed.id}`,
    evidence: buildEvidenceChain(seed),
    reasons: caseReasons(seed),
    conclusion: "疑似 RBA 招聘費合規風險",
    conclusionNote: "需要人工合規審核，不由 AI 自動判定違法。",
  };
}

export const evidenceChain = buildEvidenceChain(primaryCase);
export const riskCase = {
  id: primaryCase.id,
  title: `案件 #${primaryCase.id}`,
  worker: primaryCase.worker,
  origin: primaryCase.origin,
  workplace: primaryCase.workplace,
  agency: primaryCase.agency,
  riskLabel: "高風險",
  consistency: primaryCase.consistency,
  policyMatch: primaryCase.policyMatch,
  reasons: caseReasons(primaryCase),
  conclusion: "疑似 RBA 招聘費合規風險",
  conclusionNote: "需要人工合規審核，不由 AI 自動判定違法。",
};

export const trustPillars = [
  {
    q: "代表誰？",
    a: "ABC Electronics 合規管理員",
    detail: "AI Agent 以企業合規部門的身分執行，不代表仲介或第三方。",
  },
  {
    q: "AI 被授權做什麼？",
    a: "RBA 招聘合規驗證",
    detail: "僅能讀取證據、比對政策、產生風險評估。",
  },
  { q: "使用什麼政策？", a: "RBA / ILO / IOM", detail: "政策條文以 RAG 檢索，結論須引用來源。" },
  {
    q: "使用什麼證據？",
    a: "移工、仲介、付款資料",
    detail: "移工資料匿名化，AI 不接觸姓名與證件號。",
  },
  {
    q: "誰負責最後決定？",
    a: "人工合規人員",
    detail: "高風險案件必須由人審核，AI 不得自動判定違法。",
  },
  {
    q: "是否可以追溯？",
    a: "所有 AI 行動均留下稽核紀錄",
    detail: "每筆行動記錄時間、執行者、證據、授權與結果。",
  },
];

export const remediationSteps = [
  {
    no: "01",
    title: "確認移工付款紀錄",
    detail: "調閱 #024 的完整付款憑證與時間序，確認支付對象與金額。",
  },
  {
    no: "02",
    title: "確認相關招聘仲介",
    detail: "鎖定 ABC Recruitment Agency 在越南的合作來源公司。",
  },
  {
    no: "03",
    title: "計算可能的返還金額",
    detail: "以 ILO 基準與實付金額差額，估算應返還費用區間。",
  },
  {
    no: "04",
    title: "調查相同仲介招聘的其他移工",
    detail: "同仲介另有 3 件待審案件，需一併抽樣訪談。",
  },
  { no: "05", title: "重新審查仲介合約", detail: "檢視合約中招聘費、服務費與代收款項條款。" },
  { no: "06", title: "記錄改善結果", detail: "返還憑證、合約修訂與訪談紀錄一併納入證據鏈。" },
  { no: "07", title: "重新進行合規驗證", detail: "改善完成後重跑驗證，才可重新發行合規憑證。" },
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
  issuer: "TrustRBA Compliance Authority",
  standard: "RBA Code of Conduct · Recruitment Fees",
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
  origin: "越南",
  agency: "ABC Recruitment Agency",
  detectedAt: "2026 / 09 / 12",
};

export const auditLog = [
  {
    time: "14:32:04",
    actor: "AI Agent",
    action: "啟動驗證",
    evidence: "驗證任務 #V-2026-0828",
    auth: "合規管理員授權",
    result: "已啟動",
  },
  {
    time: "14:32:06",
    actor: "AI Agent",
    action: "取得 ILO / KNOMAD 基準",
    evidence: "Migration Cost Benchmark",
    auth: "唯讀資料存取",
    result: "成功",
  },
  {
    time: "14:32:08",
    actor: "AI Agent",
    action: "分析移工證據",
    evidence: "匿名訪談 #024",
    auth: "匿名化資料",
    result: "發現回報付款",
  },
  {
    time: "14:32:10",
    actor: "AI Agent",
    action: "付款紀錄驗證完成",
    evidence: "收據 + 轉帳紀錄",
    auth: "唯讀資料存取",
    result: "金額一致",
  },
  {
    time: "14:32:12",
    actor: "AI Agent",
    action: "發現證據衝突",
    evidence: "仲介聲明 vs 獨立證據",
    auth: "驗證授權",
    result: "衝突成立",
  },
  {
    time: "14:32:14",
    actor: "AI Agent",
    action: "產生風險評估",
    evidence: "Evidence Score 100 / 100",
    auth: "deterministic 計分",
    result: "高風險",
  },
  {
    time: "14:32:17",
    actor: "AI Agent",
    action: "要求人工審核",
    evidence: "案件 #2026-024",
    auth: "禁止自動判定",
    result: "已送審",
  },
  {
    time: "14:33:02",
    actor: "合規管理員",
    action: "核准調查",
    evidence: "案件 #2026-024",
    auth: "人工權限",
    result: "調查啟動",
  },
  {
    time: "14:34:21",
    actor: "系統",
    action: "合規憑證建立",
    evidence: "TRUST-RBA-8F92A1",
    auth: "人工審核完成",
    result: "已發行",
  },
];

/** 撤銷情境才會出現的稽核紀錄 */
export const revocationAuditLog = [
  {
    time: "09:14:07",
    actor: "AI Agent",
    action: "偵測新證據",
    evidence: `${newEvidence.worker} · ${newEvidence.fee}`,
    auth: "持續監控授權",
    result: "高風險訊號",
  },
  {
    time: "09:14:09",
    actor: "AI Agent",
    action: "重新計算合規狀態",
    evidence: "未解決高風險案件 1 件",
    auth: "deterministic 計分",
    result: "不符合發行條件",
  },
  {
    time: "09:14:12",
    actor: "系統",
    action: "撤銷合規憑證",
    evidence: credential.id,
    auth: "憑證政策：未解決證據即撤銷",
    result: "CREDENTIAL REVOKED",
  },
];

/** 主流程順序，用於頁面底部的「上一步／下一步」導引。 */
export const workflowSteps = [
  { to: "/", title: "問題", step: 0, caption: "為什麼合規文件不等於合規事實" },
  { to: "/worker", title: "移工申報", step: 1, caption: "移工端：免帳號、多語言的申報入口" },
  { to: "/worker/submit", title: "移工申報", step: 1, caption: "上傳文件與去識別化" },
  { to: "/dashboard", title: "企業偵測", step: 2, caption: "合規總覽與仲介風險排行" },
  { to: "/verification", title: "企業偵測", step: 2, caption: "AI 驗證中心" },
  { to: "/evidence", title: "企業偵測", step: 2, caption: "證據鏈與交叉驗證" },
  { to: "/cases", title: "人工審核", step: 3, caption: "案件審核佇列" },
  { to: "/vendors", title: "人工審核", step: 3, caption: "中間商合規總表" },
  { to: `/cases/${primaryCase.id}`, title: "人工審核", step: 3, caption: "AI 判斷依據與審核決定" },
  { to: "/remediation", title: "改善返還", step: 4, caption: "返還追蹤與改善步驟" },
  { to: "/credential", title: "憑證與驗證", step: 5, caption: "RBA 合規憑證" },
  { to: "/verify", title: "憑證與驗證", step: 5, caption: "第三方驗證與撤銷" },
  { to: "/audit", title: "憑證與驗證", step: 5, caption: "稽核紀錄" },
];

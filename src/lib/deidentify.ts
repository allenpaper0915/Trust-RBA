/**
 * 去識別化引擎（De-identification）。
 *
 * 移工上傳的文件在離開瀏覽器之前先做遮蔽：只保留合規判斷需要的欄位
 * （金額、日期、幣別、仲介名稱），移除可以指認個人的欄位。
 *
 * 規則為固定的樣式比對，不使用 LLM，因此結果可重現、可被稽核。
 */

export type PiiKind =
  "name" | "passport" | "arc" | "phone" | "bank" | "email" | "address" | "birthday";

export type PiiRule = {
  kind: PiiKind;
  label: string;
  /** 為什麼要遮蔽這個欄位 */
  reason: string;
  pattern: RegExp;
  /** 取第幾個 capture group 當作要遮蔽的值，預設整段 */
  group?: number;
};

export type PiiFinding = {
  kind: PiiKind;
  label: string;
  reason: string;
  original: string;
  masked: string;
};

/** 這些欄位「不會」被遮蔽 —— 它們就是合規判斷的依據。 */
export const retainedFields = [
  { label: "支付金額", reason: "與招聘費基準比對的核心數字" },
  { label: "支付日期", reason: "判斷是否落在受僱期間" },
  { label: "幣別", reason: "換算為同一基準幣別" },
  { label: "仲介／收款方名稱", reason: "追查同一仲介的其他案件" },
  { label: "來源國與工作地", reason: "對應 ILO / KNOMAD 的移工走廊基準" },
];

const rules: PiiRule[] = [
  {
    kind: "name",
    label: "姓名",
    reason: "可直接指認個人，企業審核不需要知道是誰。",
    pattern: /(姓名|名字|Name|Họ tên|Ho ten|Nama)\s*[:：]\s*([^\n,，;；]{1,30})/gi,
    group: 2,
  },
  {
    kind: "arc",
    label: "居留證／身分證號",
    reason: "唯一識別碼，外洩後無法撤回。",
    pattern: /\b[A-Z][A-D12]\d{8}\b/g,
  },
  {
    kind: "passport",
    label: "護照號碼",
    reason: "唯一識別碼，且可連結出入境紀錄。",
    pattern: /\b[A-Z]{1,2}\d{7,9}\b/g,
  },
  {
    kind: "phone",
    label: "電話號碼",
    reason: "可被用來聯繫或施壓申報人。",
    pattern:
      /(?:\+?886[-\s]?|0)9\d{2}[-\s]?\d{3}[-\s]?\d{3}|\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4}/g,
  },
  {
    kind: "bank",
    label: "銀行帳號",
    reason: "金流帳號屬敏感財務資訊，比對只需要金額。",
    pattern: /(?:帳號|帳戶|Account|Số tài khoản|Rekening)\s*[:：]?\s*(\d[\d-]{8,20}\d)/gi,
    group: 1,
  },
  {
    kind: "email",
    label: "電子郵件",
    reason: "可指認個人並成為聯繫管道。",
    pattern: /[\w.+-]+@[\w-]+\.[\w.]{2,}/g,
  },
  {
    kind: "address",
    label: "居住地址",
    reason: "可定位到宿舍或住所。",
    pattern: /(地址|住址|Address|Địa chỉ|Dia chi|Alamat)\s*[:：]\s*([^\n]{2,60})/gi,
    group: 2,
  },
  {
    kind: "birthday",
    label: "出生日期",
    reason: "與其他欄位組合後可還原身分。",
    pattern:
      /(出生|生日|Date of Birth|DOB|Ngày sinh)\s*[:：]\s*([0-9]{2,4}[-/.][0-9]{1,2}[-/.][0-9]{1,4})/gi,
    group: 2,
  },
];

/** 遮蔽：保留第一個字元，其餘以 • 取代，讓人看得出「有這個欄位但看不到內容」。 */
export function maskValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 1) return "•";
  if (trimmed.length <= 3) return trimmed[0] + "•".repeat(trimmed.length - 1);
  return trimmed.slice(0, 1) + "•".repeat(Math.min(trimmed.length - 1, 9));
}

export type DeidentifyResult = {
  redacted: string;
  findings: PiiFinding[];
};

/**
 * 對一段文字執行去識別化，回傳遮蔽後文字與逐項發現。
 * 同一個值只會被記錄一次，但文中所有出現位置都會被遮蔽。
 */
export function deidentify(text: string): DeidentifyResult {
  let redacted = text;
  const findings: PiiFinding[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    const matches = [...text.matchAll(rule.pattern)];
    for (const m of matches) {
      const raw = (rule.group ? m[rule.group] : m[0]) ?? "";
      const value = raw.trim();
      if (!value) continue;
      const masked = maskValue(value);
      const key = `${rule.kind}:${value}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({
          kind: rule.kind,
          label: rule.label,
          reason: rule.reason,
          original: value,
          masked,
        });
      }
      redacted = redacted.split(value).join(masked);
    }
  }

  return { redacted, findings };
}

/** 產生匿名代號：同一份申報在整個平台只以這個代號出現。 */
export function aliasFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `匿名申報人 #${String((h % 900) + 100)}`;
}

const CODE_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3456789";

/** 移工查詢碼：不含個資，只有持有者知道，用來回來查進度。 */
export function newLookupCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `TRB-${s}`;
}

/**
 * 證明層（Proof）。
 *
 * 先講清楚它能證明什麼、不能證明什麼：
 *
 *   能證明 —— 「這份紀錄從 T 時刻起沒有被改過、是由 P 簽的、確實在那份公開摘要裡」。
 *   不能證明 —— 「這名移工真的沒有被收費」。
 *
 * 後者是事實問題，只能靠證據鏈（雇主付款憑證、移工金流、仲介明細）來回答。
 * 密碼學只保證證據在事後不會被悄悄修改或抽掉——而這正是稽核最在意的那一半。
 *
 * 全部使用瀏覽器原生 Web Crypto，沒有外部套件、沒有錢包、沒有 gas。
 * 移工不需要持有任何金鑰。
 */

/** 穩定序列化：欄位排序後再雜湊，避免同一份資料因鍵順序不同得到不同雜湊。 */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}

const enc = new TextEncoder();

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

export const shortHash = (h: string) => `${h.slice(0, 8)}…${h.slice(-4)}`;

/* ------------------------------------------------------------------ *
 * 雜湊鏈：每一筆紀錄都含前一筆的雜湊
 * ------------------------------------------------------------------ */

export type ChainedRecord<T> = {
  index: number;
  data: T;
  prev: string;
  hash: string;
};

export const GENESIS = "0".repeat(64);

/**
 * 把一串事件串成雜湊鏈。
 * 改掉中間任何一筆，它以後的每一個雜湊都會對不上——事後竄改藏不住。
 */
export async function buildChain<T>(items: T[]): Promise<ChainedRecord<T>[]> {
  const out: ChainedRecord<T>[] = [];
  let prev = GENESIS;
  for (let i = 0; i < items.length; i++) {
    const data = items[i]!;
    const hash = await sha256(`${i}|${prev}|${canonical(data)}`);
    out.push({ index: i, data, prev, hash });
    prev = hash;
  }
  return out;
}

export type ChainVerdict = { ok: true } | { ok: false; brokenAt: number };

/** 重算整條鏈，回報第一個對不上的位置。 */
export async function verifyChain<T>(chain: ChainedRecord<T>[]): Promise<ChainVerdict> {
  let prev = GENESIS;
  for (const rec of chain) {
    const expected = await sha256(`${rec.index}|${prev}|${canonical(rec.data)}`);
    if (rec.prev !== prev || rec.hash !== expected) return { ok: false, brokenAt: rec.index };
    prev = rec.hash;
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ *
 * Merkle 樹：讓第三方驗證單一筆紀錄，而不必看到其他人的資料
 * ------------------------------------------------------------------ */

export type MerkleProof = { leaf: string; path: { hash: string; side: "left" | "right" }[] };

async function pair(a: string, b: string) {
  return sha256(`${a}${b}`);
}

/** 由葉節點雜湊建樹，回傳每一層。奇數節點與自己配對。 */
async function levels(leaves: string[]): Promise<string[][]> {
  if (leaves.length === 0) return [[GENESIS]];
  const all: string[][] = [leaves];
  let current = leaves;
  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const a = current[i]!;
      const b = current[i + 1] ?? a;
      next.push(await pair(a, b));
    }
    all.push(next);
    current = next;
  }
  return all;
}

export async function merkleRoot(leaves: string[]): Promise<string> {
  const all = await levels(leaves);
  return all[all.length - 1]![0]!;
}

/**
 * 產生第 index 筆的包含證明。
 * 查驗方拿著這條路徑就能自己算回根雜湊，不需要（也看不到）其他人的紀錄。
 */
export async function merkleProof(leaves: string[], index: number): Promise<MerkleProof> {
  const all = await levels(leaves);
  const path: MerkleProof["path"] = [];
  let i = index;
  for (let level = 0; level < all.length - 1; level++) {
    const nodes = all[level]!;
    const isRight = i % 2 === 1;
    const siblingIndex = isRight ? i - 1 : i + 1;
    const sibling = nodes[siblingIndex] ?? nodes[i]!;
    path.push({ hash: sibling, side: isRight ? "left" : "right" });
    i = Math.floor(i / 2);
  }
  return { leaf: leaves[index]!, path };
}

/** 只用「這一筆 + 路徑」重算根雜湊。 */
export async function verifyMerkleProof(proof: MerkleProof): Promise<string> {
  let acc = proof.leaf;
  for (const step of proof.path) {
    acc = step.side === "left" ? await pair(step.hash, acc) : await pair(acc, step.hash);
  }
  return acc;
}

/* ------------------------------------------------------------------ *
 * 簽章：憑證由發行者簽，任何人都能用公鑰驗
 * ------------------------------------------------------------------ */

/**
 * 示範金鑰。正式環境中私鑰放在發行者的 HSM，永遠不會出現在前端；
 * 這裡放進原始碼只是為了讓 Demo 可以離線完整跑完簽署與驗證。
 */
const DEMO_PRIVATE_JWK: JsonWebKey = {
  kty: "EC",
  crv: "P-256",
  x: "Z3ECX8X6lHxiQH8qsV-gTjHun98yefMVsC3hrVThieY",
  y: "Sx6GHzNZ5hF9BNlQ55RANOk1K2ze-IlJDUd5taWNajA",
  d: "PQYx3T_WGUhByuqnU1iqJB7oxsls__uVoBz5UAEJYYs",
  ext: true,
  key_ops: ["sign"],
};

export const ISSUER_PUBLIC_JWK: JsonWebKey = {
  kty: "EC",
  crv: "P-256",
  x: "Z3ECX8X6lHxiQH8qsV-gTjHun98yefMVsC3hrVThieY",
  y: "Sx6GHzNZ5hF9BNlQ55RANOk1K2ze-IlJDUd5taWNajA",
  ext: true,
  key_ops: ["verify"],
};

const ALG = { name: "ECDSA", namedCurve: "P-256" } as const;
const SIGN_ALG = { name: "ECDSA", hash: "SHA-256" } as const;

export async function signPayload(payload: unknown): Promise<string> {
  const key = await crypto.subtle.importKey("jwk", DEMO_PRIVATE_JWK, ALG, false, ["sign"]);
  const sig = await crypto.subtle.sign(SIGN_ALG, key, enc.encode(canonical(payload)));
  return hex(sig);
}

export async function verifyPayload(payload: unknown, signatureHex: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey("jwk", ISSUER_PUBLIC_JWK, ALG, false, ["verify"]);
    const bytes = new Uint8Array((signatureHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)));
    return await crypto.subtle.verify(SIGN_ALG, key, bytes, enc.encode(canonical(payload)));
  } catch {
    return false;
  }
}

/** 公鑰指紋，讓查驗方確認自己用的是同一把公鑰。 */
export async function issuerFingerprint(): Promise<string> {
  return sha256(canonical(ISSUER_PUBLIC_JWK));
}

/* ------------------------------------------------------------------ *
 * 錨定（anchoring）——為什麼這裡沒有區塊鏈
 * ------------------------------------------------------------------ */

export type AnchorOption = {
  key: string;
  label: string;
  cost: string;
  /** 誰需要信任誰 */
  trust: string;
  verdict: "chosen" | "viable" | "rejected";
  note: string;
};

export const anchorOptions: AnchorOption[] = [
  {
    key: "cosign",
    label: "多方共同簽署（企業 ＋ 稽核機構 ＋ 品牌客戶）",
    cost: "零額外成本",
    trust: "任一方都無法單獨改寫；改寫需要全部串謀",
    verdict: "chosen",
    note: "RBA 場景裡本來就有具名、可追責的三方。有具名當事人時，共同簽署比匿名共識更適合。",
  },
  {
    key: "tsa",
    label: "RFC 3161 可信時戳",
    cost: "每次數美分",
    trust: "需信任時戳機構，但機構有法律責任",
    verdict: "viable",
    note: "只需要證明「這份摘要在某時刻已存在」時，這是最便宜且法庭上最成熟的做法。",
  },
  {
    key: "log",
    label: "公開透明日誌（Certificate Transparency 型）",
    cost: "低",
    trust: "任何人都可以稽核日誌本身是否只增不改",
    verdict: "viable",
    note: "適合需要「無法悄悄抽掉一筆」的場景，也是我們最推薦的下一步。",
  },
  {
    key: "chain",
    label: "公鏈上鏈（僅寫入 Merkle 根）",
    cost: "每次數美分至數美元，且需持有加密資產",
    trust: "不需信任任何單一機構",
    verdict: "rejected",
    note: "只有在「連稽核機構與品牌客戶都不能信任」時才划算。上鏈的也只能是雜湊根——個資絕不上鏈。移工端完全不需要接觸。",
  },
];

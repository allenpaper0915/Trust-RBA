/**
 * Deterministic 風險計分引擎。
 *
 * LLM 不參與任何數字計算，只負責文字解釋與建議。
 * 兩個分數刻意分開，讓「證據夠不夠」與「風險多高」可以各自被檢驗：
 *   證據完整度分數 = 已取得的證據類型權重總和
 *   風險分數       = 與仲介聲明衝突、直接指向招聘費支付的證據權重總和
 */

import type { CaseSeed, EvidenceKey } from "@/data/compliance";

export type EvidenceWeight = {
  key: EvidenceKey;
  label: string;
  points: number;
  present: boolean;
  conflicting?: boolean;
};

/** 權重表為固定設定值，不由模型產生。 */
export const weightTable: { key: EvidenceKey; label: string; points: number }[] = [
  { key: "interview", label: "移工訪談", points: 20 },
  { key: "receipt", label: "付款收據", points: 25 },
  { key: "payment", label: "付款紀錄", points: 30 },
  { key: "independent", label: "獨立證據", points: 15 },
  { key: "agency", label: "仲介資料", points: 10 },
];

export const evidenceWeights: EvidenceWeight[] = weightTable.map((w) => ({
  ...w,
  present: true,
  conflicting: w.key === "interview" || w.key === "receipt" || w.key === "payment",
}));

export type RiskLevel = "低" | "中" | "高" | "極高";

export function caseWeights(seed: CaseSeed): EvidenceWeight[] {
  return weightTable.map((w) => ({
    ...w,
    present: seed.present.includes(w.key),
    conflicting: seed.conflicting.includes(w.key),
  }));
}

/** 證據完整度分數：已取得證據的權重總和。 */
export function scoreEvidence(weights: EvidenceWeight[] = evidenceWeights): number {
  return weights.filter((w) => w.present).reduce((sum, w) => sum + w.points, 0);
}

/** 風險分數：與仲介聲明衝突之證據的權重總和。 */
export function scoreRisk(weights: EvidenceWeight[] = evidenceWeights): number {
  return weights.filter((w) => w.present && w.conflicting).reduce((sum, w) => sum + w.points, 0);
}

export function riskLevel(score: number): RiskLevel {
  if (score <= 29) return "低";
  if (score <= 59) return "中";
  if (score <= 79) return "高";
  return "極高";
}

export function riskLabel(score: number): string {
  return `${riskLevel(score)}風險`;
}

export function riskTone(score: number): "success" | "warning" | "danger" {
  const level = riskLevel(score);
  if (level === "低") return "success";
  if (level === "中") return "warning";
  return "danger";
}

/** 一次取得案件的所有 deterministic 數字。 */
export function assessCase(seed: CaseSeed) {
  const weights = caseWeights(seed);
  const evidenceScore = scoreEvidence(weights);
  const risk = scoreRisk(weights);
  return {
    weights,
    evidenceScore,
    riskScore: risk,
    level: riskLevel(risk),
    label: riskLabel(risk),
    tone: riskTone(risk),
  };
}

export const riskBands = [
  { range: "0–29", level: "低", tone: "success" as const },
  { range: "30–59", level: "中", tone: "warning" as const },
  { range: "60–79", level: "高", tone: "danger" as const },
  { range: "80–100", level: "極高", tone: "danger" as const },
];

export const scoreDisclaimer = "AI 信心分數來自證據完整度與來源一致性，而非由 LLM 任意產生。";

export const engineNote =
  "權重表與級距為系統預先設定的固定值。LLM 只負責解釋、摘要與建議改善方案，不決定任何核心數字。";

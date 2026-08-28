/**
 * Deterministic 風險計分引擎。
 * LLM 不參與任何數字計算，只負責文字解釋與建議。
 */

export type EvidenceWeight = {
  key: string;
  label: string;
  points: number;
  present: boolean;
};

export const evidenceWeights: EvidenceWeight[] = [
  { key: "interview", label: "移工訪談", points: 20, present: true },
  { key: "receipt", label: "付款收據", points: 25, present: true },
  { key: "payment", label: "付款紀錄", points: 30, present: true },
  { key: "independent", label: "獨立證據", points: 15, present: true },
  { key: "agency", label: "仲介資料", points: 10, present: true },
];

export type RiskLevel = "低" | "中" | "高" | "極高";

export function scoreEvidence(weights: EvidenceWeight[] = evidenceWeights): number {
  return weights.filter((w) => w.present).reduce((sum, w) => sum + w.points, 0);
}

export function riskLevel(score: number): RiskLevel {
  if (score <= 29) return "低";
  if (score <= 59) return "中";
  if (score <= 79) return "高";
  return "極高";
}

export const riskBands = [
  { range: "0–29", level: "低" },
  { range: "30–59", level: "中" },
  { range: "60–79", level: "高" },
  { range: "80–100", level: "極高" },
];

export const scoreDisclaimer =
  "AI 信心分數來自證據完整度與來源一致性，而非由 LLM 任意產生。";

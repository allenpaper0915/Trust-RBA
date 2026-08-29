# TrustRBA

RBA 移工招聘費合規平台。移工端自主申報（多語、去識別化）與企業端人工審核共用同一份資料。

## 開發

```bash
bun install
bun run dev      # http://localhost:8080
bun run build
bun run lint
```

## 重點檔案

| 檔案 | 用途 |
|------|------|
| `src/lib/deidentify.ts` | 去識別化規則（固定樣式比對，非 LLM） |
| `src/lib/analysis.ts` | 費用鏈分析、幣別換算、基準比對 |
| `src/lib/risk-engine.ts` | deterministic 風險與證據計分 |
| `src/components/platform-store.tsx` | 案件、稽核事件、審核決定的單一來源 |
| `src/data/cases.ts` | 案件模型與初始資料 |

風險分數與金額一律由固定權重表與規則計算，不由模型產生。

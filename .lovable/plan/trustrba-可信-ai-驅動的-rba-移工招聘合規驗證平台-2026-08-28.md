# TrustRBA — 可信 AI 驅動的 RBA 移工招聘合規驗證平台

全繁體中文、企業級 B2B 合規 SaaS，適合 Hackathon Demo 與桌機錄影（1440×900 優先）。

## 視覺方向（取自參考圖片色調）

- 主色：企業藍 #1B5FAA（CTA、Active 導航、進度、AI Agent）
- 深藍：#123B6E（Sidebar、標題、重點數據）
- 強調紅：#C0392B（僅用於高風險、撤銷狀態，低飽和）
- 背景：#F7F8FA 淺灰白；卡片白；邊框 #E3E7EE
- 狀態色：成功 #2E7D5B、注意 #C98A16、危險 #C0392B（皆低飽和）
- 字體：Noto Sans TC（透過 __root.tsx 的 `<link>` 載入），標題 700、正文 400/500、數據 600/700，行高寬鬆
- 克制風格：無漸層、無玻璃擬態、少 emoji（僅狀態點）、大量留白

## 版面

固定左側 240px Sidebar（TrustRBA / 可信 AI × 供應鏈合規、六個導航項、底部 ABC Electronics 合規管理員 · 系統已連線），右側主內容 max-width 1440、padding 32–48px。頂列含「示範企業｜Synthetic Enterprise Data」標記、🎬 Demo Mode、🎥 簡報模式切換。

## 頁面（TanStack 路由，各頁自帶中文 head metadata）

1. `/` 首頁：Hero「不只是聲稱合規，而是證明合規。」＋副標、CTA「開始合規驗證」/「查看 Demo 流程」、三個特色（驗證／解釋／證明）、結尾「From AI Decisions to Verifiable Trust.」區塊（含 Evidence／Governance／Verification 三點）
2. `/dashboard` 合規總覽：合規分數 87/100（需要注意）、移工 328、仲介 5、證據 914、高風險 5；下方「全球招聘費基準」區塊（越南→台灣 NT$42,000 vs 基準 NT$18,000、+133%、風險訊號、免責語「基準異常不代表違規，僅代表需要進一步驗證。」）
3. `/verification` AI 驗證中心：六階段流程圖（資料蒐集→標準化→交叉驗證→政策比對→風險解釋→人工審核）、「執行 AI 驗證」按鈕觸發逐步動畫訊息，結束顯示「驗證完成 · 發現 5 個高風險案件」
4. `/cases` 風險案件列表 + `/cases/2026-024` 案件詳情：高風險 Badge、匿名移工 #024、越南→台灣、ABC Recruitment Agency；證據鏈（仲介聲明→移工訪談→付款收據→付款紀錄→AI 交叉驗證，每節點可點擊展開細節，含示範收據卡片）；AI 交叉驗證衝突畫面（四張大卡 NT$0 / 60,000 / 60,000 / 60,000、一致性 94%、政策符合度 90%、風險 高）；「為什麼 AI 判定高風險？」六條依據 + AI 結論 + 人工審核提示；可解釋 Evidence Score 明細（+20/+25/+30/+15/+10 = 100）；Trustworthy AI 六項治理卡；人工審核「核准調查／駁回判定」
5. `/cases/2026-024/remediation` 建議改善方案：01–07 步驟清單
6. `/credential` 合規憑證：中央憑證大卡（TRUSTRBA / ABC Electronics / 招聘費合規 / ✓ VERIFIED、328、5、94%、0、Issued 2026/08/28、Expires 2027/02/28、TRUST-RBA-8F92A1）；隱私保護對照（可見／不可見清單）；「模擬新證據」按鈕觸發撤銷（Worker #182、NT$70,000 → 憑證已撤銷）
7. `/verify` 第三方驗證：輸入 TRUST-RBA-8F92A1 → 驗證結果（VALID 或撤銷後 ❌ 憑證無效）
8. `/audit` AI 稽核紀錄：時間軸 9 筆（14:32:04 → 14:34:21），每筆顯示時間、執行者、行動、證據、授權、結果

## 技術做法

- 純前端 Demo：無後端、無登入。所有情境資料放在 `src/data/demo.ts`（企業合成資料、基準資料、證據鏈、稽核紀錄），並標註資料來源類型（Real-world Benchmark / Policy Knowledge / Synthetic Enterprise Data）
- 風險引擎為 deterministic：`src/lib/risk-engine.ts` 以固定加權計分（20/25/30/15/10）與級距（0–29 低、30–59 中、60–79 高、80–100 極高），不使用 LLM 產生數字；文字解釋為預先撰寫的固定內容
- 憑證狀態（VALID / REVOKED）與 Demo Mode、簡報模式共用一個輕量 React Context + localStorage，跨頁一致
- 驗證流程與撤銷動畫用 CSS transition + 計時器逐步揭露，克制不炫技
- Design token 全部寫在 `src/styles.css` 的 `:root` / `@theme inline`（oklch），元件只用語意 token
- 簡報模式：隱藏 Sidebar 與次要資訊、放大核心數據，頂部顯示 問題→偵測→驗證→人工審核→憑證→第三方驗證 進度條

## 開發順序

Phase 1 設計系統＋Sidebar＋首頁＋合規總覽 → Phase 2 基準＋AI 驗證＋案件＋證據鏈 → Phase 3 AI 解釋＋人工審核＋改善方案 → Phase 4 憑證＋第三方驗證＋撤銷 → Phase 5 稽核紀錄＋Demo/簡報模式＋動畫與視覺收尾

# TrustRBA: Verifiable Compliance

產品規格與 Hackathon 需求文件

最高優先級要求

請建立一個完整、可互動、適合 Hackathon Demo 與影片錄製的 Web Application：

TrustRBA

可信 AI 驅動的 RBA 移工招聘合規驗證平台

英文副標：

Trustworthy AI for Verifiable Migrant Worker Compliance

0. LANGUAGE & LOCAL DESIGN REQUIREMENTS

⚠️ CRITICAL

整個 Demo 必須以繁體中文為主要語言。

這不是英文 SaaS 翻譯版，而是要設計成：

台灣企業使用的企業級 B2B Compliance SaaS。

所有 UI 預設使用繁體中文

例如：

❌ 不要：

Dashboard

Risk Assessment

Evidence

Credential

Verification

改成：

合規總覽

風險評估

證據中心

合規憑證

憑證驗證

英文只在以下情況出現：

Logo / Product Name

TrustRBA

Trustworthy AI

RBA

ILO

KNOMAD

Verifiable Credential

技術名詞必要時的英文

1. 台灣使用者視覺審美

整體視覺請符合：

台灣企業 / 金融科技 / ESG / SaaS 審美

參考方向：

台灣銀行數位金融

台灣大型企業 ESG 平台

B2B SaaS

企業內部管理系統

FinTech

Professional Compliance Platform

不要做成：

❌ 美國新創網站

❌ Crypto Dashboard

❌ NFT / Web3 landing page

❌ 過度霓虹

❌ Cyberpunk

❌ 過度玻璃擬態

❌ 過度黑色背景

❌ 過度 3D

2. COLOR REFERENCE

我會提供一張參考圖片作為：

Color Palette Reference

請仔細分析我提供的圖片：

主色

輔助色

背景色

卡片色

邊框色

強調色

狀態色

文字顏色

然後建立完整 Design Token。

非常重要

不要直接複製參考圖片的 UI。

只參考：

色調、明度、飽和度、整體氛圍。

產品仍然維持 TrustRBA 自己的企業級 UI。

3. 色彩原則

整體：

Background

非常淺的灰白 / 米白背景。

不要純白到刺眼。

Primary

使用參考圖片中的主要品牌色。

主要用於：

CTA

Active navigation

Progress

AI Agent

Important links

Success

使用低飽和綠色。

例如：

🟢 已驗證

Warning

使用低飽和橘 / 黃。

例如：

🟡 需要注意

Danger

使用低飽和紅色。

例如：

🔴 高風險

不要使用過度鮮豔的純紅、純綠。

4. Typography

使用適合繁體中文的現代字體。

優先：

Noto Sans TC

如果不可用，使用系統繁體中文字體。

例如：

"Noto Sans TC",
"PingFang TC",
"Microsoft JhengHei",
sans-serif


中文需要：

字距舒服

行高足夠

不要過度壓縮

不要使用太細的字重

標題：

Bold / 700

正文：

400 / 500

數據：

600 / 700

5. Overall UI Structure

使用：

Left Sidebar

固定左側導航。

右側：

Main Content

不要讓頁面太擁擠。

桌面版優先。

推薦：

Sidebar: 240px

Main Content:
max-width 1440px

Content padding:
32px–48px


6. Navigation

左側 Logo：

TrustRBA

下面：

可信 AI × 供應鏈合規

Navigation：

總覽

合規總覽

AI 驗證

AI 驗證中心

證據中心

證據鏈

風險案件

風險案件

合規憑證

Verifiable Credential

稽核紀錄

AI Audit Log

底部：

ABC Electronics

合規管理員

🟢 系統已連線

7. 首頁

建立一個漂亮的 Hero。

主標題：

不只是聲稱合規，

而是證明合規。

副標：

TrustRBA 利用可信 AI 交叉驗證移工、仲介、付款與政策資料，將 RBA 合規從一份文件，轉化為可追溯、可驗證、可撤銷的信任憑證。

CTA：

開始合規驗證

Secondary：

查看 Demo 流程

三個 Feature：

驗證

交叉比對多方資料，而非相信單一來源。

解釋

每一個 AI 判斷都能追溯到實際證據。

證明

將驗證結果轉換成第三方可驗證的合規憑證。

8. Demo Scenario

整個 Demo 使用：

ABC Electronics

標示：

示範企業｜Synthetic Enterprise Data

公司資訊：

台灣電子製造供應商

移工：

328 人

仲介：

5 家

證據：

914 筆

9. 合規總覽

標題：

合規總覽

副標：

ABC Electronics · RBA 移工招聘合規

Top Cards：

合規分數

87 / 100

🟡 需要注意

移工人數

328

招聘仲介

5

證據紀錄

914

高風險案件

5

10. 全球招聘費基準

標題：

全球招聘費基準

副標：

參考 ILO / World Bank / KNOMAD 公開資料

說明：

TrustRBA 使用公開的全球移工招聘成本資料，建立 Migration Cost Benchmark，協助企業辨識異常模式。

Chart：

越南 → 台灣

企業資料：

NT$42,000

Benchmark：

NT$18,000

顯示：

+133%

高於歷史基準

狀態：

🟠 風險訊號

一定要顯示：

基準異常不代表違規，僅代表需要進一步驗證。

這句話非常重要。

11. AI 驗證中心

標題：

AI 驗證中心

副標：

AI 不直接下結論，而是交叉驗證證據。

建立漂亮的流程：

資料蒐集
   ↓
資料標準化
   ↓
交叉驗證
   ↓
政策比對
   ↓
風險解釋
   ↓
人工審核


按鈕：

執行 AI 驗證

點擊後要有動畫。

依序顯示：

正在蒐集企業資料…

↓

正在比對 ILO / KNOMAD 基準…

↓

正在分析移工訪談…

↓

正在驗證付款證據…

↓

正在套用 RBA 政策…

↓

正在產生可解釋風險評估…

最後：

驗證完成

發現 5 個高風險案件

12. 高風險案件

標題：

案件 #2026-024

Badge：

🔴 高風險

資料：

匿名移工 #024

來源：

越南

工作地：

台灣

招聘仲介：

ABC Recruitment Agency

13. 證據鏈

建立非常漂亮的 Evidence Chain。

標題：

證據鏈

流程：

仲介聲明
   ↓
移工訪談
   ↓
付款收據
   ↓
付款紀錄
   ↓
AI 交叉驗證


每一個證據都可以點擊。

14. 仲介聲明

招聘費聲明

狀態：

🟢 已取得

內容：

招聘費：NT$0

15. 移工訪談

匿名 AI 訪談

問題：

「您來台灣工作之前，是否曾支付任何招聘相關費用？」

回答：

「有，我大約支付了 NT$60,000 給招聘仲介。」

狀態：

🟠 與仲介資料不一致

16. 付款收據

顯示一張漂亮的「示範收據」。

內容：

付款金額：NT$60,000

收款方：

ABC Recruitment Agency

日期：

2026 / 05 / 14

標示：

🟢 OCR 已驗證

17. 付款紀錄

顯示：

付款金額：

NT$60,000

狀態：

🟢 已驗證

18. AI 交叉驗證

這是整個 Demo 最重要的畫面。

標題：

⚠️ 發現證據衝突

使用四個大卡片：

仲介聲明

NT$0

↓

移工訪談

NT$60,000

↓

收據

NT$60,000

↓

付款紀錄

NT$60,000

顯示：

證據一致性

94%

政策符合度

90%

風險等級

🔴 高風險

19. 為什麼 AI 判定高風險？

建立：

AI 判斷依據

移工主動回報支付招聘費。

收據確認支付金額。

付款紀錄與收據金額一致。

仲介聲明與獨立證據存在衝突。

多個證據來源指向相同事件。

達到預先設定的高風險門檻。

最後：

AI 結論

疑似 RBA 招聘費合規風險

下一行：

需要人工合規審核，不由 AI 自動判定違法。

20. 可解釋 Evidence Score

顯示：

移工訪談          +20
付款收據          +25
付款紀錄          +30
獨立證據          +15
仲介資料          +10


總分：

100 / 100

說明：

AI 信心分數來自證據完整度與來源一致性，而非由 LLM 任意產生。

21. Trustworthy AI

建立一個非常重要的區塊：

為什麼可以信任 AI？

六個項目：

代表誰？

ABC Electronics 合規管理員

AI 被授權做什麼？

RBA 招聘合規驗證

使用什麼政策？

RBA / ILO / IOM

使用什麼證據？

移工、仲介、付款資料

誰負責最後決定？

人工合規人員

是否可以追溯？

所有 AI 行動均留下稽核紀錄

22. 人工審核

標題：

需要人工審核

文字：

AI 可以發現風險與整理證據，但不能自行宣布企業違法，也不能自行執行不可逆的處置。

Buttons：

核准調查

Primary

駁回判定

Secondary

點擊：

核准調查

進入下一頁。

23. AI 改善方案

標題：

建議改善方案

AI 建議：

01

確認移工付款紀錄

02

確認相關招聘仲介

03

計算可能的返還金額

04

調查相同仲介招聘的其他移工

05

重新審查仲介合約

06

記錄改善結果

07

重新進行合規驗證

24. 合規憑證

這一頁要做得非常漂亮。

標題：

RBA 合規憑證

中央大卡片：

TRUSTRBA

ABC Electronics

招聘費合規

✓ VERIFIED


顯示：

驗證移工：

328

驗證仲介：

5

證據完整度：

94%

未解決高風險案件：

0

Issued:

2026 / 08 / 28

Expires:

2027 / 02 / 28

Credential ID:

TRUST-RBA-8F92A1

25. 隱私保護

標題：

第三方可以驗證，但不需要看到所有資料

顯示：

第三方可以看到

✓ 合規狀態

✓ 驗證範圍

✓ 發行者

✓ 有效期限

✓ Credential Status

第三方不需要看到

✕ 移工姓名

✕ 身分證 / 護照

✕ 銀行帳戶

✕ 私人聊天紀錄

✕ 完整收據

26. 第三方驗證

標題：

驗證合規憑證

Input：

TRUST-RBA-8F92A1

Button：

驗證憑證

點擊後顯示：

✓ 憑證有效

ABC Electronics

RBA 招聘費合規

狀態：

🟢 VALID

證據完整度：

94%

人工審核：

✓ 已完成

隱私：

✓ 已保護

27. 憑證撤銷 Demo

建立：

模擬新證據

點擊後：

顯示：

發現新的高風險證據。

Worker #182

招聘費：

NT$70,000

然後 Credential 狀態改成：

🔴 CREDENTIAL REVOKED

中文：

🔴 憑證已撤銷

原因：

發現新的未解決合規證據，需要重新調查。

再次驗證時：

❌ 憑證無效

28. AI 稽核紀錄

建立：

AI 稽核紀錄

Timeline：

14:32:04
AI Agent 啟動驗證

14:32:06
取得 ILO / KNOMAD 基準

14:32:08
分析移工證據

14:32:10
付款紀錄驗證完成

14:32:12
發現證據衝突

14:32:14
產生風險評估

14:32:17
要求人工審核

14:33:02
合規管理員核准調查

14:34:21
合規憑證建立


每筆紀錄顯示：

時間

執行者

行動

證據

授權

結果

29. Demo Mode

右上角建立：

🎬 Demo Mode

啟用後：

自動載入所有 Demo Data

不顯示空白狀態

所有核心流程可以直接點擊

所有重要數字預先準備

不需要登入

不需要真正的後端帳號

顯示：

Demo Environment

30. Presentation Mode

建立：

🎥 簡報模式

開啟後：

隱藏：

不必要的 sidebar

系統設定

無關資訊

放大：

核心數據

AI 結論

Evidence

Credential

頂部顯示：

問題
→
偵測
→
驗證
→
人工審核
→
憑證
→
第三方驗證


31. Hackathon Demo Story

整個網站必須可以按照以下流程錄影：

Scene 1 — 問題

「企業真正的問題不是沒有 Compliance Report，而是無法證明文件反映真實世界。」

↓

Scene 2 — 基準

展示：

ILO / World Bank / KNOMAD Benchmark

↓

Scene 3 — AI 發現異常

NT$42,000 vs Benchmark NT$18,000

↓

Scene 4 — 證據驗證

Worker：

NT$60,000

Receipt：

NT$60,000

Payment：

NT$60,000

Agency：

NT$0

↓

Scene 5 — AI 解釋

證據衝突

↓

Scene 6 — Human-in-the-loop

人工核准

↓

Scene 7 — Credential

RBA Compliance Credential

↓

Scene 8 — Third-party Verification

VALID

↓

Scene 9 — New Evidence

REVOKED

32. Data Strategy

重要：

不要假裝所有資料都是真實企業資料。

清楚區分：

Real-world benchmark

ILO / World Bank / KNOMAD

用途：

Migration Cost Benchmark

Compliance knowledge

RBA / ILO / IOM / Apple Supplier Requirements

用途：

Policy / RAG Knowledge Base

Enterprise data

Synthetic Demo Data

用途：

ABC Electronics Demo Scenario

UI 中適度顯示：

Real-world Benchmark

以及：

Synthetic Enterprise Evidence

33. Risk Engine

Demo 不要讓 LLM 隨機產生 Risk Score。

使用 deterministic scoring。

例如：

移工回報付款       +20
付款收據           +25
付款紀錄           +30
獨立證據           +15
仲介資料衝突       +10


Risk：

0–29    低
30–59   中
60–79   高
80–100  極高


LLM 只負責：

解釋

摘要

Evidence reasoning

建議改善方案

不要讓 LLM 決定核心數字。

34. Trustworthy AI Requirements

這些是整個產品最重要的技術概念。

Evidence First

沒有 Evidence，不允許 AI 做高風險結論。

Explainability

每個 AI 結論都要可以追溯到 Evidence。

Human-in-the-loop

高風險案件一定需要人工確認。

Authorization

AI Agent 只能執行被授權的工具與行動。

Auditability

所有 AI 行動都留下 Log。

Privacy

第三方驗證 Credential 時，不需要取得完整 Worker Data。

Expiry

Credential 有有效期限。

Revocation

新的高風險證據出現後，可以撤銷 Credential。

35. IMPORTANT — UX Quality

請特別注意：

不要讓畫面看起來像 AI 產生的模板。

避免：

太多漸層

太多 emoji

太多玻璃效果

太多圓形

太多彩色卡片

太多文字

太多裝飾

優先：

清楚、專業、留白、可信任。

36. Responsive

優先 Desktop：

1440 × 900

同時支援：

1280 × 800

不要優先 Mobile。

Hackathon Demo 會在 Desktop Browser 錄製。

37. Final Screen

影片最後顯示：

不只是聲稱合規。

而是證明合規。

下面：

Evidence

每個判斷都有證據。

Governance

AI 在授權與人工監督下運作。

Verification

結果可以驗證、過期與撤銷。

最下面：

TrustRBA

From AI Decisions to Verifiable Trust.

38. FINAL DEVELOPMENT PRIORITY

請嚴格按照以下順序開發：

Phase 1

完成：

全中文 UI

Design System

Color Palette

Sidebar

Dashboard

Landing Page

Phase 2

完成：

Benchmark

AI Verification

Risk Case

Evidence Chain

Phase 3

完成：

AI Explanation

Human Review

Remediation

Phase 4

完成：

Credential

Third-party Verification

Revocation

Phase 5

完成：

Audit Log

Demo Mode

Presentation Mode

Animation

Final visual polish

39. 最終驗收標準

完成後，我希望打開網站，30 秒內就能理解：

這是一個幫企業驗證移工招聘合規的 AI 平台。

3 分鐘內理解：

AI 如何找出風險。

5 分鐘內理解：

為什麼這個 AI 值得信任。

8 分鐘內完成：

Problem → Benchmark → Evidence → AI Reasoning → Human Review → Credential → Verification → Revocation

最核心的一句話

整個產品必須讓評審理解：

Trustworthy AI 不是要求人相信 AI，而是讓 AI 的決策有證據、有治理、可追溯、可驗證。

TrustRBA 的目標，就是把：

「我們符合 RBA」

轉化成：

「任何人都可以驗證我們為什麼符合 RBA。」


## Development

需要 Node.js 與 bun（或 npm）。

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, SearchCheck, FileCheck2, Building2, Users } from "lucide-react";

import { enterprise } from "@/data/compliance";
import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";
import { WorkflowNav } from "@/components/page-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustRBA｜不只是聲稱合規，而是證明合規" },
      {
        name: "description",
        content:
          "TrustRBA 讓移工自己上傳並去識別化證據，讓企業在同一個平台完成人工審核，把 RBA 移工招聘合規轉化為可追溯、可驗證、可撤銷的信任憑證。",
      },
      { property: "og:title", content: "TrustRBA｜不只是聲稱合規，而是證明合規" },
      {
        property: "og:description",
        content: "移工端申報 × 企業端審核 × 第三方驗證，一條完整的合規證據鏈。",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: SearchCheck, title: "驗證", body: "交叉比對多方資料，而非相信單一來源。" },
  { icon: FileCheck2, title: "解釋", body: "每一個 AI 判斷都能追溯到實際證據。" },
  { icon: ShieldCheck, title: "證明", body: "將驗證結果轉換成第三方可驗證的合規憑證。" },
];

/** 產品主流程：從移工按下上傳，到第三方可以驗證。 */
const scenes: { no: string; title: string; body: string; to: string }[] = [
  {
    no: "01",
    title: "移工上傳資料",
    body: "移工用自己的語言填寫金額並上傳收據、匯款單。",
    to: "/worker/submit",
  },
  {
    no: "02",
    title: "自動去識別化",
    body: "姓名、證件號、電話、帳號在送出前就被遮蔽，移工親眼確認。",
    to: "/worker/submit",
  },
  {
    no: "03",
    title: "基準比對",
    body: "以 ILO / World Bank / KNOMAD 公開資料判斷是否高於合理區間。",
    to: "/dashboard",
  },
  {
    no: "04",
    title: "進入審核佇列",
    body: "移工申報與企業抽樣進入同一個佇列，依風險分數排序。",
    to: "/cases",
  },
  {
    no: "05",
    title: "證據交叉驗證",
    body: "仲介聲明與獨立證據並列，衝突會被明確標示。",
    to: "/evidence",
  },
  {
    no: "06",
    title: "人工審核決定",
    body: "合規人員選擇處置、寫下理由、核定返還金額。",
    to: "/cases",
  },
  {
    no: "07",
    title: "回覆移工",
    body: "決定與回覆同步顯示在移工端，移工不必等通知。",
    to: "/worker",
  },
  {
    no: "08",
    title: "改善與返還",
    body: "追蹤返還進度，改善完成才重新發行憑證。",
    to: "/remediation",
  },
  {
    no: "09",
    title: "第三方驗證",
    body: "品牌客戶輸入憑證編號即可驗證，且憑證可被撤銷。",
    to: "/verify",
  },
];

const closing = [
  { title: "Evidence", body: "每個判斷都有證據。" },
  { title: "Governance", body: "AI 在授權與人工監督下運作。" },
  { title: "Verification", body: "結果可以驗證、過期與撤銷。" },
];

function Landing() {
  const { cases } = usePlatform();
  const pending = cases.filter((c) => c.state === "pending_review").length;
  const workerCases = cases.filter((c) => c.source === "worker").length;

  return (
    <div className="space-y-16">
      <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <StatusPill tone="primary" dot={false}>
            Trustworthy AI for Verifiable Migrant Worker Compliance
          </StatusPill>
          <h1 className="mt-6 text-[2.75rem] leading-[1.25] font-bold text-primary-deep">
            不只是聲稱合規，
            <br />
            而是證明合規。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-loose text-muted-foreground">
            TrustRBA 是一個雙邊平台：移工自己上傳並去識別化證據，企業在同一條流程裡完成人工審核， AI
            只負責整理證據與計算風險，不代替人做決定。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              <Building2 className="size-4" /> 企業合規平台
            </Link>
            <Link
              to="/worker"
              className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-card px-5 py-3 text-sm font-medium text-primary-deep transition-colors hover:bg-muted"
            >
              <Users className="size-4" /> 移工申報平台
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <Link to="/dashboard" className="card-surface block p-6 transition-colors hover:bg-muted">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-4 text-primary" />
              <span className="text-sm font-bold text-primary-deep">企業端</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              查看哪些移工可能被收取不當費用、逐案審核、核定返還金額。
            </p>
            <div className="mt-4 flex gap-6 border-t border-border pt-4">
              <span>
                <span className="num block text-xl text-warning-foreground">{pending}</span>
                <span className="text-[11px] text-muted-foreground">件待審核</span>
              </span>
              <span>
                <span className="num block text-xl text-primary-deep">{enterprise.workers}</span>
                <span className="text-[11px] text-muted-foreground">名在職移工</span>
              </span>
            </div>
          </Link>

          <Link to="/worker" className="card-surface block p-6 transition-colors hover:bg-muted">
            <div className="flex items-center gap-2.5">
              <Users className="size-4 text-primary" />
              <span className="text-sm font-bold text-primary-deep">移工端</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              四種語言、免帳號、匿名申報，上傳後可用查詢碼追蹤結果。
            </p>
            <div className="mt-4 flex gap-6 border-t border-border pt-4">
              <span>
                <span className="num block text-xl text-primary-deep">{workerCases}</span>
                <span className="text-[11px] text-muted-foreground">件自主申報</span>
              </span>
              <span>
                <span className="num block text-xl text-primary-deep">4</span>
                <span className="text-[11px] text-muted-foreground">種語言介面</span>
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card-surface p-7">
            <f.icon className="size-5 text-primary" />
            <h3 className="mt-4 text-base font-bold text-primary-deep">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <section id="demo-story" className="scroll-mt-24">
        <div className="mb-6 border-t border-border pt-10">
          <h2 className="text-xl font-bold text-primary-deep">完整流程</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            九個步驟，從移工按下上傳，到第三方可以驗證。點擊任一步驟直接跳到對應畫面。
          </p>
        </div>
        <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scenes.map((s) => (
            <li key={s.no}>
              <Link
                to={s.to}
                className="card-surface group flex h-full gap-4 p-6 transition-colors hover:border-border-strong hover:bg-muted"
              >
                <span className="num text-xs text-primary">{s.no}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-primary-deep">{s.title}</span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                    {s.body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg bg-primary-deep px-10 py-12 text-white">
        <h2 className="text-2xl leading-relaxed font-bold">
          不只是聲稱合規。
          <br />
          而是證明合規。
        </h2>
        <div className="mt-8 grid gap-6 border-t border-white/15 pt-8 md:grid-cols-3">
          {closing.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold tracking-wide text-white/85">{c.title}</div>
              <p className="mt-1 text-sm text-white/65">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/15 pt-6">
          <div className="text-lg font-bold">TrustRBA</div>
          <div className="text-sm text-white/60">From AI Decisions to Verifiable Trust.</div>
        </div>
      </section>

      <WorkflowNav current="/" />
    </div>
  );
}

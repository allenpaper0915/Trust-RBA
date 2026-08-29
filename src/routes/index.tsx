import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, SearchCheck, FileCheck2, Building2, Users } from "lucide-react";

import { enterprise } from "@/data/compliance";
import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";

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
              回應客戶稽核：六項對帳測試、逐案人工審核、核定返還，產出舉證包。
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
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, SearchCheck, FileCheck2, ArrowRight } from "lucide-react";

import { enterprise } from "@/data/demo";
import { StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustRBA｜不只是聲稱合規，而是證明合規" },
      {
        name: "description",
        content:
          "TrustRBA 交叉驗證移工、仲介、付款與政策資料，把 RBA 移工招聘合規轉化為可追溯、可驗證、可撤銷的信任憑證。",
      },
      { property: "og:title", content: "TrustRBA｜不只是聲稱合規，而是證明合規" },
      {
        property: "og:description",
        content: "可信 AI 驅動的 RBA 移工招聘合規驗證平台，Evidence、Governance、Verification 三位一體。",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: SearchCheck,
    title: "驗證",
    body: "交叉比對多方資料，而非相信單一來源。",
  },
  {
    icon: FileCheck2,
    title: "解釋",
    body: "每一個 AI 判斷都能追溯到實際證據。",
  },
  {
    icon: ShieldCheck,
    title: "證明",
    body: "將驗證結果轉換成第三方可驗證的合規憑證。",
  },
];

const closing = [
  { title: "Evidence", body: "每個判斷都有證據。" },
  { title: "Governance", body: "AI 在授權與人工監督下運作。" },
  { title: "Verification", body: "結果可以驗證、過期與撤銷。" },
];

function Landing() {
  return (
    <div className="space-y-16">
      <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <StatusPill tone="primary" dot={false}>
            Trustworthy AI for Verifiable Migrant Worker Compliance
          </StatusPill>
          <h1 className="mt-6 text-[2.75rem] font-bold leading-[1.25] text-primary-deep">
            不只是聲稱合規，
            <br />
            而是證明合規。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-loose text-muted-foreground">
            TrustRBA 利用可信 AI 交叉驗證移工、仲介、付款與政策資料，將 RBA
            合規從一份文件，轉化為可追溯、可驗證、可撤銷的信任憑證。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/verification"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              開始合規驗證 <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-card px-5 py-3 text-sm font-medium text-primary-deep transition-colors hover:bg-muted"
            >
              查看 Demo 流程
            </Link>
          </div>
        </div>

        <div className="card-surface p-8">
          <div className="text-xs text-muted-foreground">示範企業｜Synthetic Enterprise Data</div>
          <div className="mt-2 text-lg font-bold text-primary-deep">{enterprise.name}</div>
          <div className="text-sm text-muted-foreground">{enterprise.industry}</div>
          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
            {[
              { k: "移工", v: enterprise.workers },
              { k: "仲介", v: enterprise.agencies },
              { k: "證據", v: enterprise.evidence },
            ].map((s) => (
              <div key={s.k}>
                <dd className="num text-2xl text-primary-deep">{s.v}</dd>
                <dt className="text-xs text-muted-foreground">{s.k}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-md bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
            Real-world Benchmark 採用 ILO / World Bank / KNOMAD 公開資料；企業層級資料為 Demo
            用合成資料。
          </div>
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

      <section className="rounded-lg bg-primary-deep px-10 py-12 text-white">
        <h2 className="text-2xl font-bold leading-relaxed">
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
    </div>
  );
}

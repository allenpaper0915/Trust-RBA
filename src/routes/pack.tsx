import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Check,
  Fingerprint,
  Loader2,
  Minus,
  Send,
  X,
} from "lucide-react";

import { enterprise, money } from "@/data/compliance";
import { buyer, commercialStakes, ncMeta } from "@/data/buyer";
import { usePlatform } from "@/components/platform-store";
import { buildPack, daysUntil } from "@/lib/evidence-pack";
import { outcomeMeta, testSpecs, type TestOutcome } from "@/lib/verification-tests";
import { canonical, merkleRoot, sha256, shortHash, signPayload } from "@/lib/proof";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pack")({
  head: () => ({
    meta: [
      { title: "舉證包｜TrustRBA" },
      {
        name: "description",
        content:
          "回覆品牌客戶 RBA 稽核請求的舉證包：涵蓋範圍、舉證覆蓋率、六項對帳測試結果、不符合事項與矯正措施、可獨立驗證的簽章。",
      },
    ],
  }),
  component: PackPage,
});

function OutcomeIcon({ outcome }: { outcome: TestOutcome }) {
  if (outcome === "pass") return <Check className="size-3.5 text-success" />;
  if (outcome === "fail") return <X className="size-3.5 text-danger" />;
  if (outcome === "partial") return <AlertTriangle className="size-3.5 text-warning" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

function PackPage() {
  const { cases } = usePlatform();
  const pack = useMemo(() => buildPack(cases), [cases]);
  const meta = ncMeta[pack.level];
  const remaining = daysUntil(buyer.dueDate);

  const [seal, setSeal] = useState<{ root: string; signature: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // 封裝：案件摘要收斂成 Merkle 根，連同覆蓋率一起簽章，客戶可自行驗證。
  useEffect(() => {
    let live = true;
    void (async () => {
      const leaves = await Promise.all(
        cases.map((c) =>
          sha256(canonical({ id: c.id, origin: c.origin, agency: c.agency, state: c.state })),
        ),
      );
      const root = await merkleRoot(leaves);
      const signature = await signPayload({
        request: buyer.requestId,
        supplier: enterprise.name,
        workers: pack.coverage.workers,
        proven: pack.coverage.proven,
        level: pack.level,
        caseRoot: root,
      });
      if (live) setSeal({ root, signature });
    })();
    return () => {
      live = false;
    };
  }, [cases, pack]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={`${buyer.program} · ${buyer.requestId}`}
        title="舉證包"
        subtitle={`回覆 ${buyer.name} 的 RBA 稽核請求 · 產出於 ${pack.generatedAt}`}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={remaining <= 14 ? "danger" : "warning"}>
              距期限 {remaining} 天
            </StatusPill>
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </div>
        }
      />

      {/* 客戶要什麼 */}
      <section className="card-surface p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-xs tracking-wider text-muted-foreground">
              <Building2 className="size-3.5" /> 提出要求的一方
            </div>
            <div className="mt-2 text-lg font-bold text-primary-deep">{buyer.name}</div>
            <p className="mt-4 rounded-md border border-primary/25 bg-primary-soft px-4 py-3.5 text-sm leading-relaxed text-primary-deep">
              「{buyer.ask}」
            </p>
            <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              {[
                { k: "稽核方案", v: buyer.program },
                { k: "涵蓋範圍", v: buyer.scope },
                { k: "發出日期", v: buyer.issued },
                { k: "回覆期限", v: buyer.due },
              ].map((r) => (
                <div key={r.k} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">{r.k}</dt>
                  <dd className="text-right text-primary-deep">{r.v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{buyer.note}</p>
          </div>

          <div>
            <div className="text-xs tracking-wider text-muted-foreground">客戶不接受的東西</div>
            <ul className="mt-3 space-y-2">
              {buyer.notAccepted.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <X className="mt-0.5 size-3.5 shrink-0 text-danger" />
                  {x}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-lg border border-danger/25 bg-danger-soft p-5">
              <div className="text-xs tracking-wider text-muted-foreground">若無法舉證</div>
              <div className="num mt-1.5 text-2xl text-danger">
                {money(commercialStakes.annualOrders)}
              </div>
              <div className="text-xs text-muted-foreground">
                年度訂單受影響 · 占營收 {Math.round(commercialStakes.shareOfRevenue * 100)}%
              </div>
              <ul className="mt-4 space-y-2 border-t border-danger/20 pt-3.5">
                {commercialStakes.items.map((c) => (
                  <li key={c.title} className="text-xs leading-relaxed">
                    <span className="font-medium text-primary-deep">{c.title}</span>
                    <span className="block text-muted-foreground">{c.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 1 覆蓋率聲明 */}
      <section className="card-surface p-8">
        <div className="text-xs tracking-wider text-muted-foreground">第 1 節</div>
        <h2 className="mt-1 text-lg font-bold text-primary-deep">舉證覆蓋率聲明</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          本節聲明的是「能證明多少」，不是「有沒有申訴」。無法證明的部分一併列出，不做隱藏。
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { k: "涵蓋在職移工", v: `${pack.coverage.workers} 名` },
            { k: "已證明未收費", v: `${pack.coverage.proven} 名`, tone: "text-success" },
            { k: "尚無法證明", v: `${pack.coverage.unproven} 名`, tone: "text-warning-foreground" },
            {
              k: "舉證覆蓋率",
              v: `${Math.round(pack.coverage.rate * 100)}%`,
              tone: pack.coverage.rate >= 0.9 ? "text-success" : "text-danger",
            },
          ].map((c) => (
            <div key={c.k} className="rounded-lg border border-border bg-secondary p-5">
              <div className="text-xs text-muted-foreground">{c.k}</div>
              <div className={cn("num mt-1.5 text-2xl text-primary-deep", c.tone)}>{c.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 2 六項測試 */}
      <section className="card-surface overflow-hidden">
        <div className="border-b border-border px-8 py-6">
          <div className="text-xs tracking-wider text-muted-foreground">第 2 節</div>
          <h2 className="mt-1 text-lg font-bold text-primary-deep">六項對帳測試結果</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            任一項未通過，該來源國即不得宣稱已舉證。客戶可依
            <Link to="/assurance" className="mx-1 text-primary hover:underline">
              測試明細
            </Link>
            自行重跑。
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">來源國</th>
                <th className="px-3 py-3 text-right font-medium">人數</th>
                {testSpecs.map((t) => (
                  <th key={t.id} className="px-3 py-3 text-center font-medium" title={t.label}>
                    {t.id}
                  </th>
                ))}
                <th className="px-6 py-3 font-medium">結論</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pack.sections.map((s) => (
                <tr key={s.origin}>
                  <td className="px-6 py-4 text-primary-deep">{s.corridor}</td>
                  <td className="num px-3 py-4 text-right text-muted-foreground">{s.workers}</td>
                  {s.results.map((r, i) => (
                    <td key={i} className="px-3 py-4">
                      <span className="mx-auto flex w-fit">
                        <OutcomeIcon outcome={r.outcome} />
                      </span>
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <StatusPill tone={outcomeMeta[s.verdict].tone}>
                      {outcomeMeta[s.verdict].label}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 不符合事項與矯正措施 */}
      <section className="card-surface overflow-hidden">
        <div className="border-b border-border px-8 py-6">
          <div className="text-xs tracking-wider text-muted-foreground">第 3 節</div>
          <h2 className="mt-1 text-lg font-bold text-primary-deep">
            不符合事項與矯正措施（{pack.findings.length} 項）
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            依 RBA VAP 分級。本次整體結論為
            <span className={cn("mx-1 font-semibold", meta.tone === "danger" && "text-danger")}>
              {meta.label}
            </span>
            —— {meta.consequence}
          </p>
        </div>
        <ul className="divide-y divide-border">
          {pack.findings.map((f) => (
            <li key={f.id} className="px-8 py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusPill tone={ncMeta[f.level].tone}>{ncMeta[f.level].label}</StatusPill>
                    <span className="num text-xs text-muted-foreground">{f.clause.code}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-primary-deep">{f.title}</div>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <div className="num text-primary-deep">{f.dueDays} 日內</div>
                  <div>{f.owner}</div>
                </div>
              </div>

              <dl className="mt-4 grid gap-4 border-t border-border pt-4 lg:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">依據條款</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-primary-deep">
                    {f.clause.title}
                    <span className="mt-1 block text-muted-foreground">{f.clause.requirement}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">查證依據</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-primary-deep">{f.evidence}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">矯正措施</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-primary-deep">{f.corrective}</dd>
                </div>
              </dl>
            </li>
          ))}
          {pack.findings.length === 0 && (
            <li className="px-8 py-12 text-center text-sm text-muted-foreground">
              六項測試全數通過，無不符合事項。
            </li>
          )}
        </ul>
      </section>

      {/* 4 封裝與提交 */}
      <section className="card-surface p-8">
        <div className="text-xs tracking-wider text-muted-foreground">第 4 節</div>
        <h2 className="mt-1 flex items-center gap-2.5 text-lg font-bold text-primary-deep">
          <Fingerprint className="size-4 text-primary" /> 封裝與提交
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          案件摘要收斂成一個 Merkle 根，連同覆蓋率與結論一併簽章。 客戶拿到之後可以在
          <Link to="/verify" className="mx-1 text-primary hover:underline">
            查驗入口
          </Link>
          自行驗證，不需要信任我們，也看不到任何移工個資。
        </p>

        {seal ? (
          <dl className="mt-6 space-y-2 border-t border-border pt-5 text-[11px]">
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-muted-foreground">案件根雜湊</dt>
              <dd className="num break-all text-primary-deep">{seal.root}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-muted-foreground">簽章</dt>
              <dd className="num break-all text-muted-foreground">{shortHash(seal.signature)}</dd>
            </div>
          </dl>
        ) : (
          <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> 計算摘要與簽章中…
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <button
            onClick={() => setSubmitted(true)}
            disabled={!seal || submitted}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
          >
            <Send className="size-4" /> 提交給 {buyer.name}
          </button>
          {submitted && (
            <span className="inline-flex items-center gap-2 text-sm text-success">
              <Check className="size-4" /> 已提交，等待客戶查驗
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

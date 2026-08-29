import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertOctagon,
  ArrowRight,
  BadgeCheck,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  Siren,
} from "lucide-react";
import { useState } from "react";

import { credential, newEvidence, privacyDisclosure } from "@/data/compliance";
import { WorkflowNav, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { useSession } from "@/components/session-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/credential")({
  head: () => ({
    meta: [
      { title: "RBA 合規憑證｜TrustRBA" },
      {
        name: "description",
        content:
          "把驗證結果轉換成第三方可驗證的合規憑證：有發行者、有效期限、驗證範圍，並可在新證據出現時撤銷。",
      },
      { property: "og:title", content: "RBA 合規憑證｜TrustRBA" },
      {
        property: "og:description",
        content: "Credential ID TRUST-RBA-8F92A1，可驗證、可過期、可撤銷。",
      },
    ],
  }),
  component: CredentialPage,
});

function CredentialCard({ revoked }: { revoked: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-10 py-11 text-white",
        revoked ? "border-danger/40 bg-[oklch(0.32_0.09_25)]" : "border-primary/30 bg-primary-deep",
      )}
    >
      {revoked && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[3.5rem] font-bold tracking-widest text-white/8"
          aria-hidden
        >
          REVOKED
        </span>
      )}

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.35em] text-white/70">
            {credential.brand}
          </div>
          <div className="mt-5 text-2xl font-bold">{credential.subject}</div>
          <div className="mt-1 text-sm text-white/70">{credential.scope}</div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wider",
            revoked
              ? "border-white/25 bg-white/10 text-white"
              : "border-white/25 bg-white/10 text-white",
          )}
        >
          {revoked ? <AlertOctagon className="size-3.5" /> : <BadgeCheck className="size-3.5" />}
          {revoked ? "REVOKED" : "VERIFIED"}
        </div>
      </div>

      <dl className="relative mt-10 grid gap-6 border-t border-white/15 pt-7 sm:grid-cols-4">
        {[
          { k: "驗證移工", v: credential.workers },
          { k: "驗證仲介", v: credential.agencies },
          { k: "證據完整度", v: `${credential.evidenceCompleteness}%` },
          { k: "未解決高風險案件", v: revoked ? 1 : credential.unresolved },
        ].map((s) => (
          <div key={s.k}>
            <dd
              className={cn(
                "num text-2xl",
                revoked && s.k === "未解決高風險案件" && "text-[oklch(0.85_0.13_45)]",
              )}
            >
              {s.v}
            </dd>
            <dt className="mt-1 text-xs text-white/60">{s.k}</dt>
          </div>
        ))}
      </dl>

      <div className="relative mt-8 grid gap-4 border-t border-white/15 pt-6 text-xs sm:grid-cols-3">
        <div>
          <div className="text-white/55">Issued</div>
          <div className="num mt-1 text-white">{credential.issued}</div>
        </div>
        <div>
          <div className="text-white/55">Expires</div>
          <div className="num mt-1 text-white">{credential.expires}</div>
        </div>
        <div>
          <div className="text-white/55">Credential ID</div>
          <div className="num mt-1 text-white">{credential.id}</div>
        </div>
      </div>
    </div>
  );
}

function CredentialPage() {
  const { revoked, setRevoked } = useSession();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(credential.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="VERIFIABLE CREDENTIAL"
        title="RBA 合規憑證"
        subtitle={`發行者 ${credential.issuer} · ${credential.standard}`}
        aside={
          <StatusPill tone={revoked ? "danger" : "success"}>
            {revoked ? "憑證已撤銷" : "憑證有效"}
          </StatusPill>
        }
      />

      <section className="mx-auto w-full max-w-4xl">
        <CredentialCard revoked={revoked} />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <Copy className="size-3.5" /> {copied ? "已複製 Credential ID" : "複製 Credential ID"}
          </button>
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            以第三方身分驗證 <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* 隱私保護 */}
      <section>
        <div className="mb-6 border-t border-border pt-10">
          <h2 className="text-xl font-bold text-primary-deep">
            第三方可以驗證，但不需要看到所有資料
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            合規憑證揭露的是「驗證結果」，不是移工的個人資料。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card-surface border-success/25 p-8">
            <div className="flex items-center gap-2.5">
              <Eye className="size-4 text-success" />
              <h3 className="text-base font-bold text-primary-deep">第三方可以看到</h3>
            </div>
            <ul className="mt-6 space-y-3 border-t border-border pt-5">
              {privacyDisclosure.visible.map((v) => (
                <li key={v} className="flex items-center gap-3 text-sm text-primary-deep">
                  <span className="text-success">✓</span>
                  {v}
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-8">
            <div className="flex items-center gap-2.5">
              <EyeOff className="size-4 text-muted-foreground" />
              <h3 className="text-base font-bold text-primary-deep">第三方不需要看到</h3>
            </div>
            <ul className="mt-6 space-y-3 border-t border-border pt-5">
              {privacyDisclosure.hidden.map((v) => (
                <li key={v} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="text-danger">✕</span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 撤銷情境 */}
      <section
        className={cn(
          "rounded-lg border px-8 py-8",
          revoked ? "border-danger/30 bg-danger-soft" : "border-border bg-card",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="flex items-center gap-2.5 text-lg font-bold text-primary-deep">
              <Siren className={cn("size-5", revoked ? "text-danger" : "text-muted-foreground")} />
              憑證撤銷情境
            </h2>
            <p className="mt-2.5 text-sm leading-loose text-muted-foreground">
              合規不是一次性的結論。當新的高風險證據出現，憑證必須能被撤銷——這是「可驗證」與「可信任」的差別。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!revoked ? (
              <button
                onClick={() => setRevoked(true)}
                className="inline-flex items-center gap-2 rounded-md border border-danger/40 bg-card px-5 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
              >
                <Siren className="size-4" /> 模擬新證據
              </button>
            ) : (
              <button
                onClick={() => setRevoked(false)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <RotateCcw className="size-4" /> 還原憑證狀態
              </button>
            )}
          </div>
        </div>

        {revoked && (
          <div className="mt-8 space-y-6 border-t border-danger/20 pt-7">
            <div>
              <div className="text-sm font-semibold text-danger">{newEvidence.headline}</div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-4">
                {[
                  { k: "移工", v: newEvidence.worker },
                  { k: "來源國", v: newEvidence.origin },
                  { k: "招聘費", v: newEvidence.fee },
                  { k: "偵測日期", v: newEvidence.detectedAt },
                ].map((r) => (
                  <div key={r.k} className="rounded-md border border-danger/20 bg-card p-5">
                    <dt className="text-xs text-muted-foreground">{r.k}</dt>
                    <dd className="num mt-1.5 text-base text-primary-deep">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-md border border-danger/25 bg-card px-6 py-5">
              <div className="text-lg font-bold text-danger">🔴 憑證已撤銷</div>
              <div className="mt-1 text-xs tracking-wider text-muted-foreground">
                CREDENTIAL REVOKED
              </div>
              <p className="mt-3 text-sm text-muted-foreground">原因：{newEvidence.reason}</p>
            </div>

            <Link to="/verify" className="inline-block text-sm text-primary hover:underline">
              再次以第三方身分驗證，確認憑證已失效 →
            </Link>
          </div>
        )}
      </section>

      <WorkflowNav current="/credential" />
    </div>
  );
}

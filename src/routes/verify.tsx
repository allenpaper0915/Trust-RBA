import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, Search, ShieldX, Siren, XCircle } from "lucide-react";

import { credential, newEvidence, privacyDisclosure } from "@/data/compliance";
import { WorkflowNav, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { useSession } from "@/components/session-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "驗證合規憑證｜TrustRBA" },
      {
        name: "description",
        content:
          "第三方驗證入口：輸入 Credential ID 即可確認合規狀態、驗證範圍與有效性，不需要取得移工個資。",
      },
      { property: "og:title", content: "驗證合規憑證｜TrustRBA" },
      { property: "og:description", content: "VALID 或 REVOKED，任何人都可以自行驗證。" },
    ],
  }),
  component: VerifyPage,
});

type Result = "valid" | "revoked" | "notfound";

function VerifyPage() {
  const { revoked, setRevoked } = useSession();
  const [input, setInput] = useState(credential.id);
  const [state, setState] = useState<"idle" | "checking" | "done">("idle");
  const [result, setResult] = useState<Result | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setState("checking");
    setResult(null);
    const id = input.trim().toUpperCase();
    setTimeout(() => {
      setResult(id !== credential.id ? "notfound" : revoked ? "revoked" : "valid");
      setState("done");
    }, 900);
  };

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="THIRD-PARTY VERIFICATION"
        title="驗證合規憑證"
        subtitle="品牌客戶、稽核單位或 NGO 都可以自行驗證，不需要 TrustRBA 的帳號。"
        aside={
          <StatusPill tone={revoked ? "danger" : "success"}>
            憑證狀態：{revoked ? "REVOKED" : "VALID"}
          </StatusPill>
        }
      />

      <section className="mx-auto w-full max-w-3xl">
        <form onSubmit={submit} className="card-surface p-8">
          <label htmlFor="cid" className="text-sm font-medium text-primary-deep">
            Credential ID
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            示範憑證編號：<span className="num">{credential.id}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              id="cid"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="TRUST-RBA-XXXXXX"
              className="num min-w-0 flex-1 rounded-md border border-border bg-background px-4 py-3 text-base tracking-wider text-primary-deep outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              disabled={state === "checking"}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              {state === "checking" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              驗證憑證
            </button>
          </div>
        </form>

        {/* 驗證結果 */}
        {state === "done" && result === "valid" && (
          <div className="mt-6 rounded-lg border border-success/30 bg-card">
            <div className="flex items-center gap-3 border-b border-border bg-success-soft px-8 py-6">
              <CheckCircle2 className="size-6 text-success" />
              <div>
                <div className="text-xl font-bold text-success">憑證有效</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {credential.subject} · RBA 招聘費合規
                </div>
              </div>
            </div>
            <dl className="grid gap-x-8 gap-y-4 px-8 py-7 sm:grid-cols-2">
              {[
                { k: "狀態", v: "VALID", tone: "success" as const },
                { k: "證據完整度", v: `${credential.evidenceCompleteness}%` },
                { k: "人工審核", v: "已完成" },
                { k: "隱私", v: "已保護" },
                { k: "發行者", v: credential.issuer },
                { k: "有效期限", v: `${credential.issued} – ${credential.expires}` },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">{r.k}</dt>
                  <dd
                    className={cn(
                      "text-sm font-medium",
                      r.tone === "success" ? "num text-success" : "text-primary-deep",
                    )}
                  >
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border px-8 py-5 text-xs leading-relaxed text-muted-foreground">
              本次驗證僅回傳合規狀態與範圍。第三方看不到{privacyDisclosure.hidden.join("、")}。
            </div>
          </div>
        )}

        {state === "done" && result === "revoked" && (
          <div className="mt-6 rounded-lg border border-danger/30 bg-card">
            <div className="flex items-center gap-3 border-b border-border bg-danger-soft px-8 py-6">
              <XCircle className="size-6 text-danger" />
              <div>
                <div className="text-xl font-bold text-danger">憑證無效</div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {credential.subject} · 憑證已撤銷
                </div>
              </div>
            </div>
            <dl className="grid gap-x-8 gap-y-4 px-8 py-7 sm:grid-cols-2">
              {[
                { k: "狀態", v: "REVOKED" },
                { k: "撤銷日期", v: newEvidence.detectedAt },
                { k: "撤銷原因", v: newEvidence.reason },
                { k: "後續", v: "需重新調查並重新驗證" },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">{r.k}</dt>
                  <dd className="text-sm font-medium text-primary-deep">{r.v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border px-8 py-5 text-xs leading-relaxed text-muted-foreground">
              撤銷讓「過去通過驗證」不等於「現在仍然合規」。
            </div>
          </div>
        )}

        {state === "done" && result === "notfound" && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-card px-8 py-7">
            <ShieldX className="size-5 text-muted-foreground" />
            <div>
              <div className="text-base font-bold text-primary-deep">查無此憑證</div>
              <p className="mt-1 text-sm text-muted-foreground">
                請確認 Credential ID 是否正確，或使用示範憑證 {credential.id}。
              </p>
            </div>
          </div>
        )}

        {/* 撤銷情境切換，方便 Demo 錄影 */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary px-6 py-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {revoked
              ? "目前為「已撤銷」狀態：再次驗證會得到 REVOKED。"
              : "模擬新的高風險證據出現，觀察同一組 Credential ID 的驗證結果如何改變。"}
          </p>
          {!revoked ? (
            <button
              onClick={() => {
                setRevoked(true);
                setState("idle");
                setResult(null);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-danger/40 bg-card px-4 py-2 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
            >
              <Siren className="size-3.5" /> 模擬新證據
            </button>
          ) : (
            <button
              onClick={() => {
                setRevoked(false);
                setState("idle");
                setResult(null);
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="size-3.5" /> 還原憑證狀態
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          想看完整發行資訊？
          <Link to="/credential" className="ml-1 text-primary hover:underline">
            回到合規憑證頁面
          </Link>
        </p>
      </section>

      <WorkflowNav current="/verify" />
    </div>
  );
}

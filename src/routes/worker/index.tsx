import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileUp,
  Lock,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { BigButton, inputClass } from "@/components/worker-shell";
import { usePlatform, useT } from "@/components/platform-store";

export const Route = createFileRoute("/worker/")({
  head: () => ({
    meta: [
      { title: "移工權益申報平台｜TrustRBA" },
      {
        name: "description",
        content:
          "移工可以自行上傳收據與匯款紀錄，系統自動去識別化後與國際招聘費基準比對，並由企業合規人員人工審核。",
      },
    ],
  }),
  component: WorkerHome,
});

function WorkerHome() {
  const t = useT();
  const { events, getByCode, getCase, recordRoleEvent } = usePlatform();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const demoCase = getCase("2026-031");
  const confirmed = events.some(
    (event) =>
      event.caseId === "2026-031" &&
      event.actor === "worker" &&
      event.action === "本人回報轉換期間近況",
  );

  const confirmStatus = () => {
    if (confirmed) return;
    recordRoleEvent({
      caseId: "2026-031",
      actor: "worker",
      action: "本人回報轉換期間近況",
      evidence: "本人確認安全 · 正在等待新雇主承接 · 聯絡方式仍有效",
      auth: "本人查詢碼與一次性驗證",
      result: "已納入案件證據鏈，等待政府交叉確認",
    });
  };

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    const found = getByCode(code);
    if (!found) {
      setError(t("portal.codeNotFound"));
      return;
    }
    navigate({ to: "/worker/case/$code", params: { code: found.code! } });
  };

  const steps = [
    { n: "1", title: t("portal.how1"), body: t("portal.how1d") },
    { n: "2", title: t("portal.how2"), body: t("portal.how2d") },
    { n: "3", title: t("portal.how3"), body: t("portal.how3d") },
    { n: "4", title: t("portal.how4"), body: t("portal.how4d") },
  ];

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-[1.75rem] font-bold leading-snug text-primary-deep">
          {t("portal.tagline")}
        </h1>
        <p className="mt-4 text-sm leading-loose text-muted-foreground">{t("portal.intro")}</p>
      </section>

      {demoCase && (
        <section className="overflow-hidden rounded-lg border border-primary/25 bg-card">
          <header className="border-b border-primary/15 bg-primary-soft px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Clock3 className="size-4" /> 我的聘僱程序
                </div>
                <h2 className="mt-2 text-lg font-bold text-primary-deep">轉換雇主確認中</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  案件 {demoCase.id} · 政府正在比對轉換申請與原雇主通報
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-xs text-warning-foreground">
                等待確認
              </span>
            </div>
          </header>
          <div className="p-6">
            <div className="flex items-start gap-3">
              <UserCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <div className="text-sm font-semibold text-primary-deep">系統需要你的近況</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  確認本人安全與目前程序狀態，可協助政府判斷是否只是合法轉換期間的資料時間差。
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={confirmStatus}
                disabled={confirmed}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-deep disabled:cursor-default disabled:bg-success"
              >
                {confirmed && <CheckCircle2 className="size-4" />}
                {confirmed ? "近況已送出" : "確認本人安全並送出近況"}
              </button>
              {demoCase.code && (
                <Link
                  to="/worker/case/$code"
                  params={{ code: demoCase.code }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-card px-5 py-3 text-sm font-semibold text-primary-deep hover:bg-muted"
                >
                  查看我的案件 <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <Link
          to="/worker/submit"
          className="flex items-center gap-4 rounded-lg border border-primary bg-primary px-6 py-5 text-primary-foreground transition-colors hover:bg-primary-deep"
        >
          <FileUp className="size-6 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">{t("portal.submit")}</span>
            <span className="block text-xs text-primary-foreground/75">
              {t("portal.submitHint")}
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0" />
        </Link>

        <form onSubmit={lookup} className="card-surface p-6">
          <div className="flex items-center gap-2.5">
            <Search className="size-4 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-semibold text-primary-deep">{t("portal.lookup")}</div>
              <div className="text-xs text-muted-foreground">{t("portal.lookupHint")}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder={t("portal.codePlaceholder")}
              className={`${inputClass} min-w-[220px] flex-1 font-mono uppercase`}
            />
            <BigButton type="submit" variant="ghost">
              {t("portal.codeSearch")}
            </BigButton>
          </div>
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
          <p className="mt-3 text-[11px] text-muted-foreground">
            示範查詢碼：<span className="font-mono">TRB-K7M3QX</span> ·{" "}
            <span className="font-mono">TRB-6VXK4D</span> ·{" "}
            <span className="font-mono">TRB-8NQR2C</span>
          </p>
        </form>
      </section>

      <section className="rounded-lg border border-success/25 bg-success-soft p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-success">
          <Lock className="size-4" /> {t("portal.promise")}
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-primary-deep/85">
          {[
            t("portal.promise1"),
            t("portal.promise2"),
            t("portal.promise3"),
            t("portal.promise4"),
          ].map((p) => (
            <li key={p} className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-bold text-primary-deep">{t("portal.how")}</h2>
        <ol className="mt-5 space-y-3">
          {steps.map((s) => (
            <li key={s.n} className="card-surface flex gap-4 p-5">
              <span className="num flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs text-primary">
                {s.n}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-primary-deep">{s.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {s.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileUp, Lock, Search, ShieldCheck } from "lucide-react";

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
  const { getByCode } = usePlatform();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

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
            Demo 可用查詢碼：<span className="font-mono">TRB-K7M3QX</span> ·{" "}
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

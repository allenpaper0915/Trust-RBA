import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/enterprise")({
  head: () => ({
    meta: [
      { title: "企業聘僱與合規驗證｜移工狀態雷達" },
      {
        name: "description",
        content: "企業以移工授權憑證與仲介合規摘要辦理聘僱程序的示範工作台。",
      },
    ],
  }),
  component: EnterprisePortal,
});

const demoCaseId = "2026-031";
const verificationAction = "驗證移工授權聘僱憑證";

function EnterprisePortal() {
  const { events, getCase, recordRoleEvent } = usePlatform();
  const record = getCase(demoCaseId);
  const verified = events.some(
    (event) =>
      event.caseId === demoCaseId &&
      event.actor === "enterprise" &&
      event.action === verificationAction,
  );

  if (!record) return null;

  const verify = () => {
    if (verified) return;
    recordRoleEvent({
      caseId: demoCaseId,
      actor: "enterprise",
      action: verificationAction,
      evidence: "工作資格有效 · 轉換雇主程序進行中 · 本人身分已核驗",
      auth: "移工一次性授權 VC-W031-EMP",
      result: "憑證有效；等待政府完成轉換核定",
    });
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="EMPLOYER & RBA PORTAL"
        title="聘僱與供應鏈驗證"
        subtitle="企業只取得辦理聘僱所需的可驗證聲明，不直接調閱移工原始文件或完整申訴紀錄。"
        aside={<StatusPill tone="primary">1 件程序進行中</StatusPill>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["聘僱程序", "2", "新聘、轉換或續聘"],
          ["待驗證憑證", verified ? "0" : "1", "由移工授權分享"],
          ["合作仲介", "5", "依已驗證紀錄持續監測"],
        ].map(([label, value, note]) => (
          <div key={label} className="card-surface p-5">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="num mt-2 text-3xl text-primary-deep">{value}</div>
            <div className="mt-2 text-xs text-muted-foreground">{note}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="card-surface overflow-hidden">
          <header className="border-b border-primary/15 bg-primary-soft/45 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <BriefcaseBusiness className="size-4" /> 新雇主承接程序
                </div>
                <h2 className="mt-3 text-xl font-semibold text-primary-deep">匿名候選人 W-031</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  案件 {record.id} · 越南籍 · 移工已授權本企業驗證必要資格聲明
                </p>
              </div>
              <StatusPill tone={verified ? "success" : "warning"}>
                {verified ? "憑證已驗證" : "等待企業驗證"}
              </StatusPill>
            </div>
          </header>

          <div className="p-6">
            <h3 className="font-semibold text-primary-deep">本次授權揭露的聲明</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["身分", "本人身分已核驗"],
                ["工作資格", "目前仍在有效期間"],
                ["聘僱程序", "轉換雇主程序進行中"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-secondary px-4 py-4">
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                  <div className="mt-1.5 text-sm font-medium text-primary-deep">{value}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              未揭露：姓名、護照號碼、銀行資料、失聯通報原文與移工申訴內容。
            </p>

            <button
              onClick={verify}
              disabled={verified}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:cursor-default disabled:bg-success"
            >
              {verified ? <CheckCircle2 className="size-4" /> : <FileCheck2 className="size-4" />}
              {verified ? "授權憑證驗證完成" : "模擬驗證授權憑證"}
            </button>
          </div>
        </div>

        <aside className="card-surface p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <BadgeCheck className="size-4 text-warning-foreground" /> 合作仲介摘要
          </div>
          <h2 className="mt-3 text-lg font-semibold text-primary-deep">ABC Recruitment Agency</h2>
          <div className="mt-4">
            <StatusPill tone="warning">持續觀察</StatusPill>
          </div>
          <dl className="mt-5 space-y-3 border-t border-border pt-5 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">機構登記</dt>
              <dd className="text-primary-deep">已驗證</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">未結案紀錄</dt>
              <dd className="num text-primary-deep">1</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">資料更新</dt>
              <dd className="text-primary-deep">2026/08/30</dd>
            </div>
          </dl>
          <Link
            to="/credential"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            查看 RBA 合規憑證 <ArrowRight className="size-4" />
          </Link>
        </aside>
      </section>

      <section className="card-surface flex flex-wrap items-center justify-between gap-5 px-6 py-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-success" />
          <div>
            <div className="text-sm font-semibold text-primary-deep">供應鏈舉證資料已持續更新</div>
            <div className="mt-1 text-xs text-muted-foreground">
              由已驗證事件、證據與改善紀錄產生，不採用單一自我聲明。
            </div>
          </div>
        </div>
        <Link
          to="/pack"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          查看對外舉證包 <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

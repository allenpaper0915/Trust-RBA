import { createFileRoute } from "@tanstack/react-router";
import { Building, CheckCircle2, Clock3, FileUp, LockKeyhole } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/agency")({
  head: () => ({
    meta: [
      { title: "仲介案件與補件｜移工狀態雷達" },
      { name: "description", content: "仲介機構提交聘僱程序、補件與狀態回報的示範工作台。" },
    ],
  }),
  component: AgencyPortal,
});

const demoCaseId = "2026-031";
const submissionAction = "提交轉換雇主補件";

function AgencyPortal() {
  const { cases, events, getCase, recordRoleEvent } = usePlatform();
  const record = getCase(demoCaseId);
  const submitted = events.some(
    (event) =>
      event.caseId === demoCaseId && event.actor === "agency" && event.action === submissionAction,
  );
  const agencyCases = cases.filter((item) => item.agency === "ABC Recruitment Agency");

  if (!record) return null;

  const submit = () => {
    if (submitted) return;
    recordRoleEvent({
      caseId: demoCaseId,
      actor: "agency",
      action: submissionAction,
      evidence: "新雇主承接意向書 · 預定到職日確認 · 仲介服務紀錄",
      auth: "ABC Recruitment Agency 組織憑證",
      result: "已送交政府核驗，官方狀態尚未變更",
    });
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="AGENCY COLLABORATION PORTAL"
        title="我的案件與補件"
        subtitle="只顯示本機構承辦的聘僱程序；仲介可以提交事件與證據，但不能直接變更政府認定狀態。"
        aside={<StatusPill tone="warning">1 件待補件</StatusPill>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["本機構承辦案件", agencyCases.length, "政府資料範圍"],
          ["待補件", 1, "今日優先處理"],
          ["已送交核驗", submitted ? 1 : 0, "等待政府確認"],
        ].map(([label, value, note]) => (
          <div key={label} className="card-surface p-5">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="num mt-2 text-3xl text-primary-deep">{value}</div>
            <div className="mt-2 text-xs text-muted-foreground">{note}</div>
          </div>
        ))}
      </section>

      <section className="card-surface overflow-hidden">
        <header className="border-b border-warning/20 bg-warning-soft/45 px-6 py-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-warning-foreground">
                <Clock3 className="size-4" /> 政府要求補充資料
              </div>
              <h2 className="mt-3 text-xl font-semibold text-primary-deep">
                轉換雇主申請 · 案件 {record.id}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {record.worker} · {record.origin}籍 · 目前程序狀態：等待關係人資料交叉確認
              </p>
            </div>
            <StatusPill tone={submitted ? "primary" : "warning"}>
              {submitted ? "政府核驗中" : "待仲介補件"}
            </StatusPill>
          </div>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="p-6 lg:p-8">
            <h3 className="font-semibold text-primary-deep">本次應提交資料</h3>
            <div className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {[
                ["轉換雇主申請書", "已由系統取得", true],
                ["原雇主終止聘僱說明", "已由原雇主通報", true],
                [
                  "新雇主承接意向與預定到職日",
                  submitted ? "已提交，等待核驗" : "待本機構補充",
                  submitted,
                ],
              ].map(([label, state, done]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={done ? "size-4 text-success" : "size-4 text-muted-foreground"}
                    />
                    <span className="text-sm text-primary-deep">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{state}</span>
                </div>
              ))}
            </div>

            <button
              onClick={submit}
              disabled={submitted}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:cursor-default disabled:bg-success"
            >
              {submitted ? <CheckCircle2 className="size-4" /> : <FileUp className="size-4" />}
              {submitted ? "補件已送出" : "模擬提交補件與狀態申請"}
            </button>
          </div>

          <aside className="border-t border-border bg-secondary p-6 lg:border-t-0 lg:border-l lg:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
              <LockKeyhole className="size-4 text-primary" /> 仲介資料邊界
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
              <li>只顯示 ABC Recruitment Agency 承辦案件。</li>
              <li>可提交申請、文件與現況說明。</li>
              <li>政府核驗前，不改寫正式聘僱或失聯狀態。</li>
            </ul>
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building className="size-4 text-primary" /> 機構憑證
              </div>
              <div className="mt-2 text-sm font-medium text-primary-deep">組織身分已驗證</div>
              <div className="mt-1 text-xs text-muted-foreground">ORG-ABC-TW · 有效</div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

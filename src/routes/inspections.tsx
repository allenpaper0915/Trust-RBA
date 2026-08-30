import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ClipboardCheck, Info, Shuffle } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { inspectionTasks, signalMeta } from "@/data/monitoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inspections")({
  head: () => ({
    meta: [
      { title: "訪查與抽樣｜移工狀態雷達" },
      { name: "description", content: "依證據衝突、長期靜默與隨機抽樣建立政府查證策略。" },
    ],
  }),
  component: Inspections,
});

type Strategy = "directed" | "gray" | "random";

const strategies = [
  {
    id: "directed" as const,
    label: "定向查證",
    count: 2,
    icon: ClipboardCheck,
    tone: "text-danger",
    description: "由證據衝突或法定期限逾期觸發，確認制度紀錄能否解釋現場狀態。",
    principle: "優先處理紅黃燈，但紅燈本身不是違法結論。",
  },
  {
    id: "gray" as const,
    label: "灰燈抽樣",
    count: 1,
    icon: Info,
    tone: "text-muted-foreground",
    description: "對長期靜默或關鍵資料不可得的關係做低侵入確認，避免把沒有資料誤當成正常。",
    principle: "先多語確認，仍無法確認時才評估現場訪查。",
  },
  {
    id: "random" as const,
    label: "綠燈隨機抽樣",
    count: 1,
    icon: Shuffle,
    tone: "text-success",
    description: "從目前無異常的關係中保留隨機樣本，估計漏報率並檢驗偵測規則是否失靈。",
    principle: "不得依國籍、仲介或單一低品質訊號選樣。",
  },
];

function taskStrategy(tone: string): Strategy {
  if (tone === "gray") return "gray";
  if (tone === "green") return "random";
  return "directed";
}

function Inspections() {
  const [selected, setSelected] = useState<Strategy>("directed");
  const strategy = strategies.find((item) => item.id === selected) ?? strategies[0];
  const tasks = inspectionTasks.filter((task) => taskStrategy(task.tone) === selected);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="INSPECTION & SAMPLING"
        title="訪查與抽樣"
        subtitle="訪查不是所有異常的預設答案；先選查證策略，再查看受選樣本與個案。"
      />

      <section className="card-surface overflow-hidden">
        {strategy && (
          <header
            className={cn(
              "border-b px-6 py-6 lg:px-8",
              selected === "directed"
                ? "border-danger/15 bg-danger-soft/45"
                : selected === "random"
                  ? "border-success/15 bg-success-soft/45"
                  : "border-border bg-muted/60",
            )}
          >
            <div>
              <div className="max-w-3xl lg:min-h-32">
                <div className="text-xs font-medium tracking-[0.12em] text-muted-foreground">
                  查證來源與選樣依據
                </div>
                <h2 className="mt-3 text-xl font-semibold text-primary-deep">
                  {strategy.label} · {tasks.length} 件受選樣本
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {strategy.description}
                </p>
              </div>

              <div
                className="mt-5 grid w-full grid-cols-1 rounded-lg border border-border/80 bg-card/55 p-1 sm:grid-cols-3 lg:max-w-[38rem]"
                aria-label="查證策略"
              >
                {strategies.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item.id)}
                    aria-pressed={selected === item.id}
                    className={cn(
                      "inline-flex min-w-0 items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card/70 hover:text-primary-deep",
                      selected === item.id &&
                        (item.id === "directed"
                          ? "border-danger/20 bg-card text-danger shadow-sm"
                          : item.id === "random"
                            ? "border-success/20 bg-card text-success shadow-sm"
                            : "border-border bg-card text-primary-deep shadow-sm"),
                    )}
                  >
                    <item.icon className={cn("size-4", selected === item.id && item.tone)} />
                    {item.label}
                    <span className="num font-semibold">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 border-t border-current/10 pt-4 text-xs leading-5 text-muted-foreground">
              <span className="shrink-0 font-medium text-primary-deep">選樣邊界</span>
              <span>{strategy.principle}</span>
            </div>
          </header>
        )}

        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-semibold text-primary-deep">受選查證樣本</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              依目前策略顯示受選任務；進入個案後才展開完整證據與識別資料。
            </p>
          </div>
          <span className="num shrink-0 text-sm font-semibold text-primary-deep">
            {tasks.length} 件
          </span>
        </div>

        <div className="divide-y divide-border">
          {tasks.map((task) => {
            const signal = signalMeta[task.tone];
            return (
              <div
                key={task.id}
                className="grid items-center gap-4 px-6 py-5 transition-colors hover:bg-muted/40 md:grid-cols-[9rem_1fr_10rem_8rem_auto]"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary-deep">
                    <span className={cn("size-2.5 rounded-full", signal.dotClass)} /> {task.kind}
                  </div>
                  <div className="num mt-1 text-[11px] text-muted-foreground">{task.id}</div>
                </div>
                <div className="text-xs leading-5 text-primary-deep">{task.reason}</div>
                <div className="text-xs text-muted-foreground">{task.assignee}</div>
                <div>
                  <div className="text-xs text-primary-deep">{task.due}</div>
                  <StatusPill tone={task.state === "已排程" ? "primary" : "warning"}>
                    {task.state}
                  </StatusPill>
                </div>
                <Link
                  to="/cases/$id"
                  params={{ id: task.caseId }}
                  className="inline-flex items-center justify-end gap-1.5 text-sm text-primary hover:underline"
                >
                  開啟個案 <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

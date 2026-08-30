import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  DatabaseZap,
  EyeOff,
  GitCompareArrows,
  Minus,
  Radar,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import {
  conflictPatterns,
  eventTypeTrends,
  eventWeek,
  monitoringBlindSpots,
  overviewSnapshot,
  signalMeta,
  type SignalTone,
} from "@/data/monitoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "狀態總覽｜移工狀態雷達" },
      {
        name: "description",
        content: "以聚合事件呈現移工聘僱關係的整體變化、證據衝突與監測盲區。",
      },
    ],
  }),
  component: Dashboard,
});

type ViewMode = "events" | "conflicts";
const toneOrder: SignalTone[] = ["red", "yellow", "blue", "gray", "green"];

function Trend({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="size-3" />
        持平
      </span>
    );
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 text-warning-foreground">
        <ArrowUpRight className="size-3" />
        {value}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-success">
      <ArrowDownRight className="size-3" />
      {Math.abs(value)}%
    </span>
  );
}

function Dashboard() {
  const [mode, setMode] = useState<ViewMode>("events");
  const [selectedDay, setSelectedDay] = useState(eventWeek.at(-1)!.key);
  const selected = eventWeek.find((day) => day.key === selectedDay) ?? eventWeek.at(-1)!;
  const dailyValue = (day: (typeof eventWeek)[number]) =>
    mode === "events" ? day.total : day.conflicts;
  const maxDaily = Math.max(...eventWeek.map(dailyValue));
  const selectedRows = mode === "events" ? selected.breakdown : selected.conflictBreakdown;
  const maxSelected = Math.max(...selectedRows.map((item) => item.value), 1);
  const weeklyRows =
    mode === "events"
      ? eventTypeTrends.map((item) => ({
          label: item.label,
          value: item.count,
          change: item.change,
        }))
      : conflictPatterns.map((item) => ({
          label: item.label,
          value: item.count,
          change: item.change,
        }));
  const maxWeekly = Math.max(...weeklyRows.map((item) => item.value));
  const readableRelationships = overviewSnapshot.relationships - overviewSnapshot.blindSpots;
  const coverageRate = (readableRelationships / overviewSnapshot.relationships) * 100;
  const maxBlindSpot = Math.max(...monitoringBlindSpots.map((item) => item.count));

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-primary">
            <Radar className="size-4" /> MIGRANT EVENT MONITOR
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary-deep">
            移工聘僱關係狀態總覽
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            掌握事件如何改變聘僱關係，以及哪些變化形成跨來源證據衝突。
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <UsersRound className="size-3.5 text-primary" />
            目前追蹤{" "}
            <span className="num font-semibold text-primary-deep">
              {overviewSnapshot.relationships.toLocaleString()}
            </span>{" "}
            個有效或程序中的聘僱關係
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <RefreshCw className="size-3.5" /> 最後同步 2026/08/30 10:42
        </div>
      </header>

      <section className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border px-7 py-6">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <h2 className="text-lg font-bold text-primary-deep">本週事件態勢</h2>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              切換事件或衝突視角；日曆與摘要會在同一位置更新。
            </p>
          </div>
          <div
            className="grid min-w-[360px] grid-cols-2 overflow-hidden rounded-lg border border-border bg-secondary/45"
            role="tablist"
            aria-label="事件態勢視角"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "events"}
              onClick={() => setMode("events")}
              className={cn(
                "flex items-center justify-between gap-4 border-r border-border px-5 py-3 text-left transition-colors",
                mode === "events" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <span>
                <span
                  className={cn(
                    "block text-[11px]",
                    mode === "events" ? "text-primary-foreground/75" : "text-muted-foreground",
                  )}
                >
                  全部狀態事件
                </span>
                <span className="num mt-0.5 block text-3xl font-semibold">
                  {overviewSnapshot.weeklyEvents}
                </span>
              </span>
              <Activity className="size-5 opacity-70" />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "conflicts"}
              onClick={() => setMode("conflicts")}
              className={cn(
                "flex items-center justify-between gap-4 px-5 py-3 text-left transition-colors",
                mode === "conflicts" ? "bg-danger text-danger-foreground" : "hover:bg-danger-soft",
              )}
            >
              <span>
                <span
                  className={cn(
                    "block text-[11px]",
                    mode === "conflicts" ? "text-danger-foreground/75" : "text-muted-foreground",
                  )}
                >
                  其中形成衝突
                </span>
                <span
                  className={cn(
                    "num mt-0.5 block text-3xl font-semibold",
                    mode === "conflicts" ? "text-danger-foreground" : "text-danger",
                  )}
                >
                  {overviewSnapshot.conflicts}
                </span>
              </span>
              <GitCompareArrows className="size-5 opacity-70" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border bg-secondary/35 px-5 pt-6">
          {eventWeek.map((day) => {
            const value = dailyValue(day);
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDay(day.key)}
                className={cn(
                  "group flex min-w-0 flex-col items-center border-b-2 px-1 pb-5 transition-colors",
                  selectedDay === day.key
                    ? mode === "events"
                      ? "border-primary"
                      : "border-danger"
                    : "border-transparent hover:border-border-strong",
                )}
              >
                <span className="text-[10px] text-muted-foreground">週{day.day}</span>
                <span
                  className={cn(
                    "num mt-0.5 text-xs",
                    selectedDay === day.key
                      ? mode === "events"
                        ? "font-semibold text-primary"
                        : "font-semibold text-danger"
                      : "text-primary-deep",
                  )}
                >
                  {day.date}
                </span>
                <div className="mt-3 flex h-28 items-end">
                  <div
                    className={cn(
                      "w-8 rounded-t transition-all",
                      mode === "events"
                        ? selectedDay === day.key
                          ? "bg-primary"
                          : "bg-primary/25 group-hover:bg-primary/45"
                        : selectedDay === day.key
                          ? "bg-danger"
                          : "bg-danger/20 group-hover:bg-danger/40",
                    )}
                    style={{ height: `${Math.max((value / maxDaily) * 100, 10)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "num mt-2 text-base font-semibold",
                    mode === "conflicts" && value > 0 ? "text-danger" : "text-primary-deep",
                  )}
                >
                  {value}
                </span>
                {mode === "events" && (
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {day.conflicts} 項衝突
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid min-h-[245px] divide-y divide-border lg:grid-cols-[0.9fr_1.1fr] lg:divide-x lg:divide-y-0">
          <div className="px-7 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  {selected.date} · {mode === "events" ? "事件組成" : "衝突組成"}
                </div>
                <div
                  className={cn(
                    "num mt-1 text-3xl font-semibold",
                    mode === "events" ? "text-primary-deep" : "text-danger",
                  )}
                >
                  {mode === "events" ? selected.total : selected.conflicts}
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px]",
                  mode === "events" ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger",
                )}
              >
                {mode === "events" ? "項狀態事件" : "項證據衝突"}
              </span>
            </div>
            <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {selectedRows.map((item) => (
                <li key={item.label}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-primary-deep">{item.label}</span>
                    <span className="num text-primary-deep">{item.value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        mode === "events" ? "bg-primary/65" : "bg-danger/60",
                      )}
                      style={{ width: `${(item.value / maxSelected) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-7 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-primary-deep">
                  {mode === "events" ? "本週事件類型" : "本週衝突樣態"}
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {mode === "events" ? "326 項事件的類型分布" : "18 項衝突的組合分布"}
                </p>
              </div>
              <Link
                to="/cases"
                search={{ view: mode }}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                進入事件群組 <ChevronRight className="size-3" />
              </Link>
            </div>
            <ul className="mt-5 space-y-3">
              {weeklyRows.map((item) => (
                <li
                  key={item.label}
                  className="grid grid-cols-[minmax(0,1fr)_42px_60px] items-center gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs text-primary-deep">{item.label}</div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          mode === "events" ? "bg-primary/55" : "bg-danger/55",
                        )}
                        style={{ width: `${(item.value / maxWeekly) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="num text-right text-sm font-semibold text-primary-deep">
                    {item.value}
                  </span>
                  <span className="text-right text-[10px] text-muted-foreground">
                    {typeof item.change === "number" ? <Trend value={item.change} /> : item.change}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="card-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <EyeOff className="size-4 text-muted-foreground" />
                <h2 className="text-base font-bold text-primary-deep">監測覆蓋與盲區</h2>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                這是追蹤母體的資料可見性，與本週事件量分開計算。
              </p>
            </div>
            <div className="text-right">
              <div className="num text-2xl font-semibold text-primary-deep">
                {coverageRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-muted-foreground">可維持狀態判讀</div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/65"
              style={{ width: `${coverageRate}%` }}
            />
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[180px_1fr]">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <div>
                <div className="num text-2xl font-semibold text-primary-deep">
                  {readableRelationships.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">資料足以判讀</div>
              </div>
              <div>
                <div className="num text-2xl font-semibold text-muted-foreground">
                  {overviewSnapshot.blindSpots}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">關鍵資料不足</div>
              </div>
            </div>
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {monitoringBlindSpots.map((item) => (
                <li key={item.label}>
                  <Link to="/inspections" className="group block">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-primary-deep group-hover:text-primary">
                        {item.label}
                      </span>
                      <span className="num text-primary-deep">{item.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-muted-foreground/45"
                        style={{ width: `${(item.count / maxBlindSpot) * 100}%` }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/55 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
            <DatabaseZap className="size-4 text-primary" />
            狀態圖例
          </div>
          <div className="mt-4 space-y-3">
            {toneOrder.map((tone) => (
              <div key={tone} className="flex items-start gap-2.5 text-xs">
                <span className={cn("mt-1 size-2 rounded-full", signalMeta[tone].dotClass)} />
                <div>
                  <div className="font-medium text-primary-deep">
                    {signalMeta[tone].label.split("｜")[0]}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {signalMeta[tone].label.split("｜")[1]}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            首頁只呈現聚合態勢。案件、當事人與文件內容需進入事件群組後才可取得。
          </p>
        </div>
      </section>

      <p className="text-center text-[11px] text-muted-foreground">
        目前為聚合示範資料；事件群組提供 {overviewSnapshot.sampleCases} 件去識別化案件作為下鑽樣本。
      </p>
    </div>
  );
}

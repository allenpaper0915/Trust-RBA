import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  GitCompareArrows,
  RadioTower,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";
import { statusMeta } from "@/data/cases";
import {
  conflictPatterns,
  eventTypeTrends,
  monitoringFor,
  overviewSnapshot,
  signalMeta,
} from "@/data/monitoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cases/")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: search["view"] === "conflicts" ? ("conflicts" as const) : ("events" as const),
  }),
  head: () => ({
    meta: [
      { title: "事件與衝突群組｜移工狀態雷達" },
      {
        name: "description",
        content: "先從跨案件事件樣態辨識監理問題，再由有權承辦人按需展開去識別個案。",
      },
    ],
  }),
  component: EventGroups,
});

type GroupView = "conflict" | "event";

const conflictCaseMap = [["2026-031", "2026-088"], ["2026-024"], ["2026-047"], ["2026-119"]];

const eventCaseMap: Record<string, string[]> = {
  新聘僱許可: ["2026-024"],
  轉換雇主申請: ["2026-031", "2026-088"],
  投保異動: ["2026-024"],
  雇主失聯通報: ["2026-031"],
  移工本人回報: ["2026-047", "2026-119"],
  其他依法通報: ["2026-119"],
};

function EventGroups() {
  const { cases } = usePlatform();
  const { view: routeView } = Route.useSearch();
  const view: GroupView = routeView === "conflicts" ? "conflict" : "event";
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groups = view === "conflict" ? conflictPatterns : eventTypeTrends;
  const selected = groups[selectedIndex] ?? groups[0];
  const selectedCaseIds =
    view === "conflict"
      ? (conflictCaseMap[selectedIndex] ?? [])
      : (eventCaseMap[selected?.label ?? ""] ?? []);
  const selectedCases = cases.filter((item) => selectedCaseIds.includes(item.id));

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-primary">
            <GitCompareArrows className="size-4" /> EVENT & CONFLICT GROUPS
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary-deep">
            事件與衝突群組
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            從跨案件樣態理解哪些制度狀態正在形成證據衝突，再按需展開個案查證。
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
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-5 border-b px-7 py-6",
            view === "conflict"
              ? "border-danger/15 bg-danger-soft/45"
              : "border-primary/15 bg-primary-soft/45",
          )}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              {view === "conflict" ? (
                <GitCompareArrows className="size-4" />
              ) : (
                <RadioTower className="size-4" />
              )}
              從狀態總覽進入 · 目前檢視
            </div>
            <h2 className="mt-2 text-xl font-bold text-primary-deep">
              {view === "conflict"
                ? `${overviewSnapshot.conflicts} 項證據衝突，形成 ${conflictPatterns.length} 種樣態`
                : `${overviewSnapshot.weeklyEvents} 項狀態事件，分為 ${eventTypeTrends.length} 種類型`}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {view === "conflict"
                ? "選擇衝突樣態，查看判讀原則與可展開的去識別個案。"
                : "選擇事件類型，查看系統如何追蹤後續義務與證據期限。"}
            </p>
          </div>
          <div
            className="grid shrink-0 grid-cols-2 rounded-lg border border-border/80 bg-card/55 p-1"
            aria-label="檢視模式"
          >
            <Link
              to="/cases"
              search={{ view: "events" }}
              onClick={() => setSelectedIndex(0)}
              aria-current={view === "event" ? "page" : undefined}
              className={cn(
                "inline-flex min-w-36 items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium transition-colors",
                view === "event"
                  ? "border-primary/20 bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-card/70 hover:text-primary-deep",
              )}
            >
              狀態事件
              <span className="num font-semibold">{overviewSnapshot.weeklyEvents}</span>
            </Link>
            <Link
              to="/cases"
              search={{ view: "conflicts" }}
              onClick={() => setSelectedIndex(0)}
              aria-current={view === "conflict" ? "page" : undefined}
              className={cn(
                "inline-flex min-w-36 items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium transition-colors",
                view === "conflict"
                  ? "border-danger/20 bg-card text-danger shadow-sm"
                  : "text-muted-foreground hover:bg-card/70 hover:text-primary-deep",
              )}
            >
              證據衝突
              <span className="num font-semibold">{overviewSnapshot.conflicts}</span>
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-[23rem_minmax(0,1fr)]">
          <nav className="border-b border-border bg-secondary p-4 lg:border-r lg:border-b-0">
            <div className="px-2 pb-3 text-xs text-muted-foreground">
              {view === "conflict" ? "衝突樣態" : "事件類型"}
            </div>
            <div className="space-y-1.5">
              {groups.map((group, index) => (
                <button
                  key={group.label}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-md border border-transparent px-4 py-3.5 text-left transition-colors",
                    selectedIndex === index
                      ? view === "conflict"
                        ? "border-danger/20 bg-danger-soft"
                        : "border-primary/20 bg-primary-soft"
                      : "hover:bg-card",
                  )}
                >
                  <span className="text-sm font-medium leading-5 text-primary-deep">
                    {group.label}
                  </span>
                  <span
                    className={cn(
                      "num shrink-0 text-xl font-semibold",
                      view === "conflict" ? "text-danger" : "text-primary",
                    )}
                  >
                    {group.count}
                  </span>
                </button>
              ))}
            </div>
          </nav>

          {selected && (
            <div className="min-w-0 p-6 lg:p-8">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {view === "conflict" ? (
                  <GitCompareArrows className="size-4 text-danger" />
                ) : (
                  <RadioTower className="size-4 text-primary" />
                )}
                已選{view === "conflict" ? "衝突樣態" : "事件類型"}
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-primary-deep">{selected.label}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {view === "conflict"
                  ? "兩項各自成立的制度證據，在時間或狀態上無法同時解釋現況。這是要求查證的訊號，不是違法認定。"
                  : "這類事件由既有申報或系統更新產生。系統追蹤後續義務與證據期限，只有形成衝突、逾期或資料缺口時才升級。"}
              </p>
              <section className="mt-6 border-t border-border pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-primary-deep">去識別個案</h4>
                    <div className="mt-1 text-xs text-muted-foreground">
                      僅顯示判讀摘要，進入個案後才揭露證據鏈與原始文件。
                    </div>
                  </div>
                  <span className="num shrink-0 text-sm font-semibold text-primary-deep">
                    {selectedCases.length} 件
                  </span>
                </div>
                <div className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {selectedCases.map((item) => {
                    const profile = monitoringFor(item);
                    const signal = signalMeta[profile.tone];
                    const state = statusMeta[item.state];
                    return (
                      <div
                        key={item.id}
                        className="grid items-center gap-4 px-5 py-4 xl:grid-cols-[1fr_9rem_8rem_auto]"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn("size-2.5 shrink-0 rounded-full", signal.dotClass)}
                            />
                            <span className="text-sm font-medium text-primary-deep">
                              {profile.trigger}
                            </span>
                          </div>
                          <div className="mt-1.5 text-xs text-muted-foreground">
                            {item.origin}籍 · {item.workplace} ·{" "}
                            {item.source === "worker" ? "本人回報" : "制度抽樣"}
                          </div>
                        </div>
                        <div className="text-xs text-primary-deep">
                          {signal.label.split("｜")[1]}
                        </div>
                        <StatusPill tone={state.tone}>{state.short}</StatusPill>
                        <Link
                          to="/cases/$id"
                          params={{ id: item.id }}
                          className="inline-flex items-center justify-end gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          開啟個案 <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    );
                  })}
                  {selectedCases.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      示範資料中沒有可展開個案。
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="flex items-start gap-3 border-t border-border bg-muted/50 px-6 py-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
          <p className="text-xs leading-5 text-muted-foreground">
            <strong className="font-medium text-primary-deep">判讀邊界：</strong>
            Agent 只指出證據的不一致與缺口；是否調閱、訪查或排除異常，仍由有權承辦人決定。
          </p>
        </footer>
      </section>
    </div>
  );
}

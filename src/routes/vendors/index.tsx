import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Building, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { usePlatform } from "@/components/platform-store";
import { StatusPill } from "@/components/status-pill";
import { feeCategoryMeta, vendorTypeLabel } from "@/data/vendors";
import { vendorStats, vendorStatusMeta, type VendorStatus } from "@/lib/vendor-stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "仲介監理｜移工狀態雷達" },
      { name: "description", content: "依仲介機構彙整跨案件異常樣態、資料信心與訪查優先序。" },
    ],
  }),
  component: VendorSupervision,
});

const statusOrder: VendorStatus[] = ["violation", "watch", "unlisted", "clear"];

function VendorSupervision() {
  const { cases } = usePlatform();
  const [selectedStatus, setSelectedStatus] = useState<VendorStatus>("violation");
  const stats = useMemo(() => vendorStats(cases), [cases]);
  const selectedMeta = vendorStatusMeta[selectedStatus];
  const rows = stats.filter((stat) => stat.status === selectedStatus);

  const statusCount = (status: VendorStatus) =>
    stats.filter((stat) => stat.status === status && (status !== "unlisted" || stat.caseCount > 0))
      .length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="AGENCY SUPERVISION"
        title="仲介機構風險監理"
        subtitle="先看跨案件形成的機構樣態，再展開特定仲介；排序只分配監理資源，不等同評鑑或裁罰。"
      />

      <section className="card-surface overflow-hidden">
        <header
          className={cn(
            "border-b px-6 py-6 lg:px-8",
            selectedStatus === "violation"
              ? "border-danger/15 bg-danger-soft/45"
              : selectedStatus === "watch"
                ? "border-warning/20 bg-warning-soft/45"
                : selectedStatus === "clear"
                  ? "border-success/15 bg-success-soft/45"
                  : "border-border bg-muted/60",
          )}
        >
          <div>
            <div className="max-w-3xl lg:min-h-28">
              <div className="flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-muted-foreground">
                <ShieldAlert className="size-4 text-danger" /> 跨案件監理態勢
              </div>
              <h2 className="mt-3 text-xl font-semibold text-primary-deep">
                {selectedMeta.label} · {rows.length} 家機構
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {selectedMeta.detail} 點入機構後可查看跨案件證據與改善紀錄。
              </p>
            </div>

            <div
              className="mt-5 grid w-full grid-cols-2 rounded-lg border border-border/80 bg-card/55 p-1 sm:grid-cols-4 lg:max-w-[38rem]"
              aria-label="機構監理狀態"
            >
              {statusOrder.map((status) => {
                const meta = vendorStatusMeta[status];
                const count = statusCount(status);
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    aria-pressed={selectedStatus === status}
                    className={cn(
                      "inline-flex min-w-28 items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card/70 hover:text-primary-deep",
                      selectedStatus === status &&
                        (status === "violation"
                          ? "border-danger/20 bg-card text-danger shadow-sm"
                          : status === "watch"
                            ? "border-warning/25 bg-card text-warning-foreground shadow-sm"
                            : status === "clear"
                              ? "border-success/20 bg-card text-success shadow-sm"
                              : "border-border bg-card text-primary-deep shadow-sm"),
                    )}
                  >
                    {meta.label}
                    <span className="num font-semibold">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="hidden grid-cols-[minmax(15rem,1fr)_12rem_8rem_7rem_8rem_auto] gap-5 border-b border-border bg-secondary/60 px-6 py-3 text-[11px] text-muted-foreground lg:grid">
          <div>仲介機構</div>
          <div>重複樣態</div>
          <div>涉及／未結案</div>
          <div>資料信心</div>
          <div>監理狀態</div>
          <div className="text-right">機構資料</div>
        </div>
        <div className="divide-y divide-border">
          {rows.map((stat) => {
            const pattern = stat.categories.length
              ? stat.categories
                  .slice(0, 3)
                  .map((category) => feeCategoryMeta[category].label)
                  .join("、")
              : "目前無重複異常";
            const confidence = stat.caseCount >= 2 ? "高" : stat.caseCount === 1 ? "中" : "低";
            return (
              <div
                key={stat.vendor.id}
                className="grid items-center gap-5 px-6 py-5 transition-colors hover:bg-muted/40 lg:grid-cols-[minmax(15rem,1fr)_12rem_8rem_7rem_8rem_auto]"
              >
                <div>
                  <div className="flex items-center gap-2 font-medium text-primary-deep">
                    <Building className="size-4 text-primary" /> {stat.vendor.name}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {vendorTypeLabel[stat.vendor.type]} · {stat.vendor.country} · 服務{" "}
                    {stat.vendor.workers} 人
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground lg:hidden">重複樣態</div>
                  <div className="mt-1 text-xs text-primary-deep">{pattern}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground lg:hidden">涉及／未結案</div>
                  <div className="num mt-1 text-sm text-primary-deep">
                    {stat.caseCount}／{stat.openCases}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground lg:hidden">資料信心</div>
                  <div className="mt-1 text-sm text-primary-deep">{confidence}</div>
                </div>
                <StatusPill tone={vendorStatusMeta[stat.status].tone}>
                  {vendorStatusMeta[stat.status].label}
                </StatusPill>
                <Link
                  to="/vendors/$id"
                  params={{ id: stat.vendor.id }}
                  className="inline-flex items-center justify-end gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  查看機構 <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              目前沒有符合此監理狀態的機構。
            </div>
          )}
        </div>

        <footer className="border-t border-border bg-muted/50 px-6 py-4 text-xs leading-5 text-muted-foreground">
          RBA
          評分是供應鏈監理的下游結果：必須建立在已查證的事件、可驗證證據與改善紀錄上，不能由單一通報直接推導。
        </footer>
      </section>
    </div>
  );
}

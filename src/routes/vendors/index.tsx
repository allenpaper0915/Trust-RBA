import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building, ChevronRight } from "lucide-react";

import { money } from "@/data/compliance";
import { vendorTypeLabel, feeCategoryMeta } from "@/data/vendors";
import { usePlatform } from "@/components/platform-store";
import { vendorStats, vendorStatusMeta, type VendorStatus } from "@/lib/vendor-stats";
import { PageHeader, WorkflowNav } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "中間商合規｜TrustRBA" },
      {
        name: "description",
        content:
          "把每一件移工申報的費用鏈依收款方重新聚合，看出哪一家仲介、訓練中心或體檢機構在系統性收費。",
      },
    ],
  }),
  component: VendorList,
});

const filters: { key: VendorStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "violation", label: vendorStatusMeta.violation.label },
  { key: "watch", label: vendorStatusMeta.watch.label },
  { key: "unlisted", label: vendorStatusMeta.unlisted.label },
  { key: "clear", label: vendorStatusMeta.clear.label },
];

function VendorList() {
  const { cases } = usePlatform();
  const [filter, setFilter] = useState<VendorStatus | "all">("all");

  const stats = useMemo(() => vendorStats(cases), [cases]);
  const rows = stats.filter((s) => filter === "all" || s.status === filter);
  const totalDisallowed = stats.reduce((s, v) => s + v.disallowed, 0);
  const violations = stats.filter((s) => s.status === "violation").length;
  const unlisted = stats.filter((s) => s.status === "unlisted" && s.caseCount > 0).length;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="VENDOR COMPLIANCE"
        title="中間商合規"
        subtitle="招聘費被拆給好幾家中間商。依收款方聚合後，才看得出誰在系統性收費。"
        aside={<StatusPill tone="danger">{violations} 家確認違規</StatusPill>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "合約名單內中間商",
            value: String(stats.filter((s) => s.vendor.registered).length),
          },
          { label: "確認違規", value: String(violations), tone: "text-danger" },
          { label: "名單外中間商", value: String(unlisted), tone: "text-warning-foreground" },
          { label: "不當收費合計", value: money(totalDisallowed), tone: "text-danger" },
        ].map((c) => (
          <div key={c.label} className="card-surface p-5">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className={cn("num mt-1.5 text-2xl text-primary-deep", c.tone)}>{c.value}</div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="card-surface overflow-x-auto">
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-xs text-muted-foreground">
              <th className="px-5 py-3.5 font-medium">中間商</th>
              <th className="px-5 py-3.5 font-medium">類型 / 國家</th>
              <th className="px-5 py-3.5 font-medium">收費項目</th>
              <th className="px-5 py-3.5 text-right font-medium">涉及案件</th>
              <th className="px-5 py-3.5 text-right font-medium">移工實付</th>
              <th className="px-5 py-3.5 text-right font-medium">不當收費</th>
              <th className="px-5 py-3.5 font-medium">狀態</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((s) => {
              const meta = vendorStatusMeta[s.status];
              return (
                <tr key={s.vendor.id} className="transition-colors hover:bg-muted">
                  <td className="px-5 py-4">
                    <Link
                      to="/vendors/$id"
                      params={{ id: s.vendor.id }}
                      className="flex items-center gap-2 font-medium text-primary hover:underline"
                    >
                      <Building className="size-3.5 shrink-0" />
                      {s.vendor.name}
                    </Link>
                    {!s.vendor.registered && (
                      <div className="mt-0.5 text-[11px] text-warning-foreground">
                        不在企業合約名單上
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {vendorTypeLabel[s.vendor.type]}
                    <div className="text-xs">{s.vendor.country}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {s.categories.map((c) => (
                        <span
                          key={c}
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[11px]",
                            feeCategoryMeta[c].workerPayable
                              ? "border-border bg-muted text-muted-foreground"
                              : "border-danger/25 bg-danger-soft text-danger",
                          )}
                        >
                          {feeCategoryMeta[c].label}
                        </span>
                      ))}
                      {s.categories.length === 0 && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="num px-5 py-4 text-right text-primary-deep">{s.caseCount}</td>
                  <td className="num px-5 py-4 text-right text-primary-deep">
                    {s.collected > 0 ? money(s.collected) : "—"}
                  </td>
                  <td className="num px-5 py-4 text-right text-danger">
                    {s.disallowed > 0 ? money(s.disallowed) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/vendors/$id"
                      params={{ id: s.vendor.id }}
                      aria-label={`檢視 ${s.vendor.name}`}
                    >
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="rounded-md border border-border bg-muted px-5 py-4 text-sm leading-relaxed text-muted-foreground">
        狀態由案件審核結果推導，不是人工標註：有經人工確認的不當收費即為「確認違規」，
        有未結案申報為「調查中」，申報中出現但不在合約名單上的公司為「名單外」。
      </p>

      <WorkflowNav current="/vendors" />
    </div>
  );
}

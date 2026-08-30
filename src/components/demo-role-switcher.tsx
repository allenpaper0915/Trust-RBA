import { useNavigate } from "@tanstack/react-router";

import { usePlatform, type Role } from "@/components/platform-store";
import { cn } from "@/lib/utils";

const roleLabels: Record<Role, string> = {
  government: "政府／監管單位",
  agency: "仲介機構",
  worker: "移工本人",
  enterprise: "聘僱企業",
};

export function DemoRoleSwitcher({ light = false }: { light?: boolean }) {
  const { role, setRole } = usePlatform();
  const navigate = useNavigate();

  const switchRole = (next: Role) => {
    setRole(next);
    if (next === "government") navigate({ to: "/dashboard" });
    if (next === "agency") navigate({ to: "/agency" });
    if (next === "worker") navigate({ to: "/worker" });
    if (next === "enterprise") navigate({ to: "/enterprise" });
  };

  return (
    <label className="block min-w-0">
      <span
        className={cn(
          "block text-[11px]",
          light ? "text-muted-foreground" : "text-sidebar-foreground/60",
        )}
      >
        Demo 情境身分
      </span>
      <select
        value={role}
        onChange={(event) => switchRole(event.target.value as Role)}
        className={cn(
          "mt-1 w-full rounded border px-2 py-1.5 text-xs outline-none",
          light
            ? "border-border bg-card text-primary-deep"
            : "border-sidebar-border bg-sidebar-accent text-white",
        )}
      >
        {(Object.keys(roleLabels) as Role[]).map((item) => (
          <option key={item} value={item} className="text-primary-deep">
            {roleLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}

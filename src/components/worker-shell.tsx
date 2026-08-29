import { Link } from "@tanstack/react-router";
import { Building2, Globe, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { locales, type Locale } from "@/lib/i18n";
import { usePlatform, useT } from "@/components/platform-store";
import { cn } from "@/lib/utils";

/**
 * 移工端外殼。
 *
 * 與企業端刻意不同：單欄、字級大、按鈕大、可切換語言，
 * 因為使用者多半在手機上、在下班時間、用非母語以外的第二語言操作。
 */
export function WorkerShell({ children }: { children: ReactNode }) {
  const { locale, setLocale } = usePlatform();
  const t = useT();

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/worker" className="flex items-center gap-2.5">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-tight text-primary-deep">
                TrustRBA
              </span>
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                {t("portal.name")}
              </span>
            </span>
          </Link>

          <label className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="sr-only">Language</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="bg-transparent text-xs text-primary-deep outline-none"
            >
              {locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-3xl px-5 py-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            TrustRBA · {t("portal.promise2")}
          </p>
        </div>
      </footer>
    </div>
  );
}

/** 移工端共用：大按鈕。 */
export function BigButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary-deep"
          : "border border-border-strong bg-card text-primary-deep hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

/** 移工端共用：欄位外框。 */
export function Field({
  label,
  hint,
  children,
  error,
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
  error?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-primary-deep">{label}</span>
      {hint && (
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
      )}
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-1.5 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-border bg-card px-3.5 py-3 text-sm text-primary-deep outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

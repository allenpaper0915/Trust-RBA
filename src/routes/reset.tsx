import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { usePlatform } from "@/components/platform-store";
import { useSession } from "@/components/session-state";

/**
 * 未對外連結的重設入口。
 *
 * 正式產品不會有「重設資料」這種按鈕，所以介面上找不到它；
 * 但簡報前需要一個乾淨起點，直接輸網址 /reset 即可。
 */
export const Route = createFileRoute("/reset")({
  component: ResetPage,
});

function ResetPage() {
  const { resetPlatform } = usePlatform();
  const { resetSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    resetPlatform();
    resetSession();
    navigate({ to: "/dashboard", replace: true });
  }, [resetPlatform, resetSession, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      正在回復初始資料…
    </div>
  );
}

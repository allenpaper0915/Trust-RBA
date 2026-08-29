import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type DemoState = {
  demoMode: boolean;
  presentation: boolean;
  revoked: boolean;
  verified: boolean;
  reviewApproved: boolean;
  toggleDemoMode: () => void;
  togglePresentation: () => void;
  setRevoked: (v: boolean) => void;
  setVerified: (v: boolean) => void;
  setReviewApproved: (v: boolean) => void;
  resetDemo: () => void;
};

const DemoContext = createContext<DemoState | null>(null);

const KEY = "trustrba-demo-state";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState(true);
  const [presentation, setPresentation] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [verified, setVerified] = useState(false);
  const [reviewApproved, setReviewApproved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<DemoState>;
      if (typeof s.demoMode === "boolean") setDemoMode(s.demoMode);
      if (typeof s.presentation === "boolean") setPresentation(s.presentation);
      if (typeof s.revoked === "boolean") setRevoked(s.revoked);
      if (typeof s.verified === "boolean") setVerified(s.verified);
      if (typeof s.reviewApproved === "boolean") setReviewApproved(s.reviewApproved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ demoMode, presentation, revoked, verified, reviewApproved }),
      );
    } catch {
      /* ignore */
    }
  }, [demoMode, presentation, revoked, verified, reviewApproved]);

  /**
   * Demo Mode 開啟時預先載入完整劇情狀態，避免任何頁面出現空白；
   * 關閉時清回原始狀態，方便從第一步開始錄影。
   */
  const toggleDemoMode = useCallback(() => {
    const next = !demoMode;
    setDemoMode(next);
    setVerified(next);
    setReviewApproved(next);
    setRevoked(false);
  }, [demoMode]);

  const resetDemo = useCallback(() => {
    setRevoked(false);
    setVerified(false);
    setReviewApproved(false);
    setPresentation(false);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        demoMode,
        presentation,
        revoked,
        verified,
        reviewApproved,
        toggleDemoMode,
        togglePresentation: () => setPresentation((v) => !v),
        setRevoked,
        setVerified,
        setReviewApproved,
        resetDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useSession 必須在 SessionProvider 之內使用");
  return ctx;
}

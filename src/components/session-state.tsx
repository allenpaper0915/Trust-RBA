import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * 跨頁面的作業狀態：驗證是否跑過、憑證是否被撤銷。
 * 與案件資料分開存放，因為這些是「這台裝置的操作狀態」而非平台資料。
 */
type SessionState = {
  revoked: boolean;
  verified: boolean;
  setRevoked: (v: boolean) => void;
  setVerified: (v: boolean) => void;
  resetSession: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

const KEY = "trustrba-session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [revoked, setRevoked] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<SessionState>;
      if (typeof s.revoked === "boolean") setRevoked(s.revoked);
      if (typeof s.verified === "boolean") setVerified(s.verified);
    } catch {
      /* 首次使用或無法讀取時維持預設值 */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ revoked, verified }));
    } catch {
      /* 儲存失敗不影響操作 */
    }
  }, [revoked, verified]);

  const resetSession = useCallback(() => {
    setRevoked(false);
    setVerified(false);
  }, []);

  return (
    <SessionContext.Provider value={{ revoked, verified, setRevoked, setVerified, resetSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession 必須在 SessionProvider 之內使用");
  return ctx;
}

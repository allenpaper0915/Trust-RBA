import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { seedCases, statusMeta, decisionMeta } from "@/data/cases";
import type { CaseDoc, CaseRecord, CaseStatus, ReviewDecision } from "@/data/cases";
import type { Locale } from "@/lib/i18n";
import type { AnalysisResult, SubmissionInput } from "@/lib/analysis";
import { aliasFor, newLookupCode } from "@/lib/deidentify";
import { translate } from "@/lib/i18n";

export type EventActor = "worker" | "ai" | "reviewer" | "system";

export type PlatformEvent = {
  id: string;
  at: string;
  caseId?: string;
  actor: EventActor;
  action: string;
  evidence: string;
  auth: string;
  result: string;
};

export type Role = "enterprise" | "worker";

type PlatformState = {
  cases: CaseRecord[];
  events: PlatformEvent[];
  role: Role;
  locale: Locale;
  reviewer: string;
  setRole: (r: Role) => void;
  setLocale: (l: Locale) => void;
  setReviewer: (r: string) => void;
  getCase: (id: string) => CaseRecord | undefined;
  getByCode: (code: string) => CaseRecord | undefined;
  caseEvents: (id: string) => PlatformEvent[];
  addSubmission: (
    input: SubmissionInput,
    analysis: AnalysisResult,
    redactedCount: number,
  ) => CaseRecord;
  addDocs: (caseId: string, docs: CaseDoc[]) => void;
  decide: (
    caseId: string,
    args: { decision: ReviewDecision; note: string; refund?: number | undefined; reply: string },
  ) => void;
  assign: (caseId: string, reviewer: string) => void;
  markRemediated: (caseId: string) => void;
  resetPlatform: () => void;
};

const Ctx = createContext<PlatformState | null>(null);

const KEY = "trustrba-platform-v1";

const pad = (n: number) => String(n).padStart(2, "0");

/** 日期，與種子資料同格式（例："2026 / 08 / 29"）。 */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()} / ${pad(d.getMonth() + 1)} / ${pad(d.getDate())}`;
};

/** 日期加時間，用於稽核紀錄。 */
const now = () => {
  const d = new Date();
  return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 為初始案件補上對應的稽核事件，讓稽核紀錄一開始就反映真實歷程。 */
function seedEvents(cases: CaseRecord[]): PlatformEvent[] {
  const out: PlatformEvent[] = [];
  for (const c of cases) {
    if (c.source === "worker") {
      out.push({
        id: `${c.id}-recv`,
        at: `${c.submittedAt} 09:12`,
        caseId: c.id,
        actor: "worker",
        action: "移工端提交申報",
        evidence: `${c.docs.length} 份文件 · 查詢碼 ${c.code}`,
        auth: "本人同意書",
        result: "已受理",
      });
      out.push({
        id: `${c.id}-deid`,
        at: `${c.submittedAt} 09:12`,
        caseId: c.id,
        actor: "system",
        action: "去識別化",
        evidence: `遮蔽 ${c.docs.reduce((s, d) => s + d.redactedCount, 0)} 個個資欄位`,
        auth: "固定樣式規則",
        result: "完成",
      });
    } else {
      out.push({
        id: `${c.id}-audit`,
        at: `${c.submittedAt} 09:12`,
        caseId: c.id,
        actor: "reviewer",
        action: "合規抽樣建案",
        evidence: `${c.agency} · ${c.origin} 走廊`,
        auth: "年度稽核計畫",
        result: "已建案",
      });
    }
    out.push({
      id: `${c.id}-ai`,
      at: `${c.submittedAt} 09:13`,
      caseId: c.id,
      actor: "ai",
      action: "基準比對與風險計分",
      evidence: `實付 NT$${c.fee.toLocaleString("en-US")}`,
      auth: "deterministic 權重表",
      result: "送交人工審核",
    });
    if (c.review) {
      out.push({
        id: `${c.id}-review`,
        at: c.review.at,
        caseId: c.id,
        actor: "reviewer",
        action: decisionMeta[c.review.decision].label,
        evidence: c.review.note,
        auth: c.review.reviewer,
        result: statusMeta[c.state].label,
      });
    }
  }
  return out;
}

type Persisted = { cases: CaseRecord[]; events: PlatformEvent[] };

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<CaseRecord[]>(seedCases);
  const [events, setEvents] = useState<PlatformEvent[]>(() => seedEvents(seedCases));
  const [role, setRole] = useState<Role>("enterprise");
  const [locale, setLocale] = useState<Locale>("zh");
  const [reviewer, setReviewer] = useState("林郁婷（合規主管）");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted> & { role?: Role; locale?: Locale };
        if (Array.isArray(p.cases) && p.cases.length) setCases(p.cases);
        if (Array.isArray(p.events) && p.events.length) setEvents(p.events);
        if (p.locale) setLocale(p.locale);
      }
    } catch {
      /* 首次使用或無法讀取時，維持初始種子資料 */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ cases, events, locale }));
    } catch {
      /* 儲存失敗不影響操作 */
    }
  }, [cases, events, locale, hydrated]);

  const push = useCallback((e: Omit<PlatformEvent, "id" | "at"> & { at?: string }) => {
    setEvents((prev) => [
      ...prev,
      { ...e, at: e.at ?? now(), id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ]);
  }, []);

  const addSubmission = useCallback(
    (input: SubmissionInput, analysis: AnalysisResult, redactedCount: number) => {
      const serial = String(Date.now()).slice(-3);
      const id = `${new Date().getFullYear()}-${serial}`;
      const code = newLookupCode();
      const record: CaseRecord = {
        id,
        code,
        worker: aliasFor(code),
        origin: input.origin,
        workplace: input.workplace,
        agency: input.agency,
        fee: analysis.paid,
        agencyClaim: input.docs.find((d) => d.kind === "contract")?.ocrAmount ?? 0,
        date: input.arrivedAt,
        language: "移工端自填",
        present: analysis.present,
        conflicting: analysis.conflicting,
        consistency: analysis.consistency,
        policyMatch: analysis.policyMatch,
        status: "待人工審核",
        source: "worker",
        submittedAt: today(),
        arrivedAt: input.arrivedAt,
        paymentMethod: input.paymentMethod,
        docs: input.docs,
        assignee: "尚未指派",
        state: "pending_review",
        workerNote: input.note,
      };
      setCases((prev) => [record, ...prev]);
      const stamp = now();
      setEvents((prev) => [
        ...prev,
        {
          id: `${id}-recv`,
          at: stamp,
          caseId: id,
          actor: "worker",
          action: "移工端提交申報",
          evidence: `${input.docs.length} 份文件 · 查詢碼 ${code}`,
          auth: "本人同意書",
          result: "已受理",
        },
        {
          id: `${id}-deid`,
          at: stamp,
          caseId: id,
          actor: "system",
          action: "去識別化",
          evidence: `遮蔽 ${redactedCount} 個個資欄位`,
          auth: "固定樣式規則",
          result: "完成",
        },
        {
          id: `${id}-ai`,
          at: stamp,
          caseId: id,
          actor: "ai",
          action: "基準比對與風險計分",
          evidence: `實付 NT$${analysis.paid.toLocaleString("en-US")} / 基準 NT$${analysis.benchmark.toLocaleString("en-US")}`,
          auth: "deterministic 權重表",
          result: `風險分數 ${analysis.riskScore}，送交人工審核`,
        },
      ]);
      return record;
    },
    [],
  );

  const addDocs = useCallback(
    (caseId: string, docs: CaseDoc[]) => {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                docs: [...c.docs, ...docs],
                state: c.state === "need_more" ? ("pending_review" as CaseStatus) : c.state,
              }
            : c,
        ),
      );
      push({
        caseId,
        actor: "worker",
        action: "補上傳文件",
        evidence: docs.map((d) => d.name).join(" · "),
        auth: "本人同意書",
        result: "重新排入審核佇列",
      });
    },
    [push],
  );

  const decide = useCallback(
    (
      caseId: string,
      args: { decision: ReviewDecision; note: string; refund?: number | undefined; reply: string },
    ) => {
      const at = now();
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                state: decisionMeta[args.decision].next,
                workerReply: args.reply,
                review: {
                  decision: args.decision,
                  note: args.note,
                  reviewer,
                  at,
                  refund: args.refund,
                },
              }
            : c,
        ),
      );
      push({
        at,
        caseId,
        actor: "reviewer",
        action: decisionMeta[args.decision].label,
        evidence: args.note || "（未填寫理由）",
        auth: reviewer,
        result: statusMeta[decisionMeta[args.decision].next].label,
      });
    },
    [push, reviewer],
  );

  const assign = useCallback(
    (caseId: string, to: string) => {
      setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, assignee: to } : c)));
      push({
        caseId,
        actor: "reviewer",
        action: "指派審核人",
        evidence: to,
        auth: reviewer,
        result: "已指派",
      });
    },
    [push, reviewer],
  );

  const markRemediated = useCallback(
    (caseId: string) => {
      setCases((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, state: "remediated" as CaseStatus } : c)),
      );
      push({
        caseId,
        actor: "reviewer",
        action: "確認返還完成",
        evidence: "返還憑證已納入證據鏈",
        auth: reviewer,
        result: "已完成返還",
      });
    },
    [push, reviewer],
  );

  const resetPlatform = useCallback(() => {
    setCases(seedCases);
    setEvents(seedEvents(seedCases));
  }, []);

  const value = useMemo<PlatformState>(
    () => ({
      cases,
      events,
      role,
      locale,
      reviewer,
      setRole,
      setLocale,
      setReviewer,
      getCase: (id) => cases.find((c) => c.id === id),
      getByCode: (code) =>
        cases.find((c) => (c.code ?? "").toUpperCase() === code.trim().toUpperCase()),
      caseEvents: (id) => events.filter((e) => e.caseId === id),
      addSubmission,
      addDocs,
      decide,
      assign,
      markRemediated,
      resetPlatform,
    }),
    [
      cases,
      events,
      role,
      locale,
      reviewer,
      addSubmission,
      addDocs,
      decide,
      assign,
      markRemediated,
      resetPlatform,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatform() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatform 必須在 PlatformProvider 之內使用");
  return ctx;
}

/** 移工端字串翻譯的便利 hook。 */
export function useT() {
  const { locale } = usePlatform();
  return useMemo(
    () => (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );
}

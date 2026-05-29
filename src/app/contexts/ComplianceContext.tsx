/**
 * ComplianceContext — shared state for the VW Funds 2 Compliance / Web Monitoring feature.
 *
 * Manages the full lifecycle of compliance infractions, dealer solutions, and OEM notifications.
 * Extracted from AppContent to keep AppContent focused on routing/layout concerns.
 *
 * Design principles mirror WorkflowContext:
 *  • Single source of truth for all compliance state
 *  • localStorage persistence via useLocalStorage hook
 *  • All action callbacks are stable (useCallback)
 *  • Derived memos accept dealership arguments to support multi-dealer demo
 */

import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import type { WCMItem, CaseSolution, WCMComment } from '../../data/types/compliance';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ─── Stable serializers (module-level = no new reference every render) ───────

// Strip screenshotDataUrl before persisting — base64 images easily exceed
// localStorage's ~5 MB quota, causing a silent QuotaExceededError that loses
// the whole caseSolutions record on the next page load.
// React state retains the full URL for the current session; after a reload the
// panel shows a "screenshot not available" placeholder instead of a broken img.
const serializeCaseSolutions = (value: Record<string, CaseSolution>): string => {
  const stripped: Record<string, CaseSolution> = {};
  for (const [id, sol] of Object.entries(value)) {
    stripped[id] = { ...sol, screenshotDataUrl: '' };
  }
  return JSON.stringify(stripped);
};

// Normalize stale submittedBy names after renames (runs once on localStorage load)
const LEGACY_NAMES: Record<string, string> = { 'Aaron Vasquez': 'Katelyn Gray' };
const deserializeCaseSolutions = (raw: string): Record<string, CaseSolution> => {
  const parsed = JSON.parse(raw) as Record<string, CaseSolution>;
  for (const sol of Object.values(parsed)) {
    if (sol.submittedBy in LEGACY_NAMES) sol.submittedBy = LEGACY_NAMES[sol.submittedBy];
  }
  return parsed;
};

// ─── localStorage keys ────────────────────────────────────────────────────────

const USER_INFRACTIONS_STORAGE_KEY    = 'vw-funds-2:userAddedInfractions';
const DELETED_INFRACTIONS_STORAGE_KEY = 'vw-funds-2:deletedInfractionIds'; // [FV] right-click delete
const SEEN_INFRACTIONS_STORAGE_KEY    = 'vw-funds-2:dealerSeenInfractionIds';
const SEEN_SUBMITTED_STORAGE_KEY      = 'vw-funds-2:dealerSeenSubmittedIds';
const CASE_SOLUTIONS_STORAGE_KEY      = 'vw-funds-2:caseSolutions';
const OEM_SEEN_SOLUTIONS_KEY          = 'vw-funds-2:oemSeenSolutionIds';
const OEM_SEEN_REPORTED_KEY           = 'vw-funds-2:oemSeenReportedIds';
const WCM_COMMENTS_STORAGE_KEY        = 'vw-funds-2:wcmComments';
const DEALER_CASE_UPDATES_KEY         = 'vw-funds-2:dealerCaseUpdates';
const DEALER_SEEN_CASE_UPDATE_KEY     = 'vw-funds-2:dealerSeenCaseUpdateIds';

// ─── Dealer identity map ──────────────────────────────────────────────────────

// [FV] dealer identity per role — drives Compliance scope, AI auto-fill, and "submitted by" labels
const DEALER_IDENTITY: Record<string, { dealership: string; userName: string }> = {
  'dealer':               { dealership: 'Jack Daniels Volkswagen',          userName: 'Mallory Manning' },
  'dealer-singular':      { dealership: 'Jack Daniels Volkswagen',          userName: 'Mallory Manning' },
  'dealer-emich':         { dealership: 'Emich Volkswagen',                 userName: 'Katelyn Gray' },
  'dealer-ridenow':       { dealership: 'RideNow Powersports Weatherford',  userName: 'Rachel Hui' },
};

// [FV] kept for backward compatibility — used as default when userType isn't a known dealer role
export const DEALER_VIEW_DEALERSHIP = 'Jack Daniels Volkswagen';

export function getDealerIdentity(role: string): { dealership: string; userName: string } {
  return DEALER_IDENTITY[role] ?? DEALER_IDENTITY['dealer'];
}

// ─── Case update notification interface ──────────────────────────────────────

export interface CaseUpdateNotif {
  id: string;
  itemId: string;
  dealership: string;
  message: string;
  timestampISO: string;
}

// ─── Context interface ────────────────────────────────────────────────────────

interface ComplianceContextType {
  // State
  userAddedInfractions: WCMItem[];
  deletedInfractionIds: Set<string>;
  seenInfractionIds: Set<string>;
  seenSubmittedIds: Set<string>;
  caseSolutions: Record<string, CaseSolution>;
  oemSeenSolutionIds: Set<string>;
  oemSeenReportedIds: Set<string>;
  wcmComments: Record<string, WCMComment[]>;

  // Infraction actions
  addInfraction: (infraction: WCMItem) => void;
  deleteInfraction: (id: string) => void;
  updateInfractionStatus: (id: string, newStatus: string) => void;
  markSeenInfraction: (id: string) => void;
  markSeenSubmitted: (id: string) => void;

  // Case solution actions
  submitCaseSolution: (id: string, draft: { screenshotDataUrl: string; comment: string }, submittedBy: string) => void;
  markCaseSolved: (id: string) => void;
  markOemSeenSolution: (id: string) => void;
  markOemSeenReported: (id: string) => void;

  // Discussion thread
  addWcmComment: (itemId: string, text: string, author: string, role: 'oem' | 'dealer') => void;

  // Derived — dealer
  dealerInfractionNotifs: (dealership: string) => WCMItem[];
  dealerInfractionUnread: (dealership: string) => number;
  dealerSubmittedNotifs: (reporterName: string) => WCMItem[];
  dealerSubmittedUnread: (reporterName: string) => number;

  // Case update notifications (OEM changes status → dealer bell)
  caseUpdates: CaseUpdateNotif[];
  seenCaseUpdateIds: Set<string>;
  addDealerCaseUpdate: (itemId: string, message: string, dealership: string) => void;
  markSeenCaseUpdate: (id: string) => void;
  dealerCaseUpdateNotifs: (dealershipName: string) => CaseUpdateNotif[];
  dealerCaseUpdateUnread: (dealershipName: string) => number;

  // Derived — OEM
  oemSolutionNotifs: Array<{ id: string; solution: CaseSolution }>;
  oemSolutionUnread: number;
  oemReportedNotifs: WCMItem[];
  oemReportedUnread: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ComplianceContext = createContext<ComplianceContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ComplianceProvider({ children }: { children: ReactNode }) {
  // [FV] user-added infractions (OEM Add Infraction + dealer Report Infraction flows)
  const [userAddedInfractions, setUserAddedInfractions] = useLocalStorage<WCMItem[]>(
    USER_INFRACTIONS_STORAGE_KEY,
    [],
    (raw) => {
      const parsed = JSON.parse(raw) as WCMItem[];
      // [FV] migrate older entries that pre-date the `source` field
      return parsed.map(item => item.source ? item : { ...item, source: 'Manually Added' as const });
    },
  );

  // [FV] right-click delete — deleted IDs (covers both static WCM_DATA and userAddedInfractions)
  const [deletedInfractionIds, setDeletedInfractionIds] = useLocalStorage<Set<string>>(
    DELETED_INFRACTIONS_STORAGE_KEY,
    new Set<string>(),
    (raw) => new Set(JSON.parse(raw) as string[]),
    (value) => JSON.stringify(Array.from(value)),
  );

  // [FV] dealer-side "seen" infraction IDs — drives the unread bell badge for the dealer
  const [seenInfractionIds, setSeenInfractionIds] = useLocalStorage<Set<string>>(
    SEEN_INFRACTIONS_STORAGE_KEY,
    new Set<string>(),
    (raw) => new Set(JSON.parse(raw) as string[]),
    (value) => JSON.stringify(Array.from(value)),
  );

  // dealer-side "seen" submitted-infraction IDs — confirms own submissions in the bell
  const [seenSubmittedIds, setSeenSubmittedIds] = useLocalStorage<Set<string>>(
    SEEN_SUBMITTED_STORAGE_KEY,
    new Set<string>(),
    (raw) => new Set(JSON.parse(raw) as string[]),
    (value) => JSON.stringify(Array.from(value)),
  );

  // ── Case solutions ────────────────────────────────────────────────────────

  const [caseSolutions, setCaseSolutions] = useLocalStorage<Record<string, CaseSolution>>(
    CASE_SOLUTIONS_STORAGE_KEY,
    {},
    deserializeCaseSolutions, // normalize stale names + JSON.parse
    serializeCaseSolutions,   // strip screenshots before writing to localStorage
  );

  // OEM-side: which solution updates have been seen by the OEM (drives the OEM bell badge)
  const [oemSeenSolutionIds, setOemSeenSolutionIds] = useLocalStorage<Set<string>>(
    OEM_SEEN_SOLUTIONS_KEY,
    new Set<string>(),
    (raw) => new Set(JSON.parse(raw) as string[]),
    (value) => JSON.stringify(Array.from(value)),
  );

  // OEM-side: which dealer-reported infractions the OEM has already opened
  const [oemSeenReportedIds, setOemSeenReportedIds] = useLocalStorage<Set<string>>(
    OEM_SEEN_REPORTED_KEY,
    new Set<string>(),
    (raw) => new Set(JSON.parse(raw) as string[]),
    (value) => JSON.stringify(Array.from(value)),
  );

  // Discussion thread comments keyed by WCM item id
  const [wcmComments, setWcmComments] = useLocalStorage<Record<string, WCMComment[]>>(
    WCM_COMMENTS_STORAGE_KEY,
    {},
  );

  // dealer-side case update notifications (OEM changes status on a compliance item)
  const [caseUpdates, setCaseUpdates] = useLocalStorage<CaseUpdateNotif[]>(
    DEALER_CASE_UPDATES_KEY,
    [],
  );

  const [seenCaseUpdateIds, setSeenCaseUpdateIds] = useLocalStorage<Set<string>>(
    DEALER_SEEN_CASE_UPDATE_KEY,
    new Set<string>(),
    (raw) => new Set(JSON.parse(raw) as string[]),
    (value) => JSON.stringify(Array.from(value)),
  );

  // ── Infraction actions ────────────────────────────────────────────────────

  const addInfraction = useCallback((infraction: WCMItem) => {
    setUserAddedInfractions(prev => [infraction, ...prev]);
  }, [setUserAddedInfractions]);

  const deleteInfraction = useCallback((id: string) => {
    setUserAddedInfractions(prev => prev.filter(i => i.id !== id));
    setDeletedInfractionIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setUserAddedInfractions, setDeletedInfractionIds]);

  // [FV] update status of a user-added (dealer-reported or OEM-added) infraction
  const updateInfractionStatus = useCallback((id: string, newStatus: string) => {
    setUserAddedInfractions(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  }, [setUserAddedInfractions]);

  const markSeenInfraction = useCallback((id: string) => {
    setSeenInfractionIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setSeenInfractionIds]);

  const markSeenSubmitted = useCallback((id: string) => {
    setSeenSubmittedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setSeenSubmittedIds]);

  // ── Case solution actions ─────────────────────────────────────────────────

  const submitCaseSolution = useCallback((
    id: string,
    draft: { screenshotDataUrl: string; comment: string },
    submittedBy: string,
  ) => {
    setCaseSolutions(prev => ({
      ...prev,
      [id]: {
        screenshotDataUrl: draft.screenshotDataUrl,
        comment: draft.comment,
        submittedBy,
        submittedAtISO: new Date().toISOString(),
        solved: false,
      },
    }));
    // Always mark the OEM notification as unread — handles re-submissions where
    // the OEM had previously seen an earlier submission for the same item.
    setOemSeenSolutionIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [setCaseSolutions, setOemSeenSolutionIds]);

  const markCaseSolved = useCallback((id: string) => {
    setCaseSolutions(prev => prev[id] ? ({
      ...prev,
      [id]: { ...prev[id], solved: true, solvedAtISO: new Date().toISOString() },
    }) : prev);
  }, [setCaseSolutions]);

  const markOemSeenSolution = useCallback((id: string) => {
    setOemSeenSolutionIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setOemSeenSolutionIds]);

  const markOemSeenReported = useCallback((id: string) => {
    setOemSeenReportedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setOemSeenReportedIds]);

  // ── Discussion thread ─────────────────────────────────────────────────────

  const addWcmComment = useCallback((itemId: string, text: string, author: string, role: 'oem' | 'dealer') => {
    const comment: WCMComment = {
      id: `wcmc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author,
      role,
      text,
      timestampISO: new Date().toISOString(),
    };
    setWcmComments(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), comment],
    }));
  }, [setWcmComments]);

  const addDealerCaseUpdate = useCallback((itemId: string, message: string, dealership: string) => {
    const id = `cup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setCaseUpdates(prev => [{ id, itemId, dealership, message, timestampISO: new Date().toISOString() }, ...prev]);
  }, [setCaseUpdates]);

  const markSeenCaseUpdate = useCallback((id: string) => {
    setSeenCaseUpdateIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setSeenCaseUpdateIds]);

  const dealerCaseUpdateNotifs = useCallback(
    (dealershipName: string) => caseUpdates.filter(n => n.dealership === dealershipName),
    [caseUpdates],
  );

  const dealerCaseUpdateUnread = useCallback(
    (dealershipName: string) =>
      dealerCaseUpdateNotifs(dealershipName).filter(n => !seenCaseUpdateIds.has(n.id)).length,
    [dealerCaseUpdateNotifs, seenCaseUpdateIds],
  );

  // ── Derived — dealer ──────────────────────────────────────────────────────

  // [FV] Infractions targeted at a given dealership — these surface as bell notifications.
  // Accepts a dealership string so any dealer view (Jack Daniels, Emich, etc.) can call it.
  const dealerInfractionNotifs = useCallback(
    (dealership: string) => userAddedInfractions.filter(i => i.dealership === dealership),
    [userAddedInfractions],
  );

  const dealerInfractionUnread = useCallback(
    (dealership: string) =>
      dealerInfractionNotifs(dealership).filter(i => !seenInfractionIds.has(i.id)).length,
    [dealerInfractionNotifs, seenInfractionIds],
  );

  // Infractions submitted BY a given reporter — confirmation bell for the submitting dealer
  const dealerSubmittedNotifs = useCallback(
    (reporterName: string) => userAddedInfractions.filter(i => i.reportedBy === reporterName),
    [userAddedInfractions],
  );

  const dealerSubmittedUnread = useCallback(
    (reporterName: string) =>
      dealerSubmittedNotifs(reporterName).filter(i => !seenSubmittedIds.has(i.id)).length,
    [dealerSubmittedNotifs, seenSubmittedIds],
  );

  // ── Derived — OEM ─────────────────────────────────────────────────────────

  // OEM solution notifications — every submitted solution is an OEM notif.
  const oemSolutionNotifs = useMemo(() => {
    return Object.entries(caseSolutions)
      .map(([id, solution]) => ({ id, solution }));
  }, [caseSolutions]);

  const oemSolutionUnread = useMemo(
    () => oemSolutionNotifs.filter(({ id }) => !oemSeenSolutionIds.has(id)).length,
    [oemSolutionNotifs, oemSeenSolutionIds],
  );

  // OEM-reported notifications — every userAddedInfraction with reportedBy set is a dealer report
  const oemReportedNotifs = useMemo(
    () => userAddedInfractions.filter(i => !!i.reportedBy),
    [userAddedInfractions],
  );

  const oemReportedUnread = useMemo(
    () => oemReportedNotifs.filter(i => !oemSeenReportedIds.has(i.id)).length,
    [oemReportedNotifs, oemSeenReportedIds],
  );

  return (
    <ComplianceContext.Provider
      value={{
        userAddedInfractions,
        deletedInfractionIds,
        seenInfractionIds,
        seenSubmittedIds,
        caseSolutions,
        oemSeenSolutionIds,
        oemSeenReportedIds,
        wcmComments,
        addInfraction,
        deleteInfraction,
        updateInfractionStatus,
        markSeenInfraction,
        markSeenSubmitted,
        submitCaseSolution,
        markCaseSolved,
        markOemSeenSolution,
        markOemSeenReported,
        addWcmComment,
        caseUpdates,
        seenCaseUpdateIds,
        addDealerCaseUpdate,
        markSeenCaseUpdate,
        dealerCaseUpdateNotifs,
        dealerCaseUpdateUnread,
        dealerInfractionNotifs,
        dealerInfractionUnread,
        dealerSubmittedNotifs,
        dealerSubmittedUnread,
        oemSolutionNotifs,
        oemSolutionUnread,
        oemReportedNotifs,
        oemReportedUnread,
      }}
    >
      {children}
    </ComplianceContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCompliance(): ComplianceContextType {
  const ctx = useContext(ComplianceContext);
  if (!ctx) throw new Error('useCompliance must be used within ComplianceProvider');
  return ctx;
}

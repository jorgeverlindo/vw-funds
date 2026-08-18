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

import { createContext, useContext, useCallback, useMemo, ReactNode, useEffect, useRef } from 'react';
import type { WCMItem, CaseSolution, WCMComment, WCMLifecycleStatus, LifecycleEvent } from '../../data/types/compliance';
import { useLocalStorage } from '../hooks/useLocalStorage';

const API_BASE = 'http://localhost:3001';

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
const OEM_APPEAL_UPDATES_KEY          = 'vw-funds-2:oemAppealUpdates';
const OEM_SEEN_APPEAL_KEY             = 'vw-funds-2:oemSeenAppealIds';
const STATIC_OVERRIDES_STORAGE_KEY    = 'vw-funds-2:staticOverrides';

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

export interface OemAppealUpdate {
  id: string;
  itemId: string;
  dealership: string;
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
  duplicateInfraction: (id: string) => void;
  updateInfractionStatus: (id: string, newStatus: string) => void;
  patchInfraction: (id: string, patch: Partial<WCMItem>) => void;
  markSeenInfraction: (id: string) => void;
  markSeenSubmitted: (id: string) => void;

  // Case solution actions
  submitCaseSolution: (id: string, draft: { screenshotDataUrl: string; comment: string }, submittedBy: string) => void;
  rejectCaseSolution: (id: string) => void;
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
  oemAppealUpdates: OemAppealUpdate[];
  oemSeenAppealIds: Set<string>;
  markOemSeenAppeal: (id: string) => void;
  oemAppealUnread: number;

  // Shadow-override map — lifecycle state for static WCM_DATA rows
  staticOverrides: Record<string, Partial<WCMItem>>;
  getEffectiveItem: (item: WCMItem) => WCMItem;
  patchAnyItem: (id: string, patch: Partial<WCMItem>) => void;

  // DMP Lifecycle actions
  issueNotificationLetter: (id: string, notificationNumber: number, actor: string, dealership: string, caseCategory?: 'A' | 'B') => void;
  dismissCase: (id: string, actor: string, dealership: string) => void;
  submitAppeal: (id: string, actor: string, dealership: string) => void;
  decideAppeal: (id: string, actor: string, decision: 'granted' | 'denied', dealership: string) => void;
  markReMonitored: (id: string, actor: string) => void;
  markCured: (id: string, actor: string, dealership: string) => void;
  escalateCase: (id: string, actor: string, dealership: string) => void;
  resetStaticOverride: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ComplianceContext = createContext<ComplianceContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ComplianceProvider({ children }: { children: ReactNode }) {
  // [FV] user-added infractions (OEM Add Infraction + dealer Report Infraction flows)
  // screenshotDataUrl is stripped before persisting — base64 images easily blow the ~5 MB
  // localStorage quota, causing a silent QuotaExceededError that loses all items on reload.
  // React state retains the full URL for the current session; after reload the panel shows
  // a "screenshot not available" placeholder.
  const [userAddedInfractions, setUserAddedInfractions] = useLocalStorage<WCMItem[]>(
    USER_INFRACTIONS_STORAGE_KEY,
    [],
    (raw) => {
      const parsed = JSON.parse(raw) as WCMItem[];
      // [FV] migrate older entries that pre-date the `source` field
      return parsed.map(item => item.source ? item : { ...item, source: 'Manually Added' as const });
    },
    (value) => JSON.stringify(value.map(item => ({ ...item, screenshotDataUrl: '' }))),
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

  // OEM-side appeal notifications (dealer submits appeal → OEM bell)
  const [oemAppealUpdates, setOemAppealUpdates] = useLocalStorage<OemAppealUpdate[]>(
    OEM_APPEAL_UPDATES_KEY,
    [],
  );

  const [oemSeenAppealIds, setOemSeenAppealIds] = useLocalStorage<Set<string>>(
    OEM_SEEN_APPEAL_KEY,
    new Set<string>(),
    (raw) => new Set(JSON.parse(raw) as string[]),
    (value) => JSON.stringify(Array.from(value)),
  );

  // Shadow-override map for static WCM_DATA rows — never use patchInfraction on static rows
  const [staticOverrides, setStaticOverrides] = useLocalStorage<Record<string, Partial<WCMItem>>>(
    STATIC_OVERRIDES_STORAGE_KEY,
    {},
  );

  // ── Infraction actions ────────────────────────────────────────────────────

  // Server sync — debounced write so any change to userAddedInfractions is persisted.
  // hydratedRef blocks the sync on initial load so stale localStorage never overwrites
  // the server's canonical rebuild data.
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedBodyRef = useRef<string>('');
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!hydratedRef.current) return; // wait for hydration
    if (userAddedInfractions.length === 0) return;
    const items = userAddedInfractions.map(i => ({ ...i, screenshotDataUrl: '' }));
    const body = JSON.stringify({ items });
    if (body === lastSyncedBodyRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      lastSyncedBodyRef.current = body;
      fetch(`${API_BASE}/api/compliance/infractions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => {});
    }, 1000);
  }, [userAddedInfractions]);

  // Server hydration — always load from server on mount (server is source of truth).
  // Replaces localStorage entirely; unlock sync only after this resolves.
  useEffect(() => {
    fetch(`${API_BASE}/api/compliance/infractions`)
      .then(r => r.json())
      .then((data: { items?: WCMItem[] }) => {
        const serverItems = data.items ?? [];
        if (serverItems.length > 0) {
          setUserAddedInfractions(serverItems);
        }
        hydratedRef.current = true;
      })
      .catch(() => {
        hydratedRef.current = true; // allow sync even if hydration failed
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // On mount: backfill screenshotHash for existing items that pre-date the hash field.
  // screenshotHash is stable (content-addressed by URL+channel on the server), so it
  // survives page reloads without any client-side image storage.
  useEffect(() => {
    const needsHash = userAddedInfractions.filter(i => !i.screenshotHash && i.url && i.channel);
    if (!needsHash.length) return;
    Promise.all(
      needsHash.map(item =>
        fetch(`${API_BASE}/api/compliance/screenshot-hash`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url, channel: item.channel }),
        })
          .then(r => r.json() as Promise<{ hash: string | null }>)
          .then(({ hash }) => hash ? { id: item.id, hash } : null)
          .catch(() => null),
      ),
    ).then(results => {
      const updates: Record<string, string> = {};
      for (const r of results) {
        if (r) updates[r.id] = r.hash;
      }
      if (!Object.keys(updates).length) return;
      setUserAddedInfractions(prev =>
        prev.map(i => updates[i.id] ? { ...i, screenshotHash: updates[i.id] } : i),
      );
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

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

  const duplicateInfraction = useCallback((id: string) => {
    const original = userAddedInfractions.find(i => i.id === id);
    if (!original) return;
    const newId = `SCN-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    const copy: WCMItem = {
      ...original,
      id: newId,
      violationType: `${original.violationType} [copy]`,
      createdAtISO: new Date().toISOString(),
      screenshotDataUrl: '',
      // keep screenshotHash so the screenshot thumbnail still loads
    };
    setUserAddedInfractions(prev => [copy, ...prev]);
  }, [userAddedInfractions, setUserAddedInfractions]);

  // [FV] update status of a user-added (dealer-reported or OEM-added) infraction
  const updateInfractionStatus = useCallback((id: string, newStatus: string) => {
    setUserAddedInfractions(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  }, [setUserAddedInfractions]);

  const patchInfraction = useCallback((id: string, patch: Partial<WCMItem>) => {
    setUserAddedInfractions(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
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

  const rejectCaseSolution = useCallback((id: string) => {
    setCaseSolutions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // Move back to REMEDIATION_PENDING so dealer knows to re-submit
    setStaticOverrides(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {}),
        lifecycleStatus: 'REMEDIATION_PENDING' as const,
      },
    }));
  }, [setCaseSolutions, setStaticOverrides]);

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

  const addOemAppealUpdate = useCallback((itemId: string, dealership: string) => {
    const id = `oap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setOemAppealUpdates(prev => [{ id, itemId, dealership, timestampISO: new Date().toISOString() }, ...prev]);
  }, [setOemAppealUpdates]);

  const markOemSeenAppeal = useCallback((id: string) => {
    setOemSeenAppealIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setOemSeenAppealIds]);

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

  // ── Shadow-override & lifecycle helpers ──────────────────────────────────

  // Merges staticOverrides into a WCMItem — use this before passing any static row to the UI.
  const getEffectiveItem = useCallback((item: WCMItem): WCMItem => {
    const override = staticOverrides[item.id];
    return override ? { ...item, ...override } : item;
  }, [staticOverrides]);

  // Smart patch: user-added rows go through setUserAddedInfractions; static rows go through staticOverrides.
  const patchAnyItem = useCallback((id: string, patch: Partial<WCMItem>) => {
    const isUserAdded = userAddedInfractions.some(i => i.id === id);
    if (isUserAdded) {
      setUserAddedInfractions(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    } else {
      setStaticOverrides(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
    }
  }, [userAddedInfractions, setUserAddedInfractions, setStaticOverrides]);

  // Internal helper: applies a functional patch to whichever store owns this item.
  const applyLifecyclePatch = useCallback((
    id: string,
    patcher: (current: Partial<WCMItem>) => Partial<WCMItem>,
  ) => {
    const isUserAdded = userAddedInfractions.some(i => i.id === id);
    if (isUserAdded) {
      setUserAddedInfractions(prev => prev.map(i => i.id === id ? { ...i, ...patcher(i) } : i));
    } else {
      setStaticOverrides(prev => ({ ...prev, [id]: patcher(prev[id] ?? {}) }));
    }
  }, [userAddedInfractions, setUserAddedInfractions, setStaticOverrides]);

  // ── DMP Lifecycle actions ─────────────────────────────────────────────────

  const issueNotificationLetter = useCallback((
    id: string,
    notificationNumber: number,
    actor: string,
    dealership: string,
    caseCategory?: 'A' | 'B',
  ) => {
    const now = new Date().toISOString();
    const appealDeadlineDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const appealDeadline = appealDeadlineDate.toISOString();
    // penaltyStartMonth = 1st of the calendar month following the appeal deadline
    const psDate = new Date(appealDeadlineDate);
    psDate.setDate(1);
    psDate.setMonth(psDate.getMonth() + 1);
    const penaltyStartMonth = notificationNumber >= 2 ? psDate.toISOString().slice(0, 7) : undefined;
    const event: LifecycleEvent = {
      id: `lce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampISO: now,
      actor,
      actorRole: 'oem',
      type: 'NOTIFIED',
      label: `Notification Letter #${notificationNumber} issued`,
    };
    applyLifecyclePatch(id, (cur) => ({
      ...cur,
      lifecycleStatus: 'NOTIFIED' as WCMLifecycleStatus,
      notificationNumber,
      notifiedAt: now,
      appealDeadline,
      appealStatus: null,
      penaltyStep: notificationNumber - 1,
      ...(caseCategory !== undefined ? { caseCategory } : {}),
      ...(penaltyStartMonth !== undefined ? { penaltyStartMonth } : {}),
      ...(notificationNumber >= 4 ? { awardsIneligible: true } : {}),
      lifecycleHistory: [...(cur.lifecycleHistory ?? []), event],
    }));
    addDealerCaseUpdate(id, `A Notification Letter (#${notificationNumber}) has been issued for your dealership.`, dealership);
  }, [applyLifecyclePatch, addDealerCaseUpdate]);

  const dismissCase = useCallback((id: string, actor: string, dealership: string) => {
    const event: LifecycleEvent = {
      id: `lce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampISO: new Date().toISOString(),
      actor,
      actorRole: 'oem',
      type: 'DISMISSED',
      label: 'Case dismissed — no further action required',
    };
    applyLifecyclePatch(id, (cur) => ({
      ...cur,
      lifecycleStatus: 'DISMISSED' as WCMLifecycleStatus,
      lifecycleHistory: [...(cur.lifecycleHistory ?? []), event],
    }));
    addDealerCaseUpdate(id, 'Your compliance case has been dismissed by OEM.', dealership);
  }, [applyLifecyclePatch, addDealerCaseUpdate]);

  const submitAppeal = useCallback((id: string, actor: string, dealership: string) => {
    const now = new Date().toISOString();
    const event: LifecycleEvent = {
      id: `lce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampISO: now,
      actor,
      actorRole: 'dealer',
      type: 'APPEAL_SUBMITTED',
      label: 'Appeal submitted by dealer',
    };
    applyLifecyclePatch(id, (cur) => ({
      ...cur,
      appealStatus: 'submitted',
      appealSubmittedAt: now,
      lifecycleHistory: [...(cur.lifecycleHistory ?? []), event],
    }));
    addOemAppealUpdate(id, dealership);
  }, [applyLifecyclePatch, addOemAppealUpdate]);

  const decideAppeal = useCallback((id: string, actor: string, decision: 'granted' | 'denied', dealership: string) => {
    // Lifecycle status: granted → APPEAL_GRANTED (PDF: infraction removed from record)
    //                   denied  → REMEDIATION_PENDING (dealer must fix the violation)
    const newStatus: WCMLifecycleStatus = decision === 'granted' ? 'APPEAL_GRANTED' : 'REMEDIATION_PENDING';
    const event: LifecycleEvent = {
      id: `lce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampISO: new Date().toISOString(),
      actor,
      actorRole: 'oem',
      type: decision === 'granted' ? 'APPEAL_GRANTED' : 'APPEAL_DENIED',
      label: decision === 'granted' ? 'Appeal granted by OEM' : 'Appeal denied by OEM',
    };
    applyLifecyclePatch(id, (cur) => {
      const patch: Partial<WCMItem> = {
        lifecycleStatus: newStatus,
        appealStatus: decision,
        lifecycleHistory: [...(cur.lifecycleHistory ?? []), event],
      };
      // Per VW DMP Guidelines p.21: appeal granted → infraction removed from dealer record,
      // previously enforced non-compliance actions reversed → decrement notification counter.
      if (decision === 'granted') {
        const prevNum = cur.notificationNumber ?? 1;
        const newNum = Math.max(0, prevNum - 1);
        patch.notificationNumber = newNum;
        patch.penaltyStep = Math.max(0, newNum - 1);
        if (newNum < 4) patch.awardsIneligible = false;
      }
      return { ...cur, ...patch };
    });
    const msg = decision === 'granted'
      ? 'Your appeal has been granted by OEM. The infraction has been removed from your record.'
      : 'Your appeal has been denied by OEM. The violation must be remediated.';
    addDealerCaseUpdate(id, msg, dealership);
  }, [applyLifecyclePatch, addDealerCaseUpdate]);

  const markReMonitored = useCallback((id: string, actor: string) => {
    const now = new Date().toISOString();
    const event: LifecycleEvent = {
      id: `lce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampISO: now,
      actor,
      actorRole: 'oem',
      type: 'RE_MONITORING',
      label: 'Re-monitoring check completed',
    };
    applyLifecyclePatch(id, (cur) => ({
      ...cur,
      lifecycleStatus: 'RE_MONITORING' as WCMLifecycleStatus,
      lastReMonitoredAt: now,
      lifecycleHistory: [...(cur.lifecycleHistory ?? []), event],
    }));
  }, [applyLifecyclePatch]);

  const markCured = useCallback((id: string, actor: string, dealership: string) => {
    const event: LifecycleEvent = {
      id: `lce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampISO: new Date().toISOString(),
      actor,
      actorRole: 'oem',
      type: 'CURED',
      label: 'Infraction cured — dealership back in compliance',
    };
    applyLifecyclePatch(id, (cur) => ({
      ...cur,
      lifecycleStatus: 'CURED' as WCMLifecycleStatus,
      lifecycleHistory: [...(cur.lifecycleHistory ?? []), event],
    }));
    addDealerCaseUpdate(id, 'Your compliance case has been marked as cured. You are back in compliance.', dealership);
  }, [applyLifecyclePatch, addDealerCaseUpdate]);

  const escalateCase = useCallback((id: string, actor: string, dealership: string) => {
    const now = new Date().toISOString();
    const appealDeadlineDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const appealDeadline = appealDeadlineDate.toISOString();
    const psDate = new Date(appealDeadlineDate);
    psDate.setDate(1);
    psDate.setMonth(psDate.getMonth() + 1);
    const escalateEvent: LifecycleEvent = {
      id: `lce-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampISO: now,
      actor,
      actorRole: 'oem',
      type: 'ESCALATED',
      label: 'Penalty assigned — new Notification Letter issued',
    };
    applyLifecyclePatch(id, (cur) => {
      const nextNum = (cur.notificationNumber ?? 1) + 1;
      const penaltyStartMonth = nextNum >= 2 ? psDate.toISOString().slice(0, 7) : undefined;
      return {
        ...cur,
        lifecycleStatus: 'ESCALATED' as WCMLifecycleStatus,
        notificationNumber: nextNum,
        notifiedAt: now,
        appealDeadline,
        appealStatus: null,
        penaltyStep: nextNum - 1,
        ...(penaltyStartMonth !== undefined ? { penaltyStartMonth } : {}),
        ...(nextNum >= 4 ? { awardsIneligible: true } : {}),
        lifecycleHistory: [...(cur.lifecycleHistory ?? []), escalateEvent],
      };
    });
    addDealerCaseUpdate(id, 'A penalty has been assigned. A new Notification Letter has been issued.', dealership);
  }, [applyLifecyclePatch, addDealerCaseUpdate]);

  const resetStaticOverride = useCallback((id: string) => {
    setStaticOverrides(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCaseSolutions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [setStaticOverrides, setCaseSolutions]);

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

  const oemAppealUnread = useMemo(
    () => oemAppealUpdates.filter(u => !oemSeenAppealIds.has(u.id)).length,
    [oemAppealUpdates, oemSeenAppealIds],
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
        duplicateInfraction,
        updateInfractionStatus,
        patchInfraction,
        markSeenInfraction,
        markSeenSubmitted,
        submitCaseSolution,
        rejectCaseSolution,
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
        oemAppealUpdates,
        oemSeenAppealIds,
        markOemSeenAppeal,
        oemAppealUnread,
        staticOverrides,
        getEffectiveItem,
        patchAnyItem,
        resetStaticOverride,
        issueNotificationLetter,
        dismissCase,
        submitAppeal,
        decideAppeal,
        markReMonitored,
        markCured,
        escalateCase,
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

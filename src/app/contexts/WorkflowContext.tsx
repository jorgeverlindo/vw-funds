/**
 * WorkflowContext — shared state for the Volkswagen Anytown end-to-end demo workflow.
 *
 * Manages the full pre-approval → claim lifecycle for the RFP demo scenario:
 *   Dealer: Volkswagen Anytown  |  Code: 12345
 *   Activity: March 1–31, 2026  |  $5,000 digital ad campaign
 *
 * Design principles:
 *  • Single source of truth — all surfaces (pre-approval list, claim list,
 *    OEM panels, dealer panels, notifications, badge) read from this context.
 *  • Scalable state machines — adding extra revision rounds needs zero refactoring:
 *    status values cycle naturally; history is append-only.
 *  • No automatic navigation — the demo presenter switches views manually.
 *    This context only produces data; routing is the presenter's job.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─── Canonical demo data ─────────────────────────────────────────────────────

export const WORKFLOW_PA_ID = 'WF-PA-001';
export const WORKFLOW_CL_ID = 'WF-CL-001';

export const WORKFLOW_DEALER = {
  name: 'Volkswagen Anytown',
  code: '12345',
  city: 'Anytown',
  contact: 'Mallory Manning',
  email: 'mallory.manning@vw-anytown.com',
};

export const WORKFLOW_CAMPAIGN = {
  activityStartDate: 'Mar 1, 2026',
  activityEndDate: 'Mar 31, 2026',
  totalAmount: 5000,
  channelBreakdown: {
    'Display Banners': 1000,
    'Facebook': 500,
    'Paid Search': 500,
    'Video': 3000,
  } as Record<string, number>,
  mediaType: 'Digital Advertising',
  initiativeType: 'Digital Ad Campaign',
  description:
    'March 2026 digital advertising campaign — Display Banners, Facebook, Paid Search, and Video targeting the Anytown metro area.',
};

// ─── Status types ───────────────────────────────────────────────────────────

export type PreApprovalWorkflowStatus =
  | 'Draft'
  | 'Submitted'
  | 'In Review'
  | 'Revision Requested'
  | 'Resubmitted'
  | 'Approved';

export type ClaimWorkflowStatus =
  | 'Draft'
  | 'Submitted'
  | 'In Review'
  | 'Revision Requested'
  | 'Resubmitted'
  | 'Approved'
  | 'Ready for Payment'
  | 'Paid';

// ─── Supporting types ────────────────────────────────────────────────────────

export interface ClaimLineItem {
  description: string;
  amount: string;
}

export interface WorkflowDocument {
  name: string;
  size: string;
  type: string;
  /** Blob URL for image previews — set when an image file is uploaded */
  url?: string;
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;       // ISO string
  actor: 'Dealer' | 'OEM';
  actorName: string;
  action: string;
  comment?: string;
}

export interface WorkflowNotification {
  id: string;
  targetRole: 'oem' | 'dealer';
  type: 'pre-approval' | 'claim';
  title: string;
  body: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;       // ISO string
  time: string;            // display string e.g. "just now"
}

export interface WorkflowPreApprovalState {
  id: string;
  status: PreApprovalWorkflowStatus;
  oemComment: string | null;
  history: WorkflowEvent[];
  documents: WorkflowDocument[];
  submittedAt: string | null;
  claimsCount: number;
  /** Dynamic fields set from the pre-approval form */
  totalAmount: number;
  activityPeriod: string;
  claimLines: ClaimLineItem[];
  mediaType: string;
  details: string;
}

export interface WorkflowClaimState {
  id: string;
  /** null = claim not yet created by dealer */
  status: ClaimWorkflowStatus | null;
  oemComment: string | null;
  history: WorkflowEvent[];
  linkedPreApprovalId: string;
  invoiceTotal: number;
  documents: WorkflowDocument[];
  submittedAt: string | null;
}

/** Snapshot of a completed PA → Claim cycle, kept for display in both datagrids */
export interface ArchivedCycle {
  /** 1-based index: first completed cycle is 1 */
  cycleIndex: number;
  preApproval: WorkflowPreApprovalState;
  claim: WorkflowClaimState;
  archivedAt: string;  // ISO string
}

export interface WorkflowState {
  preApproval: WorkflowPreApprovalState;
  claim: WorkflowClaimState;
  notifications: WorkflowNotification[];
  archivedCycles: ArchivedCycle[];
}

// ─── Context interface ───────────────────────────────────────────────────────

interface WorkflowContextType {
  workflow: WorkflowState;

  // Pre-approval actions (Dealer)
  submitPreApproval: () => void;
  resubmitPreApproval: () => void;

  // Pre-approval actions (OEM)
  approvePreApproval: (comment?: string) => void;
  requestPreApprovalRevision: (comment: string) => void;

  // Claim actions (Dealer)
  createClaim: () => void;
  submitClaim: () => void;
  resubmitClaim: () => void;

  // Claim actions (OEM)
  approveClaimAction: (comment?: string) => void;
  requestClaimRevision: (comment: string) => void;
  processPayment: () => void;

  // Cycle management
  archiveAndReset: () => void;
  updatePreApprovalData: (
    totalAmount: number,
    activityPeriod: string,
    claimLines: ClaimLineItem[],
    mediaType: string,
    details: string,
  ) => void;

  // Document management
  addPreApprovalDocument: (doc: WorkflowDocument) => void;
  removePreApprovalDocument: (name: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllRead: (role: 'oem' | 'dealer') => void;
  oemUnreadCount: number;
  dealerUnreadCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _eventCounter = 2; // starts at 2 because initial event is evt-001
function nextEventId() {
  return `evt-${String(++_eventCounter).padStart(3, '0')}`;
}

let _notifCounter = 2; // initial notif is wf-notif-001
function nextNotifId() {
  return `wf-notif-${String(++_notifCounter).padStart(3, '0')}`;
}

function nowIso() {
  return new Date().toISOString();
}

// ─── Initial state ───────────────────────────────────────────────────────────

const INITIAL_STATE: WorkflowState = {
  preApproval: {
    id: WORKFLOW_PA_ID,
    // Demo starts with the pre-approval already submitted so the OEM
    // sees it immediately when viewing the Pre-Approvals list.
    status: 'Submitted',
    oemComment: null,
    history: [
      {
        id: 'evt-001',
        timestamp: '2026-04-20T09:30:00.000Z',
        actor: 'Dealer',
        actorName: WORKFLOW_DEALER.contact,
        action: 'Pre-approval submitted for OEM review',
      },
    ],
    documents: [],
    submittedAt: '2026-04-20T09:30:00.000Z',
    claimsCount: 0,
    totalAmount: WORKFLOW_CAMPAIGN.totalAmount,
    activityPeriod: `${WORKFLOW_CAMPAIGN.activityStartDate} – ${WORKFLOW_CAMPAIGN.activityEndDate}`,
    claimLines: Object.entries(WORKFLOW_CAMPAIGN.channelBreakdown).map(([description, amount]) => ({
      description,
      amount: String(amount),
    })),
    mediaType: WORKFLOW_CAMPAIGN.mediaType,
    details: WORKFLOW_CAMPAIGN.description,
  },

  claim: {
    id: WORKFLOW_CL_ID,
    status: null, // not yet created
    oemComment: null,
    history: [],
    linkedPreApprovalId: WORKFLOW_PA_ID,
    invoiceTotal: WORKFLOW_CAMPAIGN.totalAmount,
    documents: [],
    submittedAt: null,
  },

  archivedCycles: [],

  // OEM sees one unread notification from the pre-approval submission.
  notifications: [
    {
      id: 'wf-notif-001',
      targetRole: 'oem',
      type: 'pre-approval',
      title: 'New pre-approval submitted',
      body: `${WORKFLOW_DEALER.name} (${WORKFLOW_DEALER.code}) submitted a pre-approval for review`,
      referenceId: WORKFLOW_PA_ID,
      isRead: false,
      createdAt: '2026-04-20T09:30:00.000Z',
      time: 'just now',
    },
  ],
};

// ─── Context + Provider ──────────────────────────────────────────────────────

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<WorkflowState>(INITIAL_STATE);

  // ── Notification helpers ──────────────────────────────────────────────────

  const pushNotif = useCallback(
    (n: Omit<WorkflowNotification, 'id' | 'isRead' | 'createdAt' | 'time'>) => {
      const notif: WorkflowNotification = {
        ...n,
        id: nextNotifId(),
        isRead: false,
        createdAt: nowIso(),
        time: 'just now',
      };
      setWorkflow(prev => ({ ...prev, notifications: [notif, ...prev.notifications] }));
    },
    [],
  );

  const pushEvent = useCallback(
    (target: 'preApproval' | 'claim', event: Omit<WorkflowEvent, 'id' | 'timestamp'>) => {
      const ev: WorkflowEvent = { ...event, id: nextEventId(), timestamp: nowIso() };
      setWorkflow(prev => ({
        ...prev,
        [target]: {
          ...prev[target],
          history: [...prev[target].history, ev],
        },
      }));
    },
    [],
  );

  // ── Pre-approval actions ──────────────────────────────────────────────────

  const submitPreApproval = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        status: 'Submitted',
        submittedAt: nowIso(),
      },
    }));
    pushEvent('preApproval', {
      actor: 'Dealer',
      actorName: WORKFLOW_DEALER.contact,
      action: 'Pre-approval submitted for OEM review',
    });
    pushNotif({
      targetRole: 'oem',
      type: 'pre-approval',
      title: 'New pre-approval submitted',
      body: `${WORKFLOW_DEALER.name} (${WORKFLOW_DEALER.code}) submitted a pre-approval for review`,
      referenceId: WORKFLOW_PA_ID,
    });
  }, [pushEvent, pushNotif]);

  const resubmitPreApproval = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        status: 'Resubmitted',
        oemComment: null,
      },
    }));
    pushEvent('preApproval', {
      actor: 'Dealer',
      actorName: WORKFLOW_DEALER.contact,
      action: 'Pre-approval resubmitted after revision',
    });
    pushNotif({
      targetRole: 'oem',
      type: 'pre-approval',
      title: 'Pre-approval resubmitted',
      body: `${WORKFLOW_DEALER.name} (${WORKFLOW_DEALER.code}) resubmitted the pre-approval for review`,
      referenceId: WORKFLOW_PA_ID,
    });
  }, [pushEvent, pushNotif]);

  const approvePreApproval = useCallback((comment?: string) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        status: 'Approved',
        oemComment: comment ?? null,
      },
    }));
    pushEvent('preApproval', {
      actor: 'OEM',
      actorName: 'OEM Reviewer',
      action: 'Pre-approval approved',
      comment,
    });
    pushNotif({
      targetRole: 'dealer',
      type: 'pre-approval',
      title: 'Pre-Approval Approved',
      body: `Your pre-approval for ${WORKFLOW_DEALER.name} has been approved. You may now create a claim.`,
      referenceId: WORKFLOW_PA_ID,
    });
  }, [pushEvent, pushNotif]);

  const requestPreApprovalRevision = useCallback((comment: string) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        status: 'Revision Requested',
        oemComment: comment,
      },
    }));
    pushEvent('preApproval', {
      actor: 'OEM',
      actorName: 'OEM Reviewer',
      action: 'Revision requested',
      comment,
    });
    pushNotif({
      targetRole: 'dealer',
      type: 'pre-approval',
      title: 'Pre-Approval requires adjustments',
      body: `${WORKFLOW_DEALER.name} pre-approval was returned with OEM comments`,
      referenceId: WORKFLOW_PA_ID,
    });
  }, [pushEvent, pushNotif]);

  // ── Claim actions ─────────────────────────────────────────────────────────

  const createClaim = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: { ...prev.preApproval, claimsCount: 1 },
      claim: { ...prev.claim, status: 'Draft' },
    }));
    pushEvent('claim', {
      actor: 'Dealer',
      actorName: WORKFLOW_DEALER.contact,
      action: 'Claim created from approved pre-approval',
    });
  }, [pushEvent]);

  const submitClaim = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, status: 'Submitted', submittedAt: nowIso() },
    }));
    pushEvent('claim', {
      actor: 'Dealer',
      actorName: WORKFLOW_DEALER.contact,
      action: 'Claim submitted for OEM review',
    });
    pushNotif({
      targetRole: 'oem',
      type: 'claim',
      title: 'New claim submitted',
      body: `${WORKFLOW_DEALER.name} (${WORKFLOW_DEALER.code}) submitted a claim for $${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()}`,
      referenceId: WORKFLOW_CL_ID,
    });
  }, [pushEvent, pushNotif]);

  const resubmitClaim = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, status: 'Resubmitted', oemComment: null },
    }));
    pushEvent('claim', {
      actor: 'Dealer',
      actorName: WORKFLOW_DEALER.contact,
      action: 'Claim resubmitted after revision',
    });
    pushNotif({
      targetRole: 'oem',
      type: 'claim',
      title: 'Claim resubmitted',
      body: `${WORKFLOW_DEALER.name} (${WORKFLOW_DEALER.code}) resubmitted the claim for review`,
      referenceId: WORKFLOW_CL_ID,
    });
  }, [pushEvent, pushNotif]);

  const approveClaimAction = useCallback((comment?: string) => {
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, status: 'Approved', oemComment: comment ?? null },
    }));
    pushEvent('claim', {
      actor: 'OEM',
      actorName: 'OEM Reviewer',
      action: 'Claim approved',
      comment,
    });
    pushNotif({
      targetRole: 'dealer',
      type: 'claim',
      title: 'Claim Approved',
      body: `Your claim of $${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()} for ${WORKFLOW_DEALER.name} has been approved.`,
      referenceId: WORKFLOW_CL_ID,
    });
  }, [pushEvent, pushNotif]);

  const requestClaimRevision = useCallback((comment: string) => {
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, status: 'Revision Requested', oemComment: comment },
    }));
    pushEvent('claim', {
      actor: 'OEM',
      actorName: 'OEM Reviewer',
      action: 'Claim revision requested',
      comment,
    });
    pushNotif({
      targetRole: 'dealer',
      type: 'claim',
      title: 'Claim requires adjustments',
      body: `${WORKFLOW_DEALER.name} claim was returned with OEM comments`,
      referenceId: WORKFLOW_CL_ID,
    });
  }, [pushEvent, pushNotif]);

  const processPayment = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, status: 'Paid' },
    }));
    pushEvent('claim', {
      actor: 'OEM',
      actorName: 'OEM Reviewer',
      action: 'Payment processed',
    });
    pushNotif({
      targetRole: 'dealer',
      type: 'claim',
      title: 'Payment Processed',
      body: `Payment of $${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()} for ${WORKFLOW_DEALER.name} has been processed successfully.`,
      referenceId: WORKFLOW_CL_ID,
    });
  }, [pushEvent, pushNotif]);

  // ── Cycle archive + reset ─────────────────────────────────────────────────

  const archiveAndReset = useCallback(() => {
    setWorkflow(prev => {
      const newCycleIndex = prev.archivedCycles.length + 1;
      const newActiveNum  = newCycleIndex + 1;
      const padded = String(newActiveNum).padStart(3, '0');
      const newPaId = `WF-PA-${padded}`;
      const newClId = `WF-CL-${padded}`;

      const archived: ArchivedCycle = {
        cycleIndex:   newCycleIndex,
        preApproval:  { ...prev.preApproval },
        claim:        { ...prev.claim },
        archivedAt:   nowIso(),
      };

      const freshPA: WorkflowPreApprovalState = {
        id: newPaId,
        status: 'Draft',
        oemComment: null,
        history: [],
        documents: [],
        submittedAt: null,
        claimsCount: 0,
        totalAmount: 0,
        activityPeriod: '',
        claimLines: [],
        mediaType: '',
        details: '',
      };

      const freshClaim: WorkflowClaimState = {
        id: newClId,
        status: null,
        oemComment: null,
        history: [],
        linkedPreApprovalId: newPaId,
        invoiceTotal: WORKFLOW_CAMPAIGN.totalAmount,
        documents: [],
        submittedAt: null,
      };

      return {
        ...prev,
        archivedCycles: [...prev.archivedCycles, archived],
        preApproval:    freshPA,
        claim:          freshClaim,
      };
    });
  }, []);

  const updatePreApprovalData = useCallback((
    totalAmount: number,
    activityPeriod: string,
    claimLines: ClaimLineItem[],
    mediaType: string,
    details: string,
  ) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: { ...prev.preApproval, totalAmount, activityPeriod, claimLines, mediaType, details },
    }));
  }, []);

  // ── Document management ───────────────────────────────────────────────────

  const addPreApprovalDocument = useCallback((doc: WorkflowDocument) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        documents: [...prev.preApproval.documents, doc],
      },
    }));
  }, []);

  const removePreApprovalDocument = useCallback((name: string) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        documents: prev.preApproval.documents.filter(d => d.name !== name),
      },
    }));
  }, []);

  // ── Notification read state ───────────────────────────────────────────────

  const markNotificationRead = useCallback((id: string) => {
    setWorkflow(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    }));
  }, []);

  const markAllRead = useCallback((role: 'oem' | 'dealer') => {
    setWorkflow(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.targetRole === role ? { ...n, isRead: true } : n,
      ),
    }));
  }, []);

  // ── Derived counts ────────────────────────────────────────────────────────

  const oemUnreadCount = workflow.notifications.filter(
    n => n.targetRole === 'oem' && !n.isRead,
  ).length;

  const dealerUnreadCount = workflow.notifications.filter(
    n => n.targetRole === 'dealer' && !n.isRead,
  ).length;

  return (
    <WorkflowContext.Provider
      value={{
        workflow,
        submitPreApproval,
        resubmitPreApproval,
        approvePreApproval,
        requestPreApprovalRevision,
        createClaim,
        submitClaim,
        resubmitClaim,
        approveClaimAction,
        requestClaimRevision,
        processPayment,
        archiveAndReset,
        updatePreApprovalData,
        addPreApprovalDocument,
        removePreApprovalDocument,
        markNotificationRead,
        markAllRead,
        oemUnreadCount,
        dealerUnreadCount,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWorkflow(): WorkflowContextType {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflow must be used within WorkflowProvider');
  return ctx;
}

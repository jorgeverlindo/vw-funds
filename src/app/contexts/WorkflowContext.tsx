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
import { emitSnackbar } from '../components/Snackbar';

// ─── Canonical demo data ─────────────────────────────────────────────────────

// IDs sequenciais continuando a nomenclatura MFA/MFC existente no mock data
// MFA386603 é o último PA do mock → novo começa em MFA386604
// MFC560001 é o último claim do mock → novo começa em MFC560002
export const WORKFLOW_PA_BASE = 386604;
export const WORKFLOW_CL_BASE = 560002;
export const WORKFLOW_PA_ID = `MFA${WORKFLOW_PA_BASE}`;
export const WORKFLOW_CL_ID = `MFC${WORKFLOW_CL_BASE}`;
// Portal-submitted PAs get IDs starting here — safely above the archiveAndReset range
export const WORKFLOW_PORTAL_BASE = 387000;

/** Minimal record created when a portal pre-approval is submitted */
export interface PortalSubmission {
  id: string;
  title: string;
  mediaType: string;
  initiativeType: string;
  submittedAt: string; // ISO
}

export const WORKFLOW_DEALER = {
  name: 'Volkswagen Any Town',
  code: '12345',
  city: 'Any Town',
  contact: 'Mallory Manning',
  email: 'mallory@vwanytown.com',
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
  | 'Approved'
  | 'Declined';

export type ClaimWorkflowStatus =
  | 'Draft'
  | 'Submitted'
  | 'In Review'
  | 'Revision Requested'
  | 'Resubmitted'
  | 'Approved'
  | 'Ready for Payment'
  | 'Paid'
  | 'Declined';

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
  /**
   * 'initial' = attached during the Draft phase (before first submission).
   * 'reply'   = attached after the PA/Claim was already submitted (e.g. dealer
   *              responds to an OEM revision request with proof). Reply docs are
   *              shown in the Activity timeline, not mixed with the initial docs.
   */
  phase?: 'initial' | 'reply';
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;       // ISO string
  actor: 'Dealer' | 'OEM';
  actorName: string;
  action: string;
  comment?: string;
  /** Files attached as part of this activity (reply attachments) */
  attachments?: WorkflowDocument[];
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
  user?: { name: string; initials?: string; avatarUrl?: string };
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
  title: string;
  totalAmount: number;
  activityPeriod: string;
  claimLines: ClaimLineItem[];
  mediaType: string;
  details: string;
  contactEmail: string;
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
  portalSubmissions: PortalSubmission[];
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
  declinePreApproval: (comment?: string) => void;

  // Claim actions (Dealer)
  createClaim: () => void;
  submitClaim: () => void;
  resubmitClaim: () => void;

  // Claim actions (OEM)
  approveClaimAction: (comment?: string) => void;
  requestClaimRevision: (comment: string) => void;
  declineClaimAction: (comment?: string) => void;
  processPayment: () => void;

  // Cycle management
  archiveAndReset: () => void;
  updatePreApprovalData: (
    title: string,
    totalAmount: number,
    activityPeriod: string,
    claimLines: ClaimLineItem[],
    mediaType: string,
    details: string,
    contactEmail: string,
  ) => void;

  // Document management
  addPreApprovalDocument: (doc: WorkflowDocument) => void;
  removePreApprovalDocument: (name: string) => void;
  clearPreApprovalDocuments: () => void;
  addClaimDocument: (doc: WorkflowDocument) => void;
  removeClaimDocument: (name: string) => void;

  // Dealer can reply to an OEM revision request with a comment + resubmit
  resubmitPreApprovalWithComment: (comment: string) => void;
  resubmitClaimWithComment: (comment: string) => void;

  // Portal submissions
  addPortalSubmission: (data: { title?: string; mediaType?: string; initiativeType?: string }) => void;
  /** Returns the ID that the NEXT addPortalSubmission call will generate, without consuming it. */
  peekNextPortalId: () => string;

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

let _portalIdCounter = WORKFLOW_PORTAL_BASE;
function nextPortalId() {
  return `MFA${++_portalIdCounter}`;
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
    title: 'March 2026 Digital Ad Campaign',
    totalAmount: WORKFLOW_CAMPAIGN.totalAmount,
    activityPeriod: `${WORKFLOW_CAMPAIGN.activityStartDate} – ${WORKFLOW_CAMPAIGN.activityEndDate}`,
    claimLines: Object.entries(WORKFLOW_CAMPAIGN.channelBreakdown).map(([description, amount]) => ({
      description,
      amount: String(amount),
    })),
    mediaType: WORKFLOW_CAMPAIGN.mediaType,
    details: WORKFLOW_CAMPAIGN.description,
    contactEmail: WORKFLOW_DEALER.email,
  },

  claim: {
    // Unified ID: claim uses the same ID as its parent pre-approval.
    id: WORKFLOW_PA_ID,
    status: null, // not yet created
    oemComment: null,
    history: [],
    linkedPreApprovalId: WORKFLOW_PA_ID,
    invoiceTotal: WORKFLOW_CAMPAIGN.totalAmount,
    documents: [],
    submittedAt: null,
  },

  archivedCycles: [],
  portalSubmissions: [],

  // OEM sees one unread notification from the pre-approval submission.
  notifications: [
    {
      id: 'wf-notif-001',
      targetRole: 'oem',
      type: 'pre-approval',
      title: 'New pre-approval submitted',
      body: `submitted a pre-approval for ${WORKFLOW_DEALER.name} ${WORKFLOW_DEALER.code}`,
      referenceId: WORKFLOW_PA_ID,
      isRead: false,
      createdAt: '2026-04-20T09:30:00.000Z',
      time: 'just now',
      user: { name: WORKFLOW_DEALER.contact, initials: 'MM' },
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
      body: `submitted a pre-approval for ${WORKFLOW_DEALER.name} ${WORKFLOW_DEALER.code}`,
      referenceId: workflow.preApproval.id,
      user: { name: WORKFLOW_DEALER.contact, initials: 'MM' },
    });
    emitSnackbar('Pre-approval submitted');
  }, [pushEvent, pushNotif, workflow.preApproval.id]);

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
      body: `resubmitted the pre-approval for ${WORKFLOW_DEALER.name} ${WORKFLOW_DEALER.code}`,
      referenceId: workflow.preApproval.id,
      user: { name: WORKFLOW_DEALER.contact, initials: 'MM' },
    });
    emitSnackbar('Pre-approval resubmitted');
  }, [pushEvent, pushNotif, workflow.preApproval.id]);

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
      body: `approved your pre-approval for ${WORKFLOW_DEALER.name}. You may now create a claim.`,
      referenceId: workflow.preApproval.id,
      user: { name: 'OEM Reviewer', initials: 'OR' },
    });
    emitSnackbar('Pre-approval approved');
  }, [pushEvent, pushNotif, workflow.preApproval.id]);

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
      body: `requested revisions on your pre-approval for ${WORKFLOW_DEALER.name}`,
      referenceId: workflow.preApproval.id,
      user: { name: 'OEM Reviewer', initials: 'OR' },
    });
    emitSnackbar('Revision request sent');
  }, [pushEvent, pushNotif, workflow.preApproval.id]);

  const declinePreApproval = useCallback((comment?: string) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        status: 'Declined',
        oemComment: comment ?? '',
      },
    }));
    pushEvent('preApproval', {
      actor: 'OEM',
      actorName: 'OEM Reviewer',
      action: 'Pre-approval declined',
      comment,
    });
    pushNotif({
      targetRole: 'dealer',
      type: 'pre-approval',
      title: 'Pre-Approval declined',
      body: `declined your pre-approval for ${WORKFLOW_DEALER.name}`,
      referenceId: workflow.preApproval.id,
      user: { name: 'OEM Reviewer', initials: 'OR' },
    });
    emitSnackbar('Pre-approval declined');
  }, [pushEvent, pushNotif, workflow.preApproval.id]);

  // ── Claim actions ─────────────────────────────────────────────────────────

  const createClaim = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: { ...prev.preApproval, claimsCount: 1 },
      claim: {
        ...prev.claim,
        // Unified ID: claim inherits the same ID as the pre-approval so the
        // same reference number flows through the entire PA → Claim → Payment lifecycle.
        id: prev.preApproval.id,
        status: 'Draft',
        invoiceTotal: prev.preApproval.totalAmount,
        linkedPreApprovalId: prev.preApproval.id,
      },
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
      body: `submitted a claim for $${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()} — ${WORKFLOW_DEALER.name} ${WORKFLOW_DEALER.code}`,
      referenceId: workflow.claim.id,
      user: { name: WORKFLOW_DEALER.contact, initials: 'MM' },
    });
    emitSnackbar('Claim submitted');
  }, [pushEvent, pushNotif, workflow.claim.id]);

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
      body: `resubmitted the claim for ${WORKFLOW_DEALER.name} ${WORKFLOW_DEALER.code}`,
      referenceId: workflow.claim.id,
      user: { name: WORKFLOW_DEALER.contact, initials: 'MM' },
    });
    emitSnackbar('Claim resubmitted');
  }, [pushEvent, pushNotif, workflow.claim.id]);

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
      body: `approved your claim of $${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()} for ${WORKFLOW_DEALER.name}.`,
      referenceId: workflow.claim.id,
      user: { name: 'OEM Reviewer', initials: 'OR' },
    });
    emitSnackbar('Claim approved');
  }, [pushEvent, pushNotif, workflow.claim.id]);

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
      body: `requested revisions on your claim for ${WORKFLOW_DEALER.name}`,
      referenceId: workflow.claim.id,
      user: { name: 'OEM Reviewer', initials: 'OR' },
    });
    emitSnackbar('Revision request sent');
  }, [pushEvent, pushNotif, workflow.claim.id]);

  const declineClaimAction = useCallback((comment?: string) => {
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, status: 'Declined', oemComment: comment ?? '' },
    }));
    pushEvent('claim', {
      actor: 'OEM',
      actorName: 'OEM Reviewer',
      action: 'Claim declined',
      comment,
    });
    pushNotif({
      targetRole: 'dealer',
      type: 'claim',
      title: 'Claim declined',
      body: `declined your claim for ${WORKFLOW_DEALER.name}`,
      referenceId: workflow.claim.id,
      user: { name: 'OEM Reviewer', initials: 'OR' },
    });
    emitSnackbar('Claim declined');
  }, [pushEvent, pushNotif, workflow.claim.id]);

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
      body: `processed payment of $${WORKFLOW_CAMPAIGN.totalAmount.toLocaleString()} for ${WORKFLOW_DEALER.name}.`,
      referenceId: workflow.claim.id,
      user: { name: 'OEM Reviewer', initials: 'OR' },
    });
    emitSnackbar('Payment processed');
  }, [pushEvent, pushNotif, workflow.claim.id]);

  // ── Cycle archive + reset ─────────────────────────────────────────────────

  const archiveAndReset = useCallback(() => {
    setWorkflow(prev => {
      const newCycleIndex = prev.archivedCycles.length + 1;
      const newPaId = `MFA${WORKFLOW_PA_BASE + newCycleIndex}`;
      // Claim shares the same ID as its parent pre-approval (unified ID lifecycle)

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
        title: '',
        totalAmount: 0,
        activityPeriod: '',
        claimLines: [],
        mediaType: '',
        details: '',
        contactEmail: '',
      };

      const freshClaim: WorkflowClaimState = {
        // Unified ID: claim uses the same ID as the pre-approval for the new cycle.
        id: newPaId,
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
    title: string,
    totalAmount: number,
    activityPeriod: string,
    claimLines: ClaimLineItem[],
    mediaType: string,
    details: string,
    contactEmail: string,
  ) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: { ...prev.preApproval, title, totalAmount, activityPeriod, claimLines, mediaType, details, contactEmail },
    }));
  }, []);

  // ── Document management ───────────────────────────────────────────────────

  const addPreApprovalDocument = useCallback((doc: WorkflowDocument) => {
    // Documents added after the initial Draft phase are "reply" attachments.
    // They are stamped with phase='reply' and also appear in the activity timeline.
    const isReply = workflow.preApproval.status !== 'Draft';
    const tagged: WorkflowDocument = { ...doc, phase: isReply ? 'reply' : 'initial' };
    setWorkflow(prev => {
      // Deduplicate by URL — prevents double-adds from StrictMode or fast re-renders
      if (prev.preApproval.documents.some(d => d.url === doc.url)) return prev;
      return {
        ...prev,
        preApproval: {
          ...prev.preApproval,
          documents: [...prev.preApproval.documents, tagged],
        },
      };
    });
    if (isReply) {
      pushEvent('preApproval', {
        actor: 'Dealer',
        actorName: WORKFLOW_DEALER.contact,
        action: 'Document attached',
        attachments: [tagged],
      });
    }
  }, [pushEvent, workflow.preApproval.status]);

  const removePreApprovalDocument = useCallback((name: string) => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: {
        ...prev.preApproval,
        documents: prev.preApproval.documents.filter(d => d.name !== name),
      },
    }));
  }, []);

  const clearPreApprovalDocuments = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      preApproval: { ...prev.preApproval, documents: [] },
    }));
  }, []);

  const addClaimDocument = useCallback((doc: WorkflowDocument) => {
    const isReply = workflow.claim.status !== 'Draft';
    const tagged: WorkflowDocument = { ...doc, phase: isReply ? 'reply' : 'initial' };
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, documents: [...prev.claim.documents, tagged] },
    }));
    if (isReply) {
      pushEvent('claim', {
        actor: 'Dealer',
        actorName: WORKFLOW_DEALER.contact,
        action: 'Document attached',
        attachments: [tagged],
      });
    }
  }, [pushEvent, workflow.claim.status]);

  const removeClaimDocument = useCallback((name: string) => {
    setWorkflow(prev => ({
      ...prev,
      claim: {
        ...prev.claim,
        documents: prev.claim.documents.filter(d => d.name !== name),
      },
    }));
  }, []);

  // ── Dealer revision replies ───────────────────────────────────────────────
  // The dealer can answer an OEM adjustment request with their own comment,
  // which is appended to the history alongside the resubmit action. This lets
  // the OEM see the dealer's explanation in the timeline, mirroring how the
  // OEM's own comments are captured on approve/reject.

  const resubmitPreApprovalWithComment = useCallback((comment: string) => {
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
      comment: comment.trim() || undefined,
    });
    pushNotif({
      targetRole: 'oem',
      type: 'pre-approval',
      title: 'Pre-approval resubmitted',
      body: `resubmitted the pre-approval for ${WORKFLOW_DEALER.name} ${WORKFLOW_DEALER.code}`,
      referenceId: workflow.preApproval.id,
      user: { name: WORKFLOW_DEALER.contact, initials: 'MM' },
    });
    emitSnackbar('Pre-approval resubmitted');
  }, [pushEvent, pushNotif, workflow.preApproval.id]);

  const resubmitClaimWithComment = useCallback((comment: string) => {
    setWorkflow(prev => ({
      ...prev,
      claim: { ...prev.claim, status: 'Resubmitted', oemComment: null },
    }));
    pushEvent('claim', {
      actor: 'Dealer',
      actorName: WORKFLOW_DEALER.contact,
      action: 'Claim resubmitted after revision',
      comment: comment.trim() || undefined,
    });
    pushNotif({
      targetRole: 'oem',
      type: 'claim',
      title: 'Claim resubmitted',
      body: `resubmitted the claim for ${WORKFLOW_DEALER.name} ${WORKFLOW_DEALER.code}`,
      referenceId: workflow.claim.id,
      user: { name: WORKFLOW_DEALER.contact, initials: 'MM' },
    });
    emitSnackbar('Claim resubmitted');
  }, [pushEvent, pushNotif, workflow.claim.id]);

  // ── Portal submissions ────────────────────────────────────────────────────

  /** Peek the next portal ID without incrementing the counter. */
  const peekNextPortalId = useCallback(() => `MFA${_portalIdCounter + 1}`, []);

  const addPortalSubmission = useCallback((data: { title?: string; mediaType?: string; initiativeType?: string }) => {
    const sub: PortalSubmission = {
      id: nextPortalId(),
      title: data.title ?? '',
      mediaType: data.mediaType ?? 'Digital',
      initiativeType: data.initiativeType ?? 'DMP - Media Costs',
      submittedAt: nowIso(),
    };
    setWorkflow(prev => ({
      ...prev,
      portalSubmissions: [sub, ...prev.portalSubmissions],
    }));
    emitSnackbar('Pre-approval submitted');
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
        declinePreApproval,
        createClaim,
        submitClaim,
        resubmitClaim,
        approveClaimAction,
        requestClaimRevision,
        declineClaimAction,
        processPayment,
        archiveAndReset,
        updatePreApprovalData,
        addPreApprovalDocument,
        removePreApprovalDocument,
        clearPreApprovalDocuments,
        addClaimDocument,
        removeClaimDocument,
        resubmitPreApprovalWithComment,
        resubmitClaimWithComment,
        addPortalSubmission,
        peekNextPortalId,
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

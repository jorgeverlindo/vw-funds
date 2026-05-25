/**
 * Resolves a pre-approval ID to the full PreApproval object.
 *
 * Resolution order:
 *  1. Active workflow PA (may have been edited in-flight)
 *  2. Archived workflow cycles (after archiveAndReset)
 *  3. Portal submissions (submitted via the portal tab)
 *  4. Static mock data (demo rows without a workflow counterpart)
 */

import { useMemo } from 'react';
import { useWorkflow, WORKFLOW_DEALER, WORKFLOW_CAMPAIGN } from '../contexts/WorkflowContext';
import { MOCK_DATA as PRE_APPROVALS_MOCK_DATA } from '../components/FundsPreApprovalsContent';
import type { PreApproval } from '../components/FundsPreApprovalsContent';

export function useSelectedPreApproval(selectedId: string | null): PreApproval | null | undefined {
  const { workflow } = useWorkflow();
  const { preApproval, archivedCycles, portalSubmissions } = workflow;

  return useMemo((): PreApproval | null | undefined => {
    if (!selectedId) return null;

    // ── Active workflow PA ────────────────────────────────────────────────────
    if (selectedId === preApproval.id) {
      const wfPA = preApproval;
      return {
        id: wfPA.id,
        title: wfPA.title,
        date: new Date(),
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        status: (() => {
          switch (wfPA.status) {
            case 'Approved':           return 'Approved';
            case 'Revision Requested': return 'Revision Requested';
            case 'In Review':
            case 'Resubmitted':        return 'In Review';
            default:                   return 'Pending';
          }
        })() as PreApproval['status'],
        timeInPreApproval: 1,
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: '' },
        mediaType: WORKFLOW_CAMPAIGN.mediaType,
        details: wfPA.details || 'Digital Ad Campaign',
        lastUpdated: new Date(),
        submittedAt: wfPA.submittedAt ? new Date(wfPA.submittedAt) : new Date('2026-04-20'),
        initiativeType: WORKFLOW_CAMPAIGN.initiativeType,
        claimsCount: wfPA.claimsCount,
        contactEmail: wfPA.contactEmail || WORKFLOW_DEALER.email,
        description: wfPA.details || WORKFLOW_CAMPAIGN.description,
        documents: wfPA.documents,
      };
    }

    // ── Archived workflow cycles ──────────────────────────────────────────────
    const archived = archivedCycles.find(c => c.preApproval.id === selectedId);
    if (archived) {
      const pa = archived.preApproval;
      return {
        id: pa.id,
        title: pa.title,
        date: new Date(archived.archivedAt),
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        status: (() => {
          switch (pa.status) {
            case 'Approved':           return 'Approved';
            case 'Revision Requested': return 'Revision Requested';
            case 'In Review':
            case 'Resubmitted':        return 'In Review';
            default:                   return 'Pending';
          }
        })() as PreApproval['status'],
        timeInPreApproval: 0,
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: '' },
        mediaType: WORKFLOW_CAMPAIGN.mediaType,
        details: pa.details || 'Digital Ad Campaign',
        lastUpdated: new Date(archived.archivedAt),
        submittedAt: pa.submittedAt ? new Date(pa.submittedAt) : new Date(archived.archivedAt),
        initiativeType: WORKFLOW_CAMPAIGN.initiativeType,
        claimsCount: pa.claimsCount,
        contactEmail: pa.contactEmail || WORKFLOW_DEALER.email,
        description: pa.details || WORKFLOW_CAMPAIGN.description,
        documents: pa.documents,
      };
    }

    // ── Portal submissions ────────────────────────────────────────────────────
    const portalSub = portalSubmissions.find(s => s.id === selectedId);
    if (portalSub) {
      return {
        id: portalSub.id,
        title: portalSub.title || undefined,
        date: new Date(portalSub.submittedAt),
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        status: (portalSub.status ?? 'Pending') as PreApproval['status'],
        timeInPreApproval: 0,
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: '' },
        mediaType: portalSub.mediaType || WORKFLOW_CAMPAIGN.mediaType,
        details: portalSub.title || 'Portal Pre-Approval',
        lastUpdated: new Date(portalSub.submittedAt),
        submittedAt: new Date(portalSub.submittedAt),
        initiativeType: portalSub.initiativeType || WORKFLOW_CAMPAIGN.initiativeType,
        claimsCount: 0,
        contactEmail: WORKFLOW_DEALER.email,
        description: portalSub.title || 'Submitted via portal',
        documents: [],
      };
    }

    // ── Static mock data ──────────────────────────────────────────────────────
    return PRE_APPROVALS_MOCK_DATA.find(i => i.id === selectedId);
  }, [selectedId, workflow]);
}

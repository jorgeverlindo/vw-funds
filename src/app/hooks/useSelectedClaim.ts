/**
 * Resolves a claim ID to the full Claim object.
 *
 * Resolution order:
 *  1. Active workflow claim
 *  2. Archived workflow cycles (after archiveAndReset)
 *  3. Static mock data
 */

import { useMemo } from 'react';
import { useWorkflow, WORKFLOW_DEALER, WORKFLOW_CAMPAIGN } from '../contexts/WorkflowContext';
import { CLAIMS_MOCK_DATA } from '../components/FundsClaimsContent';
import type { Claim } from '../components/ClaimsPanel';
const imgMalloryManning = 'https://res.cloudinary.com/dvq75cqna/image/upload/v1780071138/vw-funds/f0494d5017440bdc302141d9ab01c7c81e4a339a.png';

export function useSelectedClaim(selectedId: string | null): Claim | null | undefined {
  const { workflow } = useWorkflow();
  const { claim, archivedCycles } = workflow;

  return useMemo((): Claim | null | undefined => {
    if (!selectedId) return null;

    // ── Active workflow claim ─────────────────────────────────────────────────
    if (selectedId === claim.id) {
      const wfCL = claim;
      return {
        id: wfCL.id,
        uid: wfCL.id,
        date: wfCL.submittedAt ? new Date(wfCL.submittedAt) : new Date(),
        amount: WORKFLOW_CAMPAIGN.totalAmount,
        status: (wfCL.status ?? 'Draft') as Claim['status'],
        timeInClaim: 0,
        timeInPayment: 0,
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        fund: 'VW Coop Fund 2026',
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: imgMalloryManning },
        type: WORKFLOW_CAMPAIGN.initiativeType,
        lastUpdated: new Date().toLocaleDateString(),
        details: WORKFLOW_CAMPAIGN.description,
      };
    }

    // ── Archived workflow claims ──────────────────────────────────────────────
    const archivedCl = archivedCycles.find(c => c.claim.id === selectedId);
    if (archivedCl) {
      const cl = archivedCl.claim;
      return {
        id: cl.id,
        uid: cl.id,
        date: cl.submittedAt ? new Date(cl.submittedAt) : new Date(archivedCl.archivedAt),
        amount: WORKFLOW_CAMPAIGN.totalAmount,
        status: (cl.status ?? 'Paid') as Claim['status'],
        timeInClaim: 0,
        timeInPayment: 0,
        dealershipCode: WORKFLOW_DEALER.code,
        dealershipName: WORKFLOW_DEALER.name,
        dealershipCity: WORKFLOW_DEALER.city,
        fund: 'VW Coop Fund 2026',
        submittedBy: { name: WORKFLOW_DEALER.contact, avatarUrl: imgMalloryManning },
        type: WORKFLOW_CAMPAIGN.initiativeType,
        lastUpdated: new Date(archivedCl.archivedAt).toLocaleDateString(),
        details: WORKFLOW_CAMPAIGN.description,
      };
    }

    // ── Static mock data ──────────────────────────────────────────────────────
    return CLAIMS_MOCK_DATA.find(i => i.id === selectedId);
  }, [selectedId, workflow]);
}

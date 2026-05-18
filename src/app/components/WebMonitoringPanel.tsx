// WebMonitoringPanel — routing shell that dispatches to view or create mode.
// [FV] decomposed from a monolithic file into 3 focused components.

import { WCMItem } from './WebMonitoringContent';
import { WebMonitoringViewPanel } from './WebMonitoringViewPanel';
import { WebMonitoringCreateForm } from './WebMonitoringCreateForm';
import type { WCMComment } from '../../data/types/compliance';

// [FV] minimal shape needed by the panel (full type lives in ComplianceContext)
export interface PanelCaseSolution {
  screenshotDataUrl: string;
  comment: string;
  submittedBy: string;
  submittedAtISO: string;
  solved?: boolean;
  solvedAtISO?: string;
}

interface WebMonitoringPanelProps {
  item?: WCMItem; // [FV] optional in create mode
  onClose: () => void;
  onOpenModal?: () => void; // [FV] only used in view mode
  // [FV] início — create mode (OEM Add Infraction flow)
  mode?: 'view' | 'create';
  onSave?: (infraction: WCMItem) => void;
  // [FV] dealer-vs-OEM affects the view-mode footer + adds the Issue Solution section
  userType?: 'dealer' | 'dealer-singular' | 'dealer-emich' | 'oem';
  // Solution flow (dealer submits, OEM marks as solved)
  solution?: PanelCaseSolution;
  onSubmitSolution?: (draft: { screenshotDataUrl: string; comment: string }) => void;
  onMarkSolved?: () => void;
  // OEM accepts a dealer-reported infraction (Pending → Open)
  onAcceptReport?: () => void;
  // [FV] current dealer identity (used by the create form for dealer-report flow)
  currentDealerName?: string;
  currentReporterName?: string;
  // Discussion thread
  wcmComments?: WCMComment[];
  onAddComment?: (text: string) => void;
  currentUserName?: string;
  // [FV] fim
}

export function WebMonitoringPanel({
  item, onClose, onOpenModal, mode = 'view', onSave, userType = 'oem',
  solution, onSubmitSolution, onMarkSolved, onAcceptReport,
  currentDealerName, currentReporterName,
  wcmComments, onAddComment, currentUserName,
}: WebMonitoringPanelProps) {
  // [FV] route to create-mode form (OEM Add Infraction or dealer-side report)
  if (mode === 'create') {
    return (
      <WebMonitoringCreateForm
        onClose={onClose}
        onSave={onSave}
        userType={userType}
        currentDealerName={currentDealerName}
        currentReporterName={currentReporterName}
      />
    );
  }

  if (!item) {
    // view mode requires an item; nothing to render otherwise
    return null;
  }

  return (
    <WebMonitoringViewPanel
      item={item}
      onClose={onClose}
      onOpenModal={onOpenModal}
      userType={userType}
      solution={solution}
      onSubmitSolution={onSubmitSolution}
      onMarkSolved={onMarkSolved}
      onAcceptReport={onAcceptReport}
      currentDealerName={currentDealerName}
      wcmComments={wcmComments}
      onAddComment={onAddComment}
      currentUserName={currentUserName}
    />
  );
}

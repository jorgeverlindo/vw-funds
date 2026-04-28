import { Eye } from 'lucide-react';
import { WorkflowEvent, WorkflowDocument } from '../contexts/WorkflowContext';

function isRevisionEvent(evt: WorkflowEvent): boolean {
  return evt.action.toLowerCase().includes('revision') || evt.action.toLowerCase().includes('requested');
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
}

interface WorkflowHistoryTimelineProps {
  history: WorkflowEvent[];
  /** Called when user clicks the eye icon on an inline attachment chip */
  onPreviewDoc?: (doc: WorkflowDocument) => void;
}

export function WorkflowHistoryTimeline({ history, onPreviewDoc }: WorkflowHistoryTimelineProps) {
  if (history.length === 0) return null;

  return (
    <section>
      <h3 className="text-[#1f1d25] text-[15px] font-medium mb-4">Activity</h3>
      <div className="relative">
        {history.map((evt, i) => (
          <div key={evt.id} className="flex gap-3">
            {/* Dot + connector line */}
            <div className="flex flex-col items-center">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-[5px]"
                style={{
                  backgroundColor: isRevisionEvent(evt) ? '#E17613' : evt.actor === 'OEM' ? '#473BAB' : '#1f1d25',
                }}
              />
              {i < history.length - 1 && (
                <div className="w-px flex-1 bg-[#E0E0E0] my-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-medium text-[#1f1d25]">
                  {evt.actorName}
                </span>
                <span className="text-[11px] text-[#9C99A9] whitespace-nowrap">
                  {formatTimestamp(evt.timestamp)}
                </span>
              </div>
              <p className="text-[13px] text-[#686576] mt-0.5">{evt.action}</p>

              {evt.comment && (
                <p
                  className="text-[13px] mt-1.5 rounded-lg px-3 py-2 border leading-relaxed"
                  style={isRevisionEvent(evt)
                    ? { background: 'rgba(225,118,19,0.06)', borderColor: 'rgba(225,118,19,0.3)', color: '#1f1d25' }
                    : { background: '#F9FAFA', borderColor: '#E0E0E0', color: '#1f1d25' }
                  }
                >
                  &ldquo;{evt.comment}&rdquo;
                </p>
              )}

              {/* Inline attachment chips — reply docs attached with this event */}
              {evt.attachments && evt.attachments.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {evt.attachments.map((doc, di) => (
                    <div
                      key={di}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E0E0E0] bg-white max-w-xs"
                    >
                      {/* Type badge */}
                      <div className="w-8 h-9 bg-[#F5F5F5] border border-[#E0E0E0] rounded flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-[#D2323F] leading-tight">
                          {doc.type.toUpperCase().slice(0, 4)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1f1d25] truncate">{doc.name}</p>
                        <p className="text-[10px] text-[#9C99A9] uppercase tracking-wide">{doc.type.toUpperCase()} · {doc.size}</p>
                      </div>
                      {onPreviewDoc && doc.url && (
                        <button
                          onClick={() => onPreviewDoc(doc)}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-[#686576] hover:text-[var(--brand-accent)] transition-colors cursor-pointer shrink-0"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

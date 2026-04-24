import { WorkflowEvent } from '../contexts/WorkflowContext';

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
}

export function WorkflowHistoryTimeline({ history }: WorkflowHistoryTimelineProps) {
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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

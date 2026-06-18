import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight, Check, CheckCircle2, ClipboardCheck, PartyPopper, Download } from "lucide-react";
import { useUsabilityTesting, USABILITY_FLOWS } from "../contexts/UsabilityTestingContext";

const TOTAL_FLOWS = USABILITY_FLOWS.length;

function renderTaskText(
  text: string,
  boldText?: string,
  downloadButton?: { label: string; href: string; inline?: boolean },
) {
  if (!boldText) return <>{text}</>;
  const idx = text.indexOf(boldText);
  if (idx < 0) return <>{text}</>;

  const boldPart = downloadButton?.inline ? (
    <a
      href={downloadButton.href}
      download
      onClick={e => e.stopPropagation()}
      className="font-semibold underline decoration-dotted underline-offset-2 cursor-pointer"
      style={{ color: "var(--brand-accent)" }}
    >
      {boldText}
    </a>
  ) : (
    <strong>{boldText}</strong>
  );

  return (
    <>
      {text.slice(0, idx)}
      {boldPart}
      {text.slice(idx + boldText.length)}
    </>
  );
}

export function UsabilityTestingModal() {
  const {
    modalOpen,
    currentFlowIndex,
    tasksDone,
    completedFlow,
    closeModal,
    setFlowIndex,
    toggleTask,
    dismissCompletion,
  } = useUsabilityTesting();

  const flow = USABILITY_FLOWS[currentFlowIndex];
  const canGoPrev = currentFlowIndex > 0;
  const canGoNext = currentFlowIndex < TOTAL_FLOWS - 1;
  const globalBadgeOffset = USABILITY_FLOWS.slice(0, currentFlowIndex).reduce((sum, f) => sum + f.tasks.length, 0);

  return (
    <>
      {/* ── Main Testing Modal ─────────────────────────────────────────────── */}
      <Dialog.Root open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200" />

          <Dialog.Content
            className="fixed left-1/2 top-[calc(50vh-190px)] z-[201] w-[380px] -translate-x-1/2 overflow-hidden rounded-[24px] bg-white shadow-[0px_6px_30px_5px_rgba(0,0,0,0.12),0px_16px_24px_2px_rgba(0,0,0,0.14),0px_8px_10px_-5px_rgba(0,0,0,0.2)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200 focus:outline-none"
            aria-describedby={undefined}
          >
            {/* ── Header ── */}
            <Dialog.Title asChild>
              <div
                className="relative px-4 pt-4 pb-3"
                style={{ background: "var(--brand-accent)" }}
              >
                {/* Subtitle row */}
                <div className="flex items-center gap-1 mb-[2px]">
                  <ClipboardCheck
                    className="shrink-0 text-white"
                    style={{ width: 16, height: 16, strokeWidth: 1.5 }}
                  />
                  <span className="text-[12px] font-normal text-white leading-[1.43] tracking-[0.17px]">
                    Usability Testing – Flow {currentFlowIndex + 1} of {TOTAL_FLOWS}
                  </span>
                </div>

                {/* Flow title */}
                <p className="text-[16px] font-normal text-white leading-[1.75] tracking-[0.15px] mb-3">
                  {flow.title}
                </p>

                {/* Progress bars */}
                <div className="flex items-center gap-[10px]">
                  {Array.from({ length: TOTAL_FLOWS }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-[3px] rounded-full transition-colors duration-300"
                      style={{
                        background:
                          i === currentFlowIndex
                            ? "rgba(255,255,255,1)"
                            : "var(--brand-light, #8c86fc)",
                      }}
                    />
                  ))}
                </div>

                {/* Close */}
                <Dialog.Close asChild>
                  <button
                    className="absolute right-2 top-2 flex items-center justify-center rounded-full p-[5px] text-white transition-colors hover:bg-white/15"
                    aria-label="Close"
                  >
                    <X style={{ width: 18, height: 18, strokeWidth: 1.8 }} />
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Title>

            {/* ── Content ── */}
            <div className="px-4 pt-3 pb-6 flex flex-col gap-5">
              {/* Green banner */}
              <div
                className="flex items-center gap-2 rounded-[8px] border border-[rgba(0,0,0,0.12)] p-2"
                style={{ background: "#edf7ed" }}
              >
                <CheckCircle2
                  className="shrink-0"
                  style={{ width: 20, height: 20, color: "#1e4620", strokeWidth: 1.8 }}
                />
                <p className="text-[12px] font-medium leading-5 tracking-[0.14px]" style={{ color: "#1e4620" }}>
                  We'll let you know when the task is complete
                </p>
              </div>

              {/* Tasks */}
              {flow.tasks.map((task, i) => {
                const done = tasksDone[currentFlowIndex]?.[i] ?? false;
                const badge = task.badgeNumber ?? (globalBadgeOffset + i + 1);
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-full text-[10px] font-medium text-white leading-[14px]"
                      style={{ width: 18, height: 18, background: "var(--brand-accent)", marginTop: 1 }}
                    >
                      {badge}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-[12px] font-normal leading-[1.43] tracking-[0.17px]"
                        style={{ color: "var(--ink)" }}
                      >
                        {renderTaskText(task.text, task.boldText, task.downloadButton)}
                      </p>
                      {task.bullets && (
                        <ul className="mt-1 ml-1 flex flex-col gap-[2px]">
                          {task.bullets.map((item, j) => (
                            <li key={j} className="flex items-start gap-1 text-[12px]" style={{ color: "var(--ink)" }}>
                              <span className="mt-[3px] shrink-0">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {task.downloadButton && !task.downloadButton.inline && (
                        <a
                          href={task.downloadButton.href}
                          download
                          onClick={e => e.stopPropagation()}
                          className="mt-[6px] inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full border transition-colors hover:bg-[rgba(71,59,171,0.06)] cursor-pointer"
                          style={{ color: "var(--brand-accent)", borderColor: "rgba(71,59,171,0.3)", fontSize: 11, fontWeight: 500, textDecoration: "none" }}
                        >
                          <Download style={{ width: 12, height: 12, strokeWidth: 2 }} />
                          {task.downloadButton.label}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => toggleTask(currentFlowIndex, i)}
                      className="shrink-0 flex items-center justify-center size-6 rounded-full transition-colors hover:bg-[rgba(71,59,171,0.06)]"
                      aria-label={done ? "Mark incomplete" : "Mark complete"}
                    >
                      <Check
                        style={{
                          width: 14,
                          height: 14,
                          strokeWidth: 2.5,
                          color: "var(--ink)",
                          opacity: done ? 1 : 0,
                          transition: "opacity 0.2s",
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-4 pb-4">
              {/* Nav arrows */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => canGoPrev && setFlowIndex(currentFlowIndex - 1)}
                  disabled={!canGoPrev}
                  className="flex items-center justify-center rounded-full p-1 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{ color: "var(--brand-accent)" }}
                  aria-label="Previous flow"
                >
                  <ChevronLeft style={{ width: 20, height: 20, strokeWidth: 2 }} />
                </button>
                <button
                  onClick={() => canGoNext && setFlowIndex(currentFlowIndex + 1)}
                  disabled={!canGoNext}
                  className="flex items-center justify-center rounded-full p-1 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{ color: "var(--brand-accent)" }}
                  aria-label="Next flow"
                >
                  <ChevronRight style={{ width: 20, height: 20, strokeWidth: 2 }} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={closeModal}
                  className="px-2 py-[6px] rounded-full text-[14px] font-medium leading-6 tracking-[0.4px] capitalize transition-colors hover:bg-[rgba(71,59,171,0.08)]"
                  style={{ color: "var(--brand-accent)" }}
                >
                  Cancel
                </button>
                {flow.hasStartButton && (
                  <button
                    onClick={closeModal}
                    className="px-4 py-[6px] rounded-full text-[14px] font-medium leading-6 tracking-[0.4px] capitalize text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--brand-accent)" }}
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Flow Completion Mini-Modal ─────────────────────────────────────── */}
      <Dialog.Root
        open={completedFlow !== null}
        onOpenChange={(v) => !v && dismissCompletion()}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[210] bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200" />

          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[211] w-[320px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.18)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200 focus:outline-none"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">
              Flow {completedFlow !== null ? completedFlow + 1 : ""} Complete
            </Dialog.Title>

            <div className="flex flex-col items-center px-6 pt-6 pb-5 text-center">
              {/* Icon */}
              <div
                className="flex items-center justify-center rounded-full mb-3"
                style={{ width: 52, height: 52, background: "rgba(71,59,171,0.08)" }}
              >
                <PartyPopper
                  style={{ width: 26, height: 26, color: "var(--brand-accent)", strokeWidth: 1.8 }}
                />
              </div>

              {/* Headline */}
              <p className="text-[18px] font-semibold leading-[1.4] tracking-[0.15px] mb-1" style={{ color: "var(--ink)" }}>
                Flow {completedFlow !== null ? completedFlow + 1 : ""} Complete!
              </p>

              {/* Sub-text */}
              <p className="text-[13px] font-normal leading-[1.5] tracking-[0.15px] mb-5" style={{ color: "rgba(31,29,37,0.55)" }}>
                {completedFlow !== null && completedFlow < TOTAL_FLOWS - 1
                  ? `Great job! You're ready for Flow ${completedFlow + 2}.`
                  : "You've completed all flows. Thanks for testing!"}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={dismissCompletion}
                  className="flex-1 py-[8px] rounded-full text-[14px] font-medium leading-6 tracking-[0.4px] border transition-colors hover:bg-[rgba(71,59,171,0.06)]"
                  style={{ color: "var(--brand-accent)", borderColor: "rgba(71,59,171,0.3)" }}
                >
                  Close
                </button>
                {completedFlow !== null && completedFlow < TOTAL_FLOWS - 1 && (
                  <button
                    onClick={() => {
                      setFlowIndex(completedFlow + 1);
                      dismissCompletion();
                    }}
                    className="flex-1 py-[8px] rounded-full text-[14px] font-medium leading-6 tracking-[0.4px] text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--brand-accent)" }}
                  >
                    Next Flow
                  </button>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

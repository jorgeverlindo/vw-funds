import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ─── Flow data ────────────────────────────────────────────────────────────────

export interface UsabilityTask {
  text: string;
  /** Substring of text to display in bold */
  boldText?: string;
  /** Bullet points rendered below the main text */
  bullets?: string[];
  /** App event that auto-completes this task (empty string = manual only) */
  completionEvent: string;
  /** Override the global sequential badge number displayed on this task */
  badgeNumber?: number;
  /**
   * File download button shown below the task text.
   * Set inline:true to render the boldText substring itself as a download link
   * (styled in brand-accent) instead of a separate chip.
   */
  downloadButton?: { label: string; href: string; inline?: boolean };
}

export interface UsabilityFlow {
  title: string;
  hasStartButton: boolean;
  tasks: UsabilityTask[];
}

export const USABILITY_FLOWS: UsabilityFlow[] = [
  {
    title: "Agent creates a project",
    hasStartButton: true,
    tasks: [
      {
        text: "You're on the Project's starting page, and you need to create a new project from scratch for Honda using the AI agent. Where would you go to start the task?",
        boldText: "create a new project from scratch for Honda using the AI agent.",
        completionEvent: "agent_pane_opened",
      },
      {
        text: "Set up",
        bullets: ["Brand - Honda", "Starting Today and ending July 18th", "Platform Facebook and Website"],
        completionEvent: "project_pipeline_complete",
      },
      {
        text: "Now how would you get back to projects page?",
        completionEvent: "navigate_to_projects",
      },
    ],
  },
  {
    title: "Agent creates a project",
    hasStartButton: false,
    tasks: [
      {
        text: "Now you want to use the provided background, and create a full project for Honda, using that background for the templates. How would you do it?",
        boldText: "provided background",
        completionEvent: "assets_generated",
        downloadButton: { label: "Download Background", href: "/test-assets/honda_dealer_background.jpg", inline: true },
      },
    ],
  },
  {
    title: "Agent creates a project",
    hasStartButton: false,
    tasks: [
      {
        text: "Now, using the agent, find how to create a automatic project, where the agent will pick up offers and templates for you.",
        boldText: "automatic project, where the agent will pick up offers and templates for you.",
        completionEvent: "automatic_project_created",
        badgeNumber: 5,
      },
      {
        text: "Pick whatever Goals at the beginning",
        completionEvent: "",
        badgeNumber: 6,
      },
      {
        text: "Which steps required your decisions?",
        completionEvent: "",
        badgeNumber: 6,
      },
      {
        text: "Now you want to notify Luke by Email, how would you do it?",
        completionEvent: "email_notification_sent",
        badgeNumber: 7,
      },
    ],
  },
  {
    title: "Agent creates a project",
    hasStartButton: true,
    tasks: [
      {
        text: "Let's imagine you received some offers from the client. Use the offers below to create a new project with them.",
        boldText: "received some offers from the client.",
        completionEvent: "assets_generated",
        badgeNumber: 8,
        downloadButton: { label: "Download Offer Sheet", href: "/test-assets/Honda_Offers_User_Testing.xlsx" },
      },
    ],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface UsabilityTestingContextValue {
  modalOpen: boolean;
  currentFlowIndex: number;
  tasksDone: boolean[][];
  /** Index of the flow that just had all tasks completed — show celebration modal */
  completedFlow: number | null;
  openModal: () => void;
  closeModal: () => void;
  setFlowIndex: (i: number) => void;
  toggleTask: (flowIndex: number, taskIndex: number) => void;
  /** Fire an app event; auto-completes any task with matching completionEvent */
  triggerEvent: (eventId: string) => void;
  dismissCompletion: () => void;
}

const Ctx = createContext<UsabilityTestingContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UsabilityTestingProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFlowIndex, setCurrentFlowIndex] = useState(0);
  const [tasksDone, setTasksDone] = useState<boolean[][]>(() =>
    USABILITY_FLOWS.map((f) => f.tasks.map(() => false))
  );
  const [completedFlow, setCompletedFlow] = useState<number | null>(null);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const setFlowIndex = useCallback((i: number) => setCurrentFlowIndex(i), []);
  const dismissCompletion = useCallback(() => setCompletedFlow(null), []);

  const toggleTask = useCallback((fi: number, ti: number) => {
    setTasksDone((prev) => {
      const next = prev.map((row, rfi) =>
        rfi === fi ? row.map((v, rti) => (rti === ti ? !v : v)) : row
      );
      if (next[fi].every((v) => v)) {
        setTimeout(() => setCompletedFlow(fi), 0);
      }
      return next;
    });
  }, []);

  const triggerEvent = useCallback((eventId: string) => {
    setTasksDone((prev) => {
      let next = prev;
      let justCompletedFlow: number | null = null;

      USABILITY_FLOWS.forEach((flow, fi) => {
        flow.tasks.forEach((task, ti) => {
          if (task.completionEvent === eventId && !next[fi][ti]) {
            next = next.map((row, rfi) =>
              rfi === fi ? row.map((v, rti) => (rti === ti ? true : v)) : row
            );
            if (next[fi].every((v) => v)) {
              justCompletedFlow = fi;
            }
          }
        });
      });

      if (justCompletedFlow !== null) {
        // schedule outside the setState batch so it doesn't conflict
        setTimeout(() => setCompletedFlow(justCompletedFlow), 0);
      }
      return next;
    });
  }, []);

  return (
    <Ctx.Provider
      value={{
        modalOpen,
        currentFlowIndex,
        tasksDone,
        completedFlow,
        openModal,
        closeModal,
        setFlowIndex,
        toggleTask,
        triggerEvent,
        dismissCompletion,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUsabilityTesting() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUsabilityTesting must be used within UsabilityTestingProvider");
  return ctx;
}

export const AUTHORITY_MODES = {
  SOLVE: {
    label: "SOLVE",
    meaning: "System may resolve issue and continue.",
    userImpact: "No interruption unless unresolved.",
  },
  NOTIFY: {
    label: "NOTIFY",
    meaning: "System may continue but must notify user.",
    userImpact: "User is informed, workflow continues.",
  },
  STOP: {
    label: "STOP",
    meaning: "System must halt and request human decision.",
    userImpact: "Workflow pauses until reviewed.",
  },
};

export const DEFAULT_MODULE_AUTHORITY = [
  { id: "source_intake", label: "Source Intake", mode: "SOLVE", sensitivity: 65 },
  { id: "research", label: "Research", mode: "SOLVE", sensitivity: 60 },
  { id: "validation", label: "Validation", mode: "NOTIFY", sensitivity: 75 },
  { id: "blueprint", label: "Blueprint", mode: "NOTIFY", sensitivity: 70 },
  { id: "performance", label: "Performance Blueprint", mode: "NOTIFY", sensitivity: 70 },
  { id: "allocation", label: "Allocation", mode: "NOTIFY", sensitivity: 75 },
  { id: "production", label: "Production", mode: "STOP", sensitivity: 85 },
  { id: "inventory", label: "Inventory", mode: "SOLVE", sensitivity: 55 },
  { id: "publishing", label: "Publishing", mode: "STOP", sensitivity: 90 },
  { id: "learning", label: "Learning", mode: "SOLVE", sensitivity: 55 },
];

export function resolveOperationalDecision({ mode, issueSeverity = 50, sensitivity = 70 }) {
  if (mode === "STOP") {
    return issueSeverity >= Math.max(35, 100 - sensitivity)
      ? "STOP"
      : "NOTIFY";
  }

  if (mode === "NOTIFY") {
    return issueSeverity >= Math.max(30, 100 - sensitivity)
      ? "NOTIFY"
      : "SOLVE";
  }

  return issueSeverity >= 95 ? "STOP" : "SOLVE";
}

export function createAuthorityEvent(moduleId, issue, decision) {
  return {
    id: `AUTH-${Date.now()}`,
    moduleId,
    issue,
    decision,
    createdAt: new Date().toISOString(),
  };
}

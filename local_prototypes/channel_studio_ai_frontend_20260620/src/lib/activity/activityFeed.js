export const ACTIVITY_STATES = {
  HEALTHY: "HEALTHY",
  ATTENTION: "ATTENTION",
  STOPPED: "STOPPED",
};

export const MOCK_ACTIVITY_FEED = [
  {
    id: "ACT-001",
    time: "8:42 PM",
    asset: "Adaptive Cognition AI: Why Identity Must Govern Intelligence",
    event: "Source Material Accepted",
    status: "HEALTHY",
    authority: "SOLVE",
  },
  {
    id: "ACT-002",
    time: "8:43 PM",
    asset: "Adaptive Cognition AI: Why Identity Must Govern Intelligence",
    event: "Research Completed",
    status: "HEALTHY",
    authority: "SOLVE",
  },
  {
    id: "ACT-003",
    time: "8:44 PM",
    asset: "Adaptive Cognition AI: Why Identity Must Govern Intelligence",
    event: "Blueprint Generated",
    status: "HEALTHY",
    authority: "NOTIFY",
  },
  {
    id: "ACT-004",
    time: "8:45 PM",
    asset: "Adaptive Cognition AI: Why Identity Must Govern Intelligence",
    event: "Performance Package Ready",
    status: "ATTENTION",
    authority: "NOTIFY",
  },
  {
    id: "ACT-005",
    time: "8:46 PM",
    asset: "Adaptive Cognition AI: Why Identity Must Govern Intelligence",
    event: "Publishing Halted — Human Review Required",
    status: "STOPPED",
    authority: "STOP",
  },
];

export function createActivityEvent({ asset, event, status = "HEALTHY", authority = "SOLVE" }) {
  return {
    id: `ACT-${Date.now()}`,
    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    asset,
    event,
    status,
    authority,
  };
}

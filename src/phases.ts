/**
 * Canonical, ordered registry of the Channel Studio AI production line.
 *
 * This is the single source of truth for phase ordering. The orchestrator and
 * the gate utilities both read from here so that "what comes next" is governed
 * by code, never by a model's assertion.
 */

export interface PhaseDef {
  /** Two-digit phase id, e.g. "00". */
  id: string;
  /** Human-readable phase name. */
  name: string;
  /** Path to the deterministic gate script for this phase. */
  gate: string;
  /** Id of the next phase, or null for the terminal phase. */
  next: string | null;
}

/** The complete, ordered production line (PHASE 00 → PHASE 12). */
export const PHASES: readonly PhaseDef[] = [
  { id: "00", name: "Runtime Foundation", gate: "gates/check_phase_00.sh", next: "01" },
  { id: "01", name: "Campaign Intake and State Model", gate: "gates/check_phase_01.sh", next: "02" },
  { id: "02", name: "Local Video Production Engine", gate: "gates/check_phase_02.sh", next: "03" },
  { id: "03", name: "External Creative Production Adapter", gate: "gates/check_phase_03.sh", next: "04" },
  { id: "04", name: "Strategic Blueprinting and Script Production", gate: "gates/check_phase_04.sh", next: "05" },
  { id: "05", name: "Voice, Visual, and Asset Packaging", gate: "gates/check_phase_05.sh", next: "06" },
  { id: "06", name: "HTML-to-Video Render Engine", gate: "gates/check_phase_06.sh", next: "07" },
  { id: "07", name: "Inspector and MAPS Human Review", gate: "gates/check_phase_07.sh", next: "08" },
  { id: "08", name: "Compliance and Disclosure Audit", gate: "gates/check_phase_08.sh", next: "09" },
  { id: "09", name: "Publishing Queue", gate: "gates/check_phase_09.sh", next: "10" },
  { id: "10", name: "Distribution Pack", gate: "gates/check_phase_10.sh", next: "11" },
  { id: "11", name: "Analytics Feedback Loop", gate: "gates/check_phase_11.sh", next: "12" },
  { id: "12", name: "End-to-End 20 Video Campaign Test", gate: "gates/check_phase_12.sh", next: null },
] as const;

/** Look up a phase definition by id. Returns undefined if unknown. */
export function getPhase(id: string): PhaseDef | undefined {
  return PHASES.find((p) => p.id === id);
}

/** The phase that must hold a valid PASS record before `id` may begin, or null for PHASE 00. */
export function priorPhaseOf(id: string): PhaseDef | null {
  const idx = PHASES.findIndex((p) => p.id === id);
  if (idx <= 0) return null;
  return PHASES[idx - 1] ?? null;
}

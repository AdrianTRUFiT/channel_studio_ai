/**
 * Orchestrator — runs the production line as: phase → gate → PASS record → next.
 *
 * The orchestrator HALTS on the first gate failure and refuses to run a phase
 * whose prior phase lacks a valid PASS record. It is the executable embodiment
 * of the doctrine "no prior PASS, no advance." It never writes PASS records
 * itself — only the gate scripts do that.
 *
 * Usage:
 *   node orchestrator/runner.ts status        # show PASS/FAIL state of every phase
 *   node orchestrator/runner.ts run <id>      # run a single phase's gate (after prior-PASS check)
 *   node orchestrator/runner.ts run all       # run gates in order until one fails or all pass
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { PHASES, getPhase, priorPhaseOf, type PhaseDef } from "../src/phases.ts";
import { hasValidPass, failRecordPath, repoRoot } from "../gates/shared/gateUtils.ts";

function gateExists(phase: PhaseDef): boolean {
  return existsSync(`${repoRoot()}/${phase.gate}`);
}

function runGate(phase: PhaseDef): boolean {
  const prior = priorPhaseOf(phase.id);
  if (prior && !hasValidPass(prior.id)) {
    console.error(
      `HALT: PHASE ${phase.id} (${phase.name}) blocked — ` +
        `prior PHASE ${prior.id} has no valid PASS record.`,
    );
    return false;
  }
  if (!gateExists(phase)) {
    console.error(
      `HALT: gate not yet built for PHASE ${phase.id} (${phase.name}): ${phase.gate}`,
    );
    return false;
  }

  console.log(`\n▶ PHASE ${phase.id} — ${phase.name}\n  gate: ${phase.gate}`);
  const result = spawnSync("bash", [phase.gate], {
    cwd: repoRoot(),
    stdio: "inherit",
  });

  if (result.status === 0 && hasValidPass(phase.id)) {
    console.log(`✔ PHASE ${phase.id} PASS recorded.`);
    return true;
  }
  console.error(`✗ PHASE ${phase.id} did not pass (exit=${result.status ?? "null"}).`);
  return false;
}

function printStatus(): void {
  console.log("Channel Studio AI — production line status\n");
  for (const phase of PHASES) {
    let mark = "·  not started";
    if (hasValidPass(phase.id)) mark = "✔  PASS";
    else if (existsSync(failRecordPath(phase.id))) mark = "✗  FAIL";
    const gate = gateExists(phase) ? "" : "  (gate not built)";
    console.log(`  PHASE ${phase.id}  ${mark.padEnd(14)} ${phase.name}${gate}`);
  }
  console.log("\nDoctrine: Claude processes. Code governs. Records prove. Hooks block.");
}

function main(argv: string[]): number {
  const [command, target] = argv;

  switch (command ?? "status") {
    case "status":
      printStatus();
      return 0;

    case "run": {
      if (!target) {
        console.error("usage: runner.ts run <phaseId|all>");
        return 1;
      }
      if (target === "all") {
        for (const phase of PHASES) {
          if (hasValidPass(phase.id)) {
            console.log(`• PHASE ${phase.id} already PASS — skipping.`);
            continue;
          }
          if (!runGate(phase)) {
            console.error(`\nOrchestrator halted at PHASE ${phase.id}.`);
            return 1;
          }
        }
        console.log("\nAll built phases passed.");
        return 0;
      }
      const phase = getPhase(target);
      if (!phase) {
        console.error(`unknown phase id "${target}"`);
        return 1;
      }
      return runGate(phase) ? 0 : 1;
    }

    default:
      console.error(`unknown command "${command}". Expected: status | run`);
      return 1;
  }
}

process.exit(main(process.argv.slice(2)));

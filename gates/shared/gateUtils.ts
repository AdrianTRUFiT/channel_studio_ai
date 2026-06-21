/**
 * gateUtils — shared, deterministic primitives for every phase gate.
 *
 * Doctrine: Claude processes. Code governs. Records prove. Hooks block.
 *
 * Proof model (strengthened): a PASS record is NOT valid merely because it
 * exists. It must (a) parse, (b) validate against pass-record.schema.json,
 * (c) match its phase id and gate-script path, and (d) be CURRENT — its stored
 * content hash must equal a recomputation over the hashed outputs it lists.
 * Hooks and the orchestrator use this verification, never bare file existence.
 *
 * Two roots are distinguished:
 *   - sourceRoot(): the real checked-out repo (where schemas + gates live).
 *   - dataRoot():   where records + hashed outputs are read; overridable via
 *                   the CSAI_ROOT env var so tests can run against isolated
 *                   fixtures WITHOUT touching the real records/ ledger.
 *
 * CLI (invoked by the bash gates and hooks):
 *   node gates/shared/gateUtils.ts <command> [args...]
 *
 *   require-prior <phaseId>      exit 0 if <phaseId> may begin (prior PASS is current)
 *   has-pass <phaseId>           exit 0 if <phaseId> has a valid current PASS record
 *   verify-pass-current <id>     exit 0 if PASS record is structurally valid AND current
 *   active-phase                 print the lowest phase id lacking a valid current PASS
 *   stop-check                   exit 0 if it is OK to stop, 1 (with reason) if a phase is unresolved
 *   hash <file> [file...]        print "sha256:<hex>" content hash of the files
 *   validate-schemas             verify the three runtime schemas + phase registry
 *   validate-record <file>       extract + validate the JSON payload in a record file
 *   emit-pass <id> --files a,b --tests "summary"   write records/PHASE_0N_PASS.md
 *   emit-fail <id> --command .. --error .. --repairs "a;b" --cause .. --next ..
 *   list-records                 list PASS/FAIL record files
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASES, getPhase, priorPhaseOf, type PhaseDef } from "../../src/phases.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the real checked-out repo root (two levels up). */
export function sourceRoot(): string {
  return resolve(__dirname, "..", "..");
}

/**
 * Root for records + hashed outputs. Overridable via CSAI_ROOT so tests can
 * point verification at an isolated fixture tree and never mutate real records.
 */
export function dataRoot(): string {
  const override = process.env.CSAI_ROOT;
  return override ? resolve(override) : sourceRoot();
}

/** Back-compat alias used by the orchestrator (real repo root). */
export function repoRoot(): string {
  return sourceRoot();
}

function srcAbs(rel: string): string {
  return join(sourceRoot(), rel);
}
function dataAbs(rel: string): string {
  return join(dataRoot(), rel);
}

/** Path to a phase's PASS record file (under the data root). */
export function passRecordPath(phaseId: string): string {
  return dataAbs(join("records", `PHASE_${phaseId}_PASS.md`));
}

/** Path to a phase's FAIL record file (under the data root). */
export function failRecordPath(phaseId: string): string {
  return dataAbs(join("records", `PHASE_${phaseId}_FAIL.md`));
}

/* --------------------------------------------------------------------------
 * Minimal JSON Schema validator (draft-07 subset) — dependency-free so gates
 * and hooks never require a network install of a validator. Supports the
 * keywords used by our runtime schemas.
 * ------------------------------------------------------------------------ */

type Json = unknown;
interface Schema {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  enum?: Json[];
  const?: Json;
  pattern?: string;
  minLength?: number;
  minItems?: number;
  items?: Schema;
}

function typeOf(value: Json): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function typeMatches(value: Json, type: string): boolean {
  if (type === "integer") return typeOf(value) === "integer";
  if (type === "number") return typeof value === "number";
  return typeOf(value) === type;
}

/** Validate `data` against `schema`. Returns a list of human-readable errors. */
export function validate(schema: Schema, data: Json, path = "$"): string[] {
  const errors: string[] = [];

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(data, t))) {
      errors.push(`${path}: expected type ${types.join("|")}, got ${typeOf(data)}`);
      return errors;
    }
  }

  if (schema.const !== undefined && JSON.stringify(data) !== JSON.stringify(schema.const)) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum !== undefined && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(data))) {
    errors.push(`${path}: value not in enum`);
  }

  if (typeof data === "string") {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(data)) {
      errors.push(`${path}: does not match pattern ${schema.pattern}`);
    }
  }

  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${path}: fewer than minItems ${schema.minItems}`);
    }
    if (schema.items) {
      data.forEach((item, i) => errors.push(...validate(schema.items as Schema, item, `${path}[${i}]`)));
    }
  }

  if (schema.type === "object" || schema.properties || schema.required) {
    const obj = (data ?? {}) as Record<string, Json>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) errors.push(`${path}: missing required property "${key}"`);
    }
    if (schema.properties) {
      for (const [key, sub] of Object.entries(schema.properties)) {
        if (key in obj) errors.push(...validate(sub, obj[key], `${path}.${key}`));
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(obj)) {
        if (!(key in schema.properties)) errors.push(`${path}: unexpected property "${key}"`);
      }
    }
  }

  return errors;
}

function loadSchema(name: string): Schema {
  // Schemas are code: always loaded from the real source tree.
  return JSON.parse(readFileSync(srcAbs(join("schemas", name)), "utf8")) as Schema;
}

/* --------------------------------------------------------------------------
 * Hashing & git
 * ------------------------------------------------------------------------ */

/** Deterministic content hash over the given files (sorted, length-delimited). */
export function contentHash(relFiles: string[]): string {
  const hash = createHash("sha256");
  for (const rel of [...relFiles].sort()) {
    const bytes = readFileSync(dataAbs(rel));
    hash.update(rel);
    hash.update("\0");
    hash.update(String(bytes.length));
    hash.update("\0");
    hash.update(bytes);
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

/** Best-effort current git commit hash, or null if unavailable. */
export function gitCommit(): string | null {
  try {
    return (
      execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: sourceRoot(),
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim() || null
    );
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------------------
 * Record extraction & verification
 * ------------------------------------------------------------------------ */

interface PassPayload {
  phaseId: string;
  phaseName: string;
  status: "PASS";
  timestamp: string;
  gateScript: string;
  gitCommit: string | null;
  contentHash: string;
  hashedOutputs: string[];
  testSummary: string;
  nextUnlockedPhase: string | null;
}

/** Extract the first fenced ```json block from a record's markdown. */
export function extractJsonBlock(markdown: string): Json {
  const match = markdown.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match) throw new Error("no fenced json block found in record");
  return JSON.parse(match[1]);
}

export interface VerifyResult {
  ok: boolean;
  reason: string;
}

/**
 * Verify that a phase's PASS record is structurally valid AND current.
 * Current means: the content hash stored in the record equals a fresh
 * recomputation over the hashed outputs the record itself lists. A missing,
 * malformed, schema-invalid, mismatched, or stale record returns ok:false.
 */
export function verifyPassCurrent(phaseId: string): VerifyResult {
  const phase = getPhase(phaseId);
  if (!phase) return { ok: false, reason: `unknown phase id "${phaseId}"` };

  const file = passRecordPath(phaseId);
  if (!existsSync(file)) return { ok: false, reason: `missing PASS record: ${file}` };

  let payload: Json;
  try {
    payload = extractJsonBlock(readFileSync(file, "utf8"));
  } catch (e) {
    return { ok: false, reason: `malformed record: ${(e as Error).message}` };
  }

  const errs = validate(loadSchema("pass-record.schema.json"), payload);
  if (errs.length) return { ok: false, reason: `schema invalid: ${errs.join("; ")}` };

  const p = payload as PassPayload;
  if (p.phaseId !== phaseId) {
    return { ok: false, reason: `phase id mismatch: record "${p.phaseId}" != "${phaseId}"` };
  }
  if (p.gateScript !== phase.gate) {
    return { ok: false, reason: `gate script mismatch: "${p.gateScript}" != "${phase.gate}"` };
  }
  if (p.nextUnlockedPhase !== phase.next) {
    return {
      ok: false,
      reason: `next-phase mismatch: "${p.nextUnlockedPhase}" != "${phase.next}"`,
    };
  }

  let recomputed: string;
  try {
    recomputed = contentHash(p.hashedOutputs);
  } catch (e) {
    return { ok: false, reason: `cannot read hashed outputs: ${(e as Error).message}` };
  }
  if (recomputed !== p.contentHash) {
    return {
      ok: false,
      reason: `stale: content hash mismatch (record ${p.contentHash}, actual ${recomputed})`,
    };
  }

  return { ok: true, reason: "current" };
}

/** True iff a phase holds a valid, current PASS record. */
export function hasValidPass(phaseId: string): boolean {
  return verifyPassCurrent(phaseId).ok;
}

/** True iff a phase holds a structurally valid FAIL record. */
export function hasValidFail(phaseId: string): boolean {
  const file = failRecordPath(phaseId);
  if (!existsSync(file)) return false;
  try {
    const payload = extractJsonBlock(readFileSync(file, "utf8")) as { status?: string; phaseId?: string };
    if (payload.status !== "FAIL" || payload.phaseId !== phaseId) return false;
    return validate(loadSchema("fail-record.schema.json"), payload).length === 0;
  } catch {
    return false;
  }
}

/** A phase may begin iff it has no prior, or its prior holds a valid current PASS. */
export function canPhaseBegin(phaseId: string): boolean {
  const prior = priorPhaseOf(phaseId);
  if (prior === null) return true;
  return verifyPassCurrent(prior.id).ok;
}

/** The lowest phase id that lacks a valid current PASS record, or null if all pass. */
export function activePhaseId(): string | null {
  for (const p of PHASES) {
    if (!verifyPassCurrent(p.id).ok) return p.id;
  }
  return null;
}

/**
 * Stop-guard decision: it is NOT ok to stop while the active phase has a built
 * gate but no valid current PASS and no valid FAIL record.
 */
export function stopCheck(): { block: boolean; reason: string } {
  const active = activePhaseId();
  if (active === null) return { block: false, reason: "all phases hold valid current PASS records" };

  const phase = getPhase(active);
  if (!phase) return { block: false, reason: `no phase definition for "${active}"` };

  const gateBuilt = existsSync(srcAbs(phase.gate));
  if (gateBuilt && !hasValidFail(active)) {
    return {
      block: true,
      reason:
        `PHASE ${active} is unresolved: gate ${phase.gate} is built but there is ` +
        `no valid current PASS and no valid FAIL record. Run the gate to earn a ` +
        `PASS, or emit a FAIL after the 3-attempt repair budget.`,
    };
  }
  return { block: false, reason: `PHASE ${active} is not yet built, or is resolved via FAIL` };
}

/* --------------------------------------------------------------------------
 * Record emission
 * ------------------------------------------------------------------------ */

function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Emit a PASS record for `phase`. Append-only and idempotent: if a valid,
 * current PASS record already exists it is left untouched. Throws if the
 * generated payload does not validate against pass-record.schema.json.
 */
export function emitPass(args: {
  phase: PhaseDef;
  files: string[];
  testSummary: string;
}): { written: boolean; path: string } {
  const { phase, files, testSummary } = args;
  const file = passRecordPath(phase.id);

  if (verifyPassCurrent(phase.id).ok) {
    return { written: false, path: file };
  }

  const payload: PassPayload = {
    phaseId: phase.id,
    phaseName: phase.name,
    status: "PASS",
    timestamp: isoNow(),
    gateScript: phase.gate,
    gitCommit: gitCommit(),
    contentHash: contentHash(files),
    hashedOutputs: files,
    testSummary,
    nextUnlockedPhase: phase.next,
  };

  const errors = validate(loadSchema("pass-record.schema.json"), payload);
  if (errors.length > 0) {
    throw new Error(`generated PASS record is invalid:\n  ${errors.join("\n  ")}`);
  }

  const md = `# PHASE ${phase.id} — ${phase.name} — PASS

> Emitted by \`${phase.gate}\`. This record is machine-generated and append-only.
> Do not edit by hand. Validity is determined by structural + content-hash
> verification (\`gateUtils verify-pass-current ${phase.id}\`), not by existence.

- **Phase:** ${phase.id} — ${phase.name}
- **Status:** PASS
- **Timestamp:** ${payload.timestamp}
- **Gate script:** \`${payload.gateScript}\`
- **Git commit:** ${payload.gitCommit ?? "(unavailable)"}
- **Content hash:** \`${payload.contentHash}\`
- **Hashed outputs:** ${files.map((f) => `\`${f}\``).join(", ")}
- **Test summary:** ${testSummary}
- **Next unlocked phase:** ${payload.nextUnlockedPhase ?? "(none — terminal phase)"}

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`
`;

  writeFileSync(file, md, { encoding: "utf8" });
  return { written: true, path: file };
}

/** Emit a FAIL record after repair attempts are exhausted. */
export function emitFail(args: {
  phase: PhaseDef;
  failingCommand: string;
  errorOutput: string;
  attemptedRepairs: string[];
  suspectedCause: string;
  recommendedNextAction: string;
}): { path: string } {
  const { phase } = args;
  const file = failRecordPath(phase.id);

  const payload = {
    phaseId: phase.id,
    phaseName: phase.name,
    status: "FAIL" as const,
    timestamp: isoNow(),
    gateScript: phase.gate,
    failingCommand: args.failingCommand,
    errorOutput: args.errorOutput,
    attemptedRepairs: args.attemptedRepairs,
    suspectedCause: args.suspectedCause,
    recommendedNextAction: args.recommendedNextAction,
  };

  const errors = validate(loadSchema("fail-record.schema.json"), payload);
  if (errors.length > 0) {
    throw new Error(`generated FAIL record is invalid:\n  ${errors.join("\n  ")}`);
  }

  const md = `# PHASE ${phase.id} — ${phase.name} — FAIL

> Emitted after repair attempts were exhausted. Append-only. Do not edit by hand.

- **Failed phase:** ${phase.id} — ${phase.name}
- **Failed gate:** \`${payload.gateScript}\`
- **Timestamp:** ${payload.timestamp}
- **Failing command:** \`${payload.failingCommand}\`
- **Suspected cause:** ${payload.suspectedCause}
- **Recommended next action:** ${payload.recommendedNextAction}

## Attempted repairs
${args.attemptedRepairs.map((r) => `- ${r}`).join("\n") || "- (none recorded)"}

## Error output
\`\`\`
${args.errorOutput}
\`\`\`

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`
`;

  writeFileSync(file, md, { encoding: "utf8" });
  return { path: file };
}

/* --------------------------------------------------------------------------
 * CLI
 * ------------------------------------------------------------------------ */

function parseFlags(argv: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith("--")) {
      flags[tok.slice(2)] = argv[i + 1] ?? "";
      i++;
    }
  }
  return flags;
}

function die(message: string): never {
  process.stderr.write(`gateUtils: ${message}\n`);
  process.exit(1);
}

function requirePhase(id: string): PhaseDef {
  const phase = getPhase(id);
  if (!phase) die(`unknown phase id "${id}"`);
  return phase;
}

function main(argv: string[]): void {
  const [command, ...rest] = argv;

  switch (command) {
    case "prior-pass":
    case "require-prior": {
      const phase = requirePhase(rest[0]);
      if (canPhaseBegin(phase.id)) {
        process.exit(0);
      }
      const prior = priorPhaseOf(phase.id);
      const why = prior ? verifyPassCurrent(prior.id).reason : "no prior";
      die(`PHASE ${phase.id} blocked — prior PASS not valid/current: ${why}`);
      break;
    }

    case "has-pass": {
      const phase = requirePhase(rest[0]);
      process.exit(hasValidPass(phase.id) ? 0 : 1);
      break;
    }

    case "verify-pass-current": {
      const phase = requirePhase(rest[0]);
      const result = verifyPassCurrent(phase.id);
      if (result.ok) {
        process.stdout.write(`PHASE ${phase.id} PASS record is valid and current.\n`);
        process.exit(0);
      }
      die(`PHASE ${phase.id} PASS record not current: ${result.reason}`);
      break;
    }

    case "active-phase": {
      const active = activePhaseId();
      process.stdout.write((active ?? "none") + "\n");
      break;
    }

    case "stop-check": {
      const result = stopCheck();
      if (result.block) {
        process.stderr.write(result.reason + "\n");
        process.exit(1);
      }
      process.stdout.write(result.reason + "\n");
      process.exit(0);
      break;
    }

    case "hash": {
      if (rest.length === 0) die("hash requires at least one file");
      process.stdout.write(contentHash(rest) + "\n");
      break;
    }

    case "validate-schemas": {
      const names = ["phase.schema.json", "pass-record.schema.json", "fail-record.schema.json"];
      for (const name of names) {
        const schema = loadSchema(name);
        if (!schema.type && !schema.properties) die(`schema ${name} has neither type nor properties`);
      }
      const phaseSchema = loadSchema("phase.schema.json");
      for (const p of PHASES) {
        const errs = validate(phaseSchema, p);
        if (errs.length) die(`phase ${p.id} fails phase.schema.json: ${errs.join("; ")}`);
      }
      process.stdout.write("schemas valid; phase registry conforms\n");
      break;
    }

    case "validate-record": {
      const recordFile = rest[0];
      if (!recordFile || !existsSync(recordFile)) die(`record file not found: ${recordFile}`);
      const payload = extractJsonBlock(readFileSync(recordFile, "utf8")) as { status?: string };
      const schemaName = payload.status === "FAIL" ? "fail-record.schema.json" : "pass-record.schema.json";
      const errs = validate(loadSchema(schemaName), payload);
      if (errs.length) die(`record invalid against ${schemaName}:\n  ${errs.join("\n  ")}`);
      process.stdout.write(`record valid against ${schemaName}\n`);
      break;
    }

    case "emit-pass": {
      const phase = requirePhase(rest[0]);
      const flags = parseFlags(rest.slice(1));
      const files = (flags.files ?? "")
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      if (files.length === 0) die("emit-pass requires --files a,b,c");
      const testSummary = flags.tests || "no test summary provided";
      const result = emitPass({ phase, files, testSummary });
      process.stdout.write(
        result.written
          ? `PASS record written: ${result.path}\n`
          : `PASS record already valid and current (append-only, left untouched): ${result.path}\n`,
      );
      break;
    }

    case "emit-fail": {
      const phase = requirePhase(rest[0]);
      const flags = parseFlags(rest.slice(1));
      const result = emitFail({
        phase,
        failingCommand: flags.command || "(unspecified)",
        errorOutput: flags.error || "",
        attemptedRepairs: (flags.repairs || "").split(";").map((s) => s.trim()).filter(Boolean),
        suspectedCause: flags.cause || "(unspecified)",
        recommendedNextAction: flags.next || "(unspecified)",
      });
      process.stdout.write(`FAIL record written: ${result.path}\n`);
      break;
    }

    case "list-records": {
      const dir = dataAbs("records");
      const files = readdirSync(dir).filter((f) => /^PHASE_\d{2}_(PASS|FAIL)\.md$/.test(f));
      process.stdout.write(files.sort().join("\n") + (files.length ? "\n" : ""));
      break;
    }

    default:
      die(
        `unknown command "${command ?? ""}". Expected one of: require-prior, has-pass, ` +
          `verify-pass-current, active-phase, stop-check, hash, validate-schemas, ` +
          `validate-record, emit-pass, emit-fail, list-records`,
      );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}

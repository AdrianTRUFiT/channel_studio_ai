/**
 * gateUtils — shared, deterministic primitives for every phase gate.
 *
 * Doctrine: Claude processes. Code governs. Records prove. Hooks block.
 *
 * This module is both:
 *   1. an importable library (used by the orchestrator and tests), and
 *   2. a CLI invoked by the bash gate scripts:
 *
 *        node gates/shared/gateUtils.ts <command> [args...]
 *
 * Commands:
 *   prior-pass <phaseId>                    exit 0 if the prior phase has a valid PASS record
 *   require-prior <phaseId>                 like prior-pass, but exits 1 with a message if missing
 *   has-pass <phaseId>                      exit 0 if THIS phase already has a valid PASS record
 *   hash <file> [file...]                   print "sha256:<hex>" content hash of the files
 *   validate-schemas                        verify the three runtime schemas parse and self-check
 *   validate-record <recordFile>            extract + validate the JSON payload in a record file
 *   emit-pass <phaseId> --files a,b --tests "summary"
 *                                           write records/PHASE_0N_PASS.md (idempotent, append-only)
 *   emit-fail <phaseId> --command "<cmd>" --error "<text>" \
 *             --repairs "a;b;c" --cause "<text>" --next "<text>"
 *                                           write records/PHASE_0N_FAIL.md
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASES, getPhase, priorPhaseOf, type PhaseDef } from "../../src/phases.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the repository root (two levels up from gates/shared). */
export function repoRoot(): string {
  return resolve(__dirname, "..", "..");
}

function abs(rel: string): string {
  return join(repoRoot(), rel);
}

/** Path to a phase's PASS record file. */
export function passRecordPath(phaseId: string): string {
  return abs(join("records", `PHASE_${phaseId}_PASS.md`));
}

/** Path to a phase's FAIL record file. */
export function failRecordPath(phaseId: string): string {
  return abs(join("records", `PHASE_${phaseId}_FAIL.md`));
}

/* --------------------------------------------------------------------------
 * Minimal JSON Schema validator (draft-07 subset)
 *
 * Deliberately dependency-free so gates never require a network install of a
 * validator. Supports the keywords actually used by our runtime schemas:
 * type, required, properties, additionalProperties:false, enum, const,
 * pattern, minLength, minItems, items.
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
      return errors; // further checks are meaningless on a type mismatch
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
  return JSON.parse(readFileSync(abs(join("schemas", name)), "utf8")) as Schema;
}

/* --------------------------------------------------------------------------
 * Hashing & git
 * ------------------------------------------------------------------------ */

/** Deterministic content hash over the given files (sorted, length-delimited). */
export function contentHash(relFiles: string[]): string {
  const hash = createHash("sha256");
  for (const rel of [...relFiles].sort()) {
    const bytes = readFileSync(abs(rel));
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
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot(),
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------------------
 * Record extraction & validation
 * ------------------------------------------------------------------------ */

/** Extract the first fenced ```json block from a record's markdown. */
export function extractJsonBlock(markdown: string): Json {
  const match = markdown.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match) throw new Error("no fenced json block found in record");
  return JSON.parse(match[1]);
}

/** True if a phase holds a structurally valid PASS record on disk. */
export function hasValidPass(phaseId: string): boolean {
  const file = passRecordPath(phaseId);
  if (!existsSync(file)) return false;
  try {
    const payload = extractJsonBlock(readFileSync(file, "utf8"));
    const errors = validate(loadSchema("pass-record.schema.json"), payload);
    if (errors.length > 0) return false;
    return (payload as { phaseId?: string }).phaseId === phaseId;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
 * Record emission
 * ------------------------------------------------------------------------ */

function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Emit a PASS record for `phase`. Append-only and idempotent: if a valid PASS
 * record already exists it is left untouched. Throws if the generated payload
 * does not validate against pass-record.schema.json.
 */
export function emitPass(args: {
  phase: PhaseDef;
  files: string[];
  testSummary: string;
}): { written: boolean; path: string } {
  const { phase, files, testSummary } = args;
  const file = passRecordPath(phase.id);

  if (hasValidPass(phase.id)) {
    return { written: false, path: file };
  }

  const payload = {
    phaseId: phase.id,
    phaseName: phase.name,
    status: "PASS" as const,
    timestamp: isoNow(),
    gateScript: phase.gate,
    gitCommit: gitCommit(),
    contentHash: contentHash(files),
    testSummary,
    nextUnlockedPhase: phase.next,
  };

  const errors = validate(loadSchema("pass-record.schema.json"), payload);
  if (errors.length > 0) {
    throw new Error(`generated PASS record is invalid:\n  ${errors.join("\n  ")}`);
  }

  const md = `# PHASE ${phase.id} — ${phase.name} — PASS

> Emitted by \`${phase.gate}\`. This record is machine-generated and append-only.
> Do not edit by hand.

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
      const prior = priorPhaseOf(phase.id);
      if (prior === null) {
        // PHASE 00 has no prior; the gate is permitted to run.
        process.exit(0);
      }
      if (hasValidPass(prior.id)) {
        process.exit(0);
      }
      die(
        `prior PASS missing: PHASE ${phase.id} requires a valid records/PHASE_${prior.id}_PASS.md`,
      );
      break;
    }

    case "has-pass": {
      const phase = requirePhase(rest[0]);
      process.exit(hasValidPass(phase.id) ? 0 : 1);
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
        const schema = loadSchema(name); // throws if not valid JSON
        if (!schema.type && !schema.properties) {
          die(`schema ${name} has neither type nor properties`);
        }
      }
      // Cross-check: every entry in the phase registry validates against phase.schema.json.
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
          : `PASS record already present (append-only, left untouched): ${result.path}\n`,
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
      const dir = abs("records");
      const files = readdirSync(dir).filter((f) => /^PHASE_\d{2}_(PASS|FAIL)\.md$/.test(f));
      process.stdout.write(files.sort().join("\n") + (files.length ? "\n" : ""));
      break;
    }

    default:
      die(
        `unknown command "${command ?? ""}". ` +
          `Expected one of: prior-pass, require-prior, has-pass, hash, ` +
          `validate-schemas, validate-record, emit-pass, emit-fail, list-records`,
      );
  }
}

// Run as CLI only when invoked directly (not when imported).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}

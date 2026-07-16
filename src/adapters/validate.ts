/**
 * validate — CLI to verify adapter CONTRACTS and offline PAYLOADS against their
 * schemas, and to assert the Phase 03 safety posture (every adapter blocked).
 *
 * CLI:
 *   node src/adapters/validate.ts contracts          # validate all contracts + assert blocked
 *   node src/adapters/validate.ts payload <file.json> # validate one adapter payload
 */

import { readFileSync } from "node:fs";
import { isAbsolute, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../../gates/shared/gateUtils.ts";
import { ADAPTERS, allAdaptersBlocked, capabilityMatrix } from "./registry.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
function repoRoot(): string {
  return resolve(__dirname, "..", "..");
}
type Schema = Parameters<typeof validate>[0];
function loadSchema(name: string): Schema {
  return JSON.parse(readFileSync(join(repoRoot(), "schemas", name), "utf8")) as Schema;
}

function die(msg: string): never {
  process.stderr.write(`adapters: ${msg}\n`);
  process.exit(1);
}

function main(argv: string[]): void {
  const [command, pathArg] = argv;

  if (command === "contracts") {
    const schema = loadSchema("adapter-contract.schema.json");
    const errors: string[] = [];
    for (const a of ADAPTERS) {
      errors.push(...validate(schema, a.contract).map((e) => `${a.contract.id} ${e}`));
    }
    if (errors.length) die(`contract validation failed:\n  ${errors.join("\n  ")}`);
    if (!allAdaptersBlocked()) {
      die("safety violation: not every adapter is LIVE-INTEGRATION-BLOCKED in Phase 03");
    }
    const vendors = capabilityMatrix().map((m) => m.vendor).join(", ");
    process.stdout.write(
      `adapter contracts valid: ${ADAPTERS.length} adapters (${vendors}); all LIVE-INTEGRATION-BLOCKED\n`,
    );
    return;
  }

  if (command === "payload") {
    if (!pathArg) die("usage: payload <file.json>");
    const full = isAbsolute(pathArg) ? pathArg : join(repoRoot(), pathArg);
    const payload = JSON.parse(readFileSync(full, "utf8")) as { liveStatus?: string; published?: boolean };
    const errs = validate(loadSchema("adapter-payload.schema.json"), payload);
    if (errs.length) die(`payload invalid:\n  ${errs.join("\n  ")}`);
    if (payload.liveStatus !== "LIVE-INTEGRATION-BLOCKED") die("payload liveStatus must be blocked");
    if (payload.published !== false) die("payload published must be false");
    process.stdout.write(`payload valid (blocked, dry-run, not published): ${pathArg}\n`);
    return;
  }

  die(`unknown command "${command ?? ""}". Expected: contracts | payload <file>`);
}

main(process.argv.slice(2));

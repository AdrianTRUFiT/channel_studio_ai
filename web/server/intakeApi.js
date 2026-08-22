/**
 * intakeApi — a Vite dev-server middleware exposing the existing, governed
 * Campaign Intake Engine to the operator dashboard over HTTP.
 *
 * This is plumbing only: every route is a thin wrapper around the SAME core
 * functions the CLI (`scripts/intake_campaign.ts`) and the gates already use
 * (`runIntake`, `loadCampaign`, `validateCampaignObject`) — no logic is
 * duplicated, and no "parallel workflow" is introduced. The operator's browser
 * form and the terminal `npm run intake` command both terminate in the exact
 * same deterministic engine.
 *
 * Scope boundary (by design, not an oversight): this middleware is registered
 * via Vite's `configureServer` hook, which Vite only invokes for `vite dev`.
 * It does NOT run for `vite preview` or a static production build — so a
 * statically hosted dashboard (e.g. Vercel) has no write/query backend and the
 * UI must degrade honestly rather than pretend to write files that can't be
 * written from a browser. See `web/src/data/campaignApi.js` for the fallback.
 *
 * Everything here is local-only, offline, and mock: it never calls an
 * external API, never publishes, and never bypasses the MAPⓈ review gates —
 * it only writes the same governed campaign JSON the CLI would write.
 */

import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const campaignsDir = join(repoRoot, "data", "campaigns");

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function sendJson(res, status, body) {
  const text = JSON.stringify(body, null, 2);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(text);
}

/** Resolve a campaign filename against data/campaigns/, refusing path escapes. */
function resolveCampaignFile(name) {
  const full = resolve(campaignsDir, name);
  const rel = relative(campaignsDir, full);
  if (rel.startsWith("..") || resolve(full) !== full) return null;
  return full;
}

export function intakeApiPlugin() {
  return {
    name: "csai-intake-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, "http://localhost");

          if (url.pathname === "/api/campaigns" && req.method === "GET") {
            const { loadCampaign } = await import("../../src/campaign/campaign.ts");
            let files = [];
            try {
              files = (await readdir(campaignsDir)).filter((f) => f.endsWith(".campaign.json"));
            } catch {
              files = [];
            }
            const campaigns = files
              .map((file) => {
                try {
                  const c = loadCampaign(`data/campaigns/${file}`);
                  return {
                    file,
                    id: c.id,
                    name: c.name,
                    videoCount: c.videos.length,
                    targetVideoCount: c.targetVideoCount,
                    createdAt: c.createdAt,
                    dataSource: c.provenance?.dataSource ?? "mock",
                  };
                } catch {
                  return null;
                }
              })
              .filter(Boolean)
              .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
            return sendJson(res, 200, { ok: true, campaigns });
          }

          if (url.pathname === "/api/campaigns/one" && req.method === "GET") {
            const file = url.searchParams.get("file");
            const full = file ? resolveCampaignFile(file) : null;
            if (!full) return sendJson(res, 400, { ok: false, error: "missing or invalid ?file=" });
            const { loadCampaign } = await import("../../src/campaign/campaign.ts");
            try {
              const campaign = loadCampaign(full);
              return sendJson(res, 200, { ok: true, campaign });
            } catch (e) {
              return sendJson(res, 404, { ok: false, error: `campaign not found: ${e.message}` });
            }
          }

          if (url.pathname === "/api/intake" && req.method === "POST") {
            const { runIntake } = await import("../../src/intake/campaignIntake.ts");
            let body;
            try {
              body = await readJsonBody(req);
            } catch {
              return sendJson(res, 400, { ok: false, error: "request body must be valid JSON" });
            }
            try {
              const result = runIntake({
                topic: body.topic,
                videoCount: body.videoCount === undefined ? undefined : Number(body.videoCount),
                mode: body.mode || undefined,
                productTitle: body.productTitle || undefined,
                productType: body.productType || undefined,
                contentBrief: body.contentBrief || undefined,
              });
              return sendJson(res, 200, {
                ok: true,
                campaignId: result.campaignId,
                campaignFile: result.campaignFile,
                intakeManifestFile: result.intakeManifestFile,
                videoIds: result.videoIds,
                overwroteExisting: result.overwroteExisting,
                campaign: result.campaign,
              });
            } catch (e) {
              return sendJson(res, 400, { ok: false, error: e.message });
            }
          }

          next();
        } catch (e) {
          sendJson(res, 500, { ok: false, error: e?.message || String(e) });
        }
      });
    },
  };
}

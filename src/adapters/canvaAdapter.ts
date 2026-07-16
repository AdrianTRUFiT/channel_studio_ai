/**
 * Canva adapter — design graphics lane (title cards, thumbnails, captions).
 *
 * Contract + OFFLINE payload builder only. No Canva API is called in Phase 03;
 * live execution is LIVE-INTEGRATION-BLOCKED.
 */

import {
  makePayload,
  type Adapter,
  type AdapterContract,
  type AdapterPayload,
} from "./adapterContract.ts";
import type { ProductionPackage } from "../production/types.ts";

const contract: AdapterContract = {
  id: "canva.design-graphics.v1",
  vendor: "Canva",
  name: "Canva Design Graphics",
  kind: "design-graphics",
  version: "1.0.0",
  capabilities: ["brand-templates", "title-cards", "thumbnails", "text-overlays"],
  acceptsFrom: ["storyboard", "script", "animation"],
  produces: "Branded title cards / thumbnail / overlay designs, one page per scene.",
  credentialsEnv: ["CANVA_API_KEY"],
  liveStatus: "LIVE-INTEGRATION-BLOCKED",
  liveBlockedReason:
    "No CANVA_API_KEY provisioned and live (paid) calls are not approved in Phase 03.",
  docsHint: "Mirrors a brand-template design with one page per storyboard scene.",
};

export const canvaAdapter: Adapter = {
  contract,
  buildPayload(pkg: ProductionPackage): AdapterPayload {
    const request = {
      design_type: "video",
      brand_template_id: "<BRAND_TEMPLATE_PLACEHOLDER>",
      brand_colors: pkg.animation.brandColors,
      thumbnail: {
        headline: pkg.script.hook,
        subhead: pkg.title,
      },
      pages: pkg.storyboard.scenes.map((s) => ({
        scene_index: s.index,
        background: pkg.animation.brandColors[0] ?? "#0b0f17",
        elements: [
          { type: "text", role: "headline", text: s.onScreenText },
          { type: "text", role: "kicker", text: s.kind.toUpperCase() },
        ],
      })),
    };
    return makePayload(contract, pkg.videoId, request);
  },
};

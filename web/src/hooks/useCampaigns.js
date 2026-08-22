import { useCallback, useEffect, useState } from "react";
import sampleCampaign from "../data/campaign.js";
import { fetchCampaignList, fetchCampaign } from "../data/campaignApi.js";

/**
 * Owns "which campaign is the dashboard showing" and, when the local
 * sovereign dev-server API is reachable, lets the operator switch between
 * every governed campaign on disk (including ones just created via intake).
 *
 * Honest degradation: if the API is unreachable (a static/Vercel build has no
 * backend — see web/server/intakeApi.js), `apiAvailable` stays false and the
 * dashboard falls back to exactly today's behavior — the single campaign file
 * bundled at build time. Nothing pretends the write path exists when it can't.
 */
export function useCampaigns() {
  const [apiAvailable, setApiAvailable] = useState(null); // null = not yet known
  const [campaigns, setCampaigns] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [campaign, setCampaign] = useState(sampleCampaign);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshList = useCallback(async () => {
    try {
      const list = await fetchCampaignList();
      setCampaigns(list);
      setApiAvailable(true);
      return list;
    } catch {
      setApiAvailable(false);
      return [];
    }
  }, []);

  const selectCampaign = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const c = await fetchCampaign(file);
      setCampaign(c);
      setActiveFile(file);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshList().then((list) => {
      // Default to the canonical sample if present, else the most recent.
      const sample = list.find((c) => c.id === sampleCampaign.id);
      const target = sample ?? list[0];
      if (target) selectCampaign(target.file);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    apiAvailable: apiAvailable === true,
    campaigns,
    activeFile,
    campaign,
    loading,
    error,
    refreshList,
    selectCampaign,
  };
}

import { getJson, sendJson } from "../core/http.js";

// data: { settings: {...}, defaults: {...} }
export function getSettings() {
  return getJson("/api/settings");
}

// partial: { review_timing: {...} } (chi can gui muc muon doi)
export function updateSettings(partial) {
  return sendJson("/api/settings", "PUT", partial);
}

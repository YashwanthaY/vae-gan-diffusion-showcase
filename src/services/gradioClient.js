import { Client } from "@gradio/client";
import { SPACE_ID, API_TIMEOUT_MS } from "../config.js";

let clientPromise = null;
let currentToken  = null;

export async function getGradioClient(hfToken = null) {
  if (hfToken !== currentToken) { clientPromise = null; currentToken = hfToken; }
  if (!clientPromise) {
    const opts = hfToken ? { hf_token: hfToken } : {};
    clientPromise = Client.connect(SPACE_ID, opts).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

/** Safely extract image URL from a Gradio output item. */
export function extractImageUrl(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (typeof item === "object") return item.url || item.path || null;
  return null;
}

/**
 * Call the /generate_studio named endpoint.
 * Returns the raw JSON dict from the Space:
 *   { mode, seed, steps, cfg, class, nfe, seconds,
 *     per_model: { vae?, wgan?, ddpm?: { grid_png_b64, tile_sheet_png_b64, seconds, diversity } },
 *     notes }
 * Never throws; on failure returns { mode: "error", error: msg }.
 */
export async function generateStudio({
  cls_name   = "dog",
  prompt     = "",
  steps      = 50,
  cfg        = 1.5,
  seed       = null,
  enhance    = false,
  models     = ["vae", "wgan", "ddpm"],
  hfToken    = null,
} = {}) {
  const effectiveSeed = seed ?? Math.floor(Math.random() * 100000);
  const payload = [cls_name, prompt, steps, cfg, effectiveSeed, enhance, models];

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("API_TIMEOUT")), API_TIMEOUT_MS)
  );

  try {
    const client = await getGradioClient(hfToken);
    const result = await Promise.race([
      client.predict("/generate_studio", payload),
      timeoutPromise,
    ]);
    // The Space wraps the JSON string in result.data[0]
    const raw = result.data[0];
    if (typeof raw === "string") return JSON.parse(raw);
    return raw;
  } catch (err) {
    console.warn("[generateStudio] API error:", err.message);
    return { mode: "error", error: err.message };
  }
}

/**
 * Call the /param_strip named endpoint.
 * Returns { mode, axis, seed, class, strips: [{ setting, grid_png_b64, seconds }] }
 */
export async function fetchParamStrip({
  cls_name = "dog",
  seed = 42,
  axis = "steps",
  hfToken = null,
} = {}) {
  const payload = [cls_name, seed, axis];
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("API_TIMEOUT")), API_TIMEOUT_MS)
  );

  try {
    const client = await getGradioClient(hfToken);
    const result = await Promise.race([
      client.predict("/param_strip", payload),
      timeoutPromise,
    ]);
    const raw = result.data[0];
    if (typeof raw === "string") return JSON.parse(raw);
    return raw;
  } catch (err) {
    console.warn("[fetchParamStrip] API error:", err.message);
    return { mode: "unavailable", message: err.message, strips: [] };
  }
}

// ─── Legacy helpers (kept for compatibility with LiveModelApi) ────────────────

export async function generateSingleModel({
  architecture, ddpmClass = "dog", ddpmSteps = 100, ddpmCfg = 1.5,
  enhance = true, ddpmPrompt = "", hfToken = null
}) {
  const client = await getGradioClient(hfToken);
  let archRadio = "DDPM (Class-Conditional - Best, FID 11.32)";
  if (architecture === "vae")  archRadio = "β-VAE (Unconditional, FID 112.24)";
  if (architecture === "gan")  archRadio = "WGAN-GP (Unconditional - Collapsed, FID 242.59)";
  const result = await client.predict(1, [archRadio, ddpmClass, Number(ddpmSteps), Number(ddpmCfg), Boolean(enhance), ddpmPrompt]);
  return { imageUrl: extractImageUrl(result.data[0]), statusMsg: result.data[1] || "", timingMsg: result.data[2] || "" };
}

export async function generateCompareAll({
  ddpmClass = "dog", ddpmSteps = 100, ddpmCfg = 1.5,
  enhance = true, ddpmPrompt = "", hfToken = null
}) {
  const client = await getGradioClient(hfToken);
  const result = await client.predict(0, [ddpmClass, Number(ddpmSteps), Number(ddpmCfg), Boolean(enhance), ddpmPrompt]);
  return {
    vaeUrl:    extractImageUrl(result.data[0]),
    wganUrl:   extractImageUrl(result.data[1]),
    ddpmUrl:   extractImageUrl(result.data[2]),
    statusMsg: result.data[3] || "",
    timingMsg: result.data[4] || "",
  };
}

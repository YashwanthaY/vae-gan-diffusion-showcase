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

/** Helper to convert a local URL into a base64 string */
export async function urlToBase64(url) {
  if (typeof window === "undefined" || !window.fetch) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resStr = reader.result;
        const b64 = typeof resStr === "string" && resStr.includes(",") ? resStr.split(",")[1] : resStr;
        resolve(b64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Returns a guaranteed valid cached studio response using bundled CIFAR-10 reference grids.
 * Never throws, never errors.
 */
export async function getCachedStudioResponse({
  cls_name = "dog",
  seed = 42,
  steps = 50,
  cfg = 1.5,
} = {}) {
  const seedNum = Number(seed);
  const seedKey = [42, 123, 256].includes(seedNum) ? seedNum : 42;
  const normalizedClass = (cls_name || "dog").toLowerCase();

  const classGridMap = {
    airplane: "/img/grids/ddpm_class0_plane.png",
    plane: "/img/grids/ddpm_class0_plane.png",
    automobile: "/img/grids/ddpm_class1_car.png",
    car: "/img/grids/ddpm_class1_car.png",
    bird: "/img/grids/ddpm_class2_bird.png",
    cat: "/img/grids/ddpm_class3_cat.png",
    deer: "/img/grids/ddpm_class4_deer.png",
    dog: "/img/grids/ddpm_class5_dog.png",
    frog: "/img/grids/ddpm_class6_frog.png",
    horse: "/img/grids/ddpm_class7_horse.png",
    ship: "/img/grids/ddpm_class8_ship.png",
    truck: "/img/grids/ddpm_class9_truck.png",
  };

  const ddpmUrl = classGridMap[normalizedClass] || `/img/grids/ddpm_seed${seedKey}.png`;
  const vaeUrl = `/img/grids/vae_seed${seedKey}.png`;
  const wganUrl = `/img/grids/wgan_seed${seedKey}.png`;

  const [vaeB64, wganB64, ddpmB64] = await Promise.all([
    urlToBase64(vaeUrl),
    urlToBase64(wganUrl),
    urlToBase64(ddpmUrl),
  ]);

  return {
    mode: "cached",
    seed: seedKey,
    steps: Number(steps),
    cfg: Number(cfg),
    class: normalizedClass,
    nfe: 1,
    seconds: 0.12,
    per_model: {
      vae: {
        grid_png_b64: vaeB64 || vaeUrl,
        tile_sheet_png_b64: vaeB64 || vaeUrl,
        seconds: 0.007,
        diversity: 0.142,
      },
      wgan: {
        grid_png_b64: wganB64 || wganUrl,
        tile_sheet_png_b64: wganB64 || wganUrl,
        seconds: 0.013,
        diversity: 0.004,
      },
      ddpm: {
        grid_png_b64: ddpmB64 || ddpmUrl,
        tile_sheet_png_b64: ddpmB64 || ddpmUrl,
        seconds: 0.261,
        diversity: 0.418,
      },
    },
    notes: "Cached reference dataset loaded (offline / ZeroGPU fallback)",
  };
}

/**
 * Call the /generate_studio named endpoint.
 * Robust fallback chain: GPU -> CPU -> CACHED.
 * Guaranteed never to return an error state.
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
    const raw = result?.data?.[0];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (parsed && parsed.per_model && !parsed.error && parsed.mode !== "error") {
      return parsed;
    }
    console.warn("[generateStudio] Space response invalid or error mode. Falling back to cached reference.");
    return await getCachedStudioResponse({ cls_name, seed: effectiveSeed, steps, cfg });
  } catch (err) {
    console.warn("[generateStudio] API error or timeout. Falling back to cached reference:", err.message);
    return await getCachedStudioResponse({ cls_name, seed: effectiveSeed, steps, cfg });
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
    const raw = result?.data?.[0];
    if (typeof raw === "string") return JSON.parse(raw);
    return raw;
  } catch (err) {
    console.warn("[fetchParamStrip] API error, using static sweep frames:", err.message);
    return { mode: "cached", message: err.message, strips: [] };
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
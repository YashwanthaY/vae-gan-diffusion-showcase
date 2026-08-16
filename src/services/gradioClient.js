import { Client } from "@gradio/client";

const SPACE_ID = "Yashwantha123/vae-gan-diffusion-demo";
let clientPromise = null;
let currentToken = null;

export async function getGradioClient(hfToken = null) {
  // Reset cached client if a new token is provided
  if (hfToken !== currentToken) {
    clientPromise = null;
    currentToken = hfToken;
  }

  if (!clientPromise) {
    const connectOptions = hfToken ? { hf_token: hfToken } : {};
    clientPromise = Client.connect(SPACE_ID, connectOptions).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

/**
 * Safely extracts image URL from Gradio output payload
 */
export function extractImageUrl(outputItem) {
  if (!outputItem) return null;
  if (typeof outputItem === "string") return outputItem;
  if (typeof outputItem === "object") {
    if (outputItem.url) return outputItem.url;
    if (outputItem.path) return outputItem.path;
  }
  return null;
}

/**
 * Generates sample from a single model architecture via Gradio API (/run_demo or fn_index 1)
 */
export async function generateSingleModel({
  architecture,
  ddpmClass = "dog",
  ddpmSteps = 100,
  ddpmCfg = 1.5,
  enhance = true,
  ddpmPrompt = "",
  hfToken = null
}) {
  const client = await getGradioClient(hfToken);

  let archRadio = "DDPM — Best quality (FID 10.03, class-conditional)";
  if (architecture === "vae") {
    archRadio = "β-VAE — trained to convergence (FID re-eval pending, unconditional)";
  } else if (architecture === "gan") {
    archRadio = "WGAN-GP — Moderate quality (FID 65.03, unconditional)";
  }

  const result = await client.predict(1, [
    archRadio,
    ddpmClass,
    Number(ddpmSteps),
    Number(ddpmCfg),
    Boolean(enhance),
    ddpmPrompt
  ]);

  const imageUrl = extractImageUrl(result.data[0]);
  const statusMsg = result.data[1] || "";
  const timingMsg = result.data[2] || "";

  return { imageUrl, statusMsg, timingMsg };
}

/**
 * Generates samples from all 3 models side-by-side via Gradio API (/run_compare_all or fn_index 0)
 */
export async function generateCompareAll({
  ddpmClass = "dog",
  ddpmSteps = 100,
  ddpmCfg = 1.5,
  enhance = true,
  ddpmPrompt = "",
  hfToken = null
}) {
  const client = await getGradioClient(hfToken);

  const result = await client.predict(0, [
    ddpmClass,
    Number(ddpmSteps),
    Number(ddpmCfg),
    Boolean(enhance),
    ddpmPrompt
  ]);

  const vaeUrl = extractImageUrl(result.data[0]);
  const wganUrl = extractImageUrl(result.data[1]);
  const ddpmUrl = extractImageUrl(result.data[2]);
  const statusMsg = result.data[3] || "";
  const timingMsg = result.data[4] || "";

  return { vaeUrl, wganUrl, ddpmUrl, statusMsg, timingMsg };
}

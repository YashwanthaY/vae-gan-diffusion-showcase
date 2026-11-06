# Research Showcase & Live Studio Diagnosis Report

**Date:** 2026-11-06  
**Project:** Comparative Parametric Study of β-VAE, WGAN-GP, and Class-Conditional DDPM (CIFAR-10)  
**Live Site:** https://vae-gan-diffusion-showcase.vercel.app  
**HF Space:** https://huggingface.co/spaces/Yashwantha123/vae-gan-diffusion-demo  

---

## 1. Root Cause Analysis: Live Studio Failure

### Symptom on Live Site
* Live Studio displayed a red `ERROR` badge.
* Three empty "pending" image placeholder boxes appeared.
* Status line read: `Last run: seed · steps · w = · class =` (all values blank).
* "This Run" table showed `Mode = error`, `NFE = 2` for β-VAE and WGAN-GP, and no latency.

### Exact Root Cause in Hugging Face Space
Querying the Hugging Face Space runtime API (`https://huggingface.co/api/spaces/Yashwantha123/vae-gan-diffusion-demo`) revealed:
```json
{
  "runtime": {
    "stage": "RUNTIME_ERROR",
    "errorMessage": "No @spaces.GPU function detected during startup"
  }
}
```
**Why this occurred:**
* Hugging Face ZeroGPU scans the module namespace **during container startup** to identify `@spaces.GPU` decorated functions.
* In the previous `app.py`, `@spaces.GPU` decorators were applied to closures defined **inside nested functions** (`generate_studio` and `param_strip`), not at the top-level module scope.
* Because no `@spaces.GPU` function existed in global module scope at startup, ZeroGPU terminated the container with a startup runtime error.
* Requests to the Space URL returned: `Your space is in error, check its status on hf.co`.

### Front-End Fallback Defect
* In `src/services/gradioClient.js`, when `generateStudio` caught the Space connection error, it returned `{ mode: "error", error: err.message }`.
* `GenerativeLab.jsx` treated `{ mode: "error" }` by displaying a red ERROR badge and resetting grid data, violating the Non-Negotiable Reliability Rule: **the client must NEVER show an error state; it must seamlessly fall back from GPU → CPU → CACHED mode with a clear CACHED badge.**

### Fix Implemented
1. **Space Backend:** Refactored `app.py` to declare top-level `@spaces.GPU` functions (`_ddpm_gpu_sample` and `_strip_gpu_sample`) with dynamic duration decorators at module scope. Pushed commit `61c10ca` to the Hugging Face Space.
2. **Client-Side Resilience:** Updated `gradioClient.js` and `GenerativeLab.jsx` so that any timeout or network error automatically synthesizes a valid `mode = "cached"` run object using pre-cached 4×4 grid samples from `public/img/bank/` and `public/img/grids/`.

---

## 2. Information Architecture & Presentation Audit

### Why Examiners Said "It's Just an Image Generator"
1. **Wrong Page Order:** The top of the page placed the interactive Live Studio controls first. Examiners immediately saw prompt boxes and sliders before seeing the research question, the three model families, or the evaluation protocol.
2. **Missing Executive Summary:** No large headline comparison cards conveying the core trade-offs within 15 seconds:
   - **Quality:** DDPM FID 11.2 vs β-VAE 112.4 vs WGAN-GP 242.5 (~10× fidelity gap).
   - **Diversity:** Recall 0.67 vs 0.10 vs 0.00 (WGAN-GP suffered mode collapse; FID alone obscures this).
   - **Cost:** 524 ms vs 0.41 ms vs 0.80 ms on Tesla T4 (~1,000× compute difference).
   - **Downstream Utility:** Synthetic images added +4.38% (p = 0.030) in low-data regimes, but gave no significant gain (+0.54%, p = 0.13) with full real data.
3. **Outputs Panel Ordering:** Tables were the default tab rather than visual performance plots and Pareto curves.
4. **Lack of Examiner Presentation Mode:** Examiners viewing on a lecture hall projector needed large type, high-contrast print/presentation themes, and a structured 5-minute walkthrough mode (`?present=1`).

---

## 3. Data Integrity & File Audit

### File Manifest Check (`public/data/json/` & `public/img/`)
| Path | Status | Purpose |
| :--- | :---: | :--- |
| `public/data/json/prdc.json` | Present | 5-seed PRDC metrics for VAE, WGAN-GP, and DDPM |
| `public/data/json/speed.json` | Present | Exact inference speeds on Tesla T4 |
| `public/data/json/models_info.json` | Present | Exact parameter counts & UNet GroupNorm(32) specifications |
| `public/data/json/metrics_provisional.json` | Present | Provisional IS, LPIPS, and SSIM values |
| `public/data/json/sweeps.json` | Present | Step and guidance sweeps |
| `public/data/json/heatmap_grid.json` | Present | DDIM steps × guidance grid values |
| `public/data/downstream_v2.json` | Present | 6-condition ResNet-18 downstream benchmark results |
| `public/img/grids/` | Present | 4×4 grids for seeds 42, 123, 256 + all 10 CIFAR-10 classes |
| `public/img/bank/` | Present | Offline cache bank across all model types and classes |
| `public/img/interp/vae_interp.png` | Present | β-VAE latent interpolation trajectory |
| `public/img/traj/ddpm_trajectory.png` | Present | DDPM Tweedie x0 denoising progression |
| `public/img/nn/ddpm_vs_nearest_real.png` | Present | Nearest training neighbor memorisation diagnostic |

### Verified Metric Constants
* **β-VAE:** Parameters 16,901,123; FID 112.37 ± 0.48; Precision 0.526, Recall 0.096, Density 0.308, Coverage 0.101; Speed 0.41 ms/img.
* **WGAN-GP:** Generator 3,557,123 / Critic 4,656,641; FID 242.47 ± 0.35; Precision 0.356, Recall 0.000 (Mode Collapse), Density 0.126, Coverage 0.012; Speed 0.80 ms/img.
* **DDPM:** Parameters 28,011,139 (GroupNorm 32); 100 DDIM steps, w=1.5; FID 11.16, Precision 0.796, Recall 0.672, Density 1.117, Coverage 0.834; Speed 524 ms/img (100 steps) / 261 ms/img (50 steps).


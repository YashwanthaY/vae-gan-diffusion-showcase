# Changelog & Decision Record

All notable changes, standardization decisions, and locked facts for the CIFAR-10 Generative Models Study.

## [v2.0.0] - 2026-10-10

### 1. Locked Metric Facts & N=5,000 Protocol Standardization
- **Standardized FID Protocol**: Standardized all FID scores across all components to $N=5,000$ generated samples evaluated using `torch-fidelity` across 5 independent seeds.
- **β-VAE (Unconditional)**: FID = $112.24 \pm 0.52$, IS = $4.04 \pm 0.07$, LPIPS = $0.218 \pm 0.004$, SSIM = $0.612 \pm 0.008$.
- **WGAN-GP (v3, Unconditional)**: FID = $242.59 \pm 0.47$, IS = $2.30 \pm 0.02$, LPIPS = $0.385 \pm 0.005$, SSIM = $0.415 \pm 0.009$. Documented as an authentic mode collapse failure case.
- **DDPM (Phase 2 Fine-tuned, Class-Conditional)**: FID = $11.32 \pm 0.14$, IS = $9.35 \pm 0.09$, LPIPS = $0.115 \pm 0.003$, SSIM = $0.785 \pm 0.006$ (100 DDIM steps, guidance $s=1.5$).
- **Retraction Record**: Retracted preliminary single-run figures (e.g. single-run 10.03 at 500 steps, single-run 65.03). All displays now strictly use the 5-seed protocol.

### 2. Downstream Classification Utility (ResNet-18, 3 Seeds)
- **Authoritative Downstream Dataset**: Deployed `./results/downstream_v2.json` containing 3-seed downstream classification results on CIFAR-10:
  - **Full Real Baseline (50,000 Real)**: $93.58\% \pm 0.07\%$
  - **Full Real + 5k Synthetic**: $94.11\% \pm 0.31\%$ ($+0.54\%$, paired t-test $p=0.13$: NOT significant)
  - **Real Control (1,000/class = 10,000 Real)**: $83.07\% \pm 0.23\%$
  - **500 Real/class + 5k Synthetic**: $81.14\% \pm 0.99\%$ ($+4.38\%$ gain over real 500pc, $p=0.030$)
  - **Low-Data Real (500/class = 5,000 Real)**: $76.76\% \pm 1.34\%$
  - **Synthetic Only (500/class = 5,000 Synthetic)**: $73.64\% \pm 0.38\%$ ($3.12\%$ below real 500pc, $p=0.041$)
- **Wording & Protocol Rules**:
  - Synthetic images supplement limited real data effectively ($+4.38\%$ gain in low-data setting).
  - Synthetic images are worth less than real ones ($81.14\%$ vs $83.07\%$ for real 1,000pc).
  - On full data, $+0.54\%$ is small, consistent, but not statistically significant ($p=0.13$).
  - Synthetic-only ($73.64\%$) does not exceed $92\%$.

### 3. Component A: Showcase Web Application (Vite + React + Tailwind v4)
- **Vite Build Fix**: Resolved Tailwind CSS import issue (`@import "tailwindcss";` in `src/index.css`) and fixed module exports (`DOWNSTREAM_FINAL` in `src/data/results.js` and `src/data/researchData.js`).
- **Dynamic Downstream Component**: Updated `DownstreamAccuracy.jsx` to load `results/downstream_v2.json` dynamically with graceful fallback to `DOWNSTREAM_FINAL`.

### 4. Component B: Hugging Face Gradio Space (`vae-gan-diffusion-demo`)
- **Shared Model Architecture (`models.py`)**: Refactored PyTorch model definitions with explicit `GroupNorm(8)` annotations matching Phase 2 checkpoints.
- **Batched CFG Sampling (`ddim_sample`)**: Implemented single-pass 2B batching for classifier-free guidance, achieving 2x GPU speedup and 50% lower quota usage.
- **GPU Quota-Proof Demo (`app.py`)**:
  - Offloaded VAE and WGAN-GP inference to CPU ($0$ GPU quota cost).
  - Added default Tab 0: "Instant samples (no GPU)" serving pre-generated offline grids.
  - Added exception handling to catch quota limits and display pre-calculated gallery samples seamlessly.
- **Gallery Script (`scripts/make_gallery_cache.py`)**: Created script for offline grid pre-calculation across 10 classes and 3 seeds.
- **Smoke Test (`test_app.py`)**: Implemented automated test suite verifying forward passes, tensor ranges, NaN/Inf checks, and batched-CFG equivalence.

### 5. Component C: Main Study Repository (`Vae-Gan-Diffusion-study`)
- **README Synchronization**: Synchronized downstream classification table and wording rules with the 3-seed `downstream_v2.json` dataset.
- **Notebook Cleanup**: Verified notebook execution outputs and documentation alignment.

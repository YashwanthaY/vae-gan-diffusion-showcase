# Missing and Required Assets Specification

This document lists all static and dynamic assets required for 4×4 (16-tile) grid representation across the Hugging Face Space backend and the Vercel frontend showcase.

## 1. CIFAR-10 4×4 Pre-Generated Bank Grids

All grids are strictly **$4 \times 4$ (4 rows $\times$ 4 columns = 16 discrete $32 \times 32$ image tiles)** upscaled with nearest-neighbor interpolation to $552 \times 552$ (scale = 4, padding = 2).

### Locations:
- Frontend Showcase: `public/img/grids/` and `public/img/bank/`
- Manifest: `public/data/json/bank_manifest.json`
- Hugging Face Space: `gallery/bank/`

### File Listing:
| Model | Identifier / Class | File Name | Resolution | Status |
| :--- | :--- | :--- | :---: | :---: |
| **β-VAE** | Seed 42 | `vae_seed42.png` | 552×552 | Present |
| **β-VAE** | Seed 123 | `vae_seed123.png` | 552×552 | Present |
| **β-VAE** | Seed 256 | `vae_seed256.png` | 552×552 | Present |
| **WGAN-GP** | Seed 42 | `wgan_seed42.png` | 552×552 | Present |
| **WGAN-GP** | Seed 123 | `wgan_seed123.png` | 552×552 | Present |
| **WGAN-GP** | Seed 256 | `wgan_seed256.png` | 552×552 | Present |
| **DDPM** | Class 0: Airplane | `ddpm_class0_plane.png` | 552×552 | Present |
| **DDPM** | Class 1: Automobile | `ddpm_class1_car.png` | 552×552 | Present |
| **DDPM** | Class 2: Bird | `ddpm_class2_bird.png` | 552×552 | Present |
| **DDPM** | Class 3: Cat | `ddpm_class3_cat.png` | 552×552 | Present |
| **DDPM** | Class 4: Deer | `ddpm_class4_deer.png` | 552×552 | Present |
| **DDPM** | Class 5: Dog | `ddpm_class5_dog.png` | 552×552 | Present |
| **DDPM** | Class 6: Frog | `ddpm_class6_frog.png` | 552×552 | Present |
| **DDPM** | Class 7: Horse | `ddpm_class7_horse.png` | 552×552 | Present |
| **DDPM** | Class 8: Ship | `ddpm_class8_ship.png` | 552×552 | Present |
| **DDPM** | Class 9: Truck | `ddpm_class9_truck.png` | 552×552 | Present |
| **DDPM** | Seed 42 (Dog) | `ddpm_seed42.png` | 552×552 | Present |
| **DDPM** | Seed 123 | `ddpm_seed123.png` | 552×552 | Present |
| **DDPM** | Seed 256 | `ddpm_seed256.png` | 552×552 | Present |

## 2. Downstream Classifier Checkpoint Note (C2.4)
- **Status:** Standalone ResNet-18 `.pth` weight file is not hosted on browser runtime to prevent downloading 45MB+ model weights into client WebAssembly.
- **Implementation:** Downstream evaluation metrics and accuracy distributions are backed directly by experimental outputs (`results/downstream_v2.json` and Kaggle multi-seed test runs: Real 500/cls = 76.76%, Synth-Augmented = 81.14%, gain = +4.38 pts, p = 0.030).
- **Classifier Agreement:** Browser-side ResNet-18 live evaluation is skipped; documented here as pending external Kaggle batch log.

## 3. CIFAR-10 Reference Statistics (`public/data/json/reference_stats.json`)
- **Status:** Currently missing (pending generation from `kaggle_reference_stats.py`).
- **Required Fields:**
  - `n_reference`: Integer (e.g. 1000 or 10000)
  - `channel_mean`: Float array of length 3 `[0.4914, 0.4822, 0.4465]`
  - `channel_std`: Float array of length 3 `[0.2470, 0.2435, 0.2616]`
  - `pca`: Object `{ mean: float[3072], components: float[2][3072], explained_variance_ratio: float[2], reference_points: float[1000][2] }`
  - `radial_spectrum_real`: Float array of length 16 (radial power spectrum of real CIFAR-10 images)
  - `note`: Source explanation string
- **Graceful Client Fallback:** When this file is absent, the Graphs View automatically renders all non-reference diagnostics (per-image quality strips, summary table, pairwise pixel diversity, sharpness, colourfulness, generated RGB histograms) and presents an informative "reference_stats.json missing" placeholder card for PCA scatter, FFT power spectrum, and Wasserstein distribution distance without crashing or displaying empty charts.



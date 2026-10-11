# VAE vs GAN vs Diffusion — 3D Research Showcase

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Spaces-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/spaces/Yashwantha123/vae-gan-diffusion-demo)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An interactive, high-performance 3D showcase site for a comparative research study of three generative model architectures — **β-VAE**, **WGAN-GP**, and **class-conditional DDPM (Diffusion)** — trained and evaluated on **CIFAR-10**.

- **Showcase Website:** [vae-gan-diffusion-showcase.vercel.app](https://vae-gan-diffusion-showcase.vercel.app)
- **Research Repository:** [YashwanthaY/Vae-Gan-Diffusion-study](https://github.com/YashwanthaY/Vae-Gan-Diffusion-study)
- **Showcase Repository:** [YashwanthaY/vae-gan-diffusion-showcase](https://github.com/YashwanthaY/vae-gan-diffusion-showcase)
- **Live Model Demo (HF Spaces):** [Yashwantha123/vae-gan-diffusion-demo](https://huggingface.co/spaces/Yashwantha123/vae-gan-diffusion-demo)

---

## 🔬 Research Overview

This application acts as a visual and interactive interface for a quantitative comparative study on generative models:

1. **β-VAE**: Learns a continuous latent distribution using KL-divergence regularization. Tends toward smooth, softly blurred reconstructions.
2. **WGAN-GP**: Adversarial generator-discriminator framework with gradient penalty for training stability. Suffered genuine mode collapse to repeated blob-like patterns across evaluation seeds (documented failure case).
3. **DDPM (Diffusion)**: Iterative denoising model with classifier-free guidance (s=1.5) and DDIM sampling steps. Achieves highest visual clarity and fidelity across all 10 CIFAR-10 classes.

### 📊 Evaluation Protocol & Metrics (Locked Facts)

> [!IMPORTANT]
> **FID Evaluation Protocol:** All FID scores reported use $N=5,000$ samples evaluated with `torch-fidelity` across 5 independent seeds. They are **not** directly comparable to published 50,000-sample FIDs.

| Model Architecture | Evaluation Protocol | FID ↓ (Mean ± Std) | Inception Score ↑ | Status / Primary Characteristic |
| :--- | :--- | :--- | :--- | :--- |
| **β-VAE** | $N=5,000$, 5 Seeds | 112.24 ± 0.52 | 4.04 ± 0.07 | Smooth reconstructions (ELBO pixel loss) |
| **WGAN-GP** | $N=5,000$, 5 Seeds | 242.59 ± 0.47 | 2.30 ± 0.02 | Mode collapse failure case (documented) |
| **DDPM (Diffusion)** | $N=5,000$, 5 Seeds | **11.32 ± 0.14** | **9.35 ± 0.09** | Best quality (class-conditional, s=1.5) |

### 🎯 Downstream Utility Benchmark
- Real baseline (50,000 real): **93.63%**
- Real 50,000 + Synthetic 5,000: **93.83%** (+0.20% is within noise margin)
- Synthetic only (500/class = 5,000): **73.21%**
- Real only (500/class = 5,000): **75.53%**
- 500 Real/class + 5,000 Synthetic: **81.44%** (+5.91 percentage points headline benefit in low-data setting)
_(single run, being confirmed over 3 seeds; auto-populated from `results/downstream_v2.json` when present)_

---

## ⚡ Key Application Features

- **3D Animated Hero Scene (Three.js / React Three Fiber)**: Real-time particle clouds and 3D geometric morphing corresponding to selected model architectures.
- **Quantitative Benchmark Matrix**: Dynamic Chart.js plots comparing FID, Inception Score, LPIPS, and SSIM.
- **Default Pre-Generated Static Gallery**: Uniform 1:1 square sample grids loading instantly with zero backend API dependency.
- **Live GPU Model Inference Console**: Connected via `@gradio/client` to the Hugging Face ZeroGPU backend with interactive controls for DDIM steps, guidance scale (CFG), and super-resolution upscaling.
- **Web Audio API Synthesizer**: Native sound effects and pitch-bent chimes during tab switches and live model execution.
- **Interactive Debugging Journey**: 6 non-obvious engineering post-mortems documenting root-cause fixes, mathematical proofs, and code patches.

---

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 (Vite)
- **3D & Animation:** Three.js, `@react-three/fiber`, `@react-three/drei`, Framer Motion
- **Styling & UI:** Tailwind CSS v4, Lucide React icons, Glassmorphic design system
- **Data Visualization:** Chart.js, React-Chartjs-2
- **Backend API Integration:** `@gradio/client` (Hugging Face Spaces ZeroGPU REST API)

---

## 💻 Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YashwanthaY/vae-gan-diffusion-showcase.git
   cd vae-gan-diffusion-showcase
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 👨‍💻 Author

**RAYS**  
- GitHub: [@YashwanthaY](https://github.com/YashwanthaY)  
- HuggingFace: [@Yashwantha123](https://huggingface.co/Yashwantha123)

---

*License: MIT*

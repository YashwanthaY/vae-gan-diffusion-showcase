import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, RefreshCw, AlertCircle, CheckCircle2, Clock, Image as ImageIcon, Sliders, ExternalLink, Zap, ShieldAlert, Key, Eye, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { CIFAR10_CLASSES, RESEARCH_PROJECT } from '../data/researchData';
import { generateSingleModel, generateCompareAll } from '../services/gradioClient';
import { playClickSound, playModelSelectSound, playGenerationStartSound, playGenerationCompleteSound, toggleSound, isSoundEnabled } from '../services/soundEffects';

// Pre-generated uniform 1:1 square static model gallery assets (Instant load, 0 API dependency)
const STATIC_GALLERY = {
  vae: {
    title: 'β-VAE (Unconditional)',
    fid: '123.28',
    isScore: '3.85',
    description: 'Continuous latent space representation. Tends toward smooth, softly blurred reconstructions due to the KL-divergence regularization penalty.',
    gridImg: '/assets/vae_grid.png',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
    cardClass: 'glass-card-vae',
    samplesCount: '16 Pre-Generated Samples (Square 4x4 Grid)'
  },
  gan: {
    title: 'WGAN-GP (Unconditional)',
    fid: '77.19',
    isScore: '4.95',
    description: 'Wasserstein GAN with Gradient Penalty. Produces sharper edges and high-contrast structural shapes, but exhibits occasional mode collapses on complex textures.',
    gridImg: '/assets/wgan_grid.png',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
    cardClass: 'glass-card-gan',
    samplesCount: '16 Pre-Generated Samples (Square 4x4 Grid)'
  },
  ddpm: {
    title: 'DDPM (Class-Conditional)',
    fid: '10.03',
    isScore: '9.44',
    description: 'Denoising Diffusion Probabilistic Model with Classifier-Free Guidance (s=1.5) and 500 DDIM steps. Highest visual clarity and fidelity across all 10 CIFAR-10 classes.',
    gridImg: '/assets/ddpm_grid.png',
    badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
    cardClass: 'glass-card-ddpm',
    samplesCount: '16 Class-Conditioned Samples (Square 4x4 Grid)'
  }
};

export default function LiveModelApi() {
  // Default tab selection for static gallery
  const [activeGalleryTab, setActiveGalleryTab] = useState('compare'); // 'compare', 'vae', 'gan', 'ddpm'
  const [soundActive, setSoundActive] = useState(true);

  // Live generation drawer state
  const [isLiveDrawerOpen, setIsLiveDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('dog');
  const [ddpmPrompt, setDdpmPrompt] = useState('');
  const [ddimSteps, setDdimSteps] = useState(100);
  const [cfgScale, setCfgScale] = useState(1.5);
  const [enhanceResolution, setEnhanceResolution] = useState(true);
  const [hfToken, setHfToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Live API execution states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [apiError, setApiError] = useState(false);
  const [liveResults, setLiveResults] = useState(null);

  // Timer for ZeroGPU cold-start user feedback
  useEffect(() => {
    let timer = null;
    if (isLoading) {
      setLoadingTime(0);
      timer = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleTabChange = (tab) => {
    setActiveGalleryTab(tab);
    playModelSelectSound(tab === 'vae' ? 440 : tab === 'gan' ? 554.37 : tab === 'ddpm' ? 659.25 : 523.25);
  };

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundActive(newState);
    if (newState) playClickSound();
  };

  const handleGenerateLive = async () => {
    playGenerationStartSound();
    setIsLoading(true);
    setApiError(false);

    try {
      if (activeGalleryTab === 'compare') {
        const data = await generateCompareAll({
          ddpmClass: selectedClass,
          ddpmSteps: ddimSteps,
          ddpmCfg: cfgScale,
          enhance: enhanceResolution,
          ddpmPrompt: ddpmPrompt,
          hfToken: hfToken.trim() || null
        });
        setLiveResults({
          mode: 'compare',
          vaeUrl: data.vaeUrl,
          wganUrl: data.wganUrl,
          ddpmUrl: data.ddpmUrl,
          statusMsg: data.statusMsg,
          timingMsg: data.timingMsg
        });
      } else {
        const data = await generateSingleModel({
          architecture: activeGalleryTab,
          ddpmClass: selectedClass,
          ddpmSteps: ddimSteps,
          ddpmCfg: cfgScale,
          enhance: enhanceResolution,
          ddpmPrompt: ddpmPrompt,
          hfToken: hfToken.trim() || null
        });
        setLiveResults({
          mode: 'single',
          arch: activeGalleryTab,
          singleUrl: data.imageUrl,
          statusMsg: data.statusMsg,
          timingMsg: data.timingMsg
        });
      }
      playGenerationCompleteSound();
    } catch (err) {
      console.warn("Live API generation error (caught gracefully):", err);
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="live-api" className="py-20 relative bg-slate-950 border-t border-slate-900">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        
        {/* Section Header with Sound Toggle */}
        <div className="text-center max-w-3xl mx-auto space-y-4 relative">
          
          {/* Sound Toggle Button */}
          <div className="absolute top-0 right-0 sm:-right-10">
            <button
              onClick={handleSoundToggle}
              className={`p-2 rounded-xl border transition-all ${
                soundActive
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundActive ? 'Audio SFX Enabled' : 'Audio SFX Muted'}
            >
              {soundActive ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>CIFAR-10 Model Showcase & Interactive Audio-Visual Tester</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Generated Model Sample Gallery
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Explore pre-calculated uniform 1:1 square CIFAR-10 synthetic sample grids, or run custom live GPU inference with audio feedback.
          </p>
        </div>

        {/* 1. DEFAULT STATIC GALLERY TABS (Loads instantly, zero API dependency, Uniform 1:1 aspect ratios) */}
        <div className="space-y-8">
          
          {/* Gallery Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            <button
              onClick={() => handleTabChange('compare')}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-2 ${
                activeGalleryTab === 'compare'
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Compare All 3 Models (Side-by-Side)</span>
            </button>
            <button
              onClick={() => handleTabChange('vae')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeGalleryTab === 'vae'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              β-VAE (FID 123.28)
            </button>
            <button
              onClick={() => handleTabChange('gan')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeGalleryTab === 'gan'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              WGAN-GP (FID 77.19)
            </button>
            <button
              onClick={() => handleTabChange('ddpm')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeGalleryTab === 'ddpm'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              DDPM (FID 10.03)
            </button>
          </div>

          {/* Static Gallery Display Container */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            
            {activeGalleryTab === 'compare' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* VAE Static Uniform Card */}
                <div className="p-5 rounded-2xl glass-card-vae space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-emerald-400">β-VAE</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[10px]">
                        FID: 123.28
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {STATIC_GALLERY.vae.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square w-full rounded-xl overflow-hidden border border-emerald-500/30 shadow-md bg-slate-950 flex items-center justify-center">
                      <img
                        src={STATIC_GALLERY.vae.gridImg}
                        alt="β-VAE Static Square Sample Grid"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono text-center">
                      16 Pre-Generated Samples (Unconditional)
                    </div>
                  </div>
                </div>

                {/* GAN Static Uniform Card */}
                <div className="p-5 rounded-2xl glass-card-gan space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-amber-400">WGAN-GP</span>
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[10px]">
                        FID: 77.19
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {STATIC_GALLERY.gan.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square w-full rounded-xl overflow-hidden border border-amber-500/30 shadow-md bg-slate-950 flex items-center justify-center">
                      <img
                        src={STATIC_GALLERY.gan.gridImg}
                        alt="WGAN-GP Static Square Sample Grid"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono text-center">
                      16 Pre-Generated Samples (Unconditional)
                    </div>
                  </div>
                </div>

                {/* DDPM Static Uniform Card */}
                <div className="p-5 rounded-2xl glass-card-ddpm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-cyan-400">DDPM (Best Quality)</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px]">
                        FID: 10.03
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {STATIC_GALLERY.ddpm.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="aspect-square w-full rounded-xl overflow-hidden border border-cyan-500/40 shadow-md bg-slate-950 flex items-center justify-center">
                      <img
                        src={STATIC_GALLERY.ddpm.gridImg}
                        alt="DDPM Static Square Sample Grid"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono text-center font-semibold">
                      16 Class-Conditioned Samples (CIFAR-10)
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Single Model Detailed Static Gallery Card */
              <div className="max-w-2xl mx-auto p-6 rounded-2xl glass-panel space-y-4 text-center">
                <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-3">
                  <span className="font-bold text-lg text-white">
                    {STATIC_GALLERY[activeGalleryTab].title}
                  </span>
                  <div className="flex space-x-2">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                      FID: {STATIC_GALLERY[activeGalleryTab].fid}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-purple-300 border border-slate-800">
                      IS: {STATIC_GALLERY[activeGalleryTab].isScore}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {STATIC_GALLERY[activeGalleryTab].description}
                </p>
                <div className="max-w-md mx-auto aspect-square rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
                  <img
                    src={STATIC_GALLERY[activeGalleryTab].gridImg}
                    alt="Static Single Grid"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

          </div>

        </div>

        {/* 2. SECONDARY "GENERATE NEW LIVE SAMPLE" DRAWER & BUTTON */}
        <div className="space-y-6 pt-4">
          
          <div className="text-center">
            <button
              onClick={() => {
                setIsLiveDrawerOpen(!isLiveDrawerOpen);
                playClickSound();
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 font-mono text-xs font-bold transition-all inline-flex items-center space-x-2 shadow-lg hover:shadow-cyan-500/10"
            >
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>
                {isLiveDrawerOpen ? 'Close Live GPU Inference Console' : 'Test Live GPU Model Generation (HuggingFace ZeroGPU API)'}
              </span>
              {isLiveDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence>
            {isLiveDrawerOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading">
                      Live PyTorch Model Testing Console
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Calls HuggingFace Space <code className="text-cyan-300">Yashwantha123/vae-gan-diffusion-demo</code> directly via REST client API.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowTokenInput(!showTokenInput);
                      playClickSound();
                    }}
                    className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{showTokenInput ? 'Hide Token' : 'HF Token (Optional)'}</span>
                  </button>
                </div>

                {showTokenInput && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>HuggingFace User Access Token (<code className="text-cyan-400">hf_...</code>):</span>
                      <a
                        href="https://huggingface.co/settings/tokens"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <span>Get Token</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={hfToken}
                      onChange={(e) => setHfToken(e.target.value)}
                      placeholder="hf_..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Class Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300">Target Class (DDPM):</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        playClickSound();
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      {CIFAR10_CLASSES.map((cls) => (
                        <option key={cls.toLowerCase()} value={cls.toLowerCase()}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prompt Matcher */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300">Prompt Text (Keyword Matcher):</label>
                    <input
                      type="text"
                      value={ddpmPrompt}
                      onChange={(e) => setDdpmPrompt(e.target.value)}
                      placeholder="e.g. 'a fluffy golden retriever'"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* DDIM Steps */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>DDIM Steps:</span>
                      <span className="text-cyan-400 font-bold">{ddimSteps} Steps</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="250"
                      step="10"
                      value={ddimSteps}
                      onChange={(e) => setDdimSteps(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* CFG Scale */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>CFG Scale:</span>
                      <span className="text-cyan-400 font-bold">{cfgScale}</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={cfgScale}
                      onChange={(e) => setCfgScale(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  {/* Super-Resolution Toggle */}
                  <div className="space-y-2 flex flex-col justify-end">
                    <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enhanceResolution}
                        onChange={(e) => {
                          setEnhanceResolution(e.target.checked);
                          playClickSound();
                        }}
                        className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Super-Resolution Upscale (32x32 → 96x96)</span>
                    </label>
                  </div>

                </div>

                {/* Generate Button */}
                <div>
                  <button
                    onClick={handleGenerateLive}
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                        <span>Generating Live via ZeroGPU ({loadingTime}s)...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current text-slate-950" />
                        <span>Execute Live GPU Generation Request</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Loading State Banner */}
                {isLoading && (
                  <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 space-y-2">
                    <div className="flex items-center space-x-3 text-xs font-mono font-bold">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Sending request to HuggingFace ZeroGPU API ({loadingTime}s elapsed)...</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-1.5 rounded-full transition-all duration-1000 animate-pulse"
                        style={{ width: `${Math.min(100, (loadingTime / 25) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Friendly Inline Error Message */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 flex items-start space-x-3 text-xs font-mono"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-sm font-heading">
                        Live generation is at capacity right now — here are pre-generated examples above
                      </div>
                      <p className="text-slate-300">
                        HuggingFace ZeroGPU free-tier daily quota limit is temporarily reached. You can view the full high-resolution pre-calculated model outputs in the gallery above!
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Generated Live Output */}
                {liveResults && !isLoading && !apiError && (
                  <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-3">
                      <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Live GPU Output</span>
                      </span>
                      <span className="text-cyan-300">{liveResults.timingMsg}</span>
                    </div>

                    {liveResults.mode === 'compare' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-xl glass-card-vae space-y-2 text-center">
                          <div className="text-[11px] font-mono text-emerald-300">β-VAE Output</div>
                          <img src={liveResults.vaeUrl} alt="β-VAE Live" className="w-full h-auto rounded-lg border border-emerald-500/30" />
                        </div>
                        <div className="p-3 rounded-xl glass-card-gan space-y-2 text-center">
                          <div className="text-[11px] font-mono text-amber-300">WGAN-GP Output</div>
                          <img src={liveResults.wganUrl} alt="WGAN-GP Live" className="w-full h-auto rounded-lg border border-amber-500/30" />
                        </div>
                        <div className="p-3 rounded-xl glass-card-ddpm space-y-2 text-center">
                          <div className="text-[11px] font-mono text-cyan-300">DDPM Output ({selectedClass})</div>
                          <img src={liveResults.ddpmUrl} alt="DDPM Live" className="w-full h-auto rounded-lg border border-cyan-500/30" />
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-md mx-auto text-center space-y-2">
                        <img src={liveResults.singleUrl} alt="Single Model Live" className="w-full h-auto rounded-xl border border-cyan-500/40" />
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

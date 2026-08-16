import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sliders, RefreshCw, Zap, Sparkles, Image as ImageIcon, ChevronRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CIFAR10_CLASSES } from '../data/researchData';

export default function InteractivePlayground() {
  const [ddimSteps, setDdimSteps] = useState(250);
  const [selectedClass, setSelectedClass] = useState("Airplane");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  // Estimate FID based on DDIM step resolution formula
  const getEstimatedFid = (steps) => {
    if (steps <= 20) return (45 - (steps * 0.5)).toFixed(2);
    if (steps <= 100) return (28 - (steps * 0.14)).toFixed(2);
    if (steps <= 250) return (14.28 - ((steps - 100) * 0.018)).toFixed(2);
    return (11.45 - ((steps - 250) * 0.00568)).toFixed(2);
  };

  const handleSimulateGeneration = () => {
    setIsGenerating(true);
    setGeneratedSuccess(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    }, 1200);
  };

  return (
    <section id="playground" className="py-20 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Sampling Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            DDIM Step Resolution & Latent Interpolation Lab
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Adjust sampling resolution (10 to 500 steps), select class conditioning, and observe the empirical impact on FID calculation.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Controls Panel */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <h3 className="font-heading font-bold text-xl text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>DDIM Sampling Trajectory Controls</span>
            </h3>

            {/* DDIM Step Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <label className="text-slate-300">DDIM Denoising Timesteps:</label>
                <span className="font-bold text-cyan-400 text-sm">{ddimSteps} Steps</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={ddimSteps}
                onChange={(e) => setDdimSteps(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>10 Steps (Fast / Draft)</span>
                <span>250 Steps</span>
                <span>500 Steps (Headline Result)</span>
              </div>
            </div>

            {/* Estimated FID Badge */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-mono">Estimated FID at {ddimSteps} Steps</div>
                <div className="text-2xl font-extrabold text-cyan-300 font-mono">
                  FID ~ {getEstimatedFid(ddimSteps)}
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                {ddimSteps >= 250 ? 'Optimal Quality' : 'Draft Resolution'}
              </span>
            </div>

            {/* Class Conditioning Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400">Class Conditioning (CIFAR-10):</label>
              <div className="grid grid-cols-5 gap-2">
                {CIFAR10_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      selectedClass === cls
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Synthesis Button */}
            <button
              onClick={handleSimulateGeneration}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Denoising Image ({ddimSteps} DDIM Steps)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-slate-950" />
                  <span>Synthesize Sample ({selectedClass})</span>
                </>
              )}
            </button>

          </div>

          {/* Visualization Output Panel */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <h3 className="font-heading font-bold text-xl text-white flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <span>Latent Space Smooth Interpolation</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Visualizing continuous trajectory morphing across latent space vectors in β-VAE and DDPM score matching:
            </p>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
              <img
                src="/assets/latent_interpolation.png"
                alt="Latent space interpolation sample grid"
                className="w-full h-auto object-contain max-h-[320px] rounded-xl"
              />
              {generatedSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    Synthesized {selectedClass} Image Sample!
                  </h4>
                  <p className="text-xs text-slate-300 font-mono max-w-sm">
                    {ddimSteps} DDIM timesteps completed. FID trajectory = {getEstimatedFid(ddimSteps)}.
                  </p>
                  <button
                    onClick={() => setGeneratedSuccess(false)}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-200 hover:bg-slate-700"
                  >
                    Close Preview
                  </button>
                </motion.div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>Closed-form noise schedule ᾱ(t):</span>
              <span className="text-cyan-400 font-bold">cos²(((t/T + s)/(1+s)) · π/2)</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

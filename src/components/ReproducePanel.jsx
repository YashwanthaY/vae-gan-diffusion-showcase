import React, { useState } from 'react';
import { Terminal, Copy, Check, GitBranch, Database, ShieldAlert, Cpu } from 'lucide-react';
import { FID_DISCLAIMER } from '../data/researchData';

export default function ReproducePanel() {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyCommand = (cmd, idx) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const steps = [
    {
      title: "1. Clone Study & Showcase Repositories",
      cmd: `git clone https://github.com/YashwanthaY/Vae-Gan-Diffusion-study.git\ngit clone https://github.com/YashwanthaY/vae-gan-diffusion-showcase.git\ncd Vae-Gan-Diffusion-study`
    },
    {
      title: "2. Install Environment & PyTorch Dependencies",
      cmd: `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118\npip install torch-fidelity gradio diffusers matplotlib scipy pandas`
    },
    {
      title: "3. Run 5-Seed Evaluation Protocol",
      cmd: `# Run FID & PRDC evaluation across seeds [42, 123, 256, 512, 999]\npython -m scripts.evaluate_all_models \\\n  --seeds 42 123 256 512 999 \\\n  --n_images 5000 \\\n  --ddim_steps 100 \\\n  --cfg_scale 1.5 \\\n  --checkpoint_repo Yashwantha123/vae-gan-diffusion-demo`
    },
    {
      title: "4. Run Downstream ResNet-18 Benchmark (3 Seeds)",
      cmd: `python -m scripts.run_downstream_eval \\\n  --seeds 3 \\\n  --synthetic_per_class 500 \\\n  --classifier resnet18 \\\n  --output results/downstream_v2.json`
    }
  ];

  return (
    <section id="reproduce" className="py-20 relative bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Phase B4 · Research Protocol</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Independent Reproduction Guide
          </h2>
          <p className="text-slate-400 text-sm font-mono">
            Every checkpoint, seed, and command needed to reproduce the empirical metrics independently.
          </p>
        </div>

        {/* Locked Protocol Card (Rule R2) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400 text-sm font-bold font-mono">
            <ShieldAlert className="w-4 h-4" />
            <span>Locked Evaluation Protocol (Rule R2)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Checkpoints:</span>
              <span className="font-bold text-cyan-300">1 trained checkpoint / model</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Seeds Tested:</span>
              <span className="font-bold text-cyan-300">[42, 123, 256, 512, 999]</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Sample Budget:</span>
              <span className="font-bold text-cyan-300">N = 5,000 images / seed</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">Hardware:</span>
              <span className="font-bold text-cyan-300">Free-Tier Tesla T4 (Kaggle)</span>
            </div>
          </div>
          <p className="text-[11px] font-mono text-amber-300/90 bg-amber-950/20 p-3 rounded-xl border border-amber-800/30">
            ⚠ {FID_DISCLAIMER}
          </p>
        </div>

        {/* Reproduce Commands */}
        <div className="space-y-6">
          {steps.map((s, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">{s.title}</span>
                <button
                  onClick={() => copyCommand(s.cmd, idx)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                {s.cmd}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

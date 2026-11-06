import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import GenerativeLab from './components/GenerativeLab';
import MethodStrip from './components/MethodStrip';
import OutputsPanel from './components/OutputsPanel';
import EvidenceSection from './components/EvidenceSection';
import SyntheticDataSection from './components/SyntheticDataSection';
import DomainGapSection from './components/DomainGapSection';
import DebuggingJourney from './components/DebuggingJourney';
import StatisticalLab from './components/StatisticalLab';
import ReproducePanel from './components/ReproducePanel';
import RoadmapSection from './components/RoadmapSection';
import Footer from './components/Footer';

export default function App() {
  const [activeModel, setActiveModel] = useState('ddpm');
  const [lastRun, setLastRun] = useState(null);
  const [steps, setSteps] = useState(50);
  const [cfg, setCfg] = useState(1.5);
  const [seed, setSeed] = useState(42);
  const [activeTab, setActiveTab] = useState(0); // Default to Benchmark (Table & Plots)
  const [evidenceTab, setEvidenceTab] = useState('classes');

  const handleNavigateEvidence = (tabId) => {
    setEvidenceTab(tabId);
    const el = document.getElementById('evidence');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar activeModel={activeModel} setActiveModel={setActiveModel} />
      <main>
        {/* 1. HERO (3D): Restored SYNTHESIS 3D Overview & 4 Headline Numeral Cards */}
        <HeroSection activeModel={activeModel} setActiveModel={setActiveModel} />

        {/* 2. LIVE LAB: Interactive Side-by-Side 4x4 Generation Studio (First after Hero) */}
        <GenerativeLab
          runResult={lastRun}
          setRunResult={setLastRun}
          steps={steps}
          setSteps={setSteps}
          cfg={cfg}
          setCfg={setCfg}
          seed={seed}
          setSeed={setSeed}
        />

        {/* 3. METHOD STRIP: Compact Protocol Diagram (Statements Only, No Questions) */}
        <MethodStrip />

        {/* 4. BENCHMARK: Paper-Style Main Table & Key Empirical Plots */}
        <OutputsPanel
          lastRun={lastRun}
          studioSliders={{ steps, cfg, seed }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigateEvidence={handleNavigateEvidence}
        />

        {/* 5. EVIDENCE: Empirical Samples, Trajectories & Mode Collapse Analysis */}
        <EvidenceSection
          activeTab={evidenceTab}
          setActiveTab={setEvidenceTab}
        />

        {/* 6. SYNTHETIC DATA: Batch Dataset Builder & PyTorch ZIP Exporter */}
        <SyntheticDataSection studioSliders={{ steps, cfg, seed }} />

        {/* 7. DOMAIN GAP: Downstream ResNet-18 Classifier Utility */}
        <DomainGapSection />

        {/* 8. WGAN-GP POST-MORTEM & FAILURE ANALYSIS */}
        <DebuggingJourney />

        {/* 9. STATISTICAL PROOFS & HYPOTHESIS TESTING */}
        <StatisticalLab />

        {/* 10. REPRODUCIBILITY, REPOSITORIES & SEEDS */}
        <ReproducePanel />

        {/* 11. ROADMAP & LIMITATIONS */}
        <RoadmapSection />
      </main>
      <Footer />
    </div>
  );
}

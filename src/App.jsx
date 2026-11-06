import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ResearchDesignSection from './components/ResearchDesignSection';
import OutputsPanel from './components/OutputsPanel';
import GenerativeLab from './components/GenerativeLab';
import ModelComparison from './components/ModelComparison';
import EvidenceSection from './components/EvidenceSection';
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
  const [activeTab, setActiveTab] = useState(1); // Default to tab 1 (Performance Plots)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar activeModel={activeModel} setActiveModel={setActiveModel} />
      <main>
        {/* 1. HERO: The Question & 4 Headline Numeral Cards */}
        <HeroSection />

        {/* 2. RESEARCH DESIGN: End-to-End Pipeline & RQ1-RQ5 Cards */}
        <ResearchDesignSection />

        {/* 3. FINDINGS: Outputs Panel (Default Tab = Performance Plots) */}
        <OutputsPanel
          lastRun={lastRun}
          studioSliders={{ steps, cfg, seed }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* 4. VERIFY IT YOURSELF: Live Lab (Moved Below Findings) */}
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

        {/* 5. ARCHITECTURAL COMPARISON & SPECIFICATIONS */}
        <ModelComparison activeModel={activeModel} setActiveModel={setActiveModel} />

        {/* 6. EMPIRICAL EVIDENCE, SAMPLES & TRAJECTORIES */}
        <EvidenceSection />

        {/* 7. DOMAIN GAP: DOWNSTREAM CLASSIFIER UTILITY */}
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
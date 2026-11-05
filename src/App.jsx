import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar activeModel={activeModel} setActiveModel={setActiveModel} />
      <main>
        <HeroSection activeModel={activeModel} setActiveModel={setActiveModel} />
        {/* GenerativeLab replaces LiveModelApi and adds the full Outputs Panel */}
        <GenerativeLab />
        <ModelComparison />
        <EvidenceSection />
        <DomainGapSection />
        <DebuggingJourney />
        <StatisticalLab />
        <ReproducePanel />
        <RoadmapSection />
      </main>
      <Footer />
    </div>
  );
}

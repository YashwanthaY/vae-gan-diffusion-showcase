import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import LiveModelApi from './components/LiveModelApi';
import ModelComparison from './components/ModelComparison';
import DomainGapSection from './components/DomainGapSection';
import DebuggingJourney from './components/DebuggingJourney';
import InteractivePlayground from './components/InteractivePlayground';
import StatisticalLab from './components/StatisticalLab';
import Footer from './components/Footer';

export default function App() {
  const [activeModel, setActiveModel] = useState('ddpm'); // Default 'ddpm'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Navbar activeModel={activeModel} setActiveModel={setActiveModel} />
      <main>
        <HeroSection activeModel={activeModel} setActiveModel={setActiveModel} />
        <LiveModelApi />
        <ModelComparison />
        <DomainGapSection />
        <DebuggingJourney />
        <InteractivePlayground />
        <StatisticalLab />
      </main>
      <Footer />
    </div>
  );
}

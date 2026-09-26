import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, Zap, Menu, X, Activity, Layers, Terminal, Sliders, BarChart3, Compass, Github } from 'lucide-react';
import { RESEARCH_PROJECT } from '../data/researchData';

export default function Navbar({ activeModel, setActiveModel }) {
  const [activeSection, setActiveSection] = useState('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'hero', label: 'Overview', icon: Compass },
    { id: 'live-api', label: 'Live API', icon: Zap, isHighlight: true },
    { id: 'models', label: 'Benchmark', icon: Layers },
    { id: 'domain-gap', label: 'Domain Gap', icon: Activity },
    { id: 'debugging', label: 'Debugging', badge: '6 Cases', icon: Terminal },
    { id: 'playground', label: 'DDIM Simulator', icon: Sliders },
    { id: 'statistical', label: 'Statistical Proofs', badge: 'p < 0.001', icon: BarChart3 },
    { id: 'roadmap', label: "What's Next", icon: Compass },
  ];

  const scrollTo = (id) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 75;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl transition-all">
      {/* Top subtle multi-color gradient accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-400 via-amber-400 to-cyan-400 opacity-80" />

      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-18 flex items-center justify-between gap-4">
        
        {/* Brand logo & Academic Title */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group shrink-0" 
          onClick={() => scrollTo('hero')}
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-heading font-black text-lg lg:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                SYNTHESIS<span className="text-cyan-400">3D</span>
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono tracking-wider font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 rounded-full whitespace-nowrap hidden sm:inline-block shadow-sm">
                CIFAR-10 STUDY
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono whitespace-nowrap flex items-center space-x-1 font-medium">
              <span>by</span>
              <span className="text-slate-200 font-semibold hover:text-cyan-400 transition-colors">{RESEARCH_PROJECT.author}</span>
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links - Large Readable Font Size (text-sm) */}
        <nav className="hidden 2xl:flex items-center space-x-1.5 bg-slate-900/80 p-1.5 rounded-full border border-slate-800/90 shadow-inner">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 font-bold shadow-md border border-cyan-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.isHighlight && (
                  <Zap className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                )}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-950/90 text-purple-300 rounded-full border border-purple-700/60 whitespace-nowrap font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side actions: Model Switcher & Working GitHub Repo & HF Hub */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Segmented Model Switcher Tabs */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner">
            <button
              onClick={() => setActiveModel('vae')}
              title="Switch active model to β-VAE"
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeModel === 'vae'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>β-VAE</span>
            </button>
            <button
              onClick={() => setActiveModel('gan')}
              title="Switch active model to WGAN-GP"
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeModel === 'gan'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>WGAN-GP</span>
            </button>
            <button
              onClick={() => setActiveModel('ddpm')}
              title="Switch active model to DDPM"
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeModel === 'ddpm'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>DDPM</span>
            </button>
          </div>

          {/* GitHub Repository Link - Working Direct Link */}
          <a
            href={RESEARCH_PROJECT.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-xl border border-slate-700/90 hover:border-cyan-500/60 hover:text-cyan-300 transition-all duration-200 shadow-md whitespace-nowrap group"
            title="View Project Source Code on GitHub"
          >
            <Github className="w-4 h-4 text-slate-300 group-hover:text-cyan-400 transition-colors" />
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Hugging Face Hub Link */}
          <a
            href={RESEARCH_PROJECT.huggingFaceUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm whitespace-nowrap"
            title="View HuggingFace Models Hub"
          >
            <span>HF Hub</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Mobile/Tablet Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="2xl:hidden p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-cyan-400" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="2xl:hidden bg-slate-950/98 border-b border-slate-800 px-5 pt-4 pb-6 backdrop-blur-2xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                      : 'text-slate-200 hover:bg-slate-900 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-950 text-purple-300 rounded-full border border-purple-800 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-3 text-xs">
            <a
              href={RESEARCH_PROJECT.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 rounded-xl border border-cyan-500/40 transition-all w-full justify-center"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repository (YashwanthaY)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

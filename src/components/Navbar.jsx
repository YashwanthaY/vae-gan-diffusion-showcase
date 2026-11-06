import React, { useState, useEffect } from 'react';
import {
  ExternalLink, Sparkles, Zap, Menu, X, Terminal,
  Sliders, BarChart3, Eye, Play, Sun, Moon, Github, Database, Award
} from 'lucide-react';
import { RESEARCH_PROJECT } from '../data/researchData';
import ExaminerTourModal from './ExaminerTourModal';

export default function Navbar({ activeModel, setActiveModel }) {
  const [activeSection, setActiveSection] = useState('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('research_theme');
      if (saved === 'light') {
        setIsLightMode(true);
        document.documentElement.classList.add('presentation-light');
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    setIsLightMode(prev => {
      const next = !prev;
      try {
        if (next) {
          document.documentElement.classList.add('presentation-light');
          localStorage.setItem('research_theme', 'light');
        } else {
          document.documentElement.classList.remove('presentation-light');
          localStorage.setItem('research_theme', 'dark');
        }
      } catch (e) {}
      return next;
    });
  };

  const navItems = [
    { id: 'hero',           label: 'Overview',       icon: Sparkles },
    { id: 'live-lab',       label: 'Live Lab',       icon: Zap, isHighlight: true },
    { id: 'benchmark',      label: 'Benchmark',      icon: BarChart3 },
    { id: 'evidence',       label: 'Evidence',       icon: Eye },
    { id: 'synthetic-data', label: 'Synthetic Data', icon: Database },
    { id: 'statistical',    label: 'Proof',          icon: Award, badge: 'p<.001' },
    { id: 'reproduce',      label: 'Reproduce',      icon: Terminal },
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
      const scrollPosition = window.scrollY + 120;
      
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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl transition-all">
        {/* Top subtle multi-color gradient accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400 opacity-90" />

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-4">
          
          {/* Brand logo & Academic Title */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0" 
            onClick={() => scrollTo('hero')}
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-heading font-black text-base lg:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                  SYNTHESIS<span className="text-cyan-400">3D</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 rounded-full whitespace-nowrap hidden sm:inline-block shadow-sm">
                  CIFAR-10 STUDY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex items-center space-x-1 font-medium">
                <span>by {RESEARCH_PROJECT.author}</span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (Overview | Live Lab | Benchmark | Evidence | Synthetic Data | Proof | Reproduce) */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-full border border-slate-800/90 shadow-inner">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-full transition-all duration-200 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-cyan-300 font-bold shadow-md border border-cyan-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.isHighlight && (
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                  )}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono bg-purple-950/90 text-purple-300 rounded-full border border-purple-700/60 whitespace-nowrap font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side actions: Guided Tour, Model Switcher, Theme Toggle & Links */}
          <div className="flex items-center space-x-2 shrink-0">

            {/* Guided Tour Examiner Button */}
            <button
              onClick={() => setTourOpen(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm cursor-pointer"
              title="Open 5-Minute Guided Presentation Tour (?present=1)"
            >
              <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
              <span>Tour (5m)</span>
            </button>

            {/* Presentation/Print Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer"
              title={isLightMode ? 'Switch to Dark Theme' : 'Switch to Presentation / Print Light Theme'}
              aria-label="Toggle Theme"
            >
              {isLightMode ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4 text-cyan-400" />}
            </button>
            
            {/* Model Architecture Quick Selector */}
            <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 shadow-inner">
              <button
                onClick={() => setActiveModel?.('vae')}
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                  activeModel === 'vae'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>VAE</span>
              </button>
              <button
                onClick={() => setActiveModel?.('gan')}
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                  activeModel === 'gan'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>GAN</span>
              </button>
              <button
                onClick={() => setActiveModel?.('ddpm')}
                className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                  activeModel === 'ddpm'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>DDPM</span>
              </button>
            </div>

            {/* GitHub Repository */}
            <a
              href={RESEARCH_PROJECT.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/98 border-b border-slate-800 px-4 pt-3 pb-5 backdrop-blur-2xl shadow-2xl space-y-3">
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setTourOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch 5-Minute Guided Presentation</span>
            </button>
          </div>
        )}
      </header>

      {/* Presentation Tour Modal */}
      <ExaminerTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
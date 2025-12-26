
import React from 'react';
import { motion } from 'framer-motion';

const GlobalStrategyMap: React.FC = () => {
  return (
    <section className="py-40 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-24 space-y-6">
          <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Global Strategic Reach</div>
          <h2 className="text-5xl md:text-7xl font-serif text-white italic leading-tight">
            Presença Digital, <br/>Impacto Global.
          </h2>
          <p className="text-slate-500 text-lg font-light italic max-w-2xl mx-auto">
            Nossa rede de inteligência conecta CEOs em 3 continentes, provendo rigor metodológico onde quer que sua operação esteja.
          </p>
        </div>

        <div className="relative aspect-[21/9] w-full max-w-6xl mx-auto opacity-40 group grayscale hover:grayscale-0 transition-all duration-1000">
           <svg viewBox="0 0 1000 450" className="w-full h-full text-blue-600/30">
              <path d="M150,150 Q300,50 450,150 T750,150" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
              <circle cx="200" cy="180" r="4" fill="currentColor">
                <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="500" cy="220" r="4" fill="currentColor" />
              <circle cx="800" cy="120" r="4" fill="currentColor" />
              <text x="210" y="185" fill="white" className="text-[12px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">São Paulo Hub</text>
              <text x="510" y="225" fill="white" className="text-[12px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">London Desk</text>
              <text x="810" y="125" fill="white" className="text-[12px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">NY Strategy Office</text>
           </svg>
           
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center pointer-events-none">
              <div className="w-[800px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full"></div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalStrategyMap;

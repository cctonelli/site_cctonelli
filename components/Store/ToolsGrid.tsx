
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchTools } from '../../services/supabaseService';
import { Tool } from '../../types';

const ToolsGrid: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTools().then(data => {
      setTools(data);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return (
    <section className="py-24 bg-white dark:bg-slate-950 transition-colors">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4">
            <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Strategic Toolkit</div>
            <h2 className="text-4xl md:text-5xl font-serif dark:text-white text-slate-900 italic">Ferramentas de Decisão.</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <motion.div 
              key={tool.id}
              whileHover={{ scale: 1.02 }}
              className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex items-start gap-6 group hover:border-blue-500/30 transition-all shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <span className="text-2xl">{tool.icon || '🛠️'}</span>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                   <h4 className="text-xl font-serif dark:text-white text-slate-900 italic">{tool.name}</h4>
                   <span className="text-[8px] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded uppercase font-bold text-slate-500">{tool.access_level}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light italic leading-relaxed">{tool.description}</p>
                <a 
                  href={tool.external_url || '#'} 
                  className="inline-block pt-2 text-blue-500 font-bold uppercase tracking-widest text-[9px] border-b border-blue-500/20 hover:border-blue-500 transition-all"
                >
                  Abrir Utilitário
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;

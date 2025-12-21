
import React, { useEffect, useState } from 'react';
import { Product, Profile } from '../types';
import { getPersonalizedRecommendations } from '../services/aiService';

interface ClientPortalProps {
  profile: Profile;
  products: Product[];
  onClose: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ profile, products, onClose }) => {
  const [recommendation, setRecommendation] = useState<string>('Gerando insights para você...');

  useEffect(() => {
    const loadAiRecommendation = async () => {
      const text = await getPersonalizedRecommendations(profile, products);
      setRecommendation(text);
    };
    loadAiRecommendation();
  }, [profile, products]);

  return (
    <div className="fixed inset-0 z-[60] bg-[#030712] flex flex-col animate-in fade-in duration-500">
      <header className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold">CT</div>
          <div>
            <h1 className="text-xl font-serif font-bold">Hub do Cliente</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Portal de Excelência Executiva</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-16 bg-grid">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Welcome & AI Section */}
          <section className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-3xl font-serif">Bem-vindo, <br/><span className="text-blue-500 italic">{profile.full_name?.split(' ')[0]}</span></h2>
              <div className="p-6 bg-slate-900 border border-white/5 rounded-2xl space-y-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Seu Perfil</div>
                <div className="text-sm">
                  <span className="text-slate-400">Identificador:</span> {profile.cpf_cnpj || '---'}
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Status:</span> Premium Partner
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 animate-pulse"></div>
              <div className="relative h-full p-8 bg-slate-900/80 border border-white/10 rounded-3xl flex flex-col justify-center gap-6">
                <div className="flex items-center gap-3 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Insight Personalizado via IA</span>
                </div>
                <p className="text-xl font-light leading-relaxed italic text-slate-300">
                  {recommendation}
                </p>
              </div>
            </div>
          </section>

          {/* Catalog Section */}
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-serif">Catálogo de Alta Performance</h3>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Mostrando {products.length} itens</div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {products.map(p => (
                <div key={p.id} className="glass p-8 rounded-3xl flex flex-col justify-between group hover:border-blue-500/30 transition-all">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${p.type === 'service' ? 'bg-blue-600/10 text-blue-400' : 'bg-green-600/10 text-green-400'}`}>
                        {p.type}
                      </span>
                      <span className="font-bold text-white">R$ {p.price.toLocaleString('pt-BR')}</span>
                    </div>
                    <h4 className="text-xl font-serif mb-4 group-hover:text-blue-400 transition-colors">{p.name}</h4>
                    <p className="text-slate-500 text-sm font-light leading-relaxed mb-8">{p.description}</p>
                  </div>
                  <button className="w-full py-4 bg-white text-slate-950 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">
                    Contratar Agora
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;

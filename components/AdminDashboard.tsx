import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order } from '../types';
import { fetchAllOrders, updateOrder, supabase, fetchSiteConfig } from '../services/supabaseService';
import { SITE_CONFIG, LOCAL_INSIGHTS, LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS } from '../services/localRegistry';

type TabType = 'visual_engine' | 'sections' | 'registry_factory' | 'insights' | 'products' | 'social_seo' | 'orders' | 'maintenance';

const ADMIN_VERSION = "v13.0-SOVEREIGN-FORGE";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('visual_engine');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(fetchSiteConfig());

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoading(false);
  };

  const saveLivePreview = () => {
    localStorage.setItem('CT_ADMIN_CONFIG_OVERRIDE', JSON.stringify(config));
    
    // Injeção de CSS em tempo real para preview
    const root = document.documentElement;
    root.style.setProperty('--accent-blue', config.theme.primary);
    root.style.setProperty('--brand-gold', config.theme.secondary);
    root.style.setProperty('--global-radius', config.ux.border_radius_global);
    root.style.setProperty('--glow-opacity', config.ux.glow_intensity);
    
    window.dispatchEvent(new Event('storage'));
    alert("KODIGO-FONTE LOCAL ATUALIZADO. O site agora reflete suas mudanças.");
  };

  const handleNestedChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const generateCoreFile = () => {
    const fileContent = `
/**
 * CLAUDIO TONELLI CORE REGISTRY - SOBERANIA TOTAL v13.0
 * GENERATED: ${new Date().toLocaleString()}
 * ADMIN: ${profile.full_name}
 */
import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

export const SITE_CONFIG = ${JSON.stringify(config, null, 2)};
export const LOCAL_INSIGHTS = ${JSON.stringify(LOCAL_INSIGHTS, null, 2)};
export const LOCAL_PRODUCTS = ${JSON.stringify(LOCAL_PRODUCTS, null, 2)};
export const LOCAL_VARIANTS = ${JSON.stringify(LOCAL_VARIANTS, null, 2)};
export const LOCAL_BLOCKS = ${JSON.stringify(LOCAL_BLOCKS, null, 2)};
    `.trim();
    
    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localRegistry.ts';
    a.click();
    alert("KODIGO FONTE GERADO. Substitua o arquivo localRegistry.ts na pasta services/.");
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1750px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl transition-all">
        
        {/* Sidebar de Comando */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-10 flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-600/30">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.6em] text-white leading-none">Command Center</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {[
              { id: 'visual_engine', label: 'Estética & UX' },
              { id: 'sections', label: 'Gestão de Seções' },
              { id: 'registry_factory', label: 'Produtos Registry' },
              { id: 'social_seo', label: 'SEO & Contatos' },
              { id: 'orders', label: 'Vendas (Cofre)' },
              { id: 'maintenance', label: 'Hard Build' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-left transition-all border ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-400 shadow-2xl' : 'text-slate-600 border-transparent hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] p-6 border border-white/5 rounded-2xl transition-all">Fechar Console</button>
        </div>

        {/* Console Central */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">
            
            {activeTab === 'visual_engine' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="mb-12 flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">Estética & UX Forge</h2>
                    <div className="w-32 h-1 bg-blue-600 rounded-full"></div>
                  </div>
                  <button onClick={saveLivePreview} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-500 transition-all shadow-xl">Salvar Preview</button>
                </header>
                
                <div className="grid md:grid-cols-2 gap-10">
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Cores Master</h3>
                    {['primary', 'secondary', 'bg_dark'].map(colorKey => (
                      <div key={colorKey} className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{colorKey}</label>
                        <input 
                          type="text" 
                          value={config.theme[colorKey]} 
                          onChange={e => handleNestedChange(`theme.${colorKey}`, e.target.value)}
                          className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" 
                        />
                      </div>
                    ))}
                  </section>

                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">UX & Fine Tuning</h3>
                    {['scanline_opacity', 'glow_intensity', 'border_radius_global'].map(uxKey => (
                      <div key={uxKey} className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{uxKey.replace(/_/g, ' ')}</label>
                        <input 
                          type="text" 
                          value={config.ux[uxKey]} 
                          onChange={e => handleNestedChange(`ux.${uxKey}`, e.target.value)}
                          className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" 
                        />
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="mb-12">
                  <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">Visibilidade do Core</h2>
                  <div className="w-32 h-1 bg-blue-600 rounded-full"></div>
                </header>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(config.visibility).map(section => (
                    <button 
                      key={section}
                      onClick={() => {
                        const newVis = { ...config.visibility, [section]: !config.visibility[section] };
                        setConfig({ ...config, visibility: newVis });
                      }}
                      className={`p-10 rounded-[2.5rem] border text-left transition-all flex flex-col gap-4 group ${config.visibility[section] ? 'bg-blue-600/5 border-blue-600/20' : 'bg-black/40 border-white/5 opacity-50'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white group-hover:text-blue-500 transition-colors">{section}</span>
                        <div className={`w-3 h-3 rounded-full ${config.visibility[section] ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'}`}></div>
                      </div>
                      <p className="text-[9px] text-slate-500 font-light italic">Estado: {config.visibility[section] ? 'RENDERING' : 'OMITTED'}</p>
                    </button>
                  ))}
                </div>
                <div className="pt-8 text-center">
                   <button onClick={saveLivePreview} className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl">Salvar Topologia</button>
                </div>
              </div>
            )}

            {activeTab === 'social_seo' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="mb-12 flex justify-between items-end">
                   <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">SEO & Social Forge</h2>
                   <button onClick={saveLivePreview} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-500 transition-all shadow-xl">Salvar</button>
                </header>
                <div className="grid md:grid-cols-2 gap-10">
                   <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Contatos Globais</h3>
                      {Object.keys(config.contact).map(key => (
                        <div key={key} className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{key}</label>
                          <input 
                            value={config.contact[key]} 
                            onChange={e => handleNestedChange(`contact.${key}`, e.target.value)}
                            className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" 
                          />
                        </div>
                      ))}
                   </section>
                   <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">SEO Multilíngue</h3>
                      {['pt', 'en', 'es'].map(lang => (
                        <div key={lang} className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Título SEO ({lang})</label>
                          <input 
                            value={config.seo.title[lang]} 
                            onChange={e => handleNestedChange(`seo.title.${lang}`, e.target.value)}
                            className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" 
                          />
                        </div>
                      ))}
                   </section>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-12 animate-in zoom-in-95 duration-500">
                 <header className="mb-12">
                  <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">Sovereign Hard Build</h2>
                </header>
                <div className="p-16 bg-blue-600/5 border border-blue-600/10 rounded-[4rem] text-center space-y-10">
                  <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto text-white shadow-2xl">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </div>
                  <h3 className="text-3xl font-serif text-white italic">Consolidar DNA Soberano</h3>
                  <p className="text-slate-500 text-sm font-light leading-relaxed max-w-xl mx-auto italic">
                    Transforme suas edições em código real. Substitua o arquivo localRegistry.ts para tornar as mudanças permanentes e independentes de falhas no Supabase.
                  </p>
                  <button onClick={generateCoreFile} className="px-16 py-6 bg-white text-brand-navy rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-blue-600 hover:text-white transition-all shadow-2xl">BAIXAR REGISTRY.TS</button>
                </div>
              </div>
            )}

            {activeTab === 'registry_factory' && (
              <div className="space-y-12">
                 <header className="mb-12 flex justify-between items-center">
                    <div>
                       <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">Produtos do Registry</h2>
                       <p className="text-slate-500 text-sm font-light italic">Edição direta de ativos codificados no Kernel.</p>
                    </div>
                 </header>
                 <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">ESTRUTURA JSON (V8 & CIA)</h3>
                    <p className="text-xs text-slate-500 leading-relaxed italic">Atualmente, novos produtos devem ser adicionados via código no localRegistry.ts seguindo a estrutura abaixo. Em breve, editor visual completo para blocos.</p>
                    <pre className="bg-black p-8 rounded-2xl text-[10px] font-mono text-blue-400 overflow-x-auto border border-white/5">
{`// Estrutura de Exemplo para LOCAL_PRODUCTS:
{
  id: 'novo-id',
  slug: 'novo-slug',
  title: 'Novo Ativo Elite',
  subtitle: 'Acesso Visionário',
  ...
}`}
                    </pre>
                 </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="mb-12">
                  <h2 className="text-5xl font-serif text-white italic tracking-tighter">Monitor de Vendas</h2>
                </header>
                {orders.length === 0 ? (
                   <p className="text-slate-500 font-light italic">Nenhum pedido processado pelo cofre Supabase.</p>
                ) : orders.map(order => (
                  <div key={order.id} className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 flex items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-600 font-bold border border-white/5 uppercase">{order.profiles?.full_name?.charAt(0) || 'P'}</div>
                       <div>
                          <span className="text-xl font-serif text-white italic">{order.profiles?.full_name || 'Partner'}</span>
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">R$ {order.amount.toLocaleString('pt-BR')} — {order.status}</div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order } from '../types';
import { fetchAllOrders, updateOrder, supabase, fetchSiteConfig } from '../services/supabaseService';
import { SITE_CONFIG, LOCAL_INSIGHTS, LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS } from '../services/localRegistry';

type TabType = 'visual_engine' | 'insights' | 'products' | 'orders' | 'maintenance';

const ADMIN_VERSION = "v12.5-COMMAND-CENTER";

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
    window.dispatchEvent(new Event('storage'));
    
    // Injeção de CSS em tempo real
    const root = document.documentElement;
    root.style.setProperty('--accent-blue', config.theme.primary);
    
    alert("PREVIEW ATUALIZADO. O site agora reflete suas novas definições de design.");
  };

  const generateCoreFile = () => {
    const fileContent = `
/**
 * CLAUDIO TONELLI CORE REGISTRY
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
    alert("CÓDIGO DE ELITE GERADO. Salve o arquivo localRegistry.ts na pasta services/ para consolidar as mudanças.");
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1700px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl transition-all">
        
        {/* Sidebar de Comando */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-12 flex flex-col gap-10 shrink-0">
          <div className="flex items-center gap-5 mb-12">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-blue-600/30">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Command Center</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 flex-1">
            {[
              { id: 'visual_engine', label: 'Estética & Kernel' },
              { id: 'insights', label: 'Hub de Conhecimento' },
              { id: 'products', label: 'Ativos Digitais' },
              { id: 'orders', label: 'Monitor de Negócios' },
              { id: 'maintenance', label: 'Build & Segurança' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`px-8 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-left transition-all border ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-400 shadow-2xl' : 'text-slate-600 border-transparent hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={onClose} className="mt-auto text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] p-6 border border-white/5 rounded-2xl transition-all">Desconectar</button>
        </div>

        {/* Console Central */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">
            <header className="mb-20 flex justify-between items-end">
               <div>
                  <h2 className="text-6xl font-serif text-white italic mb-4 capitalize">{activeTab.replace('_', ' ')} Control</h2>
                  <div className="w-32 h-1.5 bg-blue-600 rounded-full"></div>
               </div>
               {activeTab === 'visual_engine' && (
                  <button onClick={saveLivePreview} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-500 transition-all shadow-xl">Aplicar Preview</button>
               )}
            </header>

            {activeTab === 'visual_engine' && (
              <div className="space-y-20 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <section className="p-12 bg-slate-900/40 border border-white/5 rounded-[3.5rem] space-y-12">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-blue-500">Color Palette & Fonts</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {Object.keys(config.theme).map(key => (
                      <div key={key} className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{key.replace(/_/g, ' ')}</label>
                        <input 
                          type="text" 
                          value={config.theme[key]} 
                          onChange={e => setConfig({...config, theme: {...config.theme, [key]: e.target.value}})}
                          className="w-full bg-black border border-white/5 rounded-2xl px-8 py-5 text-white text-sm outline-none focus:border-blue-500 transition-all shadow-inner" 
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="p-12 bg-slate-900/40 border border-white/5 rounded-[3.5rem] space-y-12">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-blue-500">Multilingual Navigation (PT | EN | ES)</h3>
                  <div className="space-y-8">
                    {Object.keys(config.menus).map(menuKey => (
                      <div key={menuKey} className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center border-b border-white/5 pb-8 last:border-0">
                         <div className="text-[11px] font-black uppercase tracking-widest text-white">{menuKey.replace('nav_', '')}</div>
                         {['pt', 'en', 'es'].map(lang => (
                            <div key={lang} className="relative group">
                              <span className="absolute -top-3 left-4 text-[7px] font-black uppercase tracking-widest text-blue-500/50 group-focus-within:text-blue-500">{lang}</span>
                              <input 
                                value={config.menus[menuKey][lang]}
                                onChange={e => {
                                  const newMenus = { ...config.menus };
                                  newMenus[menuKey][lang] = e.target.value;
                                  setConfig({...config, menus: newMenus});
                                }}
                                className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-blue-500 pt-5"
                              />
                            </div>
                         ))}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-16 animate-in zoom-in-95 duration-500">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="p-16 bg-blue-600/5 border border-blue-600/10 rounded-[4rem] text-center space-y-10 group hover:border-blue-600/40 transition-all">
                    <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto text-white shadow-2xl">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-serif text-white italic">Hard Build</h3>
                      <p className="text-slate-500 text-sm font-light leading-relaxed px-10">Exporta todo o conteúdo atual, design e estrutura de menus em um único arquivo de registro blindado.</p>
                    </div>
                    <button onClick={generateCoreFile} className="w-full py-6 bg-white text-brand-navy rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-blue-600 hover:text-white transition-all shadow-2xl">Gerar localRegistry.ts</button>
                  </div>

                  <div className="p-16 bg-red-600/5 border border-red-600/10 rounded-[4rem] text-center space-y-10 group hover:border-red-600/40 transition-all">
                    <div className="w-24 h-24 bg-red-600/20 rounded-3xl flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-serif text-white italic">Limpar Cache Local</h3>
                      <p className="text-slate-500 text-sm font-light leading-relaxed px-10">Remove o override de preview e volta o site para as configurações do arquivo mestre.</p>
                    </div>
                    <button onClick={() => { localStorage.removeItem('CT_ADMIN_CONFIG_OVERRIDE'); window.location.reload(); }} className="w-full py-6 bg-slate-900 text-red-500 border border-red-500/20 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-red-600 hover:text-white transition-all">Resetar Global Kernel</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-8">
                {orders.map(order => (
                  <div key={order.id} className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 flex flex-col lg:flex-row justify-between items-center gap-10 group hover:border-blue-600/20 transition-all shadow-2xl">
                    <div className="flex items-center gap-8">
                       <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-600 font-bold border border-white/5">{order.profiles?.full_name?.charAt(0) || 'P'}</div>
                       <div className="space-y-2">
                          <span className="text-2xl font-serif text-white italic">{order.profiles?.full_name || 'Anonymous Partner'}</span>
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-3">
                             <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                             R$ {order.amount.toLocaleString('pt-BR')} — {order.status}
                          </div>
                       </div>
                    </div>
                    {order.status !== 'approved' && (
                      <button onClick={() => alert("Aprovando no DB...")} className="px-12 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-500 transition-all shadow-2xl">Liberar Protocolo</button>
                    )}
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

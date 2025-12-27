import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order, Product, ProductContentBlock, ProductVariant } from '../types';
import { fetchAllOrders, supabase, fetchSiteConfig } from '../services/supabaseService';
import { SITE_CONFIG, LOCAL_INSIGHTS, LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS } from '../services/localRegistry';

type TabType = 'visual_dna' | 'editorial_forge' | 'sovereign_store' | 'insights' | 'security_hub' | 'orders' | 'hard_build';

const ADMIN_VERSION = "v15.5-EDITORIAL-COMMAND";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('visual_dna');
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState(fetchSiteConfig());

  const [registryProducts, setRegistryProducts] = useState<Product[]>(LOCAL_PRODUCTS);
  const [registryVariants, setRegistryVariants] = useState<Record<string, ProductVariant[]>>(LOCAL_VARIANTS);
  const [registryBlocks, setRegistryBlocks] = useState<Record<string, ProductContentBlock[]>>(LOCAL_BLOCKS);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(LOCAL_PRODUCTS[0]?.id || null);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    const data = await fetchAllOrders();
    setOrders(data);
  };

  const saveLivePreview = () => {
    const fullConfig = { 
      ...config, 
      _products: registryProducts, 
      _variants: registryVariants, 
      _blocks: registryBlocks 
    };
    localStorage.setItem('CT_ADMIN_CONFIG_OVERRIDE', JSON.stringify(fullConfig));
    window.dispatchEvent(new Event('storage'));
    
    // Update CSS variables locally
    const root = document.documentElement;
    root.style.setProperty('--h1-size', config.typography.h1_size);
    root.style.setProperty('--body-size', config.typography.body_size);
    root.style.setProperty('--text-main', config.theme.text_main);
    root.style.setProperty('--text-secondary', config.theme.text_secondary);
    
    alert("DNA EDITORIAL SINCRONIZADO.");
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

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden font-sans">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1750px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl transition-all">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-10 flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 bg-green-500 rounded-3xl flex items-center justify-center font-bold text-black text-2xl shadow-xl shadow-green-500/30">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.6em] text-white leading-none">Command Center</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-green-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {[
              { id: 'visual_dna', label: 'DNA Visual' },
              { id: 'editorial_forge', label: 'Editorial Forge' },
              { id: 'sovereign_store', label: 'Sovereign Store' },
              { id: 'insights', label: 'Insights Registry' },
              { id: 'security_hub', label: 'Security Hub (DB)' },
              { id: 'orders', label: 'Sales Vault' },
              { id: 'hard_build', label: 'Hard Build' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-left transition-all border ${activeTab === tab.id ? 'bg-green-500 text-black border-green-400 shadow-2xl' : 'text-slate-600 border-transparent hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] p-6 border border-white/5 rounded-2xl transition-all">Sair do Core</button>
        </div>

        {/* Central Console */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">

            {activeTab === 'editorial_forge' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-serif text-white italic tracking-tighter">Editorial Forge</h2>
                    <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Controle de Fontes, Tamanhos e Cores de Texto (Estilo Jornal)</p>
                  </div>
                  <button onClick={saveLivePreview} className="bg-green-500 text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">Aplicar Mudanças</button>
                </header>

                <div className="grid md:grid-cols-2 gap-10">
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Tamanhos de Fonte (EM/REM/PX)</h3>
                    {Object.keys(config.typography).map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{k}</label>
                        {typeof config.typography[k] === 'boolean' ? (
                           <button 
                            onClick={() => handleNestedChange(`typography.${k}`, !config.typography[k])}
                            className={`px-6 py-3 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${config.typography[k] ? 'bg-green-600 border-green-400 text-black' : 'bg-slate-800 border-white/10 text-slate-500'}`}
                           >
                            {config.typography[k] ? 'ATIVADO' : 'DESATIVADO'}
                           </button>
                        ) : (
                          <input 
                            type="text" 
                            value={config.typography[k]} 
                            onChange={e => handleNestedChange(`typography.${k}`, e.target.value)} 
                            className="w-full bg-black border border-white/5 rounded-xl p-4 text-white text-xs font-mono" 
                          />
                        )}
                      </div>
                    ))}
                  </section>

                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Cores de Texto & Contraste</h3>
                    {['text_main', 'text_secondary'].map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{k}</label>
                        <div className="flex gap-4">
                          <input 
                            type="color" 
                            value={config.theme[k]} 
                            onChange={e => handleNestedChange(`theme.${k}`, e.target.value)} 
                            className="w-12 h-12 bg-transparent border-none cursor-pointer" 
                          />
                          <input 
                            type="text" 
                            value={config.theme[k]} 
                            onChange={e => handleNestedChange(`theme.${k}`, e.target.value)} 
                            className="flex-1 bg-black border border-white/5 rounded-xl p-4 text-white text-xs font-mono uppercase" 
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-6 border-t border-white/5">
                        <h4 className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-4">Preview Editorial</h4>
                        <div className="p-6 bg-black rounded-2xl border border-white/5 space-y-4">
                           <h1 className="font-serif italic" style={{ fontSize: '1.5rem', color: config.theme.text_main }}>Título do Insight</h1>
                           <p className="font-light italic" style={{ fontSize: '0.9rem', color: config.theme.text_secondary }}>Este é o texto secundário que descreve a visão estratégica do período.</p>
                        </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'visual_dna' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="flex justify-between items-end">
                   <div>
                    <h2 className="text-5xl font-serif text-white italic tracking-tighter">DNA Visual Forge</h2>
                   </div>
                  <button onClick={saveLivePreview} className="bg-green-500 text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">Salvar DNA</button>
                </header>
                <div className="grid md:grid-cols-2 gap-10">
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Paleta Core</h3>
                    {['primary', 'bg_dark'].map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{k}</label>
                        <input type="text" value={config.theme[k]} onChange={e => handleNestedChange(`theme.${k}`, e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-4 text-white text-xs" />
                      </div>
                    ))}
                  </section>
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Matrix Global Core</h3>
                    {['matrix_speed', 'matrix_opacity'].map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{k}</label>
                        <input type="text" value={config.ux[k]} onChange={e => handleNestedChange(`ux.${k}`, e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-4 text-white text-xs" />
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="animate-in fade-in duration-500">
                <AdminCrudSection 
                  tableName="insights" 
                  title="Insights Editoriais" 
                  fields={[
                    { key: 'title', label: 'Título Principal' },
                    { key: 'category', label: 'Categoria (Ex: ESTRATÉGIA)' },
                    { key: 'excerpt', label: 'Resumo / Subtítulo', type: 'textarea' },
                    { key: 'image_url', label: 'Imagem de Capa (URL)' },
                    { key: 'content', label: 'Corpo do Artigo (Rich Text / Jornal)', type: 'rich-text' },
                    { key: 'is_active', label: 'Publicado', type: 'toggle' },
                    { key: 'display_order', label: 'Ordem', type: 'number' }
                  ]} 
                  displayColumns={['title', 'category', 'is_active']} 
                />
              </div>
            )}

            {activeTab === 'sovereign_store' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="mb-12">
                   <h2 className="text-5xl font-serif text-white italic tracking-tighter">Sovereign Store IDE</h2>
                </header>
                <div className="grid lg:grid-cols-4 gap-12">
                   <div className="lg:col-span-1 space-y-4">
                      {registryProducts.map(p => (
                        <button key={p.id} onClick={() => setSelectedProductId(p.id)} className={`w-full p-6 rounded-[2rem] text-left border transition-all ${selectedProductId === p.id ? 'bg-green-500 border-green-400 text-black' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                           <div className="text-[11px] font-black uppercase truncate">{p.title}</div>
                        </button>
                      ))}
                   </div>
                   <div className="lg:col-span-3">
                      {selectedProductId && (
                        <section className="p-12 bg-slate-900/40 border border-white/5 rounded-[4rem] space-y-12">
                           <div className="space-y-4">
                              <label className="text-[9px] font-black text-slate-500 uppercase">Título Público</label>
                              <input value={registryProducts.find(p => p.id === selectedProductId)?.title || ''} onChange={e => setRegistryProducts(prev => prev.map(p => p.id === selectedProductId ? {...p, title: e.target.value} : p))} className="w-full bg-black border border-white/5 rounded-2xl p-6 text-white text-sm" />
                           </div>
                           <button onClick={saveLivePreview} className="w-full py-5 bg-green-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.4em]">Sincronizar Preview</button>
                        </section>
                      )}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'hard_build' && (
              <div className="p-20 bg-green-500/5 border border-green-500/10 rounded-[4rem] text-center space-y-10 animate-in zoom-in-95 duration-700">
                <h3 className="text-4xl font-serif text-white italic tracking-tighter">Gerar Core Definitivo</h3>
                <button onClick={() => {
                  const fileContent = `export const SITE_CONFIG = ${JSON.stringify(config, null, 2)};`;
                  alert("Build Serializado no console.");
                  console.log(fileContent);
                }} className="px-16 py-7 bg-white text-brand-navy rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-green-500 hover:text-black transition-all shadow-2xl">EXPORTAR REGISTRY</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
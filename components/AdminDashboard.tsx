
import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order, Product, ProductContentBlock, ProductVariant, Insight } from '../types';
import { fetchAllOrders, fetchSiteConfig } from '../services/supabaseService';
import { SITE_CONFIG, LOCAL_INSIGHTS, LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS } from '../services/localRegistry';

type TabType = 'visual_dna' | 'editorial_forge' | 'sovereign_store' | 'insights' | 'orders' | 'hard_build';

const ADMIN_VERSION = "v16.0-SOVEREIGN-MASTER";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('visual_dna');
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Estado Mestre do Admin (Carrega do Config atual que já mescla localRegistry + localStorage)
  const currentConfig = fetchSiteConfig();
  const [config, setConfig] = useState(currentConfig);
  const [registryProducts, setRegistryProducts] = useState<Product[]>((currentConfig as any)._products || LOCAL_PRODUCTS);
  const [registryVariants, setRegistryVariants] = useState<Record<string, ProductVariant[]>>((currentConfig as any)._variants || LOCAL_VARIANTS);
  const [registryBlocks, setRegistryBlocks] = useState<Record<string, ProductContentBlock[]>>((currentConfig as any)._blocks || LOCAL_BLOCKS);
  const [registryInsights, setRegistryInsights] = useState<Insight[]>((currentConfig as any)._insights || LOCAL_INSIGHTS);
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(registryProducts[0]?.id || null);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    const data = await fetchAllOrders();
    setOrders(data);
  };

  // --- BOTÃO DE AÇÃO: SALVAR DNA (PREVIEW AO VIVO) ---
  const saveLivePreview = () => {
    const fullState = { 
      ...config, 
      _products: registryProducts, 
      _variants: registryVariants, 
      _blocks: registryBlocks,
      _insights: registryInsights
    };
    localStorage.setItem('CT_ADMIN_CONFIG_OVERRIDE', JSON.stringify(fullState));
    
    // Injeta variáveis CSS imediatamente
    const root = document.documentElement;
    root.style.setProperty('--h1-size', config.typography.h1_size);
    root.style.setProperty('--body-size', config.typography.body_size);
    root.style.setProperty('--text-main', config.theme.text_main);
    root.style.setProperty('--accent-blue', config.theme.primary);
    
    // Notifica outros componentes
    window.dispatchEvent(new Event('storage'));
    alert("SISTEMA SINCRONIZADO: O DNA foi atualizado no cache do navegador.");
  };

  // --- BOTÃO DE AÇÃO: HARD BUILD (EXPORTAR CÓDIGO) ---
  const generateHardBuild = () => {
    const code = `
import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

export const SITE_CONFIG = ${JSON.stringify(config, null, 2)};

export const LOCAL_PRODUCTS: Product[] = ${JSON.stringify(registryProducts, null, 2)};

export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = ${JSON.stringify(registryVariants, null, 2)};

export const LOCAL_BLOCKS: Record<string, ProductContentBlock[]> = ${JSON.stringify(registryBlocks, null, 2)};

export const LOCAL_INSIGHTS: Insight[] = ${JSON.stringify(registryInsights, null, 2)};
    `.trim();

    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localRegistry.ts';
    a.click();
    alert("BUILD GERADO: Substitua o arquivo services/localRegistry.ts no seu código para tornar as mudanças permanentes.");
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

  const addBlock = (prodId: string) => {
    const newBlock: ProductContentBlock = {
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      product_id: prodId,
      block_type: 'text',
      order: (registryBlocks[prodId]?.length || 0) + 1,
      content: { title: "Novo Bloco", subtitle: "Descrição aqui..." }
    };
    setRegistryBlocks({
      ...registryBlocks,
      [prodId]: [...(registryBlocks[prodId] || []), newBlock]
    });
  };

  const deleteBlock = (prodId: string, blockId: string) => {
    setRegistryBlocks({
      ...registryBlocks,
      [prodId]: registryBlocks[prodId].filter(b => b.id !== blockId)
    });
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden font-sans">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1800px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl transition-all">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-10 flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 bg-green-500 rounded-3xl flex items-center justify-center font-bold text-black text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-green-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
            {[
              { id: 'visual_dna', label: 'DNA Visual' },
              { id: 'editorial_forge', label: 'Editorial Forge' },
              { id: 'sovereign_store', label: 'Sovereign Store' },
              { id: 'insights', label: 'Insights Registry' },
              { id: 'orders', label: 'Sales Vault' },
              { id: 'hard_build', label: 'Hard Build' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-left transition-all border ${activeTab === tab.id ? 'bg-green-500 text-black border-green-400' : 'text-slate-600 border-transparent hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          
          <div className="pt-6 border-t border-white/5 space-y-4">
             <button onClick={saveLivePreview} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">SALVAR DNA (PREVIEW)</button>
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em]">Sair do Core</button>
          </div>
        </div>

        {/* Central Console */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">

            {activeTab === 'visual_dna' && (
              <div className="space-y-12">
                <header>
                   <h2 className="text-5xl font-serif text-white italic tracking-tighter">Visual DNA Forge</h2>
                   <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Controle Master de Interface</p>
                </header>
                <div className="grid md:grid-cols-2 gap-10">
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Cores da Marca</h3>
                    {['primary', 'secondary', 'bg_dark'].map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500">{k}</label>
                        <div className="flex gap-4">
                           <input type="color" value={config.theme[k]} onChange={e => handleNestedChange(`theme.${k}`, e.target.value)} className="w-12 h-12 bg-transparent border-none cursor-pointer" />
                           <input type="text" value={config.theme[k]} onChange={e => handleNestedChange(`theme.${k}`, e.target.value)} className="flex-1 bg-black border border-white/5 rounded-xl p-4 text-white text-xs font-mono uppercase" />
                        </div>
                      </div>
                    ))}
                  </section>
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Matrix UX Settings</h3>
                    {['matrix_speed', 'matrix_opacity'].map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500">{k}</label>
                        <input type="number" step="0.1" value={config.ux[k]} onChange={e => handleNestedChange(`ux.${k}`, parseFloat(e.target.value))} className="w-full bg-black border border-white/5 rounded-xl p-4 text-white text-xs font-mono" />
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'editorial_forge' && (
              <div className="space-y-12">
                <header>
                   <h2 className="text-5xl font-serif text-white italic tracking-tighter">Editorial Forge</h2>
                </header>
                <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                  <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Tipografia Editorial</h3>
                  <div className="grid md:grid-cols-2 gap-10">
                    {['h1_size', 'h2_size', 'body_size'].map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500">{k}</label>
                        <input type="text" value={config.typography[k]} onChange={e => handleNestedChange(`typography.${k}`, e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-4 text-white text-xs font-mono" />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500">Cap Drop (Jornal Style)</label>
                      <button onClick={() => handleNestedChange('typography.cap_drop', !config.typography.cap_drop)} className={`w-full py-4 rounded-xl text-[9px] font-black border transition-all ${config.typography.cap_drop ? 'bg-green-600 text-black border-green-400' : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                        {config.typography.cap_drop ? 'ATIVADO' : 'DESATIVADO'}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'sovereign_store' && (
              <div className="space-y-12">
                <header className="flex justify-between items-end">
                   <div>
                    <h2 className="text-5xl font-serif text-white italic tracking-tighter">Sovereign Store IDE</h2>
                    <p className="text-slate-500 text-sm italic">Arquitete seus Ativos Digitais</p>
                   </div>
                   <button onClick={() => {
                     const newProd: Product = {
                       id: `prod-${Date.now()}`,
                       slug: 'novo-ativo',
                       title: 'Novo Ativo Digital',
                       subtitle: 'Subtítulo do Ativo',
                       description: 'Descrição completa...',
                       image_url: '',
                       featured: false,
                       pricing_type: 'one_time',
                       is_active: true
                     };
                     setRegistryProducts([...registryProducts, newProd]);
                     setSelectedProductId(newProd.id);
                   }} className="bg-green-500 text-black px-8 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest">+ Novo Ativo</button>
                </header>
                
                <div className="grid lg:grid-cols-4 gap-12">
                   <div className="lg:col-span-1 space-y-3">
                      {registryProducts.map(p => (
                        <div key={p.id} className="relative group">
                          <button onClick={() => setSelectedProductId(p.id)} className={`w-full p-6 rounded-[2rem] text-left border transition-all ${selectedProductId === p.id ? 'bg-green-500 border-green-400 text-black' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                            <div className="text-[11px] font-black uppercase truncate">{p.title}</div>
                            <div className="text-[7px] opacity-50 truncate">{p.slug}</div>
                          </button>
                          <button onClick={() => setRegistryProducts(registryProducts.filter(x => x.id !== p.id))} className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full items-center justify-center hidden group-hover:flex">×</button>
                        </div>
                      ))}
                   </div>

                   <div className="lg:col-span-3 space-y-12">
                      {selectedProductId && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-right-10 duration-500">
                           <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[4rem] space-y-8">
                              <h4 className="text-[10px] font-black uppercase text-green-500">Configuração do Ativo</h4>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Título</label>
                                  <input value={registryProducts.find(p => p.id === selectedProductId)?.title || ''} onChange={e => setRegistryProducts(prev => prev.map(p => p.id === selectedProductId ? {...p, title: e.target.value} : p))} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white text-sm" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Slug URL</label>
                                  <input value={registryProducts.find(p => p.id === selectedProductId)?.slug || ''} onChange={e => setRegistryProducts(prev => prev.map(p => p.id === selectedProductId ? {...p, slug: e.target.value} : p))} className="w-full bg-black border border-white/5 rounded-2xl p-5 text-white text-sm" />
                                </div>
                              </div>
                           </section>

                           <section className="space-y-8">
                              <div className="flex justify-between items-center px-4">
                                <h4 className="text-[10px] font-black uppercase text-green-500">Editorial Canvas (Blocos)</h4>
                                <button onClick={() => addBlock(selectedProductId)} className="bg-white/5 text-white px-6 py-2 rounded-full text-[9px] font-black border border-white/10">+ Adicionar Bloco</button>
                              </div>
                              <div className="space-y-6">
                                {(registryBlocks[selectedProductId] || []).map((block, bIdx) => (
                                  <div key={block.id} className="p-10 bg-black/60 border border-white/5 rounded-[3.5rem] space-y-6 group">
                                    <div className="flex justify-between items-center">
                                       <span className="text-[10px] font-black uppercase text-slate-600">Bloco {bIdx + 1}: {block.block_type}</span>
                                       <button onClick={() => deleteBlock(selectedProductId, block.id)} className="text-red-500 text-[10px] font-black hover:bg-red-500/10 px-4 py-2 rounded-full">Excluir Bloco</button>
                                    </div>
                                    <div className="grid gap-6">
                                       <input value={block.content.title || ''} onChange={e => {
                                         const newBlocks = {...registryBlocks};
                                         newBlocks[selectedProductId][bIdx].content.title = e.target.value;
                                         setRegistryBlocks(newBlocks);
                                       }} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white text-sm font-serif italic" placeholder="Título do Bloco" />
                                       <textarea value={block.content.subtitle || ''} onChange={e => {
                                         const newBlocks = {...registryBlocks};
                                         newBlocks[selectedProductId][bIdx].content.subtitle = e.target.value;
                                         setRegistryBlocks(newBlocks);
                                       }} className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-slate-400 text-sm h-32" placeholder="Conteúdo do Bloco" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                           </section>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'hard_build' && (
              <div className="p-20 bg-green-500/5 border border-green-500/10 rounded-[4rem] text-center space-y-10 animate-in zoom-in-95 duration-700">
                <h3 className="text-5xl font-serif text-white italic tracking-tighter">Consolidar DNA Soberano v16.0</h3>
                <p className="text-slate-500 text-sm max-w-xl mx-auto italic font-light leading-relaxed">
                  Este comando gera o arquivo <code className="text-green-500">localRegistry.ts</code> definitivo contendo todas as suas personalizações visuais, produtos, blocos de conteúdo e insights.
                </p>
                <div className="pt-10">
                   <button onClick={generateHardBuild} className="px-16 py-8 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-green-500 transition-all shadow-2xl">GERAR BUILD DEFINITIVO</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

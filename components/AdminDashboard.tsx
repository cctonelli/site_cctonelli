import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order, Product, ProductContentBlock, ProductVariant } from '../types';
import { fetchAllOrders, updateOrder, supabase, fetchSiteConfig } from '../services/supabaseService';
import { SITE_CONFIG, LOCAL_INSIGHTS, LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS } from '../services/localRegistry';

type TabType = 'visual_engine' | 'sections' | 'registry_factory' | 'insights' | 'social_seo' | 'orders' | 'maintenance';

const ADMIN_VERSION = "v14.0-IDE-SOVEREIGN";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('visual_engine');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(fetchSiteConfig());

  // Estado Local para o Registry Factory
  const [registryProducts, setRegistryProducts] = useState<Product[]>(LOCAL_PRODUCTS);
  const [registryVariants, setRegistryVariants] = useState<Record<string, ProductVariant[]>>(LOCAL_VARIANTS);
  const [registryBlocks, setRegistryBlocks] = useState<Record<string, ProductContentBlock[]>>(LOCAL_BLOCKS);
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(LOCAL_PRODUCTS[0]?.id || null);

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
    const fullConfig = { 
      ...config, 
      _products: registryProducts, 
      _variants: registryVariants, 
      _blocks: registryBlocks 
    };
    localStorage.setItem('CT_ADMIN_CONFIG_OVERRIDE', JSON.stringify(fullConfig));
    
    // Injeção de CSS Master
    const root = document.documentElement;
    root.style.setProperty('--accent-blue', config.theme.primary);
    root.style.setProperty('--brand-gold', config.theme.secondary);
    root.style.setProperty('--bg-navy', config.theme.bg_dark);
    root.style.setProperty('--global-radius', config.ux.border_radius_global);
    
    window.dispatchEvent(new Event('storage'));
    alert("KODIGO-FONTE LOCAL ATUALIZADO. Preview ativo.");
  };

  const generateCoreFile = () => {
    const fileContent = `
/**
 * CLAUDIO TONELLI CORE REGISTRY - SOBERANIA TOTAL v14.0
 * GENERATED: ${new Date().toLocaleString()}
 * ADMIN: ${profile.full_name}
 */
import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

export const SITE_CONFIG = ${JSON.stringify(config, null, 2)};
export const LOCAL_PRODUCTS: Product[] = ${JSON.stringify(registryProducts, null, 2)};
export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = ${JSON.stringify(registryVariants, null, 2)};
export const LOCAL_BLOCKS: Record<string, ProductContentBlock[]> = ${JSON.stringify(registryBlocks, null, 2)};
export const LOCAL_INSIGHTS: Insight[] = ${JSON.stringify(LOCAL_INSIGHTS, null, 2)};
    `.trim();
    
    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localRegistry.ts';
    a.click();
    alert("SOVEREIGN CORE GERADO. Substitua em services/localRegistry.ts");
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

  const updateRegistryProduct = (id: string, field: keyof Product, value: any) => {
    setRegistryProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addBlock = (productId: string) => {
    const newBlock: ProductContentBlock = {
      id: crypto.randomUUID(),
      product_id: productId,
      block_type: 'hero',
      order: (registryBlocks[productId]?.length || 0) + 1,
      content: { title: "Novo Bloco", style: "matrix", matrix_color: "#2563eb" }
    };
    setRegistryBlocks(prev => ({
      ...prev,
      [productId]: [...(prev[productId] || []), newBlock]
    }));
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1750px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl transition-all">
        
        {/* Sidebar */}
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
              { id: 'visual_engine', label: 'Estética & DNA' },
              { id: 'sections', label: 'Gestão de Seções' },
              { id: 'registry_factory', label: 'Loja IDE' },
              { id: 'insights', label: 'Insights Registry' },
              { id: 'social_seo', label: 'SEO & Contatos' },
              { id: 'orders', label: 'Vendas' },
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
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] p-6 border border-white/5 rounded-2xl transition-all">Desconectar</button>
        </div>

        {/* Central Console */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">

            {activeTab === 'registry_factory' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="mb-12 flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">Loja IDE (Digital Rain Protocol)</h2>
                    <p className="text-slate-500 text-sm font-light italic">Configure ativos com identidades Matrix exclusivas.</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={saveLivePreview} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-500 transition-all shadow-xl">Salvar Preview</button>
                  </div>
                </header>

                <div className="grid lg:grid-cols-4 gap-8">
                  {/* Lista de Ativos */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Ativos Registrados</h3>
                    {registryProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedProductId(p.id)}
                        className={`w-full p-6 rounded-2xl text-left border transition-all ${selectedProductId === p.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-white'}`}
                      >
                        <div className="text-[11px] font-black uppercase truncate">{p.title}</div>
                      </button>
                    ))}
                    <button 
                      onClick={() => {
                        const newId = crypto.randomUUID();
                        const newP: Product = { id: newId, slug: 'novo-asset', title: 'Novo Ativo Matrix', subtitle: '', description: '', image_url: '', featured: false, pricing_type: 'one_time', is_active: true };
                        setRegistryProducts([...registryProducts, newP]);
                        setRegistryBlocks({...registryBlocks, [newId]: []});
                        setRegistryVariants({...registryVariants, [newId]: []});
                      }}
                      className="w-full p-6 rounded-2xl border border-dashed border-white/10 text-slate-600 text-[9px] font-black uppercase hover:border-blue-500 hover:text-blue-500 transition-all"
                    >
                      + Adicionar Novo Ativo
                    </button>
                  </div>

                  {/* Editor de Blocos */}
                  <div className="lg:col-span-3 space-y-12">
                    {selectedProductId && (
                      <div className="space-y-12">
                        <section className="space-y-8">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Blocos SQL-Visual</h4>
                            <button onClick={() => addBlock(selectedProductId)} className="bg-white/5 text-blue-500 border border-blue-500/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">+ Bloco Matrix</button>
                          </div>
                          
                          <div className="space-y-6">
                            {(registryBlocks[selectedProductId] || []).sort((a,b) => a.order - b.order).map((block, idx) => (
                              <div key={block.id} className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 space-y-8 group">
                                <div className="flex justify-between items-center">
                                  <span className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500">#{block.order}</span>
                                  <div className="flex gap-4">
                                     {block.block_type === 'hero' && (
                                       <div className="flex items-center gap-2">
                                          <span className="text-[8px] text-slate-600 uppercase font-black">Matrix Color:</span>
                                          <input 
                                            type="color" 
                                            value={block.content.matrix_color || '#2563eb'} 
                                            onChange={e => {
                                              const newBlocks = [...registryBlocks[selectedProductId]];
                                              newBlocks[idx].content.matrix_color = e.target.value;
                                              setRegistryBlocks({...registryBlocks, [selectedProductId]: newBlocks});
                                            }}
                                            className="w-6 h-6 bg-transparent border-none cursor-pointer"
                                          />
                                       </div>
                                     )}
                                     <button onClick={() => {
                                       const newBlocks = registryBlocks[selectedProductId].filter(b => b.id !== block.id);
                                       setRegistryBlocks({...registryBlocks, [selectedProductId]: newBlocks});
                                     }} className="text-red-500 text-[8px] font-black uppercase tracking-widest">Remover</button>
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                  {Object.keys(block.content).filter(k => k !== 'items').map(contentKey => (
                                    <div key={contentKey} className="space-y-3">
                                      <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest">{contentKey}</label>
                                      <input 
                                        value={block.content[contentKey]} 
                                        placeholder={`Placeholder ${contentKey}`}
                                        onChange={e => {
                                          const newBlocks = [...registryBlocks[selectedProductId]];
                                          newBlocks[idx].content[contentKey] = e.target.value;
                                          setRegistryBlocks({...registryBlocks, [selectedProductId]: newBlocks});
                                        }}
                                        className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white text-[10px]" 
                                      />
                                    </div>
                                  ))}
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

            {activeTab === 'visual_engine' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="mb-12">
                   <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">DNA Global & UX Forge</h2>
                </header>
                <div className="grid md:grid-cols-2 gap-10">
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Cores Master</h3>
                    {['primary', 'bg_dark'].map(colorKey => (
                      <div key={colorKey} className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{colorKey}</label>
                        <input type="text" value={config.theme[colorKey]} onChange={e => handleNestedChange(`theme.${colorKey}`, e.target.value)} className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" />
                      </div>
                    ))}
                  </section>
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Global Matrix Engine</h3>
                    {['matrix_speed', 'matrix_opacity'].map(uxKey => (
                      <div key={uxKey} className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{uxKey}</label>
                        <input type="text" value={config.ux[uxKey]} onChange={e => handleNestedChange(`ux.${uxKey}`, e.target.value)} className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" />
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="p-20 bg-blue-600/5 border border-blue-600/10 rounded-[4rem] text-center space-y-10">
                <h3 className="text-4xl font-serif text-white italic tracking-tighter">Consolidar DNA Soberano v14.0</h3>
                <p className="text-slate-500 text-sm max-w-xl mx-auto italic font-light leading-relaxed">
                  Gere o arquivo de registro local para tornar permanentes as mudanças nos ativos V8, Red Pill e na configuração visual do core.
                </p>
                <button onClick={generateCoreFile} className="px-16 py-6 bg-white text-brand-navy rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-blue-600 hover:text-white transition-all shadow-2xl">BAIXAR REGISTRY.TS DEFINITIVO</button>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="mb-12">
                  <h2 className="text-5xl font-serif text-white italic tracking-tighter">Cofre de Vendas</h2>
                </header>
                {orders.map(order => (
                  <div key={order.id} className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-600 font-bold border border-white/5 uppercase">{order.profiles?.full_name?.charAt(0)}</div>
                       <div>
                          <span className="text-xl font-serif text-white italic">{order.profiles?.full_name}</span>
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
import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order, Product, ProductContentBlock, ProductVariant } from '../types';
import { fetchAllOrders, updateOrder, supabase, fetchSiteConfig } from '../services/supabaseService';
import { SITE_CONFIG, LOCAL_INSIGHTS, LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS } from '../services/localRegistry';

type TabType = 'visual_engine' | 'sections' | 'registry_factory' | 'insights' | 'social_seo' | 'orders' | 'maintenance';

const ADMIN_VERSION = "v13.5-IDE-SOVEREIGN";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('visual_engine');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(fetchSiteConfig());

  // Estado Local para o Registry Factory (O coração da sua loja)
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
 * CLAUDIO TONELLI CORE REGISTRY - SOBERANIA TOTAL v13.5
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
      content: { title: "Novo Bloco", style: "matrix" }
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
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em] p-6 border border-white/5 rounded-2xl transition-all">Desconectar</button>
        </div>

        {/* Central Console */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">

            {activeTab === 'registry_factory' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <header className="mb-12 flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">Loja IDE (Fluxo V8 Matrix)</h2>
                    <p className="text-slate-500 text-sm font-light italic">Adicione produtos e edite seus blocos SQL visuais.</p>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={saveLivePreview} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-500 transition-all shadow-xl">Salvar Preview</button>
                  </div>
                </header>

                <div className="grid lg:grid-cols-4 gap-8">
                  {/* Lista de Produtos no Registry */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Produtos Registrados</h3>
                    {registryProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedProductId(p.id)}
                        className={`w-full p-6 rounded-2xl text-left border transition-all ${selectedProductId === p.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-white'}`}
                      >
                        <div className="text-[11px] font-black uppercase truncate">{p.title}</div>
                        <div className="text-[8px] font-mono mt-1 opacity-50">{p.slug}</div>
                      </button>
                    ))}
                    <button 
                      onClick={() => {
                        const newId = crypto.randomUUID();
                        const newP: Product = { id: newId, slug: 'novo-produto', title: 'Novo Ativo', subtitle: '', description: '', image_url: '', featured: false, pricing_type: 'one_time', is_active: true };
                        setRegistryProducts([...registryProducts, newP]);
                        setRegistryBlocks({...registryBlocks, [newId]: []});
                        setRegistryVariants({...registryVariants, [newId]: []});
                      }}
                      className="w-full p-6 rounded-2xl border border-dashed border-white/10 text-slate-600 text-[9px] font-black uppercase hover:border-blue-500 hover:text-blue-500 transition-all"
                    >
                      + Novo Produto Registry
                    </button>
                  </div>

                  {/* Editor de Blocos do Produto Selecionado */}
                  <div className="lg:col-span-3 space-y-12">
                    {selectedProductId && (
                      <div className="space-y-12">
                        {/* Editor de Dados Básicos */}
                        <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Configuração Global do Ativo</h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Nome do Produto</label>
                              <input 
                                value={registryProducts.find(p => p.id === selectedProductId)?.title || ''} 
                                onChange={e => updateRegistryProduct(selectedProductId, 'title', e.target.value)}
                                placeholder="Ex: V8 MATRIX EDITION"
                                className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" 
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Slug (URL)</label>
                              <input 
                                value={registryProducts.find(p => p.id === selectedProductId)?.slug || ''} 
                                onChange={e => updateRegistryProduct(selectedProductId, 'slug', e.target.value)}
                                placeholder="Ex: v8-matrix-edition"
                                className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs font-mono" 
                              />
                            </div>
                          </div>
                        </section>

                        {/* Editor de Blocos Estilo SQL */}
                        <section className="space-y-8">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Blocos de Experiência (SQL Content)</h4>
                            <button onClick={() => addBlock(selectedProductId)} className="bg-white/5 text-blue-500 border border-blue-500/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">+ Adicionar Bloco</button>
                          </div>
                          
                          <div className="space-y-6">
                            {(registryBlocks[selectedProductId] || []).sort((a,b) => a.order - b.order).map((block, idx) => (
                              <div key={block.id} className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 space-y-8 relative group">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500">#{block.order}</span>
                                    <select 
                                      value={block.block_type}
                                      onChange={e => {
                                        const newBlocks = [...registryBlocks[selectedProductId]];
                                        newBlocks[idx].block_type = e.target.value as any;
                                        setRegistryBlocks({...registryBlocks, [selectedProductId]: newBlocks});
                                      }}
                                      className="bg-black border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white"
                                    >
                                      {['hero', 'features', 'comparison', 'video', 'image_gallery', 'cta', 'text'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                    </select>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const newBlocks = registryBlocks[selectedProductId].filter(b => b.id !== block.id);
                                      setRegistryBlocks({...registryBlocks, [selectedProductId]: newBlocks});
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 text-[8px] font-black uppercase tracking-widest"
                                  >
                                    Remover Bloco
                                  </button>
                                </div>

                                {/* Dynamic Content Fields based on Block Type */}
                                <div className="grid md:grid-cols-2 gap-8">
                                  {Object.keys(block.content).map(contentKey => (
                                    <div key={contentKey} className="space-y-3">
                                      <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest">{contentKey}</label>
                                      {Array.isArray(block.content[contentKey]) ? (
                                        <div className="p-4 bg-black border border-white/5 rounded-xl text-[10px] text-slate-500 italic">Editor de Itens em breve (Edite via JSON abaixo)</div>
                                      ) : (
                                        <input 
                                          value={block.content[contentKey]} 
                                          placeholder={`Preencher ${contentKey}...`}
                                          onChange={e => {
                                            const newBlocks = [...registryBlocks[selectedProductId]];
                                            newBlocks[idx].content[contentKey] = e.target.value;
                                            setRegistryBlocks({...registryBlocks, [selectedProductId]: newBlocks});
                                          }}
                                          className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-white text-[10px]" 
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="space-y-3">
                                  <label className="text-[8px] font-black uppercase text-slate-800 tracking-widest">Raw Content JSON</label>
                                  <textarea 
                                    value={JSON.stringify(block.content, null, 2)}
                                    onChange={e => {
                                      try {
                                        const parsed = JSON.parse(e.target.value);
                                        const newBlocks = [...registryBlocks[selectedProductId]];
                                        newBlocks[idx].content = parsed;
                                        setRegistryBlocks({...registryBlocks, [selectedProductId]: newBlocks});
                                      } catch(err) {}
                                    }}
                                    className="w-full h-32 bg-black border border-white/5 rounded-xl p-4 text-[9px] font-mono text-blue-500/70 custom-scrollbar"
                                  />
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
                <header className="mb-12 flex justify-between items-end">
                  <div>
                    <h2 className="text-5xl font-serif text-white italic mb-4 tracking-tighter">Estética & DNA Forge</h2>
                    <div className="w-32 h-1 bg-blue-600 rounded-full"></div>
                  </div>
                  <button onClick={saveLivePreview} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-500 transition-all shadow-xl">Salvar Preview</button>
                </header>
                
                <div className="grid md:grid-cols-2 gap-10">
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Cores Master (Placeholders ativos)</h3>
                    {['primary', 'secondary', 'bg_dark'].map(colorKey => (
                      <div key={colorKey} className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{colorKey}</label>
                        <input 
                          type="text" 
                          value={config.theme[colorKey]} 
                          placeholder="#000000"
                          onChange={e => handleNestedChange(`theme.${colorKey}`, e.target.value)}
                          className="w-full bg-black border border-white/5 rounded-xl px-6 py-4 text-white text-xs" 
                        />
                      </div>
                    ))}
                  </section>

                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">UX & Fine Tuning</h3>
                    {['scanline_opacity', 'glow_intensity', 'border_radius_global', 'h1_size'].map(uxKey => (
                      <div key={uxKey} className="space-y-3">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{uxKey.replace(/_/g, ' ')}</label>
                        <input 
                          type="text" 
                          value={config.ux[uxKey]} 
                          placeholder="ex: 2.5rem ou 0.4"
                          onChange={e => handleNestedChange(`ux.${uxKey}`, e.target.value)}
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
                  <h3 className="text-3xl font-serif text-white italic">Consolidar DNA Soberano (Build v13.5)</h3>
                  <p className="text-slate-500 text-sm font-light leading-relaxed max-w-xl mx-auto italic">
                    Transforme suas edições da Loja IDE e DNA em código real. Este botão gera o localRegistry.ts final com todos os blocos SQL de produtos que você configurou.
                  </p>
                  <button onClick={generateCoreFile} className="px-16 py-6 bg-white text-brand-navy rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-blue-600 hover:text-white transition-all shadow-2xl">BAIXAR DEFINITIVO REGISTRY.TS</button>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <AdminCrudSection tableName="insights" title="Insights Registry" fields={[{ key: 'title', label: 'Título' }, { key: 'category', label: 'Categoria' }, { key: 'excerpt', label: 'Resumo', type: 'textarea' }, { key: 'image_url', label: 'Imagem' }, { key: 'content', label: 'HTML', type: 'rich-text' }, { key: 'is_active', label: 'Publicado', type: 'toggle' }]} displayColumns={['title']} />
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
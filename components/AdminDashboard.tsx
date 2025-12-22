
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  updateSiteContent, fetchMetrics, fetchInsights,
  addInsight, deleteInsight, updateInsight,
  fetchCarouselImages, addCarouselImage, deleteCarouselImage, updateCarouselImage,
  fetchAllSiteContent, fetchContacts, deleteContact,
  deleteTestimonial, updateTestimonial, fetchTestimonials,
  upsertTranslation, fetchTranslationsForEntity,
  fetchProducts, updateProduct, deleteProduct, addProduct,
  updateMetric, addMetric, deleteMetric, getCurrentUser
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, CarouselImage, SiteContent, Contact, Product } from '../types';

type AdminLang = 'pt' | 'en' | 'es';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'leads'>('carousel');
  const [editingLang, setEditingLang] = useState<AdminLang>('pt');
  const [tabSearch, setTabSearch] = useState<Record<string, string>>({
    carousel: '', insights: '', products: '', metrics: '', testimonials: '', content: '', leads: ''
  });
  
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [translationsCache, setTranslationsCache] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editItem, setEditItem] = useState<{ type: string, data: any } | null>(null);

  // Form states for NEW items
  const [newCarousel, setNewCarousel] = useState({ url: '', title: '', subtitle: '', display_order: 1 });
  const [newMetric, setNewMetric] = useState({ label: '', value: '', display_order: 1 });
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, type: 'service' as 'product'|'service', image_url: '', url: '' });
  const [newInsight, setNewInsight] = useState({ title: '', category: 'ESTRATEGIA', image_url: '', excerpt: '', content: '' });

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [t_all, m, i, c, l, lds, p] = await Promise.all([
        fetchTestimonials(),
        fetchMetrics(),
        fetchInsights(),
        fetchCarouselImages(),
        fetchAllSiteContent(),
        fetchContacts(),
        fetchProducts()
      ]);
      setAllTestimonials(t_all || []);
      setMetrics(m || []);
      setInsights(i || []);
      setCarouselImages(c || []);
      setSiteLabels(l || []);
      setLeads(lds || []);
      setProducts(p || []);

      const entities = [
        ...(c || []).map(x => ({ type: 'carousel_images', id: x.id })),
        ...(i || []).map(x => ({ type: 'insights', id: x.id })),
        ...(p || []).map(x => ({ type: 'products', id: x.id })),
        ...(m || []).map(x => ({ type: 'metrics', id: x.id })),
        ...(t_all || []).map(x => ({ type: 'testimonials', id: x.id }))
      ];

      const trans: Record<string, any> = {};
      const transResults = await Promise.all(
        entities.map(async (item) => {
          const data = await fetchTranslationsForEntity(item.type, item.id).catch(() => ({}));
          return { id: String(item.id), data };
        })
      );

      transResults.forEach(res => {
        if (res.data && Object.keys(res.data).length > 0) trans[res.id] = res.data;
      });
      setTranslationsCache(trans);
    } catch (err) {
      console.error("Admin Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const handleUpdateTranslation = async (entityType: string, entityId: any, field: string, locale: string, value: string) => {
    await upsertTranslation(entityType, entityId, field, locale, value);
    setTranslationsCache(prev => ({
      ...prev,
      [String(entityId)]: {
        ...prev[String(entityId)],
        [field]: { ...prev[String(entityId)]?.[field], [locale]: value }
      }
    }));
  };

  const updateOriginalOrTranslation = async (entityType: string, entityId: any, field: string, value: string, updateFn?: (id: any, updates: any) => Promise<boolean>) => {
    if (editingLang === 'pt') {
      if (updateFn) await updateFn(entityId, { [field]: value });
    } else {
      await handleUpdateTranslation(entityType, entityId, field, editingLang, value);
    }
    loadAdminData();
  };

  const confirmDelete = async (id: string, deleteFn: (id: string) => Promise<boolean>) => {
    if (window.confirm('Excluir este registro permanentemente?')) {
      await deleteFn(id);
      loadAdminData();
    }
  };

  const toggleActive = async (id: string, current: boolean, updateFn: (id: any, updates: any) => Promise<boolean>) => {
    await updateFn(id, { is_active: !current });
    loadAdminData();
  };

  // Filtered Lists per tab (Per-section Search)
  const filteredData = useMemo(() => {
    const s = (tabSearch[activeTab] || '').toLowerCase();
    switch (activeTab) {
      case 'carousel': return carouselImages.filter(x => (x.title || '').toLowerCase().includes(s));
      case 'insights': return insights.filter(x => x.title.toLowerCase().includes(s));
      case 'products': return products.filter(x => x.name.toLowerCase().includes(s));
      case 'metrics': return metrics.filter(x => x.label.toLowerCase().includes(s));
      case 'testimonials': return allTestimonials.filter(x => x.name.toLowerCase().includes(s));
      case 'content': return siteLabels.filter(x => x.key.toLowerCase().includes(s));
      case 'leads': return leads.filter(x => x.name.toLowerCase().includes(s) || x.email.toLowerCase().includes(s));
      default: return [];
    }
  }, [activeTab, carouselImages, insights, products, metrics, allTestimonials, siteLabels, leads, tabSearch]);

  const handleCreate = async () => {
    setIsLoading(true);
    const user = await getCurrentUser();
    try {
      if (activeTab === 'carousel') await addCarouselImage({ ...newCarousel, is_active: true, created_by: user?.id });
      if (activeTab === 'metrics') await addMetric({ ...newMetric, is_active: true });
      if (activeTab === 'insights') await addInsight({ ...newInsight, is_active: true });
      if (activeTab === 'products') await addProduct({ ...newProduct, config: { image_url: newProduct.image_url, url: newProduct.url } });
      
      setIsAdding(false);
      loadAdminData();
    } catch (e) { console.error(e); }
  };

  const renderNoData = () => (
    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.02]">
      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500">Nenhum dado localizado nesta seção</span>
      <p className="text-slate-600 text-xs mt-2 font-light">Tente ajustar sua busca ou adicione um novo registro.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-brand-navy/95 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-7xl h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in fade-in duration-700">
        
        {/* Unified Sidebar */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-12 flex flex-row lg:flex-col gap-10 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-5 mb-0 lg:mb-16 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/40 text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Advisory Admin</span>
              <span className="text-[8px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">Management v3.0</span>
            </div>
          </div>
          <nav className="flex flex-row lg:flex-col gap-4 flex-1">
            {[
              { id: 'carousel', label: 'Destaques' },
              { id: 'insights', label: 'Knowledge' },
              { id: 'products', label: 'Soluções' },
              { id: 'metrics', label: 'Indicadores' },
              { id: 'testimonials', label: 'Feedback' },
              { id: 'content', label: 'Global Text' },
              { id: 'leads', label: 'CRM Leads' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); setIsAdding(false); }} 
                className={`whitespace-nowrap px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left group ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-widest mt-auto p-5 border border-white/5 rounded-2xl transition-all hover:border-red-500/20">Sair do Painel</button>
        </div>

        {/* Dynamic Content Grid */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar">
          {isLoading && <div className="absolute top-12 right-12 w-3 h-3 bg-blue-500 rounded-full animate-ping z-20"></div>}

          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* Standard Tab Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-12">
               <div className="space-y-6 flex-1 w-full">
                  <h2 className="text-6xl font-serif italic text-white capitalize tracking-tighter">
                    {activeTab === 'carousel' ? 'Visual Engine' : activeTab}
                  </h2>
                  <div className="relative group max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder={`Localizar em ${activeTab}...`} 
                      value={tabSearch[activeTab] || ''} 
                      onChange={e => setTabSearch(prev => ({ ...prev, [activeTab]: e.target.value }))} 
                      className="bg-[#050a14] border border-white/5 rounded-2xl pl-14 pr-8 py-4 text-[11px] text-white outline-none focus:border-blue-500/40 w-full font-medium shadow-inner" 
                    />
                  </div>
               </div>
               <div className="flex items-center gap-5 shrink-0">
                 {['carousel', 'insights', 'products', 'metrics'].includes(activeTab) && (
                    <button 
                      onClick={() => setIsAdding(!isAdding)}
                      className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${isAdding ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 active:scale-95'}`}
                    >
                      {isAdding ? 'Fechar Form' : `+ Novo ${activeTab.slice(0, -1)}`}
                    </button>
                 )}
                 <div className="flex gap-1 bg-[#050a14] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                      <button 
                        key={l} 
                        onClick={() => setEditingLang(l)} 
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}
                      >
                        {l}
                      </button>
                    ))}
                 </div>
               </div>
            </header>

            {/* Standard Form Area (Reserved on Top) */}
            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, y: -30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -30 }}
                  className="bg-[#050a14] border border-blue-600/10 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none"></div>
                  <div className="relative z-10 space-y-8">
                    <h3 className="text-white font-serif italic text-3xl">Inclusão Estratégica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {activeTab === 'carousel' && (
                        <>
                          <input placeholder="Link da Imagem (URL)" className="bg-[#02050c] p-5 rounded-2xl text-white text-xs border border-white/5 col-span-2 outline-none focus:border-blue-500/40" onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                          <input placeholder="Título Principal (PT)" className="bg-[#02050c] p-5 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} />
                          <input placeholder="Ordem (Ex: 1)" type="number" className="bg-[#02050c] p-5 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewCarousel({...newCarousel, display_order: parseInt(e.target.value)})} />
                        </>
                      )}
                      {activeTab === 'metrics' && (
                        <>
                          <input placeholder="Valor (Ex: +300)" className="bg-[#02050c] p-5 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewMetric({...newMetric, value: e.target.value})} />
                          <input placeholder="Label (Ex: Projetos)" className="bg-[#02050c] p-5 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewMetric({...newMetric, label: e.target.value})} />
                        </>
                      )}
                    </div>
                    <button onClick={handleCreate} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] hover:bg-blue-500 shadow-2xl shadow-blue-600/20 transition-all">Sincronizar com Banco de Dados</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Table/Grid (Reserved Space below form) */}
            <div className="space-y-6">
              {filteredData.length === 0 ? renderNoData() : (
                <div className="space-y-4">
                   {/* Table Column Headers */}
                   <div className="px-10 flex text-[9px] font-black uppercase tracking-[0.4em] text-slate-700 pb-4">
                      <div className="w-16">Status</div>
                      <div className="flex-1 px-4">Conteúdo Estratégico</div>
                      <div className="w-40 text-right">Ações</div>
                   </div>
                   
                   {filteredData.map((item: any) => (
                    <div key={item.id || item.key} className="bg-[#050a14] border border-white/5 p-8 rounded-[2.5rem] group hover:border-blue-500/20 transition-all flex flex-col md:flex-row gap-10 items-center shadow-xl relative overflow-hidden">
                      
                      {/* Standard Item Indicator (Status/Image) */}
                      <div className="shrink-0 flex items-center gap-6">
                        {item.is_active !== undefined && (
                          <button 
                            onClick={() => toggleActive(item.id, item.is_active, activeTab === 'carousel' ? updateCarouselImage : activeTab === 'metrics' ? updateMetric : updateInsight)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-900 text-slate-700 border border-white/5'}`}
                          >
                            <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
                          </button>
                        )}
                        {item.url && activeTab === 'carousel' && (
                          <div className="w-24 aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shrink-0">
                            <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                          </div>
                        )}
                        {item.value && activeTab === 'metrics' && (
                          <div className="w-16 h-16 rounded-2xl bg-blue-600/5 flex items-center justify-center text-xl font-serif text-white shrink-0 border border-white/5">{item.value}</div>
                        )}
                      </div>

                      {/* Main Strategic Data */}
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center gap-4">
                          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-500/50">REF: {item.id?.slice(0, 8) || item.key}</span>
                          {item.display_order && <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-700">Order: {item.display_order}</span>}
                        </div>

                        {activeTab === 'content' ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400 truncate tracking-widest">{item.key}</span>
                            <input 
                              className="md:col-span-2 bg-[#02050c] border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-blue-500/40 w-full" 
                              value={item.value} 
                              onChange={e => {
                                const val = e.target.value;
                                setSiteLabels(prev => prev.map(l => l.key === item.key ? {...l, value: val} : l));
                              }}
                              onBlur={e => updateSiteContent(item.key, e.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <input 
                              className="w-full bg-[#02050c] border border-white/5 p-4 rounded-xl text-white text-[12px] font-bold outline-none focus:border-blue-500/40" 
                              defaultValue={editingLang === 'pt' ? (item.title || item.label || item.name || '') : (translationsCache[item.id]?.[activeTab === 'carousel' || activeTab === 'insights' ? 'title' : activeTab === 'metrics' ? 'label' : 'name']?.[editingLang] || '')} 
                              onBlur={e => updateOriginalOrTranslation(activeTab === 'carousel' ? 'carousel_images' : activeTab === 'metrics' ? 'metrics' : activeTab === 'insights' ? 'insights' : 'products', item.id, activeTab === 'carousel' || activeTab === 'insights' ? 'title' : activeTab === 'metrics' ? 'label' : 'name', e.target.value, activeTab === 'carousel' ? updateCarouselImage : activeTab === 'metrics' ? updateMetric : activeTab === 'insights' ? updateInsight : updateProduct)}
                              placeholder="Título Principal do Registro..."
                            />
                            <textarea 
                              className="w-full bg-[#02050c] border border-white/5 p-4 rounded-xl text-slate-500 text-[11px] font-light outline-none focus:border-blue-500/40 min-h-[70px] leading-relaxed" 
                              defaultValue={editingLang === 'pt' ? (item.subtitle || item.description || item.quote || '') : (translationsCache[item.id]?.[activeTab === 'carousel' ? 'subtitle' : activeTab === 'products' ? 'description' : 'quote']?.[editingLang] || '')} 
                              onBlur={e => updateOriginalOrTranslation(activeTab === 'carousel' ? 'carousel_images' : activeTab === 'products' ? 'products' : 'testimonials', item.id, activeTab === 'carousel' ? 'subtitle' : activeTab === 'products' ? 'description' : 'quote', e.target.value, activeTab === 'carousel' ? updateCarouselImage : activeTab === 'products' ? updateProduct : updateTestimonial)}
                              placeholder="Descrição detalhada ou subtítulo de apoio..."
                            />
                          </div>
                        )}
                      </div>

                      {/* Unified Control Actions */}
                      <div className="shrink-0 flex items-center gap-4">
                        <button 
                          onClick={() => confirmDelete(item.id || item.key, activeTab === 'carousel' ? deleteCarouselImage : activeTab === 'metrics' ? deleteMetric : activeTab === 'insights' ? deleteInsight : activeTab === 'products' ? deleteProduct : deleteContact)} 
                          className="p-5 rounded-2xl text-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all border border-transparent hover:border-red-500/20"
                          title="Remover Permanentemente"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Standard Executive Modal for Deep Content (Tiptap Integration point) */}
      <AnimatePresence>
        {editItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-brand-navy/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#02050c] border border-white/10 w-full max-w-3xl rounded-[4rem] p-16 space-y-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
               <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-serif text-white italic">Editor Estratégico</h3>
                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em]">Refining Global Content</p>
                  </div>
                  <button onClick={() => setEditItem(null)} className="p-4 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               {/* Reserved for TipTap / Advanced Form Fields */}
               <div className="min-h-[400px] flex items-center justify-center border border-white/5 rounded-[3rem] bg-white/[0.01]">
                  <span className="text-slate-700 text-[10px] font-black uppercase tracking-widest">Advanced Editor Interface</span>
               </div>
               <button className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-blue-600/30">Finalizar Edição</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

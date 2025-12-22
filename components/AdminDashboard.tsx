
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
  const [tabSearch, setTabSearch] = useState<Record<string, string>>({});
  
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
    if (window.confirm('Excluir este registro estratégico permanentemente?')) {
      await deleteFn(id);
      loadAdminData();
    }
  };

  const toggleActive = async (id: string, current: boolean, updateFn: (id: any, updates: any) => Promise<boolean>) => {
    await updateFn(id, { is_active: !current });
    loadAdminData();
  };

  // Filtered Lists per tab
  const getSearch = () => tabSearch[activeTab] || '';
  const setSearch = (val: string) => setTabSearch(prev => ({ ...prev, [activeTab]: val }));

  const filteredData = useMemo(() => {
    const s = getSearch().toLowerCase();
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
    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Nenhum registro localizado nesta seção</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#010309]/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-white/10 w-full max-w-7xl h-full lg:h-[90vh] rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-slate-900 border-r border-white/5 p-10 flex flex-row lg:flex-col gap-8 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-4 mb-0 lg:mb-12 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/30 text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.5em] text-white">Strategic Panel</span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-blue-500 font-bold">Advisory v2.5</span>
            </div>
          </div>
          <nav className="flex flex-row lg:flex-col gap-3 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Insights Hub' },
              { id: 'products', label: 'Portfólio' },
              { id: 'metrics', label: 'Indicadores' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Textos Globais' },
              { id: 'leads', label: 'Leads' }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsAdding(false); }} className={`whitespace-nowrap px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>{tab.label}</button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-600 hover:text-red-500 text-[9px] font-black uppercase tracking-widest mt-auto p-4 border border-white/5 rounded-xl transition-all">Encerrar Painel</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          {isLoading && <div className="absolute top-8 right-8 w-2 h-2 bg-blue-500 rounded-full animate-ping z-20"></div>}

          <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Standard Header per Tab */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 border-b border-white/5 pb-10">
               <div className="space-y-4">
                  <h2 className="text-5xl font-serif italic text-white capitalize">{activeTab === 'carousel' ? 'Main Carousel' : activeTab}</h2>
                  <div className="relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder={`Localizar em ${activeTab}...`} 
                      value={getSearch()} 
                      onChange={e => setSearch(e.target.value)} 
                      className="bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-[10px] text-white outline-none focus:border-blue-500/40 w-full sm:w-72 font-medium" 
                    />
                  </div>
               </div>
               <div className="flex items-center gap-4">
                 {['carousel', 'insights', 'products', 'metrics'].includes(activeTab) && (
                    <button 
                      onClick={() => setIsAdding(!isAdding)}
                      className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${isAdding ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20 active:scale-95'}`}
                    >
                      {isAdding ? 'Cancelar' : `+ Novo ${activeTab.slice(0, -1)}`}
                    </button>
                 )}
                 <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-white/5 shadow-inner">
                    {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                      <button key={l} onClick={() => setEditingLang(l)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-white'}`}>{l}</button>
                    ))}
                 </div>
               </div>
            </header>

            {/* Form Section (Reserved Space on Top) */}
            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -20 }} 
                  animate={{ opacity: 1, height: 'auto', y: 0 }} 
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl overflow-hidden"
                >
                  <div className="space-y-6">
                    <h3 className="text-white font-serif italic text-2xl mb-8">Novo Registro: {activeTab}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {activeTab === 'carousel' && (
                        <>
                          <input placeholder="URL da Imagem" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5 col-span-2" onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                          <input placeholder="Título (Base PT)" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} />
                          <input placeholder="Ordem de exibição" type="number" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewCarousel({...newCarousel, display_order: parseInt(e.target.value)})} />
                        </>
                      )}
                      {activeTab === 'metrics' && (
                        <>
                          <input placeholder="Valor (Ex: 95%)" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewMetric({...newMetric, value: e.target.value})} />
                          <input placeholder="Legenda (PT)" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewMetric({...newMetric, label: e.target.value})} />
                        </>
                      )}
                      {activeTab === 'products' && (
                        <>
                          <input placeholder="Nome do Produto" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                          <input placeholder="Preço" type="number" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                          <input placeholder="URL de Imagem" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
                          <input placeholder="URL de Link/Checkout" className="bg-slate-950 p-4 rounded-xl text-white text-xs border border-white/5" onChange={e => setNewProduct({...newProduct, url: e.target.value})} />
                        </>
                      )}
                    </div>
                    <button onClick={handleCreate} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-8 hover:bg-blue-500 shadow-xl shadow-blue-600/30">Confirmar Inclusão Estratégica</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid Section (Reserved Space below form) */}
            <div className="space-y-6">
              {filteredData.length === 0 ? renderNoData() : filteredData.map((item: any) => (
                <div key={item.id || item.key} className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] group hover:border-blue-500/20 transition-all flex flex-col sm:flex-row gap-8 items-center shadow-lg">
                  
                  {/* Item Image / Placeholder */}
                  {item.url && activeTab === 'carousel' ? (
                    <div className="w-40 aspect-video rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-white/5">
                      <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                    </div>
                  ) : item.value && activeTab === 'metrics' ? (
                    <div className="w-20 h-20 rounded-2xl bg-blue-600/5 flex items-center justify-center text-2xl font-serif text-white shrink-0 border border-white/5">{item.value}</div>
                  ) : null}

                  {/* Item Content */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex justify-between items-start">
                       <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-500 bg-blue-500/5 px-4 py-1.5 rounded-full">ID: {item.id?.slice(0, 8) || item.key}</span>
                       <div className="flex items-center gap-3">
                         {item.is_active !== undefined && (
                           <button 
                             onClick={() => toggleActive(item.id, item.is_active, activeTab === 'carousel' ? updateCarouselImage : activeTab === 'metrics' ? updateMetric : updateInsight)}
                             className={`p-2 rounded-xl transition-all ${item.is_active ? 'text-green-500 bg-green-500/5 hover:bg-green-500/10' : 'text-slate-600 bg-white/5 hover:bg-white/10'}`}
                             title={item.is_active ? 'Inativar' : 'Ativar'}
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                             </svg>
                           </button>
                         )}
                         <button onClick={() => confirmDelete(item.id || item.key, activeTab === 'carousel' ? deleteCarouselImage : activeTab === 'metrics' ? deleteMetric : activeTab === 'content' ? () => Promise.resolve(false) : deleteContact)} className="p-2 rounded-xl text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                         </button>
                       </div>
                    </div>

                    {activeTab === 'content' ? (
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <span className="w-48 text-[9px] font-black uppercase text-slate-500 truncate">{item.key}</span>
                        <input 
                          className="flex-1 w-full bg-slate-950 border border-white/5 p-3 rounded-xl text-white text-xs outline-none focus:border-blue-500/40" 
                          value={item.value} 
                          onChange={e => {
                            const val = e.target.value;
                            setSiteLabels(prev => prev.map(l => l.key === item.key ? {...l, value: val} : l));
                          }}
                          onBlur={e => updateSiteContent(item.key, e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <input 
                          className="w-full bg-slate-950 border border-white/5 p-3 rounded-xl text-white text-[11px] font-bold outline-none focus:border-blue-500/40" 
                          defaultValue={editingLang === 'pt' ? (item.title || item.label || item.name || '') : (translationsCache[item.id]?.[activeTab === 'carousel' || activeTab === 'insights' ? 'title' : activeTab === 'metrics' ? 'label' : 'name']?.[editingLang] || '')} 
                          onBlur={e => updateOriginalOrTranslation(activeTab === 'carousel' ? 'carousel_images' : activeTab === 'metrics' ? 'metrics' : activeTab === 'insights' ? 'insights' : 'products', item.id, activeTab === 'carousel' || activeTab === 'insights' ? 'title' : activeTab === 'metrics' ? 'label' : 'name', e.target.value, activeTab === 'carousel' ? updateCarouselImage : activeTab === 'metrics' ? updateMetric : activeTab === 'insights' ? updateInsight : updateProduct)}
                          placeholder="Título Principal..."
                        />
                        <textarea 
                          className="w-full bg-slate-950 border border-white/5 p-3 rounded-xl text-slate-400 text-[10px] outline-none focus:border-blue-500/40 min-h-[60px]" 
                          defaultValue={editingLang === 'pt' ? (item.subtitle || item.description || item.quote || '') : (translationsCache[item.id]?.[activeTab === 'carousel' ? 'subtitle' : activeTab === 'products' ? 'description' : 'quote']?.[editingLang] || '')} 
                          onBlur={e => updateOriginalOrTranslation(activeTab === 'carousel' ? 'carousel_images' : activeTab === 'products' ? 'products' : 'testimonials', item.id, activeTab === 'carousel' ? 'subtitle' : activeTab === 'products' ? 'description' : 'quote', e.target.value, activeTab === 'carousel' ? updateCarouselImage : activeTab === 'products' ? updateProduct : updateTestimonial)}
                          placeholder="Detalhes ou tradução secundária..."
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Edit Modal (Optional for deeper edits like full HTML content) */}
      <AnimatePresence>
        {editItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-[#010309]/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 space-y-8 shadow-2xl">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-serif text-white italic">Editor Estratégico</h3>
                  <button onClick={() => setEditItem(null)} className="text-slate-500 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
               </div>
               {/* Modal Content logic here */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

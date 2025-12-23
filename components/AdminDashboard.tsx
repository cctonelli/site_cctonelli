
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for NEW items
  const [newCarousel, setNewCarousel] = useState({ url: '', title: '', subtitle: '', display_order: 1 });
  const [newMetric, setNewMetric] = useState({ label: '', value: '', display_order: 1 });
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

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
      setIsAdding(false);
      loadAdminData();
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const renderNoData = () => (
    <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]">
       <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
       </div>
       <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600">Nenhum registro localizado nesta seção</span>
       <p className="text-slate-700 text-xs mt-4 font-light italic">Refine sua busca ou adicione um novo registro no formulário acima.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-brand-navy/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-7xl h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in fade-in duration-700">
        
        {/* Sidebar Executiva */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-12 flex flex-row lg:flex-col gap-10 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-5 mb-0 lg:mb-16 min-w-fit cursor-pointer" onClick={loadAdminData}>
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/40 text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Advisory Hub</span>
              <span className="text-[8px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">Management v5.0</span>
            </div>
          </div>
          <nav className="flex flex-row lg:flex-col gap-4 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel Principal' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'products', label: 'Soluções Digitais' },
              { id: 'metrics', label: 'Indicadores KPI' },
              { id: 'testimonials', label: 'Feedbacks' },
              { id: 'content', label: 'Textos Globais' },
              { id: 'leads', label: 'CRM Leads' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); setIsAdding(false); }} 
                className={`whitespace-nowrap px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-widest mt-auto p-6 border border-white/5 rounded-2xl transition-all hover:border-red-500/20">Sair do Painel</button>
        </div>

        {/* Área de Controle e Grid */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar">
          {isLoading && <div className="absolute top-12 right-12 w-4 h-4 bg-blue-500 rounded-full animate-ping z-20"></div>}

          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* Cabeçalho com Busca */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-b border-white/5 pb-12">
               <div className="space-y-6 flex-1 w-full">
                  <h2 className="text-6xl font-serif italic text-white capitalize tracking-tighter">
                    {activeTab === 'carousel' ? 'Visual Engine' : activeTab}
                  </h2>
                  <div className="relative group max-w-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder={`Localizar em ${activeTab}...`} 
                      value={tabSearch[activeTab]} 
                      onChange={e => setTabSearch(prev => ({ ...prev, [activeTab]: e.target.value }))} 
                      className="bg-[#050a14] border border-white/5 rounded-2xl pl-16 pr-8 py-5 text-[11px] text-white outline-none focus:border-blue-500/40 w-full font-medium shadow-inner transition-all" 
                    />
                  </div>
               </div>
               <div className="flex items-center gap-6">
                 {['carousel', 'insights', 'metrics', 'products'].includes(activeTab) && (
                    <button 
                      onClick={() => setIsAdding(!isAdding)}
                      className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${isAdding ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 active:scale-95'}`}
                    >
                      {isAdding ? 'Fechar Form' : `+ Novo Registro`}
                    </button>
                 )}
                 <div className="flex gap-1.5 bg-[#050a14] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                      <button key={l} onClick={() => setEditingLang(l)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-700 hover:text-white'}`}>{l}</button>
                    ))}
                 </div>
               </div>
            </header>

            {/* Formulário de Inclusão */}
            <AnimatePresence>
              {isAdding && (
                <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} className="bg-[#050a14] border border-blue-600/10 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none"></div>
                  <div className="relative z-10 space-y-10">
                    <h3 className="text-white font-serif italic text-3xl">Novos Dados Estratégicos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {activeTab === 'carousel' && (
                        <>
                          <input placeholder="Image Link (URL)" className="bg-[#02050c] p-6 rounded-2xl text-white text-xs border border-white/5 col-span-2 outline-none focus:border-blue-500/40" onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                          <input placeholder="Título Principal (PT)" className="bg-[#02050c] p-6 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} />
                          <input placeholder="Ordem (Ex: 1)" type="number" className="bg-[#02050c] p-6 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewCarousel({...newCarousel, display_order: parseInt(e.target.value)})} />
                        </>
                      )}
                      {activeTab === 'metrics' && (
                        <>
                          <input placeholder="Valor (Ex: +200)" className="bg-[#02050c] p-6 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewMetric({...newMetric, value: e.target.value})} />
                          <input placeholder="Label (Ex: Projetos)" className="bg-[#02050c] p-6 rounded-2xl text-white text-xs border border-white/5 outline-none focus:border-blue-500/40" onChange={e => setNewMetric({...newMetric, label: e.target.value})} />
                        </>
                      )}
                    </div>
                    <button onClick={handleCreate} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl shadow-blue-600/20 hover:bg-blue-500 transition-all">Confirmar e Sincronizar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid de Conteúdo */}
            <div className="space-y-6">
              {filteredData.length === 0 ? renderNoData() : (
                <div className="space-y-4">
                  {/* Grid Header */}
                  <div className="px-10 flex text-[9px] font-black uppercase tracking-[0.5em] text-slate-700 pb-6 border-b border-white/5">
                    <div className="w-20">Status</div>
                    <div className="flex-1 px-10 text-center">Estrutura de Conteúdo</div>
                    <div className="w-40 text-right">Ações</div>
                  </div>

                  {filteredData.map((item: any) => (
                    <div key={item.id || item.key} className="bg-[#050a14] border border-white/5 p-8 rounded-[3rem] group hover:border-blue-500/20 transition-all flex flex-col md:flex-row gap-10 items-center shadow-xl relative overflow-hidden">
                      
                      {/* Status/Preview */}
                      <div className="shrink-0 flex items-center gap-6">
                        {item.is_active !== undefined && (
                          <button 
                            onClick={() => toggleActive(item.id, item.is_active, activeTab === 'carousel' ? updateCarouselImage : activeTab === 'metrics' ? updateMetric : updateInsight)}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${item.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-900 text-slate-700 border border-white/5'}`}
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${item.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
                          </button>
                        )}
                        {item.url && activeTab === 'carousel' && (
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shrink-0">
                            <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" alt="" />
                          </div>
                        )}
                        {item.value && activeTab === 'metrics' && (
                          <div className="w-20 h-20 rounded-2xl bg-blue-600/5 flex items-center justify-center text-2xl font-serif text-white shrink-0 border border-white/5">{item.value}</div>
                        )}
                      </div>

                      {/* Conteúdo Gestão */}
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center gap-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/40">REF: {item.id?.slice(0, 8) || item.key}</span>
                           {item.display_order && <span className="px-4 py-1.5 bg-white/5 rounded-xl text-[8px] font-black uppercase text-slate-600 tracking-widest">Index: {item.display_order}</span>}
                        </div>

                        {activeTab === 'content' ? (
                          <div className="flex flex-col md:flex-row gap-6 items-center">
                            <span className="text-[10px] font-black uppercase text-slate-500 truncate w-48 tracking-widest">{item.key}</span>
                            <input 
                              className="flex-1 w-full bg-[#02050c] border border-white/5 p-5 rounded-2xl text-white text-xs outline-none focus:border-blue-500/40 shadow-inner" 
                              value={item.value} 
                              onChange={e => {
                                const val = e.target.value;
                                setSiteLabels(prev => prev.map(l => l.key === item.key ? {...l, value: val} : l));
                              }}
                              onBlur={e => updateSiteContent(item.key, e.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <input 
                              className="w-full bg-[#02050c] border border-white/5 p-5 rounded-2xl text-white text-[14px] font-bold outline-none focus:border-blue-500/40 transition-all shadow-inner" 
                              defaultValue={editingLang === 'pt' ? (item.title || item.label || item.name || '') : (item[`title_${editingLang}`] || item[`label_${editingLang}`] || item[`name_${editingLang}`] || '')} 
                              placeholder="Título de Gestão..."
                            />
                            <textarea 
                              className="w-full bg-[#02050c] border border-white/5 p-5 rounded-2xl text-slate-500 text-[12px] font-light outline-none focus:border-blue-500/40 min-h-[80px] resize-none leading-relaxed transition-all shadow-inner" 
                              defaultValue={editingLang === 'pt' ? (item.subtitle || item.description || item.quote || '') : ''}
                              placeholder="Descrição estratégica ou subtítulo de apoio..."
                            />
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="shrink-0 flex items-center gap-4">
                        <button 
                          onClick={() => confirmDelete(item.id || item.key, activeTab === 'carousel' ? deleteCarouselImage : activeTab === 'metrics' ? deleteMetric : activeTab === 'insights' ? deleteInsight : deleteContact)} 
                          className="p-6 rounded-2xl text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 active:scale-90"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    </div>
  );
};

export default AdminDashboard;

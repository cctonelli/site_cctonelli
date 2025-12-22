
import React, { useState, useEffect, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Form states
  const [newCarousel, setNewCarousel] = useState({ url: '', title: '', subtitle: '', display_order: 1 });

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

      const entitiesToFetch = [
        ...(c || []).map(x => ({ type: 'carousel_images', id: x.id })),
        ...(i || []).map(x => ({ type: 'insights', id: x.id })),
        ...(p || []).map(x => ({ type: 'products', id: x.id })),
        ...(m || []).map(x => ({ type: 'metrics', id: x.id })),
        ...(t_all || []).map(x => ({ type: 'testimonials', id: x.id }))
      ];

      const trans: Record<string, any> = {};
      const transResults = await Promise.all(
        entitiesToFetch.map(async (item) => {
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
    // Silent update do cache local para UX fluida
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
    // Opcionalmente recarregar para garantir sincronia com RLS
    // loadAdminData(); 
  };

  const confirmDelete = async (id: string, deleteFn: (id: string) => Promise<boolean>) => {
    if (window.confirm('Excluir este registro estratégico?')) {
      await deleteFn(id);
      loadAdminData();
    }
  };

  const handleAddCarousel = async () => {
    const user = await getCurrentUser();
    if (!user) return alert("Sessão expirada");
    await addCarouselImage({ ...newCarousel, is_active: true, created_by: user.id });
    setIsAdding(false);
    loadAdminData();
  };

  const filteredCarousel = useMemo(() => carouselImages.filter(img => (img.title || '').toLowerCase().includes(searchTerm.toLowerCase())), [carouselImages, searchTerm]);
  const filteredMetrics = useMemo(() => metrics.filter(m => m.label.toLowerCase().includes(searchTerm.toLowerCase())), [metrics, searchTerm]);
  const filteredInsights = useMemo(() => insights.filter(ins => ins.title.toLowerCase().includes(searchTerm.toLowerCase())), [insights, searchTerm]);
  const filteredContent = useMemo(() => siteLabels.filter(l => l.key.toLowerCase().includes(searchTerm.toLowerCase())), [siteLabels, searchTerm]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-slate-900 border border-white/10 w-full max-w-7xl h-full sm:h-[96vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar Administrativa */}
        <div className="w-full md:w-72 bg-slate-950 border-r border-white/5 p-10 flex flex-row md:flex-col gap-8 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-4 mb-0 md:mb-12 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/30 text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.4em] text-white">Advisory Hub</span>
            </div>
          </div>
          <nav className="flex flex-row md:flex-col gap-3 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel Principal' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'products', label: 'Soluções' },
              { id: 'metrics', label: 'Métricas ROI' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Textos Globais' },
              { id: 'leads', label: 'Leads de Venda' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); setIsAdding(false); }} 
                className={`whitespace-nowrap px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[9px] font-black uppercase tracking-widest mt-auto border border-white/5 p-4 rounded-xl transition-colors">Fechar Painel</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-16 bg-grid custom-scrollbar relative">
          {isLoading && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10 mb-10">
             <div>
                <h2 className="text-4xl font-serif italic text-white capitalize tracking-tight">{activeTab}</h2>
                <div className="relative mt-4">
                  <input 
                    type="text" 
                    placeholder="Filtrar registros..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-blue-500/40 w-64 font-medium" 
                  />
                </div>
             </div>
             <div className="flex items-center gap-6">
               {['carousel', 'insights', 'products', 'metrics'].includes(activeTab) && (
                 <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isAdding ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-lg'}`}
                 >
                   {isAdding ? 'Cancelar' : '+ Novo'}
                 </button>
               )}
               <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 shadow-inner">
                  {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                    <button key={l} onClick={() => setEditingLang(l)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-white'}`}>{l}</button>
                  ))}
               </div>
             </div>
          </header>

          <div className="space-y-8 max-w-4xl mx-auto">
            {isAdding && activeTab === 'carousel' && (
              <div className="bg-blue-600/5 border border-blue-600/20 p-8 rounded-3xl animate-in slide-in-from-top-4 duration-500 space-y-4">
                <input placeholder="URL da Imagem de Fundo" className="w-full bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                <input placeholder="Título (PT)" className="w-full bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} />
                <button onClick={handleAddCarousel} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Salvar Slide Principal</button>
              </div>
            )}

            {activeTab === 'carousel' && filteredCarousel.map(img => (
              <div key={img.id} className="bg-slate-950/40 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-start hover:border-blue-500/20 transition-all">
                <div className="w-48 aspect-video rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-white/5"><img src={img.url} className="w-full h-full object-cover" alt="" /></div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Display Order: {img.display_order}</span>
                     <button onClick={() => confirmDelete(img.id, deleteCarouselImage)} className="text-red-500 hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                  <input className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-white text-xs outline-none focus:border-blue-500/40" defaultValue={editingLang === 'pt' ? img.title || '' : translationsCache[img.id]?.title?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'title', e.target.value, updateCarouselImage)} placeholder="Título do Slide..." />
                  <textarea className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-[10px] outline-none focus:border-blue-500/40" defaultValue={editingLang === 'pt' ? img.subtitle || '' : translationsCache[img.id]?.subtitle?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'subtitle', e.target.value, updateCarouselImage)} placeholder="Subtítulo Descritivo..." />
                </div>
              </div>
            ))}

            {activeTab === 'testimonials' && allTestimonials.map(t => (
              <div key={t.id} className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex justify-between items-center group">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => updateTestimonial(t.id, { approved: !t.approved }).then(loadAdminData)} 
                      className={`px-4 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] transition-all ${t.approved ? 'bg-green-600/10 text-green-500 border border-green-500/20 shadow-lg shadow-green-600/5' : 'bg-slate-800 text-slate-500 border border-white/5'}`}
                    >
                      {t.approved ? 'Aprovado para o Site' : 'Pendente de Revisão'}
                    </button>
                    <span className="text-white font-bold text-sm">{t.name}</span>
                    <span className="text-slate-600 text-[10px] font-medium">{t.company}</span>
                  </div>
                  <textarea className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl text-slate-400 text-[10px] italic" defaultValue={editingLang === 'pt' ? t.quote : translationsCache[t.id]?.quote?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('testimonials', t.id, 'quote', e.target.value, updateTestimonial)} />
                </div>
                <button onClick={() => confirmDelete(t.id, deleteTestimonial)} className="text-red-500 ml-6 opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))}

            {activeTab === 'content' && filteredContent.map(l => (
              <div key={l.key} className="bg-slate-950/40 border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-48 shrink-0 text-[8px] font-black uppercase tracking-[0.3em] text-blue-500">{l.key}</div>
                <input 
                  className="flex-1 w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-white text-[11px] font-medium outline-none focus:border-blue-500/40" 
                  value={l.value} 
                  onChange={e => {
                    const newValue = e.target.value;
                    setSiteLabels(prev => prev.map(item => item.key === l.key ? {...item, value: newValue} : item));
                  }}
                  onBlur={e => updateSiteContent(l.key, e.target.value, l.page)}
                />
              </div>
            ))}

            {activeTab === 'leads' && leads.map(l => (
              <div key={l.id} className="bg-slate-950 border border-white/5 p-8 rounded-3xl space-y-4">
                 <div className="flex justify-between border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-white font-serif text-lg">{l.name}</h4>
                      <p className="text-blue-500 text-[9px] uppercase tracking-widest font-black">{l.email}</p>
                    </div>
                    <button onClick={() => confirmDelete(l.id, deleteContact)} className="text-red-500/40 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                 </div>
                 <p className="text-slate-400 text-sm font-light italic leading-relaxed">"{l.message}"</p>
                 <div className="text-[8px] text-slate-700 uppercase tracking-widest font-black">Recebido em: {new Date(l.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

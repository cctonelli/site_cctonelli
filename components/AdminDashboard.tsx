
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
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, type: 'service' as 'product'|'service', config_url: '', image_url: '' });
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

      const trans: Record<string, any> = {};
      const entitiesToFetch = [
        ...(c || []).map(x => ({ type: 'carousel_images', id: x.id })),
        ...(i || []).map(x => ({ type: 'insights', id: x.id })),
        ...(p || []).map(x => ({ type: 'products', id: x.id })),
        ...(m || []).map(x => ({ type: 'metrics', id: x.id })),
        ...(t_all || []).map(x => ({ type: 'testimonials', id: x.id }))
      ];

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
    const success = await upsertTranslation(entityType, entityId, field, locale, value);
    if (success) {
      setTranslationsCache(prev => ({
        ...prev,
        [String(entityId)]: {
          ...prev[String(entityId)],
          [field]: { ...prev[String(entityId)]?.[field], [locale]: value }
        }
      }));
    }
  };

  const updateOriginalOrTranslation = async (entityType: string, entityId: any, field: string, value: string, updateFn?: (id: any, updates: any) => Promise<boolean>) => {
    if (editingLang === 'pt') {
      if (updateFn) {
        await updateFn(entityId, { [field]: value });
        // Recarregar para garantir sincronia com RLS e triggers
        loadAdminData();
      }
    } else {
      await handleUpdateTranslation(entityType, entityId, field, editingLang, value);
    }
  };

  const confirmDelete = async (id: string, deleteFn: (id: string) => Promise<boolean>) => {
    if (window.confirm('Deseja realmente excluir este registro estrategicamente?')) {
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

  const handleAddProduct = async () => {
    await addProduct({ 
      name: newProduct.name, 
      description: newProduct.description, 
      price: newProduct.price, 
      type: newProduct.type,
      config: { url: newProduct.config_url, image_url: newProduct.image_url }
    });
    setIsAdding(false);
    loadAdminData();
  };

  const handleAddInsight = async () => {
    await addInsight({ ...newInsight, is_active: true });
    setIsAdding(false);
    loadAdminData();
  };

  const filteredCarousel = useMemo(() => carouselImages.filter(img => (img.title || '').toLowerCase().includes(searchTerm.toLowerCase())), [carouselImages, searchTerm]);
  const filteredMetrics = useMemo(() => metrics.filter(m => m.label.toLowerCase().includes(searchTerm.toLowerCase())), [metrics, searchTerm]);
  const filteredLeads = useMemo(() => (leads || []).filter(l => (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.email || '').toLowerCase().includes(searchTerm.toLowerCase())), [leads, searchTerm]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/10 w-full max-w-7xl h-full sm:h-[96vh] rounded-[4rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="w-full md:w-80 bg-slate-950 border-r border-white/5 p-14 flex flex-row md:flex-col gap-10 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-5 mb-0 md:mb-16 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/40 text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.5em] text-white">Advisory Hub</span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-blue-500/60 font-black mt-1">Strategic CMS</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-4 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel Principal' },
              { id: 'insights', label: 'Artigos & Insights' },
              { id: 'products', label: 'Soluções Corporativas' },
              { id: 'metrics', label: 'Indicadores ROI' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Textos Globais' },
              { id: 'leads', label: 'Gestão de Leads' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); setIsAdding(false); }} 
                className={`whitespace-nowrap px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mt-auto border border-white/5 p-6 rounded-2xl transition-all hover:bg-red-500/5">Sair</button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid custom-scrollbar relative">
          {isLoading && <div className="absolute top-10 right-10 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
          
          <div className="max-w-4xl mx-auto space-y-16">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-14">
               <div className="space-y-6 flex-1">
                  <h2 className="text-5xl font-serif italic text-white capitalize tracking-tight">{activeTab}</h2>
                  <div className="relative max-w-sm">
                    <input 
                      type="text" 
                      placeholder={`Localizar em ${activeTab}...`} 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-[11px] text-white placeholder:text-slate-800 outline-none focus:border-blue-500/40 transition-all font-medium"
                    />
                  </div>
               </div>
               <div className="flex items-center gap-8">
                 {activeTab !== 'leads' && activeTab !== 'content' && activeTab !== 'testimonials' && (
                    <button 
                      onClick={() => setIsAdding(!isAdding)}
                      className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isAdding ? 'bg-slate-800 text-white border border-white/10' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30'}`}
                    >
                      {isAdding ? 'Cancelar' : '+ Novo Registro'}
                    </button>
                 )}
                 <div className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-white/5 shadow-inner">
                    {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                      <button key={l} onClick={() => setEditingLang(l)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}>{l}</button>
                    ))}
                 </div>
               </div>
            </header>

            {isAdding && (
              <div className="bg-blue-600/5 border border-blue-600/20 p-12 rounded-[3rem] animate-in slide-in-from-top-6 duration-700 space-y-8 shadow-2xl">
                <h3 className="text-white font-serif italic text-2xl">Novo {activeTab}</h3>
                {activeTab === 'carousel' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <input placeholder="URL da Imagem" className="w-full bg-slate-950 border border-white/5 p-5 rounded-2xl text-white text-xs col-span-2" onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                    <input placeholder="Título (PT)" className="w-full bg-slate-950 border border-white/5 p-5 rounded-2xl text-white text-xs" onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} />
                    <input placeholder="Subtítulo (PT)" className="w-full bg-slate-950 border border-white/5 p-5 rounded-2xl text-white text-xs" onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} />
                    <button onClick={handleAddCarousel} className="bg-blue-600 text-white p-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] col-span-2 shadow-2xl">Salvar Slide</button>
                  </div>
                )}
                {activeTab === 'metrics' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <input placeholder="Valor (Ex: 10k+)" className="w-full bg-slate-950 border border-white/5 p-5 rounded-2xl text-white text-xs" onChange={e => setNewMetric({...newMetric, value: e.target.value})} />
                    <input placeholder="Legenda (PT)" className="w-full bg-slate-950 border border-white/5 p-5 rounded-2xl text-white text-xs" onChange={e => setNewMetric({...newMetric, label: e.target.value})} />
                    <button onClick={() => addMetric({...newMetric, is_active: true}).then(loadAdminData)} className="bg-blue-600 text-white p-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] col-span-2 shadow-2xl">Salvar Métrica</button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-10 pb-20">
              {activeTab === 'carousel' && filteredCarousel.map(img => (
                <div key={img.id} className="bg-slate-950/40 border border-white/5 p-10 rounded-[3rem] flex flex-col md:flex-row gap-10 items-start group hover:border-blue-500/30 transition-all shadow-xl">
                  <div className="w-56 aspect-video rounded-3xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 space-y-5">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] text-blue-500 font-black uppercase tracking-[0.5em] bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">Display {img.display_order}</span>
                       <button onClick={() => confirmDelete(img.id, deleteCarouselImage)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                    <input className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl text-white text-sm" defaultValue={editingLang === 'pt' ? img.title || '' : translationsCache[String(img.id)]?.title?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'title', e.target.value, updateCarouselImage)} placeholder="Título..." />
                    <textarea className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl text-slate-500 text-xs" defaultValue={editingLang === 'pt' ? img.subtitle || '' : translationsCache[String(img.id)]?.subtitle?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'subtitle', e.target.value, updateCarouselImage)} placeholder="Subtítulo..." />
                  </div>
                </div>
              ))}

              {activeTab === 'metrics' && filteredMetrics.map(m => (
                <div key={m.id} className="bg-slate-950/40 border border-white/5 p-10 rounded-[2.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-10 flex-1">
                    <div className="text-5xl font-serif text-white w-32 text-center">{m.value}</div>
                    <input className="flex-1 bg-slate-900 border border-white/5 p-5 rounded-2xl text-slate-400 text-xs" defaultValue={editingLang === 'pt' ? m.label : translationsCache[String(m.id)]?.label?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('metrics', m.id, 'label', e.target.value, updateMetric)} />
                  </div>
                  <button onClick={() => confirmDelete(m.id, deleteMetric)} className="text-red-500 ml-10"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}

              {activeTab === 'leads' && filteredLeads.map(l => (
                <div key={l.id} className="bg-slate-950 border border-white/10 p-12 rounded-[4rem] space-y-6">
                   <div className="flex justify-between items-center border-b border-white/5 pb-8">
                      <div>
                        <h4 className="text-white font-serif italic text-2xl">{l.name}</h4>
                        <p className="text-blue-500 text-[10px] uppercase tracking-widest">{l.email}</p>
                      </div>
                      <button onClick={() => confirmDelete(l.id, deleteContact)} className="text-red-500/40 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                   <p className="text-slate-400 text-lg font-light italic">"{l.message}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

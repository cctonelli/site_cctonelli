
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
    loadAdminData();
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
    if (window.confirm('Excluir este registro definitivamente?')) {
      await deleteFn(id);
      loadAdminData();
    }
  };

  const filteredCarousel = useMemo(() => carouselImages.filter(img => (img.title || '').toLowerCase().includes(searchTerm.toLowerCase())), [carouselImages, searchTerm]);
  const filteredMetrics = useMemo(() => metrics.filter(m => m.label.toLowerCase().includes(searchTerm.toLowerCase())), [metrics, searchTerm]);
  const filteredInsights = useMemo(() => insights.filter(ins => ins.title.toLowerCase().includes(searchTerm.toLowerCase())), [insights, searchTerm]);
  const filteredProducts = useMemo(() => products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);
  const filteredContent = useMemo(() => siteLabels.filter(l => l.key.toLowerCase().includes(searchTerm.toLowerCase())), [siteLabels, searchTerm]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-slate-900 border border-white/10 w-full max-w-7xl h-full sm:h-[96vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-slate-950 border-r border-white/5 p-10 flex flex-row md:flex-col gap-8 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-4 mb-0 md:mb-12 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/30 text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.4em] text-white">Advisory Admin</span>
            </div>
          </div>
          <nav className="flex flex-row md:flex-col gap-3 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Insights' },
              { id: 'products', label: 'Produtos' },
              { id: 'metrics', label: 'Métricas' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Textos Globais' },
              { id: 'leads', label: 'Leads' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>{tab.label}</button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[9px] font-black uppercase tracking-widest mt-auto border border-white/5 p-4 rounded-xl">Sair</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-16 bg-grid custom-scrollbar">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10 mb-10">
             <div>
                <h2 className="text-4xl font-serif italic text-white capitalize">{activeTab}</h2>
                <input type="text" placeholder="Localizar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-4 bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-blue-500/40 w-64" />
             </div>
             <div className="flex items-center gap-6">
               <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
                  {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                    <button key={l} onClick={() => setEditingLang(l)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-white'}`}>{l}</button>
                  ))}
               </div>
             </div>
          </header>

          <div className="space-y-8">
            {activeTab === 'carousel' && filteredCarousel.map(img => (
              <div key={img.id} className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-start">
                <div className="w-48 aspect-video rounded-2xl overflow-hidden bg-slate-900 shrink-0"><img src={img.url} className="w-full h-full object-cover" alt="" /></div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest">Ordem {img.display_order}</span>
                     <button onClick={() => confirmDelete(img.id, deleteCarouselImage)} className="text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                  <input className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-white text-xs" defaultValue={editingLang === 'pt' ? img.title || '' : translationsCache[img.id]?.title?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'title', e.target.value, updateCarouselImage)} placeholder="Título..." />
                  <textarea className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-[10px]" defaultValue={editingLang === 'pt' ? img.subtitle || '' : translationsCache[img.id]?.subtitle?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'subtitle', e.target.value, updateCarouselImage)} placeholder="Subtítulo..." />
                </div>
              </div>
            ))}

            {activeTab === 'insights' && filteredInsights.map(ins => (
              <div key={ins.id} className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="text-white font-serif">{editingLang === 'pt' ? ins.title : translationsCache[ins.id]?.title?.[editingLang] || ins.title}</h4>
                   <button onClick={() => confirmDelete(ins.id, deleteInsight)} className="text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                <input className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-white text-xs" defaultValue={editingLang === 'pt' ? ins.title : translationsCache[ins.id]?.title?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('insights', ins.id, 'title', e.target.value, updateInsight)} placeholder="Título..." />
                <textarea className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-[10px] h-32" defaultValue={editingLang === 'pt' ? ins.content || '' : translationsCache[ins.id]?.content?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('insights', ins.id, 'content', e.target.value, updateInsight)} placeholder="Conteúdo do Artigo (HTML)..." />
              </div>
            ))}

            {activeTab === 'testimonials' && allTestimonials.map(t => (
              <div key={t.id} className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl flex justify-between items-center">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => updateTestimonial(t.id, { approved: !t.approved }).then(loadAdminData)} className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${t.approved ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-red-600/10 text-red-500 border border-red-500/20'}`}>{t.approved ? 'Aprovado' : 'Pendente'}</button>
                    <span className="text-white font-bold">{t.name}</span>
                  </div>
                  <textarea className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-[10px]" defaultValue={editingLang === 'pt' ? t.quote : translationsCache[t.id]?.quote?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('testimonials', t.id, 'quote', e.target.value, updateTestimonial)} placeholder="Citação..." />
                </div>
                <button onClick={() => confirmDelete(t.id, deleteTestimonial)} className="text-red-500 ml-6"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))}

            {activeTab === 'content' && filteredContent.map(l => (
              <div key={l.key} className="bg-slate-950/40 border border-white/5 p-6 rounded-2xl flex items-center gap-6">
                <div className="w-48 shrink-0 text-[9px] font-black uppercase tracking-widest text-blue-500">{l.key}</div>
                <input className="flex-1 bg-slate-900 border border-white/5 p-3 rounded-xl text-white text-xs" value={l.value} onChange={e => updateSiteContent(l.key, e.target.value, l.page).then(loadAdminData)} />
              </div>
            ))}

            {activeTab === 'leads' && leads.map(l => (
              <div key={l.id} className="bg-slate-950 border border-white/10 p-8 rounded-[2rem] space-y-4">
                 <div className="flex justify-between border-b border-white/5 pb-4">
                    <div><h4 className="text-white font-serif">{l.name}</h4><p className="text-blue-500 text-[9px] uppercase tracking-widest">{l.email}</p></div>
                    <button onClick={() => confirmDelete(l.id, deleteContact)} className="text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                 </div>
                 <p className="text-slate-400 text-sm font-light italic">"{l.message}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

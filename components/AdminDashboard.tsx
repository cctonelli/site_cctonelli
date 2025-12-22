
import React, { useState, useEffect, useMemo } from 'react';
import { 
  updateSiteContent, fetchMetrics, fetchInsights,
  addInsight, deleteInsight, updateInsight,
  fetchCarouselImages, addCarouselImage, deleteCarouselImage, updateCarouselImage,
  fetchAllSiteContent, fetchContacts,
  deleteTestimonial, updateTestimonial, fetchTestimonials,
  upsertTranslation, fetchTranslationsForEntity,
  fetchProducts, updateProduct, deleteProduct, addProduct,
  updateMetric, addMetric, deleteMetric
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, CarouselImage, SiteContent, Contact, Product } from '../types';

type AdminLang = 'pt' | 'en' | 'es';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'insights' | 'metrics' | 'content' | 'testimonials' | 'leads' | 'products'>('carousel');
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
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, type: 'service' as 'product'|'service' });
  const [newMetric, setNewMetric] = useState({ label: '', value: '', display_order: 1 });

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
      setAllTestimonials(t_all);
      setMetrics(m);
      setInsights(i);
      setCarouselImages(c);
      setSiteLabels(l);
      setLeads(lds);
      setProducts(p);

      const trans: Record<string, any> = {};
      const entitiesToFetch = [
        ...c.map(x => ({ type: 'carousel_images', id: x.id })),
        ...i.map(x => ({ type: 'insights', id: x.id })),
        ...p.map(x => ({ type: 'products', id: x.id })),
        ...m.map(x => ({ type: 'metrics', id: x.id })),
        ...t_all.map(x => ({ type: 'testimonials', id: x.id }))
      ];

      const transResults = await Promise.all(
        entitiesToFetch.map(async (item) => {
          const data = await fetchTranslationsForEntity(item.type, item.id);
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
      if (updateFn) await updateFn(entityId, { [field]: value });
    } else {
      await handleUpdateTranslation(entityType, entityId, field, editingLang, value);
    }
  };

  // Generic deletion with confirmation
  const confirmDelete = async (id: string, deleteFn: (id: string) => Promise<boolean>) => {
    if (window.confirm('Deseja realmente excluir este registro estrategicamente?')) {
      await deleteFn(id);
      loadAdminData();
    }
  };

  // Filtered lists for grids
  const filteredCarousel = useMemo(() => carouselImages.filter(img => (img.title || '').toLowerCase().includes(searchTerm.toLowerCase())), [carouselImages, searchTerm]);
  const filteredInsights = useMemo(() => insights.filter(ins => ins.title.toLowerCase().includes(searchTerm.toLowerCase())), [insights, searchTerm]);
  const filteredProducts = useMemo(() => products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), [products, searchTerm]);
  const filteredMetrics = useMemo(() => metrics.filter(m => m.label.toLowerCase().includes(searchTerm.toLowerCase())), [metrics, searchTerm]);
  const filteredLeads = useMemo(() => leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.email.toLowerCase().includes(searchTerm.toLowerCase())), [leads, searchTerm]);

  if (isLoading) return (
    <div className="fixed inset-0 z-[110] bg-slate-950 flex items-center justify-center">
       <div className="text-blue-500 font-bold animate-pulse tracking-[0.5em] uppercase text-[10px]">Arquitetando Dashboard...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[94vh] rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-80 bg-slate-950 border-r border-white/5 p-12 flex flex-row md:flex-col gap-8 overflow-x-auto shrink-0">
          <div className="flex items-center gap-4 mb-0 md:mb-12 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/30 text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-bold text-[10px] uppercase tracking-[0.4em] text-white">Advisory Admin</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">Consolidated Hub</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-3 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel Hero' },
              { id: 'insights', label: 'Insights/Blog' },
              { id: 'products', label: 'Produtos/Serviços' },
              { id: 'metrics', label: 'Métricas' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Global Labels' },
              { id: 'leads', label: 'Leads' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); setIsAdding(false); }} 
                className={`whitespace-nowrap px-6 py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-600 hover:text-red-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-auto border border-white/5 p-5 rounded-2xl transition-all">Sair</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-20 bg-grid custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Header com Busca e Idioma */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
               <div className="space-y-4 flex-1">
                  <h2 className="text-4xl font-serif italic text-white capitalize">{activeTab}</h2>
                  <div className="relative max-w-sm">
                    <input 
                      type="text" 
                      placeholder={`Buscar em ${activeTab}...`} 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-700 outline-none focus:border-blue-500/50"
                    />
                  </div>
               </div>
               <div className="flex items-center gap-6">
                 <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className={`px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${isAdding ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}
                 >
                   {isAdding ? 'Cancelar' : '+ Novo Registro'}
                 </button>
                 <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/5">
                    {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                      <button key={l} onClick={() => setEditingLang(l)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{l}</button>
                    ))}
                 </div>
               </div>
            </header>

            {/* FORMULÁRIO DE CADASTRO (PADRONIZADO) */}
            {isAdding && (
              <div className="bg-blue-600/5 border border-blue-600/20 p-10 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
                <h3 className="text-white font-serif italic text-xl mb-8">Adicionar {activeTab}</h3>
                
                {activeTab === 'carousel' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <input placeholder="URL da Imagem" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs col-span-2" onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                    <input placeholder="Título (PT)" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} />
                    <input placeholder="Subtítulo (PT)" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} />
                    <button onClick={() => addCarouselImage({...newCarousel, is_active: true}).then(() => {setIsAdding(false); loadAdminData();})} className="bg-blue-600 text-white p-4 rounded-xl font-bold text-[10px] uppercase tracking-widest col-span-2 mt-4">Salvar Slide</button>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <input placeholder="Nome" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                    <input placeholder="Preço" type="number" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                    <textarea placeholder="Descrição" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs col-span-2 h-24" onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                    <button onClick={() => addProduct({...newProduct, config: {}}).then(() => {setIsAdding(false); loadAdminData();})} className="bg-blue-600 text-white p-4 rounded-xl font-bold text-[10px] uppercase tracking-widest col-span-2 mt-4">Lançar Solução</button>
                  </div>
                )}

                {activeTab === 'metrics' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <input placeholder="Valor (ex: 500+)" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewMetric({...newMetric, value: e.target.value})} />
                    <input placeholder="Legenda (ex: CEOs Impactados)" className="bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs" onChange={e => setNewMetric({...newMetric, label: e.target.value})} />
                    <button onClick={() => addMetric({...newMetric, is_active: true}).then(() => {setIsAdding(false); loadAdminData();})} className="bg-blue-600 text-white p-4 rounded-xl font-bold text-[10px] uppercase tracking-widest col-span-2 mt-4">Consolidar Métrica</button>
                  </div>
                )}

                {activeTab === 'insights' && (
                  <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-3xl uppercase tracking-widest font-bold">
                    Para novos insights, utilize o editor de artigos unificado.
                  </div>
                )}
              </div>
            )}

            {/* GRIDS DE GESTÃO (PADRONIZADAS) */}
            <div className="grid gap-8">
              {activeTab === 'carousel' && filteredCarousel.map(img => (
                <div key={img.id} className="bg-slate-950/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-start group hover:border-blue-500/20 transition-all">
                  <div className="w-40 aspect-video rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                    <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                       <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Ordem: {img.display_order}</span>
                       <div className="flex gap-2">
                         <button onClick={() => updateCarouselImage(img.id, { is_active: !img.is_active }).then(loadAdminData)} className={`px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all ${img.is_active ? 'bg-green-600/10 text-green-500 border border-green-600/20' : 'bg-slate-800 text-slate-500'}`}>{img.is_active ? 'Ativo' : 'Inativo'}</button>
                         <button onClick={() => confirmDelete(img.id, deleteCarouselImage)} className="p-2 text-slate-700 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                       </div>
                    </div>
                    <input className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-white text-xs font-bold" defaultValue={editingLang === 'pt' ? img.title || '' : translationsCache[String(img.id)]?.title?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'title', e.target.value, updateCarouselImage)} placeholder="Título..." />
                    <textarea className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-xs h-20" defaultValue={editingLang === 'pt' ? img.subtitle || '' : translationsCache[String(img.id)]?.subtitle?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('carousel_images', img.id, 'subtitle', e.target.value, updateCarouselImage)} placeholder="Subtítulo..." />
                  </div>
                </div>
              ))}

              {activeTab === 'insights' && filteredInsights.map(ins => (
                <div key={ins.id} className="bg-slate-950/30 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                    <img src={ins.image_url || ''} className="w-full h-full object-cover opacity-50" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-white font-serif italic text-xl">{ins.title}</h4>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{ins.category || 'ESTRATÉGIA'} — {new Date(ins.published_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => confirmDelete(ins.id, deleteInsight)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">Excluir</button>
                  </div>
                </div>
              ))}

              {activeTab === 'products' && filteredProducts.map(p => (
                <div key={p.id} className="bg-slate-950/30 border border-white/5 p-8 rounded-[2.5rem] space-y-6 group">
                   <div className="flex justify-between items-center">
                     <span className="text-[9px] px-3 py-1 bg-blue-600/10 text-blue-500 rounded-full font-bold uppercase">{p.type}</span>
                     <button onClick={() => confirmDelete(p.id, deleteProduct)} className="text-slate-800 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                   <input className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-white font-bold" defaultValue={editingLang === 'pt' ? p.name : translationsCache[String(p.id)]?.name?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('products', p.id, 'name', e.target.value, updateProduct)} />
                   <textarea className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-xs h-24" defaultValue={editingLang === 'pt' ? p.description || '' : translationsCache[String(p.id)]?.description?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('products', p.id, 'description', e.target.value, updateProduct)} />
                </div>
              ))}

              {activeTab === 'metrics' && filteredMetrics.map(m => (
                <div key={m.id} className="bg-slate-950/30 border border-white/5 p-8 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="text-3xl font-serif text-white w-24 text-center">{m.value}</div>
                    <input className="flex-1 bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-[10px] uppercase font-bold tracking-widest" defaultValue={editingLang === 'pt' ? m.label : translationsCache[String(m.id)]?.label?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('metrics', m.id, 'label', e.target.value, updateMetric)} />
                  </div>
                  <button onClick={() => confirmDelete(m.id, deleteMetric)} className="ml-6 text-slate-800 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}

              {activeTab === 'testimonials' && allTestimonials.map(t => (
                <div key={t.id} className="bg-slate-950/30 border border-white/5 p-8 rounded-[2.5rem] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{t.name} — <span className="text-slate-500 italic text-[10px]">{t.company}</span></span>
                    <div className="flex gap-3">
                      <button onClick={() => updateTestimonial(t.id, { approved: !t.approved }).then(loadAdminData)} className={`px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase ${t.approved ? 'bg-green-600/10 text-green-500' : 'bg-red-600/10 text-red-500'}`}>{t.approved ? 'Aprovado' : 'Pendente'}</button>
                      <button onClick={() => confirmDelete(t.id, deleteTestimonial)} className="text-slate-800 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                  <textarea className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-slate-400 text-sm italic h-24" defaultValue={editingLang === 'pt' ? t.quote : translationsCache[String(t.id)]?.quote?.[editingLang] || ''} onBlur={e => updateOriginalOrTranslation('testimonials', t.id, 'quote', e.target.value, updateTestimonial)} />
                </div>
              ))}

              {activeTab === 'leads' && filteredLeads.map(l => (
                <div key={l.id} className="bg-slate-950 border border-white/5 p-8 rounded-[3rem] space-y-4">
                   <div className="flex justify-between border-b border-white/5 pb-4">
                      <h4 className="text-white font-serif italic text-xl">{l.name}</h4>
                      <span className="text-[8px] text-slate-700 font-mono">{new Date(l.created_at).toLocaleString()}</span>
                   </div>
                   <div className="text-blue-500 text-xs font-bold">{l.email}</div>
                   <p className="text-slate-400 text-sm italic leading-relaxed">"{l.message}"</p>
                </div>
              ))}

              {activeTab === 'content' && siteLabels.filter(l => l.key.endsWith('.pt')).map(label => {
                const baseKey = label.key.replace('.pt', '');
                return (
                  <div key={label.key} className="bg-slate-950/30 border border-white/5 p-8 rounded-[2rem] space-y-4">
                    <div className="text-[9px] font-bold text-blue-500/50 uppercase tracking-widest">{baseKey}</div>
                    <textarea className="w-full bg-slate-900 border border-white/5 p-4 rounded-xl text-white text-xs h-20" defaultValue={editingLang === 'pt' ? label.value : siteLabels.find(l => l.key === `${baseKey}.${editingLang}`)?.value || ''} onBlur={e => updateSiteContent(`${baseKey}.${editingLang}`, e.target.value, label.page).then(loadAdminData)} />
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

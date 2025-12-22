
import React, { useState, useEffect } from 'react';
import { 
  updateSiteContent, fetchMetrics, fetchInsights,
  addInsight, deleteInsight, updateInsight,
  fetchCarouselImages, addCarouselImage, deleteCarouselImage, updateCarouselImage,
  fetchAllSiteContent, fetchContacts,
  deleteTestimonial, updateTestimonial, fetchTestimonials,
  upsertTranslation, fetchTranslationsForEntity,
  fetchProducts, updateProduct, deleteProduct, addProduct,
  updateMetric
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, CarouselImage, SiteContent, Contact, Product } from '../types';

type AdminLang = 'pt' | 'en' | 'es';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'insights' | 'metrics' | 'content' | 'testimonials' | 'leads' | 'products'>('carousel');
  const [editingLang, setEditingLang] = useState<AdminLang>('pt');
  
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [translationsCache, setTranslationsCache] = useState<Record<string, any>>({});

  const loadAdminData = async () => {
    try {
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
      const itemsToFetch = [
        ...c.map(x => ({ type: 'carousel_images', id: x.id })),
        ...i.map(x => ({ type: 'insights', id: x.id })),
        ...p.map(x => ({ type: 'products', id: x.id })),
        ...m.map(x => ({ type: 'metrics', id: x.id })),
        ...t_all.map(x => ({ type: 'testimonials', id: x.id }))
      ];

      for (const item of itemsToFetch) {
        const data = await fetchTranslationsForEntity(item.type, item.id);
        if (data && Object.keys(data).length > 0) {
          trans[String(item.id)] = data;
        }
      }
      setTranslationsCache(trans);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[94vh] rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
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
                onClick={() => setActiveTab(tab.id as any)} 
                className={`whitespace-nowrap px-6 py-4 rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-600 hover:text-red-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-auto border border-white/5 p-5 rounded-2xl transition-all">Sair</button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 lg:p-20 bg-grid custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <header className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-serif italic text-white capitalize">{activeTab}</h2>
                  <p className="text-slate-500 text-xs mt-2">Editando idioma: <strong className="text-blue-500 uppercase">{editingLang}</strong></p>
               </div>
               <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/5">
                  {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                    <button key={l} onClick={() => setEditingLang(l)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{l}</button>
                  ))}
               </div>
            </header>

            {activeTab === 'carousel' && (
              <div className="grid gap-6">
                {carouselImages.map(img => (
                  <div key={img.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
                     <div className="flex gap-4 items-center">
                        <img src={img.url} className="w-16 h-10 object-cover rounded-lg" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Slide #{img.display_order}</span>
                     </div>
                     <input 
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white text-xs"
                       placeholder="Título..."
                       defaultValue={editingLang === 'pt' ? img.title || '' : translationsCache[String(img.id)]?.title?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateCarouselImage(img.id, { title: e.target.value }) : handleUpdateTranslation('carousel_images', img.id, 'title', editingLang, e.target.value)}
                     />
                     <textarea 
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-xs h-20"
                       placeholder="Subtítulo..."
                       defaultValue={editingLang === 'pt' ? img.subtitle || '' : translationsCache[String(img.id)]?.subtitle?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateCarouselImage(img.id, { subtitle: e.target.value }) : handleUpdateTranslation('carousel_images', img.id, 'subtitle', editingLang, e.target.value)}
                     />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="grid gap-6">
                {insights.map(ins => (
                  <div key={ins.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
                     <input 
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white font-serif italic"
                       placeholder="Título do Insight..."
                       defaultValue={editingLang === 'pt' ? ins.title : translationsCache[String(ins.id)]?.title?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateInsight(ins.id, { title: e.target.value }) : handleUpdateTranslation('insights', ins.id, 'title', editingLang, e.target.value)}
                     />
                     <textarea 
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-xs h-20"
                       placeholder="Resumo/Excerpt..."
                       defaultValue={editingLang === 'pt' ? ins.excerpt || '' : translationsCache[String(ins.id)]?.excerpt?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateInsight(ins.id, { excerpt: e.target.value }) : handleUpdateTranslation('insights', ins.id, 'excerpt', editingLang, e.target.value)}
                     />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="grid gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
                     <input 
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white text-xs font-bold"
                       placeholder="Nome do Produto..."
                       defaultValue={editingLang === 'pt' ? p.name : translationsCache[String(p.id)]?.name?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateProduct(p.id, { name: e.target.value }) : handleUpdateTranslation('products', p.id, 'name', editingLang, e.target.value)}
                     />
                     <textarea 
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-xs h-24"
                       placeholder="Descrição..."
                       defaultValue={editingLang === 'pt' ? p.description || '' : translationsCache[String(p.id)]?.description?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateProduct(p.id, { description: e.target.value }) : handleUpdateTranslation('products', p.id, 'description', editingLang, e.target.value)}
                     />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="grid gap-6">
                {metrics.map(m => (
                  <div key={m.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2rem] flex items-center gap-6">
                    <div className="text-3xl font-serif text-white w-24">{m.value}</div>
                    <input 
                       className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-[10px] uppercase font-bold tracking-widest"
                       placeholder="Legenda..."
                       defaultValue={editingLang === 'pt' ? m.label : translationsCache[String(m.id)]?.label?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateMetric(m.id, { label: e.target.value }) : handleUpdateTranslation('metrics', m.id, 'label', editingLang, e.target.value)}
                     />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div className="grid gap-6">
                {allTestimonials.map(t => (
                  <div key={t.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2rem] space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-white font-bold text-xs">{t.name}</span>
                        <button 
                          onClick={() => updateTestimonial(t.id, { approved: !t.approved }).then(loadAdminData)}
                          className={`px-4 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${t.approved ? 'bg-green-600/20 text-green-500 border border-green-600/30' : 'bg-red-600/20 text-red-500 border border-red-600/30'}`}
                        >
                          {t.approved ? 'Aprovado' : 'Pendente'}
                        </button>
                     </div>
                     <textarea 
                       className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-sm italic h-24"
                       placeholder="Depoimento..."
                       defaultValue={editingLang === 'pt' ? t.quote : translationsCache[String(t.id)]?.quote?.[editingLang] || ''}
                       onBlur={e => editingLang === 'pt' ? updateTestimonial(t.id, { quote: e.target.value }) : handleUpdateTranslation('testimonials', t.id, 'quote', editingLang, e.target.value)}
                     />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'content' && (
              <div className="grid gap-6">
                {siteLabels.filter(label => label.key.endsWith('.pt')).map(label => {
                  const baseKey = label.key.replace('.pt', '');
                  return (
                    <div key={label.key} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2rem] space-y-2">
                       <div className="text-[8px] font-bold uppercase tracking-widest text-slate-600">{baseKey}</div>
                       <textarea 
                         className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white text-xs h-20"
                         defaultValue={editingLang === 'pt' ? label.value : siteLabels.find(l => l.key === `${baseKey}.${editingLang}`)?.value || ''}
                         onBlur={e => updateSiteContent(`${baseKey}.${editingLang}`, e.target.value, label.page).then(loadAdminData)}
                       />
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="space-y-6">
                {leads.map((lead, idx) => (
                  <div key={idx} className="bg-slate-950 border border-white/5 p-8 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h4 className="text-white font-serif italic text-xl">{lead.name}</h4>
                      <span className="text-[8px] text-slate-600 font-mono">{new Date(lead.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-blue-500 text-xs font-bold">{lead.email}</div>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">"{lead.message}"</p>
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

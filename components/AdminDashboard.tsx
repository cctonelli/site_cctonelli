
import React, { useState, useEffect } from 'react';
import { 
  updateSiteContent, fetchMetrics, fetchInsights,
  addInsight, deleteInsight, updateInsight,
  fetchCarouselImages, addCarouselImage, deleteCarouselImage, updateCarouselImage,
  fetchAllSiteContent, fetchContacts,
  deleteTestimonial, updateTestimonial, fetchTestimonials,
  upsertTranslation, fetchTranslationsForEntity
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, CarouselImage, SiteContent, Contact } from '../types';

type AdminLang = 'pt' | 'en' | 'es';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'insights' | 'metrics' | 'content' | 'testimonials' | 'leads'>('carousel');
  const [editingLang, setEditingLang] = useState<AdminLang>('pt');
  
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [translationsCache, setTranslationsCache] = useState<Record<string, any>>({});

  // Form states
  const [newCarousel, setNewCarousel] = useState<Partial<CarouselImage>>({ 
    title: '', subtitle: '', url: '', link: '', display_order: 0, is_active: true 
  });

  const loadAdminData = async () => {
    try {
      const [t_all, m, i, c, l, lds] = await Promise.all([
        fetchTestimonials(),
        fetchMetrics(),
        fetchInsights(),
        fetchCarouselImages(),
        fetchAllSiteContent(),
        fetchContacts()
      ]);
      setAllTestimonials(t_all);
      setMetrics(m);
      setInsights(i);
      setCarouselImages(c);
      setSiteLabels(l);
      setLeads(lds);

      // Carregar traduções para o cache inicial (ex: carrossel)
      const trans: Record<string, any> = {};
      for (const item of c) {
        trans[item.id] = await fetchTranslationsForEntity('carousel_images', item.id);
      }
      setTranslationsCache(trans);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const handleUpdateTranslation = async (entityType: string, entityId: string, field: string, locale: string, value: string) => {
    await upsertTranslation(entityType, entityId, field, locale, value);
    // Atualiza cache local
    setTranslationsCache(prev => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        [field]: { ...prev[entityId]?.[field], [locale]: value }
      }
    }));
  };

  const handleSaveCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const saved = await addCarouselImage(newCarousel);
    if (saved) {
      setNewCarousel({ title: '', subtitle: '', url: '', link: '', display_order: carouselImages.length + 1, is_active: true });
      loadAdminData();
    }
    setIsSubmitting(false);
  };

  const groupedLabels = siteLabels.reduce((acc, label) => {
    const baseKey = label.key.replace(/\.(pt|en|es)$/, '');
    if (!acc[baseKey]) acc[baseKey] = { pt: '', en: '', es: '', page: label.page };
    const lang = label.key.split('.').pop() as AdminLang;
    if (['pt', 'en', 'es'].includes(lang)) { acc[baseKey][lang] = label.value; }
    return acc;
  }, {} as Record<string, { pt: string, en: string, es: string, page: string }>);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[94vh] rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-slate-950 border-r border-white/5 p-12 flex flex-row md:flex-col gap-8 overflow-x-auto shrink-0">
          <div className="flex items-center gap-4 mb-0 md:mb-12 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/30 text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-bold text-[10px] uppercase tracking-[0.4em] text-white">Advisory Portal</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">Control Room</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-3 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel Hero' },
              { id: 'insights', label: 'Insights/Blog' },
              { id: 'metrics', label: 'Métricas' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Traduções Lab' },
              { id: 'leads', label: 'Leads de Contato' }
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
          <button onClick={onClose} className="text-slate-600 hover:text-red-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-auto border border-white/5 p-5 rounded-2xl transition-all">Encerrar</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-20 bg-grid custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <header className="flex justify-between items-end">
               <div>
                  <h2 className="text-4xl font-serif italic text-white capitalize">{activeTab} Manager</h2>
                  <p className="text-slate-500 text-xs mt-2">Sincronização global via Supabase Realtime.</p>
               </div>
               <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-white/5">
                  {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                    <button key={l} onClick={() => setEditingLang(l)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{l}</button>
                  ))}
               </div>
            </header>

            {/* --- CAROUSEL TAB --- */}
            {activeTab === 'carousel' && (
              <div className="space-y-12 animate-in fade-in">
                <form onSubmit={handleSaveCarousel} className="bg-slate-800/10 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input placeholder="Título Base (PT)" className="bg-slate-950 border border-white/5 rounded-xl px-6 py-3 text-white text-xs" value={newCarousel.title || ''} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} />
                    <input placeholder="URL da Imagem (HD)" className="bg-slate-950 border border-white/5 rounded-xl px-6 py-3 text-white text-xs" value={newCarousel.url || ''} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                  </div>
                  <textarea placeholder="Subtítulo Base (PT)" className="w-full bg-slate-950 border border-white/5 rounded-xl px-6 py-3 text-white text-xs h-20 resize-none" value={newCarousel.subtitle || ''} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} />
                  <button type="submit" className="w-full bg-blue-600 py-4 rounded-xl font-bold uppercase text-[9px] tracking-widest">Adicionar Frame</button>
                </form>

                <div className="grid gap-6">
                  {carouselImages.map(img => (
                    <div key={img.id} className="bg-slate-950/50 border border-white/5 p-6 rounded-[2rem] flex gap-6 items-center group">
                       <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0"><img src={img.url} className="w-full h-full object-cover" /></div>
                       <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-center">
                             {editingLang === 'pt' ? (
                               <input className="bg-transparent text-white font-serif text-lg outline-none w-full" defaultValue={img.title || ''} onBlur={e => updateCarouselImage(img.id, { title: e.target.value })} />
                             ) : (
                               <input 
                                 className="bg-transparent text-blue-400 font-serif text-lg outline-none w-full" 
                                 placeholder={`Traduzir para ${editingLang.toUpperCase()}...`}
                                 defaultValue={translationsCache[img.id]?.title?.[editingLang] || ''}
                                 onBlur={e => handleUpdateTranslation('carousel_images', img.id, 'title', editingLang, e.target.value)}
                               />
                             )}
                             <button onClick={() => deleteCarouselImage(img.id).then(loadAdminData)} className="text-red-500 text-[8px] uppercase font-black opacity-0 group-hover:opacity-100 transition-opacity">Deletar</button>
                          </div>
                          {editingLang === 'pt' ? (
                             <input className="w-full bg-transparent text-slate-500 text-[10px] outline-none" defaultValue={img.subtitle || ''} onBlur={e => updateCarouselImage(img.id, { subtitle: e.target.value })} />
                          ) : (
                             <input 
                               className="w-full bg-transparent text-blue-500/50 text-[10px] outline-none italic" 
                               placeholder={`Legenda em ${editingLang.toUpperCase()}...`}
                               defaultValue={translationsCache[img.id]?.subtitle?.[editingLang] || ''}
                               onBlur={e => handleUpdateTranslation('carousel_images', img.id, 'subtitle', editingLang, e.target.value)}
                             />
                          )}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TESTIMONIALS TAB --- */}
            {activeTab === 'testimonials' && (
              <div className="space-y-8 animate-in fade-in">
                {allTestimonials.map(t => (
                  <div key={t.id} className={`p-8 rounded-[2rem] border ${t.approved ? 'border-white/5 bg-slate-950/30' : 'border-blue-600/30 bg-blue-600/5'} flex justify-between items-center`}>
                    <div className="space-y-2 max-w-xl">
                      <p className="text-white italic text-sm font-light leading-relaxed">"{t.quote}"</p>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.name} • {t.company}</div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => updateTestimonial(t.id, { approved: !t.approved }).then(loadAdminData)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${t.approved ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 text-white shadow-lg'}`}>
                        {t.approved ? 'Arquivar' : 'Aprovar'}
                      </button>
                      <button onClick={() => deleteTestimonial(t.id).then(loadAdminData)} className="text-red-500 text-[8px] font-black uppercase">X</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- LEADS TAB --- */}
            {activeTab === 'leads' && (
              <div className="space-y-6 animate-in fade-in">
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

            {/* Content Lab handling (Grouped inputs) */}
            {activeTab === 'content' && (
              <div className="grid gap-10 animate-in fade-in">
                {Object.entries(groupedLabels).map(([key, vals]) => (
                  <div key={key} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">{key}</div>
                    <div className="grid gap-4">
                      {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                        <div key={l} className="flex items-center gap-4">
                          <span className="text-[8px] font-black text-slate-700 w-4 uppercase">{l}</span>
                          <input 
                            className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-5 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-500"
                            defaultValue={vals[l]}
                            onBlur={e => updateSiteContent(`${key}.${l}`, e.target.value, vals.page).then(loadAdminData)}
                          />
                        </div>
                      ))}
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

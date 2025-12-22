
import React, { useState, useEffect } from 'react';
import { 
  updateSiteContent, fetchMetrics, fetchInsights,
  addInsight, deleteInsight, updateInsight,
  fetchCarouselImages, addCarouselImage, deleteCarouselImage, updateCarouselImage,
  addMetric, deleteMetric, updateMetric, fetchAllSiteContent,
  deleteTestimonial, updateTestimonial, fetchTestimonials
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, CarouselImage, SiteContent } from '../types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

type AdminLang = 'pt' | 'en' | 'es';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'insights' | 'metrics' | 'content' | 'testimonials'>('carousel');
  const [editingLang, setEditingLang] = useState<AdminLang>('pt');
  
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states with multilingual support
  const [newCarousel, setNewCarousel] = useState<Partial<CarouselImage>>({ 
    title: '', title_en: '', title_es: '', 
    subtitle: '', subtitle_en: '', subtitle_es: '', 
    url: '', link: '', display_order: 0, is_active: true 
  });

  const loadAdminData = async () => {
    try {
      const [t_all, m, i, c, l] = await Promise.all([
        fetchTestimonials(),
        fetchMetrics(),
        fetchInsights(),
        fetchCarouselImages(),
        fetchAllSiteContent()
      ]);
      setAllTestimonials(t_all);
      setMetrics(m);
      setInsights(i);
      setCarouselImages(c);
      setSiteLabels(l);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const LangTabs = () => (
    <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl w-fit border border-white/5 mb-6">
      {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
        <button 
          key={l}
          onClick={() => setEditingLang(l)}
          className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  // --- Handlers ---
  const handleSaveCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (await addCarouselImage(newCarousel)) {
      setNewCarousel({ title: '', title_en: '', title_es: '', subtitle: '', subtitle_en: '', subtitle_es: '', url: '', link: '', display_order: carouselImages.length + 1, is_active: true });
      loadAdminData();
    }
    setIsSubmitting(false);
  };

  // Group labels by their base key (removing .pt, .en, .es)
  const groupedLabels = siteLabels.reduce((acc, label) => {
    const baseKey = label.key.replace(/\.(pt|en|es)$/, '');
    if (!acc[baseKey]) acc[baseKey] = { pt: '', en: '', es: '', page: label.page };
    const lang = label.key.split('.').pop() as AdminLang;
    if (['pt', 'en', 'es'].includes(lang)) {
      acc[baseKey][lang] = label.value;
    } else {
      acc[baseKey]['pt'] = label.value; // default fallback
    }
    return acc;
  }, {} as Record<string, { pt: string, en: string, es: string, page: string }>);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[94vh] rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-slate-950 border-r border-white/5 p-12 flex flex-row md:flex-col gap-10 overflow-x-auto shrink-0">
          <div className="flex items-center gap-4 mb-0 md:mb-16 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/30 text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-bold text-[12px] uppercase tracking-[0.4em] text-white">Global CMS</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">i18n Edition</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-4 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel Hero' },
              { id: 'insights', label: 'Insights/Blog' },
              { id: 'metrics', label: 'Métricas KPIs' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Textos Globais' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }} 
                className={`whitespace-nowrap px-8 py-5 rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-600 hover:text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-auto border border-white/5 p-6 rounded-2xl transition-all">Sair do Painel</button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-12 lg:p-20 bg-grid custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-16">
            
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
               <div className="space-y-4">
                  <h2 className="text-5xl font-serif italic text-white capitalize">{activeTab} Advisory</h2>
                  <p className="text-slate-500 text-sm font-light">Gestão de dados multilíngue em tempo real.</p>
               </div>
               <div className="flex flex-col items-end gap-4">
                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Idioma de Edição:</div>
                  <LangTabs />
               </div>
            </header>

            {/* --- CAROUSEL TAB --- */}
            {activeTab === 'carousel' && (
              <div className="space-y-16 animate-in fade-in">
                <form onSubmit={handleSaveCarousel} className="bg-slate-800/20 border border-white/5 p-10 rounded-[3rem] space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Título ({editingLang.toUpperCase()})</label>
                      <input 
                        required 
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-8 py-4 text-white outline-none focus:border-blue-500"
                        value={editingLang === 'pt' ? newCarousel.title : editingLang === 'en' ? newCarousel.title_en : newCarousel.title_es}
                        onChange={e => {
                          const val = e.target.value;
                          if(editingLang === 'pt') setNewCarousel({...newCarousel, title: val});
                          else if(editingLang === 'en') setNewCarousel({...newCarousel, title_en: val});
                          else setNewCarousel({...newCarousel, title_es: val});
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">URL Imagem</label>
                      <input required className="w-full bg-slate-950 border border-white/10 rounded-2xl px-8 py-4 text-white outline-none" value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Subtítulo ({editingLang.toUpperCase()})</label>
                    <textarea 
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-8 py-4 text-white outline-none h-24 resize-none"
                      value={editingLang === 'pt' ? newCarousel.subtitle : editingLang === 'en' ? newCarousel.subtitle_en : newCarousel.subtitle_es}
                      onChange={e => {
                        const val = e.target.value;
                        if(editingLang === 'pt') setNewCarousel({...newCarousel, subtitle: val});
                        else if(editingLang === 'en') setNewCarousel({...newCarousel, subtitle_en: val});
                        else setNewCarousel({...newCarousel, subtitle_es: val});
                      }}
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl">Adicionar ao Acervo</button>
                </form>

                <div className="grid gap-8">
                  {carouselImages.map(img => (
                    <div key={img.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2.5rem] flex gap-8 items-start">
                       <img src={img.url} className="w-32 h-20 object-cover rounded-2xl shrink-0" />
                       <div className="flex-1 space-y-4">
                          <div className="flex justify-between">
                            <input 
                              className="bg-transparent text-white font-serif text-xl outline-none w-full border-b border-transparent focus:border-blue-500 py-1"
                              defaultValue={editingLang === 'pt' ? img.title || '' : editingLang === 'en' ? img.title_en || '' : img.title_es || ''}
                              onBlur={e => {
                                const updates: any = {};
                                updates[editingLang === 'pt' ? 'title' : editingLang === 'en' ? 'title_en' : 'title_es'] = e.target.value;
                                updateCarouselImage(img.id, updates).then(loadAdminData);
                              }}
                            />
                            <button onClick={() => deleteCarouselImage(img.id).then(loadAdminData)} className="text-red-500 text-[9px] font-black uppercase ml-4">Excluir</button>
                          </div>
                          <p className="text-slate-500 text-xs italic line-clamp-1">
                             {editingLang === 'pt' ? img.subtitle : editingLang === 'en' ? img.subtitle_en : img.subtitle_es}
                          </p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- SITE CONTENT TAB (REFACTORED) --- */}
            {activeTab === 'content' && (
              <div className="space-y-12 animate-in fade-in">
                <input type="text" placeholder="Filtrar chaves de texto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-950 border border-white/10 rounded-2xl px-8 py-4 text-xs text-slate-400 w-full" />
                <div className="grid gap-10">
                  {Object.entries(groupedLabels).filter(([key]) => key.includes(searchTerm)).map(([key, vals]) => (
                    <div key={key} className="bg-slate-950/50 border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-xl">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">{key}</span>
                        <span className="text-[8px] text-slate-700 uppercase font-bold">Local: {vals.page}</span>
                      </div>
                      
                      <div className="grid gap-6">
                        {(['pt', 'en', 'es'] as AdminLang[]).map(l => (
                          <div key={l} className="space-y-2">
                             <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${l === 'pt' ? 'bg-green-500/10 text-green-500' : l === 'en' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{l}</span>
                             </div>
                             <textarea 
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-slate-300 text-sm outline-none focus:border-blue-500 resize-none h-20"
                                defaultValue={vals[l]}
                                onBlur={e => updateSiteContent(`${key}.${l}`, e.target.value, vals.page).then(loadAdminData)}
                             />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adicionar Testimonials, Metrics etc seguindo o mesmo padrão de grids... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


import React, { useState, useEffect } from 'react';
import { 
  fetchPendingTestimonials, approveTestimonial, 
  updateSiteContent, fetchMetrics, fetchInsights,
  fetchProducts, addProduct, deleteProduct, updateProduct,
  addInsight, deleteInsight, updateInsight, updateInsightLink,
  uploadInsightImage, fetchCarouselImages,
  addCarouselImage, deleteCarouselImage, updateCarouselImage,
  addMetric, deleteMetric, updateMetric, fetchAllSiteContent,
  deleteTestimonial, updateTestimonial, fetchTestimonials
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, Product, CarouselImage, SiteContent } from '../types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  const btnClass = (active: boolean) => `px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:text-white'}`;
  return (
    <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>Negrito</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>Itálico</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>Lista</button>
    </div>
  );
};

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'insights' | 'store' | 'metrics' | 'content' | 'testimonials'>('carousel');
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carousel Form State
  const [newCarousel, setNewCarousel] = useState({ 
    title: '', 
    subtitle: '', 
    url: '', 
    link: '', 
    display_order: 0, 
    is_active: true 
  });

  // Other Forms State
  const [newMetric, setNewMetric] = useState({ label: '', value: '', display_order: 0, is_active: true });
  const [newInsight, setNewInsight] = useState({ title: '', subtitle: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
  
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Image],
    content: '',
    editorProps: { attributes: { class: 'prose prose-invert prose-blue max-w-none focus:outline-none p-8 min-h-[300px] text-slate-300' } },
  });

  const loadAdminData = async () => {
    try {
      const [t_pend, t_all, m, p, i, c, l] = await Promise.all([
        fetchPendingTestimonials(),
        fetchTestimonials(),
        fetchMetrics(),
        fetchProducts(),
        fetchInsights(),
        fetchCarouselImages(),
        fetchAllSiteContent()
      ]);
      setPendingTestimonials(t_pend);
      setAllTestimonials(t_all);
      setMetrics(m);
      setProducts(p);
      setInsights(i);
      setCarouselImages(c);
      setSiteLabels(l);
      
      // Auto-increment display order for new slide
      if (c.length > 0) {
        const maxOrder = Math.max(...c.map(item => item.display_order));
        setNewCarousel(prev => ({ ...prev, display_order: maxOrder + 1 }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  // Carousel Specific Actions
  const handleAddCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await addCarouselImage(newCarousel);
    if (success) {
      setNewCarousel(prev => ({ ...prev, title: '', subtitle: '', url: '', link: '', display_order: prev.display_order + 1 }));
      await loadAdminData();
      alert('Slide adicionado ao acervo.');
    }
    setIsSubmitting(false);
  };

  const handleUpdateCarouselItem = async (id: string, updates: Partial<CarouselImage>) => {
    await updateCarouselImage(id, updates);
    // Reload data silently to update state
    const freshData = await fetchCarouselImages();
    setCarouselImages(freshData);
  };

  const handleDeleteCarousel = async (id: string) => {
    if (confirm('Deseja excluir este frame permanentemente? Esta ação não pode ser desfeita.')) {
      await deleteCarouselImage(id);
      loadAdminData();
    }
  };

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const content = editor?.getHTML() || '';
      await addInsight({ ...newInsight, content });
      setNewInsight({ title: '', subtitle: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: insights.length + 1 });
      editor?.commands.setContent('');
      loadAdminData();
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  // Filter logic for grids
  const filteredCarousel = carouselImages.filter(img => 
    (img.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (img.subtitle?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[92vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 bg-slate-950 border-r border-white/5 p-10 flex flex-row md:flex-col gap-8 overflow-x-auto shrink-0">
          <div className="flex items-center gap-4 mb-0 md:mb-12 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/30 text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] uppercase tracking-[0.3em] text-white">Advisory</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">CMS Center</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-3 flex-1">
            {[
              { id: 'carousel', label: 'Hero Carousel' },
              { id: 'insights', label: 'Insights & Blog' },
              { id: 'store', label: 'Produtos' },
              { id: 'metrics', label: 'KPIs Performance' },
              { id: 'testimonials', label: 'Feedback' },
              { id: 'content', label: 'Config. Site' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }} 
                className={`whitespace-nowrap px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest mt-auto border border-white/5 p-5 rounded-2xl transition-all">Sair do Dashboard</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-16 bg-grid custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-24">
            
            {/* --- CAROUSEL TAB --- */}
            {activeTab === 'carousel' && (
              <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8">
                <header className="space-y-4">
                  <div className="text-blue-500 font-bold uppercase tracking-[0.4em] text-[10px]">Gestão Visual de Impacto</div>
                  <h2 className="text-5xl font-serif italic text-white leading-tight">Master Hero Carousel</h2>
                  <p className="text-slate-500 text-sm font-light max-w-2xl">Aqui você controla os frames que definem a primeira impressão da Claudio Tonelli Consultoria.</p>
                </header>
                
                {/* 1. Registration Form */}
                <section className="bg-slate-800/20 border border-white/5 p-12 rounded-[3.5rem] space-y-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.4em]">Configurar Novo Frame</h3>
                  </div>

                  <form onSubmit={handleAddCarousel} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Título do Badge</label>
                        <input required placeholder="Ex: Expertise Global" value={newCarousel.title} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Imagem URL (HD)</label>
                        <input required placeholder="https://images.unsplash.com/..." value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Link de Destino</label>
                        <input placeholder="Ex: /insight/1" value={newCarousel.link || ''} onChange={e => setNewCarousel({...newCarousel, link: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-blue-400 outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Ordem de Exibição</label>
                        <input type="number" value={newCarousel.display_order} onChange={e => setNewCarousel({...newCarousel, display_order: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Subtítulo Estratégico</label>
                      <textarea placeholder="Arquitetando o amanhã..." value={newCarousel.subtitle} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none h-28 resize-none focus:border-blue-500 transition-all" />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-blue-600/20 active:scale-[0.98] transition-all">
                      {isSubmitting ? 'Gravando...' : 'Adicionar ao Carrossel'}
                    </button>
                  </form>
                </section>

                {/* 2. Management Grid */}
                <section className="space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif text-white italic">Inventário de Frames</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Gerencie os {carouselImages.length} slides do banco de dados</p>
                    </div>
                    <div className="relative w-full md:w-80">
                      <input 
                        type="text" 
                        placeholder="Localizar slide..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-4 text-xs text-slate-300 outline-none focus:border-blue-500 shadow-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-12">
                    {filteredCarousel.map((img, idx) => (
                      <div key={img.id} className={`group relative bg-slate-950/50 border ${img.is_active ? 'border-white/5' : 'border-red-500/10 opacity-60'} rounded-[3.5rem] overflow-hidden flex flex-col lg:flex-row hover:border-blue-500/20 transition-all shadow-2xl`}>
                        
                        {/* Status Toggle & Delete */}
                        <div className="absolute top-8 right-8 z-20 flex gap-4">
                          <button 
                            onClick={() => handleUpdateCarouselItem(img.id, { is_active: !img.is_active })}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${img.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'}`}
                          >
                            {img.is_active ? 'Ativo' : 'Inativo'}
                          </button>
                          <button 
                            onClick={() => handleDeleteCarousel(img.id)}
                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* Preview Section */}
                        <div className="w-full lg:w-96 aspect-video relative overflow-hidden bg-slate-900 shrink-0">
                          <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                          <div className="absolute bottom-8 left-8 flex items-end gap-5">
                             <div className="w-14 h-14 bg-white/5 backdrop-blur-2xl rounded-2xl flex items-center justify-center font-serif italic text-white text-2xl border border-white/10 shadow-2xl">
                               <input 
                                 type="number"
                                 defaultValue={img.display_order}
                                 onBlur={e => handleUpdateCarouselItem(img.id, { display_order: parseInt(e.target.value) })}
                                 className="w-full bg-transparent text-center outline-none"
                               />
                             </div>
                             <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.4em] mb-2">Ordem</div>
                          </div>
                        </div>

                        {/* Inline Edit Section */}
                        <div className="p-12 space-y-8 flex-1 flex flex-col justify-center">
                          <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Título Principal</label>
                            <input 
                              className="w-full bg-transparent text-white font-serif italic text-3xl outline-none focus:text-blue-500 transition-colors py-1"
                              defaultValue={img.title || ''}
                              onBlur={e => handleUpdateCarouselItem(img.id, { title: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Subtítulo Estratégico</label>
                            <textarea 
                              className="w-full bg-transparent text-slate-400 text-sm font-light leading-relaxed outline-none focus:text-slate-200 transition-colors h-16 resize-none"
                              defaultValue={img.subtitle || ''}
                              onBlur={e => handleUpdateCarouselItem(img.id, { subtitle: e.target.value })}
                            />
                          </div>
                          
                          <div className="flex gap-10">
                             <div className="space-y-2 flex-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Link de Ação</label>
                                <input 
                                  className="w-full bg-transparent text-blue-400 text-xs font-mono outline-none border-b border-white/5 focus:border-blue-500 transition-all py-1"
                                  defaultValue={img.link || ''}
                                  onBlur={e => handleUpdateCarouselItem(img.id, { link: e.target.value })}
                                />
                             </div>
                             <div className="space-y-2 flex-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">URL da Imagem</label>
                                <input 
                                  className="w-full bg-transparent text-slate-600 text-xs truncate outline-none border-b border-white/5 focus:border-blue-500 transition-all py-1"
                                  defaultValue={img.url}
                                  onBlur={e => handleUpdateCarouselItem(img.id, { url: e.target.value })}
                                />
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredCarousel.length === 0 && (
                      <div className="lg:col-span-2 py-48 text-center border-2 border-dashed border-white/5 rounded-[4rem]">
                        <p className="text-slate-600 italic font-serif text-2xl">Nenhum slide localizado no banco de dados.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* Outras Abas (Insights, Metrics, etc.) Mantendo a lógica robusta de grid... */}
            {activeTab === 'insights' && (
              <div className="space-y-16 animate-in fade-in">
                <header><h2 className="text-4xl font-serif italic text-white">Insight Factory</h2></header>
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                  <input required placeholder="Título do Artigo" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500" />
                  <textarea placeholder="Lead persuasivo..." value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950 p-6 rounded-2xl border border-white/5 text-white outline-none h-24 resize-none" />
                  <div className="border border-white/5 rounded-3xl overflow-hidden bg-slate-950"><MenuBar editor={editor} /><EditorContent editor={editor} /></div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 py-5 rounded-2xl text-[10px] font-bold uppercase text-white shadow-xl">{isSubmitting ? 'Publicando...' : 'Publicar Artigo'}</button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

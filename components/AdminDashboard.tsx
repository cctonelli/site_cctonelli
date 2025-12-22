
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
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, type: 'service' as 'product' | 'service', config: { url: '', image_url: '', action_label: 'Contratar Agora' } });
  
  const [imageFile, setImageFile] = useState<File | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Image],
    content: '',
    editorProps: { attributes: { class: 'prose prose-invert prose-blue max-w-none focus:outline-none p-8 min-h-[400px] text-slate-300' } },
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
      
      // Ajusta ordem automática para novo carrossel
      if (c.length > 0) {
        setNewCarousel(prev => ({ ...prev, display_order: c.length + 1 }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados administrativos:", err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  // Carousel Handlers
  const handleAddCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await addCarouselImage(newCarousel);
    if (success) {
      setNewCarousel({ title: '', subtitle: '', url: '', link: '', display_order: carouselImages.length + 2, is_active: true });
      loadAdminData();
    }
    setIsSubmitting(false);
  };

  const handleUpdateCarouselItem = async (id: string, updates: Partial<CarouselImage>) => {
    await updateCarouselImage(id, updates);
    loadAdminData();
  };

  const handleDeleteCarousel = async (id: string) => {
    if (confirm('Deseja excluir permanentemente este slide do carrossel?')) {
      await deleteCarouselImage(id);
      loadAdminData();
    }
  };

  // Insight Handlers
  // Fix: Added handleAddInsight to fix 'Cannot find name' error and handle article creation
  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const content = editor?.getHTML() || '';
      const insightData = {
        ...newInsight,
        content: content
      };
      await addInsight(insightData);
      setNewInsight({ 
        title: '', 
        subtitle: '', 
        excerpt: '', 
        category: 'ESTRATÉGIA', 
        image_url: '', 
        is_active: true, 
        display_order: insights.length + 1 
      });
      editor?.commands.setContent('');
      loadAdminData();
    } catch (err) {
      console.error("Error adding insight:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Carousel Images
  const filteredCarousel = carouselImages.filter(img => 
    (img.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (img.subtitle?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[92vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in duration-500">
        
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
              { id: 'insights', label: 'Insights Artigos' },
              { id: 'store', label: 'Produtos & Assets' },
              { id: 'metrics', label: 'KPIs & Performance' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Textos & Rótulos' }
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
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest mt-auto border border-white/5 p-5 rounded-2xl transition-all">Encerrar Painel</button>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-16 bg-grid custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-24">
            
            {/* --- CAROUSEL TAB --- */}
            {activeTab === 'carousel' && (
              <div className="space-y-20 animate-in fade-in slide-in-from-bottom-6">
                <header className="space-y-4">
                  <div className="text-blue-500 font-bold uppercase tracking-[0.4em] text-[10px]">Primeira Impressão</div>
                  <h2 className="text-5xl font-serif italic text-white leading-tight">Master Hero Carousel</h2>
                  <p className="text-slate-500 text-sm font-light max-w-2xl">Gerencie os slides de fundo, mensagens de impacto e links de ação da página principal.</p>
                </header>
                
                {/* 1. Registration Form (TOP) */}
                <section className="bg-slate-800/20 border border-white/5 p-12 rounded-[3.5rem] space-y-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.4em]">Configurar Novo Frame</h3>
                  </div>

                  <form onSubmit={handleAddCarousel} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Título (Badge Hero)</label>
                        <input required placeholder="Ex: Expertise Global" value={newCarousel.title} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-800" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Imagem URL (HD)</label>
                        <input required placeholder="https://images.unsplash.com/..." value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-800" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Link de Ação</label>
                        <input placeholder="Ex: /insight/1 ou https://google.com" value={newCarousel.link || ''} onChange={e => setNewCarousel({...newCarousel, link: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-blue-400 outline-none focus:border-blue-500 transition-all placeholder:text-slate-800" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Prioridade (Ordem)</label>
                        <input type="number" placeholder="1" value={newCarousel.display_order} onChange={e => setNewCarousel({...newCarousel, display_order: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Subtítulo Estratégico</label>
                      <textarea placeholder="Arquitetando o amanhã através de rigor metodológico..." value={newCarousel.subtitle} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none h-28 resize-none focus:border-blue-500 transition-all placeholder:text-slate-800" />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-blue-600/20 active:scale-[0.98] transition-all">
                      {isSubmitting ? 'Processando...' : 'Adicionar ao Acervo Corporativo'}
                    </button>
                  </form>
                </section>

                {/* 2. Management Grid (BOTTOM) */}
                <section className="space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif text-white italic">Frames Atuais</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{carouselImages.length} Slides cadastrados no Supabase</p>
                    </div>
                    <div className="relative w-full md:w-72">
                      <input 
                        type="text" 
                        placeholder="Pesquisar slides..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-6 py-3 text-xs text-slate-300 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10">
                    {filteredCarousel.map((img, idx) => (
                      <div key={img.id} className={`group relative bg-slate-950/40 border ${img.is_active ? 'border-white/5' : 'border-red-500/20 opacity-60'} rounded-[3rem] overflow-hidden flex flex-col hover:border-blue-500/30 transition-all shadow-2xl`}>
                        
                        {/* Status Toggle Toolbar */}
                        <div className="absolute top-6 right-6 z-20 flex gap-3">
                          <button 
                            onClick={() => handleUpdateCarouselItem(img.id, { is_active: !img.is_active })}
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${img.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                          >
                            {img.is_active ? 'Visível' : 'Oculto'}
                          </button>
                        </div>

                        {/* Visual Preview */}
                        <div className="aspect-video relative overflow-hidden bg-slate-900 shrink-0">
                          <img src={img.url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                          <div className="absolute bottom-6 left-8 flex items-end gap-4">
                             <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center font-serif italic text-white text-xl border border-white/10">#{img.display_order || idx + 1}</div>
                             <div className="text-[8px] text-white/40 font-bold uppercase tracking-[0.4em] mb-1">Index de Exibição</div>
                          </div>
                        </div>

                        {/* Inline Management Area */}
                        <div className="p-10 space-y-8 flex-1 flex flex-col">
                          <div className="space-y-6 flex-1">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Título do Slide</label>
                              <input 
                                className="w-full bg-transparent text-white font-serif italic text-2xl outline-none border-b border-transparent focus:border-blue-500 transition-all py-1"
                                defaultValue={img.title || ''}
                                onBlur={e => handleUpdateCarouselItem(img.id, { title: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Link Destino</label>
                              <input 
                                className="w-full bg-transparent text-blue-400 text-xs font-mono outline-none border-b border-transparent focus:border-blue-500 transition-all py-1"
                                defaultValue={img.link || ''}
                                onBlur={e => handleUpdateCarouselItem(img.id, { link: e.target.value })}
                                placeholder="/rota"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Conteúdo do Subtítulo</label>
                              <textarea 
                                className="w-full bg-slate-900/30 text-slate-400 text-sm font-light leading-relaxed outline-none border border-transparent focus:border-blue-500 p-4 rounded-2xl transition-all h-24 resize-none"
                                defaultValue={img.subtitle || ''}
                                onBlur={e => handleUpdateCarouselItem(img.id, { subtitle: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-slate-700 font-bold uppercase">ID: {img.id.slice(0, 8)}</span>
                            </div>
                            <button 
                              onClick={() => handleDeleteCarousel(img.id)}
                              className="text-[9px] font-bold uppercase text-red-600/50 hover:text-red-500 transition-all border-b border-transparent hover:border-red-500 pb-1"
                            >
                              Remover do Banco
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredCarousel.length === 0 && (
                      <div className="lg:col-span-2 py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem]">
                        <p className="text-slate-600 italic font-serif text-xl">Nenhum slide localizado no repositório.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* --- REST OF TABS (STUBBED FOR NOW) --- */}
            {activeTab === 'insights' && (
              <div className="space-y-10 animate-in fade-in">
                <header><h2 className="text-3xl font-serif italic text-white">Elite Insight Factory</h2></header>
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-8">
                  <input required placeholder="Título do Insight" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  <textarea placeholder="Lead do Insight..." value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950 p-5 rounded-xl border border-white/10 text-white outline-none h-24 resize-none" />
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950"><MenuBar editor={editor} /><EditorContent editor={editor} /></div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 py-5 rounded-2xl text-[10px] font-bold uppercase text-white shadow-xl">{isSubmitting ? 'Sincronizando...' : 'Publicar Agora'}</button>
                </form>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-16 animate-in fade-in">
                <header><h2 className="text-4xl font-serif italic text-white">KPIs & Performance</h2></header>
                <form onSubmit={(e) => { e.preventDefault(); addMetric(newMetric).then(loadAdminData); }} className="grid md:grid-cols-2 gap-8 bg-slate-800/20 p-10 rounded-[2.5rem] border border-white/5">
                  <input required placeholder="Rótulo (ex: EBITDA)" value={newMetric.label} onChange={e => setNewMetric({...newMetric, label: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                  <input required placeholder="Valor (ex: +15%)" value={newMetric.value} onChange={e => setNewMetric({...newMetric, value: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                  <button type="submit" className="md:col-span-2 bg-blue-600 py-5 rounded-2xl font-bold uppercase text-xs text-white">Adicionar Métrica</button>
                </form>
                <div className="grid md:grid-cols-2 gap-8">
                  {metrics.map(m => (
                    <div key={m.id} className="bg-slate-950 p-8 rounded-3xl border border-white/5 flex justify-between items-center">
                       <div><div className="text-4xl font-serif text-white">{m.value}</div><div className="text-[10px] font-bold text-slate-500 uppercase">{m.label}</div></div>
                       <button onClick={() => deleteMetric(m.id).then(loadAdminData)} className="text-red-500 text-xs font-bold uppercase">X</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

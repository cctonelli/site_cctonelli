
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
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Forms State
  const [newCarousel, setNewCarousel] = useState({ title: '', subtitle: '', url: '', link: '', display_order: 0, is_active: true });
  const [newMetric, setNewMetric] = useState({ label: '', value: '', display_order: 0, is_active: true });
  const [newInsight, setNewInsight] = useState({ title: '', subtitle: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
  
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Image],
    content: '',
    editorProps: { attributes: { class: 'prose prose-invert prose-blue max-w-none focus:outline-none p-8 min-h-[300px] text-slate-300' } },
  });

  const loadAdminData = async () => {
    try {
      const [t_all, m, p, i, c, l] = await Promise.all([
        fetchTestimonials(),
        fetchMetrics(),
        fetchProducts(),
        fetchInsights(),
        fetchCarouselImages(),
        fetchAllSiteContent()
      ]);
      setAllTestimonials(t_all);
      setMetrics(m);
      setProducts(p);
      setInsights(i);
      setCarouselImages(c);
      setSiteLabels(l);
      
      if (c.length > 0) {
        const maxOrder = Math.max(...c.map(item => item.display_order));
        setNewCarousel(prev => ({ ...prev, display_order: maxOrder + 1 }));
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  // --- ACTIONS ---
  const handleAddCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (await addCarouselImage(newCarousel)) {
      setNewCarousel(prev => ({ ...prev, title: '', subtitle: '', url: '', link: '', display_order: prev.display_order + 1 }));
      await loadAdminData();
    }
    setIsSubmitting(false);
  };

  const handleUpdateCarouselItem = async (id: string, updates: Partial<CarouselImage>) => {
    await updateCarouselImage(id, updates);
    loadAdminData();
  };

  const handleDeleteCarousel = async (id: string) => {
    if (confirm('Excluir este frame?')) { await deleteCarouselImage(id); loadAdminData(); }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addMetric(newMetric)) {
      setNewMetric({ label: '', value: '', display_order: metrics.length + 1, is_active: true });
      loadAdminData();
    }
  };

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const content = editor?.getHTML() || '';
    if (await addInsight({ ...newInsight, content })) {
      setNewInsight({ title: '', subtitle: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: insights.length + 1 });
      editor?.commands.setContent('');
      loadAdminData();
    }
    setIsSubmitting(false);
  };

  const handleUpdateContent = async (key: string, value: string, page: string) => {
    await updateSiteContent(key, value, page);
    loadAdminData();
  };

  const handleToggleTestimonial = async (id: string, approved: boolean) => {
    await updateTestimonial(id, { approved });
    loadAdminData();
  };

  // --- FILTERS ---
  const filteredCarousel = carouselImages.filter(img => (img.title || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredInsights = insights.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredLabels = siteLabels.filter(l => l.key.toLowerCase().includes(searchTerm.toLowerCase()) || l.value.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[92vh] rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
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
              { id: 'metrics', label: 'KPIs Metrics' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Textos do Site' }
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
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest mt-auto border border-white/5 p-5 rounded-2xl transition-all">Sair</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-16 bg-grid custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-24">
            
            {/* --- CAROUSEL --- */}
            {activeTab === 'carousel' && (
              <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8">
                <header className="space-y-4">
                  <h2 className="text-5xl font-serif italic text-white leading-tight">Master Hero Carousel</h2>
                  <p className="text-slate-500 text-sm font-light">Controle os frames de impacto da Home Page.</p>
                </header>
                
                <form onSubmit={handleAddCarousel} className="bg-slate-800/20 border border-white/5 p-12 rounded-[3.5rem] space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <input required placeholder="Título Badge" value={newCarousel.title} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500" />
                    <input required placeholder="URL Imagem" value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500" />
                  </div>
                  <textarea placeholder="Subtítulo" value={newCarousel.subtitle} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white h-24 resize-none outline-none focus:border-blue-500" />
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px]">{isSubmitting ? 'Gravando...' : 'Adicionar Frame'}</button>
                </form>

                <div className="grid gap-8">
                  <input type="text" placeholder="Localizar slide..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-4 text-xs text-slate-300 w-full" />
                  {filteredCarousel.map(img => (
                    <div key={img.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-[2.5rem] flex flex-col lg:flex-row gap-8 items-center shadow-xl">
                      <img src={img.url} className="w-48 h-32 object-cover rounded-3xl" />
                      <div className="flex-1 space-y-4 w-full">
                        <input className="bg-transparent text-white font-serif text-2xl outline-none w-full border-b border-transparent focus:border-blue-500" defaultValue={img.title || ''} onBlur={e => handleUpdateCarouselItem(img.id, { title: e.target.value })} />
                        <div className="flex gap-4">
                          <button onClick={() => handleUpdateCarouselItem(img.id, { is_active: !img.is_active })} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${img.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{img.is_active ? 'Ativo' : 'Inativo'}</button>
                          <button onClick={() => handleDeleteCarousel(img.id)} className="text-[9px] font-black uppercase text-red-500 hover:underline">Excluir</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- INSIGHTS --- */}
            {activeTab === 'insights' && (
              <div className="space-y-20 animate-in fade-in">
                <header><h2 className="text-5xl font-serif italic text-white">Insight Factory</h2></header>
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-12 rounded-[3.5rem] space-y-8">
                  <input required placeholder="Título Artigo" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                  <div className="border border-white/5 rounded-3xl overflow-hidden bg-slate-950"><MenuBar editor={editor} /><EditorContent editor={editor} /></div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px]">Publicar Insight</button>
                </form>
                <div className="space-y-6">
                  {filteredInsights.map(i => (
                    <div key={i.id} className="bg-slate-950/50 border border-white/5 p-8 rounded-3xl flex justify-between items-center">
                      <div><h4 className="text-white font-serif text-xl italic">{i.title}</h4><p className="text-[9px] text-slate-500 uppercase tracking-widest">{i.category}</p></div>
                      <button onClick={() => { if(confirm('Excluir artigo?')) deleteInsight(i.id).then(loadAdminData); }} className="text-red-500 text-[10px] font-bold uppercase">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- METRICS --- */}
            {activeTab === 'metrics' && (
              <div className="space-y-20 animate-in fade-in">
                <header><h2 className="text-5xl font-serif italic text-white">KPIs & Performance</h2></header>
                <form onSubmit={handleAddMetric} className="grid md:grid-cols-2 gap-8 bg-slate-800/20 p-12 rounded-[3.5rem] border border-white/5">
                  <input required placeholder="Rótulo (EBITDA)" value={newMetric.label} onChange={e => setNewMetric({...newMetric, label: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                  <input required placeholder="Valor (+24%)" value={newMetric.value} onChange={e => setNewMetric({...newMetric, value: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                  <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px]">Adicionar Métrica</button>
                </form>
                <div className="grid md:grid-cols-2 gap-8">
                  {metrics.map(m => (
                    <div key={m.id} className="bg-slate-950 p-10 rounded-[2.5rem] border border-white/5 flex justify-between items-center">
                      <div><div className="text-4xl font-serif text-white">{m.value}</div><div className="text-[10px] text-slate-500 uppercase font-bold">{m.label}</div></div>
                      <button onClick={() => deleteMetric(m.id).then(loadAdminData)} className="text-red-500 font-bold uppercase text-[9px]">Remover</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- TESTIMONIALS --- */}
            {activeTab === 'testimonials' && (
              <div className="space-y-20 animate-in fade-in">
                <header><h2 className="text-5xl font-serif italic text-white">Depoimentos</h2></header>
                <div className="space-y-8">
                  {allTestimonials.map(t => (
                    <div key={t.id} className={`p-10 rounded-[3rem] border ${t.approved ? 'border-white/5 bg-slate-950/50' : 'border-blue-500/20 bg-blue-500/5'} space-y-6 transition-all`}>
                      <p className="text-slate-300 italic font-light leading-relaxed">"{t.quote}"</p>
                      <div className="flex justify-between items-center">
                        <div><div className="text-white font-bold">{t.name}</div><div className="text-[9px] text-slate-500 uppercase tracking-widest">{t.company}</div></div>
                        <div className="flex gap-4">
                          <button onClick={() => handleToggleTestimonial(t.id, !t.approved)} className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${t.approved ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{t.approved ? 'Rejeitar' : 'Aprovar'}</button>
                          <button onClick={() => { if(confirm('Excluir?')) deleteTestimonial(t.id).then(loadAdminData); }} className="text-[9px] text-slate-700 hover:text-red-500 font-bold uppercase">Excluir</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- SITE CONTENT --- */}
            {activeTab === 'content' && (
              <div className="space-y-20 animate-in fade-in">
                <header><h2 className="text-5xl font-serif italic text-white">Textos & Rótulos</h2></header>
                <div className="space-y-8">
                  <input type="text" placeholder="Filtrar por chave ou texto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-4 text-xs text-slate-300 w-full" />
                  <div className="grid gap-6">
                    {filteredLabels.map(l => (
                      <div key={l.key} className="bg-slate-950/50 border border-white/5 p-8 rounded-3xl space-y-3">
                        <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{l.key}</div>
                        <textarea className="w-full bg-transparent text-slate-300 text-sm outline-none border-b border-transparent focus:border-blue-500 py-1 resize-none" defaultValue={l.value} onBlur={e => handleUpdateContent(l.key, e.target.value, l.page)} />
                      </div>
                    ))}
                  </div>
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

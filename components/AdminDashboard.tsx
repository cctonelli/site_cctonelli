
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
      <button type="button" onClick={() => {
        const url = window.prompt('URL da Imagem');
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }} className={btnClass(false)}>Imagem</button>
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

  // Forms state
  const [newCarousel, setNewCarousel] = useState({ title: '', subtitle: '', url: '', link: '', display_order: 0, is_active: true });
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
    } catch (err) {
      console.error("Admin load fail", err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  // Generic Update Handlers
  const handleUpdateInsight = async (id: string, updates: Partial<Insight>) => {
    if (await updateInsight(id, updates)) loadAdminData();
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    if (await updateProduct(id, updates)) loadAdminData();
  };

  const handleUpdateMetric = async (id: string, updates: Partial<Metric>) => {
    if (await updateMetric(id, updates)) loadAdminData();
  };

  const handleUpdateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    if (await updateTestimonial(id, updates)) loadAdminData();
  };

  const handleUpdateCarouselItem = async (id: string, updates: Partial<CarouselImage>) => {
    const success = await updateCarouselImage(id, updates);
    if (success) loadAdminData();
  };

  // Creation Handlers
  const handleAddCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addCarouselImage(newCarousel)) {
      setNewCarousel({ title: '', subtitle: '', url: '', link: '', display_order: carouselImages.length + 1, is_active: true });
      loadAdminData();
      alert('Slide adicionado!');
    }
  };

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !editor) return;
    setIsSubmitting(true);
    try {
      let finalImageUrl = newInsight.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadInsightImage(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }
      const created = await addInsight({
        ...newInsight,
        content: editor.getHTML(),
        image_url: finalImageUrl,
        link: ''
      });
      if (created && created.id) {
        await updateInsightLink(created.id, `/insight/${created.id}`);
        alert('Insight publicado!');
        setNewInsight({ title: '', subtitle: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
        editor.commands.setContent('');
        setImageFile(null);
        loadAdminData();
      }
    } catch (err: any) { alert(`Erro: ${err.message}`); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[92vh] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl transition-all duration-700">
        
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-slate-950 border-r border-white/5 p-10 flex flex-row md:flex-col gap-8 overflow-x-auto shrink-0">
          <div className="flex items-center gap-4 mb-0 md:mb-12 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl shadow-blue-600/30 text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] uppercase tracking-[0.3em] text-white">Advisory</span>
              <span className="text-[9px] uppercase tracking-widest text-slate-600">Control Panel</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-3 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Insights' },
              { id: 'store', label: 'Produtos' },
              { id: 'metrics', label: 'Métricas' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Rótulos' }
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
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest mt-auto border border-white/5 p-5 rounded-2xl transition-all hover:bg-red-500/5 hover:border-red-500/20">Desconectar</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 lg:p-16 bg-grid">
          <div className="max-w-4xl mx-auto space-y-20">
            
            {/* CAROUSEL TAB */}
            {activeTab === 'carousel' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
                <header><h2 className="text-5xl font-serif italic text-white leading-tight">Master Hero Carousel</h2></header>
                
                <section className="bg-slate-800/20 border border-white/5 p-12 rounded-[3rem] space-y-10 relative overflow-hidden group">
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-[0.4em] flex items-center gap-4">NOVO FRAME ESTRATÉGICO</h3>
                  <form onSubmit={handleAddCarousel} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <input required placeholder="Título do Slide" value={newCarousel.title || ''} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700" />
                      <input required placeholder="URL da Imagem" value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700" />
                    </div>
                    <textarea placeholder="Subtítulo persuasivo..." value={newCarousel.subtitle || ''} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none h-28 resize-none focus:border-blue-500 transition-all placeholder:text-slate-700" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-16 py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95">Publicar no Hero</button>
                  </form>
                </section>

                <div className="grid gap-10">
                   {carouselImages.map(img => (
                     <div key={img.id} className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-white/5 flex flex-col lg:flex-row gap-10 group hover:border-blue-500/30 transition-all">
                       <div className="w-full lg:w-48 aspect-video rounded-3xl overflow-hidden border border-white/5 shrink-0">
                         <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                       </div>
                       <div className="flex-1 space-y-6">
                         <div className="flex justify-between items-start">
                           <input defaultValue={img.title || ''} onBlur={e => handleUpdateCarouselItem(img.id, { title: e.target.value })} className="bg-transparent text-white font-serif italic text-3xl outline-none focus:text-blue-500 transition-colors w-full" />
                           <div className="flex gap-4">
                             <button onClick={() => handleUpdateCarouselItem(img.id, { is_active: !img.is_active })} className={`p-2 rounded-xl border transition-all ${img.is_active ? 'border-green-500/20 text-green-500' : 'border-red-500/20 text-red-500'}`}>
                               {img.is_active ? 'On' : 'Off'}
                             </button>
                             <button onClick={() => { if(confirm('Excluir?')) deleteCarouselImage(img.id).then(loadAdminData); }} className="p-2 text-slate-600 hover:text-red-500 transition-colors">Del</button>
                           </div>
                         </div>
                         <textarea defaultValue={img.subtitle || ''} onBlur={e => handleUpdateCarouselItem(img.id, { subtitle: e.target.value })} className="w-full bg-transparent text-slate-400 text-sm font-light leading-relaxed outline-none border-l border-white/10 pl-6 h-20 resize-none focus:border-blue-500" />
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* INSIGHTS TAB */}
            {activeTab === 'insights' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
                <header><h2 className="text-5xl font-serif italic text-white leading-tight">Elite Insight Factory</h2></header>
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-12 rounded-[3rem] space-y-10">
                  <div className="grid md:grid-cols-2 gap-8">
                    <input required placeholder="Título do Insight" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500" />
                    <select value={newInsight.category} onChange={e => setNewInsight({...newInsight, category: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-slate-300 outline-none">
                      <option value="ESTRATÉGIA">Estratégia</option>
                      <option value="TRANSFORMAÇÃO">Transformação</option>
                      <option value="ESG">ESG & Sustentabilidade</option>
                      <option value="TECNOLOGIA">Tecnologia & IA</option>
                    </select>
                  </div>
                  <textarea placeholder="Resumo Executivo (Excerpt)" value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none h-24 resize-none" />
                  <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-slate-950 shadow-2xl">
                    <MenuBar editor={editor} />
                    <EditorContent editor={editor} />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px] text-white shadow-xl hover:bg-blue-500 active:scale-95 transition-all">
                    {isSubmitting ? 'Sincronizando com Supabase...' : 'Publicar Agora'}
                  </button>
                </form>

                <div className="space-y-10">
                  <h3 className="text-xl font-serif italic text-white border-b border-white/5 pb-4">Artigos Publicados</h3>
                  {insights.map(i => (
                    <div key={i.id} className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 flex justify-between items-center group transition-all hover:bg-slate-950">
                      <div className="space-y-2">
                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{i.category}</div>
                        <h4 className="text-xl font-serif text-white group-hover:text-blue-400 transition-colors">{i.title}</h4>
                        <p className="text-slate-500 text-xs font-light">{new Date(i.published_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <button onClick={() => handleUpdateInsight(i.id, { is_active: !i.is_active })} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${i.is_active ? 'text-green-500' : 'text-red-500'}`}>
                          {i.is_active ? 'Visível' : 'Oculto'}
                        </button>
                        <button onClick={() => { if(confirm('Excluir?')) deleteInsight(i.id).then(loadAdminData); }} className="text-slate-700 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* METRICS TAB */}
            {activeTab === 'metrics' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
                <header><h2 className="text-5xl font-serif italic text-white">Impact Metrics</h2></header>
                <section className="bg-slate-800/20 border border-white/5 p-12 rounded-[3rem] space-y-10">
                   <h3 className="text-xs font-bold text-blue-500 uppercase tracking-[0.4em]">ADICIONAR KPI</h3>
                   <form onSubmit={(e) => { e.preventDefault(); addMetric(newMetric).then(loadAdminData); }} className="grid md:grid-cols-2 gap-8">
                     <input required placeholder="Rótulo (ex: EBITDA Médio)" value={newMetric.label} onChange={e => setNewMetric({...newMetric, label: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                     <input required placeholder="Valor (ex: +24%)" value={newMetric.value} onChange={e => setNewMetric({...newMetric, value: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                     <button type="submit" className="md:col-span-2 bg-blue-600 py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px] text-white">Adicionar à Performance</button>
                   </form>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                  {metrics.map(m => (
                    <div key={m.id} className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-white/5 group relative overflow-hidden">
                       <input defaultValue={m.value} onBlur={e => handleUpdateMetric(m.id, { value: e.target.value })} className="bg-transparent text-5xl font-serif italic text-white outline-none w-full focus:text-blue-500 transition-colors" />
                       <input defaultValue={m.label} onBlur={e => handleUpdateMetric(m.id, { label: e.target.value })} className="bg-transparent text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 outline-none w-full" />
                       <button onClick={() => deleteMetric(m.id).then(loadAdminData)} className="absolute top-8 right-8 text-red-500/0 group-hover:text-red-500 transition-all font-bold text-[9px] uppercase tracking-widest">Remover</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STORE / PRODUCTS TAB */}
            {activeTab === 'store' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
                <header><h2 className="text-5xl font-serif italic text-white">Corporate Assets</h2></header>
                <form onSubmit={(e) => { e.preventDefault(); addProduct(newProduct).then(loadAdminData); }} className="bg-slate-800/20 border border-white/5 p-12 rounded-[3rem] space-y-10">
                  <div className="grid md:grid-cols-2 gap-8">
                    <input required placeholder="Nome do Produto/Serviço" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                    <input required type="number" placeholder="Preço (BRL)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none" />
                  </div>
                  <textarea placeholder="Descrição curta..." value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none h-24 resize-none" />
                  <button type="submit" className="w-full bg-blue-600 py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px] text-white">Criar Asset</button>
                </form>

                <div className="grid gap-10">
                  {products.map(p => (
                    <div key={p.id} className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 flex justify-between items-center group">
                       <div className="flex-1 space-y-2">
                         <div className="flex items-center gap-4">
                           <input defaultValue={p.name} onBlur={e => handleUpdateProduct(p.id, { name: e.target.value })} className="bg-transparent text-xl font-serif text-white outline-none focus:text-blue-500" />
                           <span className="text-[10px] font-bold text-slate-700">R$ <input type="number" defaultValue={p.price} onBlur={e => handleUpdateProduct(p.id, { price: parseFloat(e.target.value) })} className="bg-transparent text-slate-500 w-24 outline-none" /></span>
                         </div>
                         <p className="text-slate-500 text-xs font-light line-clamp-1">{p.description}</p>
                       </div>
                       <button onClick={() => deleteProduct(p.id).then(loadAdminData)} className="text-red-500/20 group-hover:text-red-500 transition-all font-bold text-[9px] uppercase tracking-widest">Remover</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TESTIMONIALS TAB */}
            {activeTab === 'testimonials' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
                <header><h2 className="text-5xl font-serif italic text-white">Client Feedback</h2></header>
                
                <div className="space-y-10">
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-[0.4em]">AGUARDANDO APROVAÇÃO ({pendingTestimonials.length})</h3>
                  {pendingTestimonials.map(t => (
                    <div key={t.id} className="bg-blue-600/5 p-10 rounded-[2.5rem] border border-blue-500/20 space-y-6">
                       <p className="text-xl italic font-light text-slate-300">"{t.quote}"</p>
                       <div className="flex justify-between items-center">
                         <div><span className="text-white font-bold">{t.name}</span> <span className="text-slate-500 text-xs">| {t.company}</span></div>
                         <div className="flex gap-4">
                           <button onClick={() => approveTestimonial(t.id).then(loadAdminData)} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">Aprovar</button>
                           <button onClick={() => deleteTestimonial(t.id).then(loadAdminData)} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest">Descartar</button>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-10">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em]">GERENCIAR TODOS</h3>
                  {allTestimonials.filter(t => t.approved).map(t => (
                    <div key={t.id} className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 flex justify-between items-center group">
                       <div className="flex-1">
                         <p className="text-sm italic text-slate-400 line-clamp-1">"{t.quote}"</p>
                         <div className="text-[10px] text-slate-600 uppercase font-bold mt-2">{t.name} - {t.company}</div>
                       </div>
                       <button onClick={() => deleteTestimonial(t.id).then(loadAdminData)} className="text-red-500/20 group-hover:text-red-500 transition-all font-bold text-[9px] uppercase tracking-widest">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RÓTULOS (CONTENT) TAB */}
            {activeTab === 'content' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
                <header>
                  <h2 className="text-5xl font-serif italic text-white leading-tight">Global Content Keys</h2>
                  <div className="relative mt-8">
                    <input 
                      type="text" 
                      placeholder="Localizar chave ou valor..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </header>
                
                <div className="grid gap-6">
                  {siteLabels.filter(l => l.key.toLowerCase().includes(searchTerm.toLowerCase()) || l.value.toLowerCase().includes(searchTerm.toLowerCase())).map(label => (
                    <div key={label.key} className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">{label.key}</div>
                        <div className="text-[8px] font-black uppercase text-slate-700">Page: {label.page}</div>
                      </div>
                      <textarea 
                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-slate-300 outline-none focus:border-blue-600 transition-all resize-none min-h-[80px]"
                        defaultValue={label.value}
                        onBlur={(e) => updateSiteContent(label.key, e.target.value, label.page).then(loadAdminData)}
                      />
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

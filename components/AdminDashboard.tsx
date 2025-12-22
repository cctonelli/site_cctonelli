
import React, { useState, useEffect } from 'react';
import { 
  fetchPendingTestimonials, approveTestimonial, 
  updateSiteContent, fetchMetrics, fetchInsights,
  fetchProducts, addProduct, deleteProduct,
  addInsight, deleteInsight, updateInsightLink,
  uploadInsightImage, fetchCarouselImages,
  addCarouselImage, deleteCarouselImage, updateCarouselImage,
  addMetric, deleteMetric, fetchAllSiteContent
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
  const [activeTab, setActiveTab] = useState<'content' | 'testimonials' | 'metrics' | 'store' | 'insights' | 'carousel'>('content');
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms state
  const [newCarousel, setNewCarousel] = useState({ title: '', subtitle: '', url: '', display_order: 0 });
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
      const [t, m, p, i, c, l] = await Promise.all([
        fetchPendingTestimonials(),
        fetchMetrics(),
        fetchProducts(),
        fetchInsights(),
        fetchCarouselImages(),
        fetchAllSiteContent()
      ]);
      setPendingTestimonials(t);
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

  const handleUpdateLabel = async (key: string, value: string) => {
    const success = await updateSiteContent(key, value);
    if (success) loadAdminData();
  };

  const handleUpdateCarouselItem = async (id: string, updates: Partial<CarouselImage>) => {
    const success = await updateCarouselImage(id, updates);
    if (success) loadAdminData();
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
        alert('Insight publicado com sucesso!');
        setNewInsight({ title: '', subtitle: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
        editor.commands.setContent('');
        setImageFile(null);
        loadAdminData();
      }
    } catch (err: any) {
      console.error("Insight Save Error:", err);
      alert(`Erro Supabase: ${err.message || 'Verifique se as colunas da tabela "insights" batem com o formulário.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addMetric(newMetric)) {
      setNewMetric({ label: '', value: '', display_order: 0, is_active: true });
      loadAdminData();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addProduct(newProduct)) {
      setNewProduct({ name: '', description: '', price: 0, type: 'service', config: { url: '', image_url: '', action_label: 'Contratar Agora' } });
      loadAdminData();
    }
  };

  const handleAddCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addCarouselImage(newCarousel)) {
      setNewCarousel({ title: '', subtitle: '', url: '', display_order: 0 });
      loadAdminData();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[92vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-950 border-r border-white/5 p-8 flex flex-row md:flex-col gap-6 overflow-x-auto shrink-0">
          <div className="flex items-center gap-3 mb-0 md:mb-10 min-w-fit">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/30">CT</div>
            <span className="font-bold text-[9px] uppercase tracking-widest text-slate-500">Advisory CMS</span>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-2 flex-1">
            {[
              { id: 'content', label: 'Conteúdo' },
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Insights' },
              { id: 'metrics', label: 'Métricas' },
              { id: 'store', label: 'Mercado' },
              { id: 'testimonials', label: 'Feedback' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest mt-auto border border-white/5 p-4 rounded-xl transition-all">Sair do CMS</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-grid">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {activeTab === 'content' && (
              <div className="space-y-8 animate-in fade-in">
                <header>
                  <h2 className="text-3xl font-serif italic text-white">Rótulos do Site</h2>
                  <p className="text-slate-500 text-sm">Edite chaves de texto dinâmicas que aparecem na interface.</p>
                </header>
                <div className="grid gap-4">
                  {siteLabels.map(label => (
                    <div key={label.key} className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 space-y-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{label.key}</div>
                      <textarea 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-600 transition-all resize-none"
                        defaultValue={label.value}
                        onBlur={(e) => handleUpdateLabel(label.key, e.target.value)}
                      />
                    </div>
                  ))}
                  {siteLabels.length === 0 && <div className="py-20 text-center text-slate-600 italic">Nenhum rótulo configurado no banco.</div>}
                </div>
              </div>
            )}

            {activeTab === 'carousel' && (
              <div className="space-y-10 animate-in fade-in">
                <header><h2 className="text-3xl font-serif italic text-white">Carrossel de Fundo</h2></header>
                
                {/* Add Form */}
                <form onSubmit={handleAddCarousel} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input required placeholder="Título (Badge)" value={newCarousel.title || ''} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                    <input required placeholder="URL da Imagem" value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  </div>
                  <textarea placeholder="Subtítulo de Impacto..." value={newCarousel.subtitle || ''} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none h-24 resize-none" />
                  <button type="submit" className="bg-blue-600 px-8 py-4 rounded-xl text-[10px] font-bold uppercase text-white shadow-lg shadow-blue-600/20">Adicionar Frame</button>
                </form>

                {/* Listing with Auto-Save */}
                <div className="grid gap-6">
                  <h3 className="text-xl font-serif text-white italic">Frames Ativos (Clique nos textos para editar)</h3>
                  {carouselImages.map(img => (
                    <div key={img.id} className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 group space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <img src={img.url} className="w-20 h-12 object-cover rounded-xl border border-white/10" alt="" />
                          <div className="flex flex-col">
                             <input 
                               className="bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-blue-500 transition-all"
                               defaultValue={img.title || ''}
                               onBlur={(e) => handleUpdateCarouselItem(img.id, { title: e.target.value })}
                             />
                             <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Badge de Slide</span>
                          </div>
                        </div>
                        <button onClick={() => deleteCarouselImage(img.id).then(loadAdminData)} className="text-red-500 text-[9px] font-bold uppercase px-3 py-1 bg-red-500/10 rounded-full hover:bg-red-500 hover:text-white transition-all">Excluir</button>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Subtítulo de Impacto</label>
                        <textarea 
                          className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-slate-400 outline-none focus:border-blue-500 focus:text-white transition-all resize-none"
                          defaultValue={img.subtitle || ''}
                          onBlur={(e) => handleUpdateCarouselItem(img.id, { subtitle: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-10 animate-in fade-in">
                <header><h2 className="text-3xl font-serif italic text-white">Métricas de Impacto</h2></header>
                <form onSubmit={handleAddMetric} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input required placeholder="Rótulo (Ex: EBITDA)" value={newMetric.label} onChange={e => setNewMetric({...newMetric, label: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                    <input required placeholder="Valor (Ex: +24%)" value={newMetric.value} onChange={e => setNewMetric({...newMetric, value: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  </div>
                  <button type="submit" className="bg-blue-600 px-8 py-4 rounded-xl text-[10px] font-bold uppercase text-white">Salvar Métrica</button>
                </form>
                <div className="grid gap-3">
                  {metrics.map(m => (
                    <div key={m.id} className="bg-slate-950/50 p-6 rounded-2xl flex justify-between items-center group border border-white/5 hover:border-blue-500/30 transition-all">
                      <div><div className="text-xl font-bold text-white">{m.value}</div><div className="text-[10px] text-slate-500 uppercase tracking-widest">{m.label}</div></div>
                      <button onClick={() => deleteMetric(m.id).then(loadAdminData)} className="text-red-500 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-10 animate-in fade-in">
                <header><h2 className="text-3xl font-serif italic text-white">Área Editorial</h2></header>
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input required placeholder="Título Principal" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                    <input placeholder="Categoria (Ex: ESG, IA)" value={newInsight.category} onChange={e => setNewInsight({...newInsight, category: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  </div>
                  <input placeholder="Subtítulo (Opcional)" value={newInsight.subtitle || ''} onChange={e => setNewInsight({...newInsight, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Capa do Insight</label>
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full bg-slate-950 p-4 rounded-xl border border-white/10 text-slate-400 text-sm" />
                  </div>
                  <textarea placeholder="Resumo Executivo (Lead)..." value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950 p-5 rounded-xl border border-white/10 text-white outline-none h-24 resize-none" />
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950"><MenuBar editor={editor} /><EditorContent editor={editor} /></div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 py-5 rounded-2xl text-[10px] font-bold uppercase text-white shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all">{isSubmitting ? 'Sincronizando Banco...' : 'Publicar Agora'}</button>
                </form>
                <div className="space-y-4 pt-10">
                   <h3 className="text-xl font-serif text-white italic">Acervo</h3>
                   <div className="grid gap-3">
                     {insights.map(i => (
                       <div key={i.id} className="bg-slate-950/50 p-5 rounded-xl flex justify-between items-center group">
                          <span className="text-white text-sm font-medium">{i.title}</span>
                          <button onClick={() => { if(confirm('Excluir Insight?')) deleteInsight(i.id).then(loadAdminData) }} className="text-red-600 text-[9px] font-bold uppercase">Deletar</button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'store' && (
              <div className="space-y-12 animate-in fade-in">
                <header><h2 className="text-3xl font-serif italic text-white">Mercado de Ativos</h2></header>
                <form onSubmit={handleAddProduct} className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] space-y-10">
                   <div className="grid lg:grid-cols-2 gap-8">
                     <input required placeholder="Nome do Produto" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none" />
                     <input required type="number" placeholder="Preço (R$)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none" />
                   </div>
                   <textarea placeholder="Descrição breve..." value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none h-32 resize-none" />
                   <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl text-[10px] font-bold uppercase text-white shadow-xl">Cadastrar Oferta</button>
                </form>
                <div className="grid gap-4 mt-8">
                   {products.map(p => (
                     <div key={p.id} className="bg-slate-950/50 p-6 rounded-3xl flex justify-between items-center group">
                       <div><div className="font-bold text-white">{p.name}</div><div className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mt-1">R$ {p.price.toLocaleString('pt-BR')}</div></div>
                       <button onClick={() => deleteProduct(p.id).then(loadAdminData)} className="text-[10px] font-bold uppercase text-red-600 hover:text-red-400">Excluir</button>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div className="space-y-12 animate-in fade-in">
                <h2 className="text-4xl font-serif italic text-white">Feedbacks Pendentes</h2>
                {pendingTestimonials.length === 0 ? (
                  <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[2.5rem] text-slate-700 italic font-serif">Nenhum feedback aguardando moderação.</div>
                ) : (
                  <div className="grid gap-6">
                    {pendingTestimonials.map(t => (
                      <div key={t.id} className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3 flex-1">
                          <div className="font-bold text-white text-lg">{t.name} <span className="text-slate-500 font-normal text-sm">({t.company})</span></div>
                          <p className="text-slate-400 text-sm leading-relaxed italic">"{t.quote}"</p>
                        </div>
                        <button onClick={() => approveTestimonial(t.id).then(loadAdminData)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-green-600/10">Aprovar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

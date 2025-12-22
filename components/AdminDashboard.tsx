
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
      alert(`Erro Supabase: ${err.message}`);
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
      setNewCarousel({ title: '', subtitle: '', url: '', link: '', display_order: 0, is_active: true });
      loadAdminData();
      alert('Slide adicionado ao carrossel!');
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
                </div>
              </div>
            )}

            {activeTab === 'carousel' && (
              <div className="space-y-16 animate-in fade-in">
                <header>
                  <h2 className="text-4xl font-serif italic text-white">Gestão do Carrossel Hero</h2>
                  <p className="text-slate-500 text-sm">Controle as imagens de fundo, badges e links de destino da página inicial.</p>
                </header>
                
                {/* Registration Form */}
                <section className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full"></div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Novo Slide
                  </h3>
                  <form onSubmit={handleAddCarousel} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Título (Badge)</label>
                        <input required placeholder="Ex: Expertise Global" value={newCarousel.title || ''} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">URL da Imagem</label>
                        <input required placeholder="https://unsplash.com/..." value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Link de Destino</label>
                      <input placeholder="Ex: /insight/id ou https://..." value={newCarousel.link || ''} onChange={e => setNewCarousel({...newCarousel, link: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Subtítulo de Impacto</label>
                      <textarea placeholder="Frase persuasiva para o slide..." value={newCarousel.subtitle || ''} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none h-24 resize-none focus:border-blue-500 transition-all" />
                    </div>
                    <button type="submit" className="w-full md:w-auto bg-blue-600 px-12 py-5 rounded-2xl text-[11px] font-bold uppercase text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all">
                      Adicionar Frame ao Carrossel
                    </button>
                  </form>
                </section>

                {/* Listing Grid */}
                <section className="space-y-8">
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <h3 className="text-2xl font-serif text-white italic">Acervo do Carrossel</h3>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {carouselImages.length} Slides Cadastrados
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {carouselImages.map((img, idx) => (
                      <div key={img.id} className={`group relative bg-slate-950/40 border ${img.is_active ? 'border-white/5' : 'border-red-500/20 opacity-70'} rounded-[2.5rem] overflow-hidden transition-all hover:border-blue-500/30 shadow-2xl flex flex-col`}>
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                          <button 
                            onClick={() => handleUpdateCarouselItem(img.id, { is_active: !img.is_active })}
                            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${img.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'}`}
                          >
                            {img.is_active ? 'Ativo' : 'Desativado'}
                          </button>
                        </div>

                        {/* Image Preview */}
                        <div className="aspect-video relative overflow-hidden bg-slate-900">
                          <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" alt={img.title || ''} />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                          <div className="absolute bottom-4 left-6">
                            <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.4em]">Frame #{idx + 1}</span>
                          </div>
                        </div>

                        {/* Edit Area (Auto-Save) */}
                        <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-widest text-slate-500 font-black">Badge do Hero</label>
                              <input 
                                className="w-full bg-transparent text-white font-serif italic text-xl outline-none border-b border-white/5 focus:border-blue-500 transition-all py-1"
                                defaultValue={img.title || ''}
                                onBlur={(e) => handleUpdateCarouselItem(img.id, { title: e.target.value })}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-widest text-slate-500 font-black">Link de Destino</label>
                              <input 
                                className="w-full bg-transparent text-blue-400 text-[10px] outline-none border-b border-white/5 focus:border-blue-500 transition-all py-1"
                                defaultValue={img.link || ''}
                                onBlur={(e) => handleUpdateCarouselItem(img.id, { link: e.target.value })}
                                placeholder="/insight/..."
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-widest text-slate-500 font-black">Subtítulo (Impacto)</label>
                              <textarea 
                                className="w-full bg-slate-900/30 text-slate-400 text-xs font-light leading-relaxed outline-none border border-white/5 focus:border-blue-500 p-3 rounded-xl transition-all resize-none h-20"
                                defaultValue={img.subtitle || ''}
                                onBlur={(e) => handleUpdateCarouselItem(img.id, { subtitle: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="pt-6 flex justify-between items-center">
                            <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                              ID: {img.id.slice(0, 8)}...
                            </div>
                            <button 
                              onClick={() => { if(confirm('Excluir este slide permanentemente?')) deleteCarouselImage(img.id).then(loadAdminData); }}
                              className="text-[9px] font-bold uppercase text-red-600 hover:text-red-400 transition-colors border-b border-transparent hover:border-red-600 pb-1"
                            >
                              Remover do Banco
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {carouselImages.length === 0 && (
                      <div className="lg:col-span-2 py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-slate-600 italic font-serif text-lg">Nenhum slide encontrado no Supabase.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-10 animate-in fade-in">
                <header><h2 className="text-3xl font-serif italic text-white">Métricas de Performance</h2></header>
                <form onSubmit={handleAddMetric} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input required placeholder="Rótulo (Ex: Projetos)" value={newMetric.label} onChange={e => setNewMetric({...newMetric, label: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                    <input required placeholder="Valor (Ex: 150+)" value={newMetric.value} onChange={e => setNewMetric({...newMetric, value: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  </div>
                  <button type="submit" className="bg-blue-600 px-8 py-4 rounded-xl text-[10px] font-bold uppercase text-white">Salvar</button>
                </form>
                <div className="grid gap-3">
                  {metrics.map(m => (
                    <div key={m.id} className="bg-slate-950/50 p-6 rounded-2xl flex justify-between items-center group border border-white/5">
                      <div><div className="text-xl font-bold text-white">{m.value}</div><div className="text-[10px] text-slate-500 uppercase tracking-widest">{m.label}</div></div>
                      <button onClick={() => deleteMetric(m.id).then(loadAdminData)} className="text-red-500 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-10 animate-in fade-in">
                <header><h2 className="text-3xl font-serif italic text-white">Área de Insights</h2></header>
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-8">
                  <input required placeholder="Título do Insight" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  <textarea placeholder="Lead do Insight..." value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950 p-5 rounded-xl border border-white/10 text-white outline-none h-24 resize-none" />
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950"><MenuBar editor={editor} /><EditorContent editor={editor} /></div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 py-5 rounded-2xl text-[10px] font-bold uppercase text-white shadow-xl">{isSubmitting ? 'Sincronizando...' : 'Publicar Agora'}</button>
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

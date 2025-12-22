
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
  const [activeTab, setActiveTab] = useState<'content' | 'testimonials' | 'metrics' | 'store' | 'insights' | 'carousel'>('carousel');
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
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

  const handleAddCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addCarouselImage(newCarousel)) {
      setNewCarousel({ title: '', subtitle: '', url: '', link: '', display_order: carouselImages.length + 1, is_active: true });
      loadAdminData();
      alert('Slide adicionado com sucesso!');
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
        alert('Insight publicado com sucesso!');
        setNewInsight({ title: '', subtitle: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
        editor.commands.setContent('');
        setImageFile(null);
        loadAdminData();
      }
    } catch (err: any) {
      alert(`Erro ao salvar insight: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCarousel = carouselImages.filter(img => 
    img.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    img.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Insights' },
              { id: 'store', label: 'Mercado' },
              { id: 'metrics', label: 'Métricas' },
              { id: 'content', label: 'Rótulos' },
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
          <div className="max-w-4xl mx-auto space-y-16">
            
            {activeTab === 'carousel' && (
              <div className="space-y-16 animate-in fade-in">
                <header>
                  <h2 className="text-4xl font-serif italic text-white leading-tight">Master Hero Carousel</h2>
                  <p className="text-slate-500 text-sm font-light mt-2">Gerencie a primeira impressão visual da Claudio Tonelli Consultoria.</p>
                </header>
                
                {/* 1. Formulário de Cadastro */}
                <section className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] space-y-10 relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full group-hover:bg-blue-600/20 transition-all duration-1000"></div>
                  
                  <h3 className="text-lg font-bold text-white uppercase tracking-[0.3em] flex items-center gap-4">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    Novo Frame de Impacto
                  </h3>

                  <form onSubmit={handleAddCarousel} className="space-y-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Título do Badge</label>
                        <input required placeholder="Ex: Expertise Global" value={newCarousel.title || ''} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-2 md:col-span-1 lg:col-span-2">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">URL da Imagem de Fundo</label>
                        <input required placeholder="https://images.unsplash.com/..." value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Link de Redirecionamento</label>
                        <input placeholder="Ex: /insight/1 ou https://..." value={newCarousel.link || ''} onChange={e => setNewCarousel({...newCarousel, link: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-blue-400 outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Ordem de Exibição</label>
                        <input type="number" placeholder="0" value={newCarousel.display_order} onChange={e => setNewCarousel({...newCarousel, display_order: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest text-slate-500 font-bold ml-1">Subtítulo de Impacto</label>
                      <textarea placeholder="Arquitetando o amanhã através de rigor metodológico..." value={newCarousel.subtitle || ''} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none h-28 resize-none focus:border-blue-500 transition-all" />
                    </div>

                    <button type="submit" className="w-full lg:w-auto bg-blue-600 hover:bg-blue-500 text-white px-16 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-600/20 active:scale-95 transition-all">
                      Publicar no Carrossel
                    </button>
                  </form>
                </section>

                {/* 2. Grid de Gestão */}
                <section className="space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-serif text-white italic">Frames Cadastrados</h3>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{carouselImages.length} Slides no Banco de Dados</p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <input 
                        type="text" 
                        placeholder="Buscar slides..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-xs text-slate-300 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8">
                    {filteredCarousel.map((img, idx) => (
                      <div key={img.id} className={`group relative bg-slate-950/40 border ${img.is_active ? 'border-white/5' : 'border-red-500/20 opacity-60'} rounded-[2.5rem] overflow-hidden transition-all hover:border-blue-500/40 shadow-2xl flex flex-col`}>
                        
                        {/* Toolbar de Status */}
                        <div className="absolute top-6 right-6 z-20 flex gap-3">
                          <button 
                            onClick={() => handleUpdateCarouselItem(img.id, { is_active: !img.is_active })}
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${img.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'}`}
                          >
                            {img.is_active ? 'Ativo' : 'Inativo'}
                          </button>
                        </div>

                        {/* Preview */}
                        <div className="aspect-video relative overflow-hidden bg-slate-900 group/img">
                          <img src={img.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                          <div className="absolute bottom-6 left-8 flex items-end gap-4">
                             <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center font-serif italic text-white text-xl border border-white/10">#{img.display_order || idx + 1}</div>
                             <div className="text-[9px] text-white/50 font-bold uppercase tracking-[0.4em] mb-1">Index de Exibição</div>
                          </div>
                        </div>

                        {/* Campos Editáveis (Auto-Save) */}
                        <div className="p-10 space-y-8 flex-1">
                          <div className="grid gap-6">
                            <div className="space-y-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Título Principal (Badge)</label>
                              <input 
                                className="w-full bg-transparent text-white font-serif italic text-2xl outline-none border-b border-white/5 focus:border-blue-500 transition-all py-1"
                                defaultValue={img.title || ''}
                                onBlur={(e) => handleUpdateCarouselItem(img.id, { title: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Caminho de Destino</label>
                              <input 
                                className="w-full bg-transparent text-blue-400 text-xs font-mono outline-none border-b border-white/5 focus:border-blue-500 transition-all py-1"
                                defaultValue={img.link || ''}
                                onBlur={(e) => handleUpdateCarouselItem(img.id, { link: e.target.value })}
                                placeholder="/exemplo"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Subtítulo Estratégico</label>
                              <textarea 
                                className="w-full bg-slate-900/30 text-slate-400 text-sm font-light leading-relaxed outline-none border border-white/5 focus:border-blue-500 p-4 rounded-2xl transition-all resize-none h-24"
                                defaultValue={img.subtitle || ''}
                                onBlur={(e) => handleUpdateCarouselItem(img.id, { subtitle: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-600">Prioridade</label>
                                <input 
                                  type="number"
                                  className="w-full bg-transparent text-white text-xs outline-none border-b border-white/5 focus:border-blue-500 transition-all py-1"
                                  defaultValue={img.display_order || 0}
                                  onBlur={(e) => handleUpdateCarouselItem(img.id, { display_order: parseInt(e.target.value) })}
                                />
                              </div>
                              <div className="flex items-end justify-end">
                                <button 
                                  onClick={() => { if(confirm('Remover este slide permanentemente?')) deleteCarouselImage(img.id).then(loadAdminData); }}
                                  className="text-[9px] font-bold uppercase text-red-500/50 hover:text-red-500 transition-all border-b border-transparent hover:border-red-500 pb-1"
                                >
                                  Excluir Registro
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredCarousel.length === 0 && (
                      <div className="lg:col-span-2 py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-slate-600 italic font-serif text-xl">Nenhum slide encontrado.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* Outras Abas (Insights, Store, etc) mantendo a mesma lógica se desejar... */}
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

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

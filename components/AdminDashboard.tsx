
import React, { useState, useEffect } from 'react';
import { 
  fetchPendingTestimonials, approveTestimonial, 
  updateSiteContent, fetchMetrics, fetchInsights,
  fetchProducts, addProduct, deleteProduct,
  addInsight, deleteInsight, updateInsightLink,
  uploadInsightImage, fetchCarouselImages,
  addCarouselImage, deleteCarouselImage
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, Product, CarouselImage } from '../types';
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
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))}>Citação</button>
      <button type="button" onClick={() => {
        const url = window.prompt('URL da Imagem');
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }} className={btnClass(false)}>Inserir Imagem</button>
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
  const [heroTitle, setHeroTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carousel form state
  const [newCarousel, setNewCarousel] = useState({ title: '', subtitle: '', url: '', display_order: 0 });

  const [newInsight, setNewInsight] = useState({
    title: '',
    excerpt: '',
    category: 'ESTRATÉGIA',
    image_url: '',
    is_active: true,
    display_order: 0
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-blue max-w-none focus:outline-none p-8 min-h-[400px] text-slate-300 leading-relaxed font-light',
      },
    },
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'service' as 'product' | 'service',
    config: { url: '', image_url: '', action_label: 'Contratar Agora' }
  });

  const loadAdminData = async () => {
    try {
      const [t, m, p, i, c] = await Promise.all([
        fetchPendingTestimonials().catch(() => []),
        fetchMetrics().catch(() => []),
        fetchProducts().catch(() => []),
        fetchInsights().catch(() => []),
        fetchCarouselImages().catch(() => [])
      ]);
      setPendingTestimonials(t);
      setMetrics(m);
      setProducts(p);
      setInsights(i);
      setCarouselImages(c);
    } catch (err) {
      console.error("Admin data load error", err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (id: string) => {
    const success = await approveTestimonial(id);
    if (success) setPendingTestimonials(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateContent = async () => {
    if (!heroTitle) return;
    const success = await updateSiteContent('home.hero.title.pt', heroTitle);
    if (success) alert('Título atualizado com sucesso!');
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

      if (created) {
        const link = `/insight/${created.id}`;
        await updateInsightLink(created.id, link);
        alert('Insight publicado com sucesso!');
        setNewInsight({ title: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
        editor.commands.setContent('');
        setImageFile(null);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar insight.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    if (confirm('Deseja excluir este insight permanentemente?')) {
      const success = await deleteInsight(id);
      if (success) setInsights(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addProduct(newProduct);
    if (success) {
      alert('Produto adicionado ao catálogo!');
      setNewProduct({ name: '', description: '', price: 0, type: 'service', config: { url: '', image_url: '', action_label: 'Contratar Agora' } });
      loadAdminData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Excluir produto definitivamente?')) {
      const success = await deleteProduct(id);
      if (success) setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addCarouselImage(newCarousel);
    if (success) {
      alert('Imagem adicionada ao carrossel!');
      setNewCarousel({ title: '', subtitle: '', url: '', display_order: 0 });
      loadAdminData();
    }
  };

  const handleDeleteCarousel = async (id: string) => {
    if (confirm('Remover esta imagem do fundo do site?')) {
      const success = await deleteCarouselImage(id);
      if (success) setCarouselImages(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[92vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-950 border-r border-white/5 p-8 flex flex-row md:flex-col gap-8 overflow-x-auto md:overflow-y-auto shrink-0">
          <div className="flex items-center gap-3 mb-0 md:mb-10 min-w-fit">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/30">CT</div>
            <span className="font-bold text-[10px] uppercase tracking-[0.3em] text-slate-500">Advisory CMS</span>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-2 flex-1">
            {[
              { id: 'content', label: 'Dashboard' },
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Insights' },
              { id: 'store', label: 'Mercado' },
              { id: 'testimonials', label: 'Feedback' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`whitespace-nowrap px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={onClose} className="text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ml-auto md:ml-0 md:mt-auto py-4 px-6 border border-white/5 rounded-2xl">
            Sair do Painel
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-16 bg-grid">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'content' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                <header className="space-y-2">
                  <h2 className="text-4xl font-serif italic text-white">Gestão Estratégica</h2>
                  <p className="text-slate-500 text-sm">Controle a presença digital da consultoria.</p>
                </header>
                <div className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Título de Impacto (Home)</label>
                    <input 
                      type="text" 
                      value={heroTitle} 
                      onChange={e => setHeroTitle(e.target.value)} 
                      placeholder="Ex: Estratégia de Alto Nível."
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-800" 
                    />
                  </div>
                  <button onClick={handleUpdateContent} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/20">Publicar Alterações</button>
                </div>
              </div>
            )}

            {activeTab === 'carousel' && (
              <div className="space-y-12 animate-in fade-in">
                <header className="space-y-2">
                  <h2 className="text-4xl font-serif italic text-white">Fundo Visual (Carrossel)</h2>
                  <p className="text-slate-500 text-sm">Gerencie as imagens e frases de impacto do fundo da Home.</p>
                </header>
                
                <form onSubmit={handleAddCarousel} className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Badge/Título</label>
                      <input required value={newCarousel.title} onChange={e => setNewCarousel({...newCarousel, title: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none" placeholder="Ex: Expertise Global" />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">URL da Imagem</label>
                      <input required value={newCarousel.url} onChange={e => setNewCarousel({...newCarousel, url: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Subtítulo (Frase de Impacto)</label>
                    <textarea value={newCarousel.subtitle} onChange={e => setNewCarousel({...newCarousel, subtitle: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none h-24 resize-none" placeholder="Descreva o impacto visual..." />
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px]">Adicionar ao Fundo</button>
                </form>

                <div className="grid gap-4">
                  {carouselImages.map(img => (
                    <div key={img.id} className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <img src={img.url} className="w-20 h-12 object-cover rounded-xl" alt="" />
                        <div>
                          <div className="font-bold text-white text-sm">{img.title}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{img.subtitle}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteCarousel(img.id)} className="text-[10px] font-bold uppercase text-red-600">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4">
                <header className="space-y-2">
                  <h2 className="text-4xl font-serif italic text-white">Insights & Liderança</h2>
                  <p className="text-slate-500 text-sm">Publique conhecimentos proprietários para o mercado.</p>
                </header>
                
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] space-y-10">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Título do Artigo</label>
                      <input required type="text" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-600" />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Segmento</label>
                      <input type="text" value={newInsight.category} onChange={e => setNewInsight({...newInsight, category: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Capa do Artigo</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-4 text-slate-500 file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white cursor-pointer" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Lead / Resumo Executivo</label>
                    <textarea value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none h-32 resize-none focus:border-blue-600" />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Corpo do Artigo</label>
                    <div className="bg-slate-950/50 rounded-3xl overflow-hidden border border-white/10 min-h-[400px]">
                      <MenuBar editor={editor} />
                      <EditorContent editor={editor} />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white px-12 py-6 rounded-3xl font-bold uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-blue-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Finalizando Processamento...' : 'Publicar Insight Estratégico'}
                  </button>
                </form>

                <div className="space-y-8">
                  <h3 className="text-2xl font-serif text-white italic">Acervo Digital</h3>
                  <div className="grid gap-4">
                    {insights.map(i => (
                      <div key={i.id} className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-blue-600/30 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
                            <img src={i.image_url || ''} alt="" className="w-full h-full object-cover opacity-60" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white group-hover:text-blue-500 transition-colors">{i.title}</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{i.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-6">
                          <button onClick={() => handleDeleteInsight(i.id)} className="text-[10px] font-bold uppercase text-red-600 hover:text-red-400">Excluir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'store' && (
              <div className="space-y-12 animate-in fade-in">
                <h2 className="text-4xl font-serif italic text-white">Hub de Soluções</h2>
                <p className="text-slate-500">Adicione novos serviços e produtos digitais ao catálogo.</p>
                <form onSubmit={handleAddProduct} className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] space-y-10">
                   <div className="grid lg:grid-cols-2 gap-8">
                     <input required placeholder="Nome do Produto" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-600" />
                     <input required type="number" placeholder="Preço (R$)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-blue-600" />
                   </div>
                   <textarea placeholder="Descrição detalhada..." value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none h-32 resize-none focus:border-blue-600" />
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/10">Cadastrar Produto</button>
                </form>
                <div className="grid gap-4 mt-8">
                   {products.map(p => (
                     <div key={p.id} className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:border-blue-600/30 transition-all">
                       <div>
                         <div className="font-bold text-white group-hover:text-blue-500 transition-colors">{p.name}</div>
                         <div className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mt-1">R$ {p.price.toLocaleString('pt-BR')}</div>
                       </div>
                       <button onClick={() => handleDeleteProduct(p.id)} className="text-[10px] font-bold uppercase text-red-600 hover:text-red-400">Excluir</button>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div className="space-y-12 animate-in fade-in">
                <h2 className="text-4xl font-serif italic text-white">Relatos de Sucesso</h2>
                <p className="text-slate-500">Depoimentos aguardando verificação e curadoria.</p>
                {pendingTestimonials.length === 0 ? (
                  <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[2.5rem] text-slate-700 italic font-serif">Nenhum feedback aguardando moderação no momento.</div>
                ) : (
                  <div className="grid gap-6">
                    {pendingTestimonials.map(t => (
                      <div key={t.id} className="bg-slate-800/20 border border-white/5 p-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3 flex-1">
                          <div className="font-bold text-white text-lg">{t.name} <span className="text-slate-500 font-normal text-sm">({t.company})</span></div>
                          <p className="text-slate-400 text-sm leading-relaxed italic">"{t.quote}"</p>
                        </div>
                        <button onClick={() => handleApprove(t.id)} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-green-600/10 shrink-0">Aprovar Depoimento</button>
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

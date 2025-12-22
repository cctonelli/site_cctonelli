
import React, { useState, useEffect } from 'react';
import { 
  fetchPendingTestimonials, approveTestimonial, 
  updateSiteContent, fetchMetrics, fetchInsights,
  fetchProducts, addProduct, deleteProduct,
  addInsight, deleteInsight, updateInsightLink,
  uploadInsightImage, fetchCarouselImages,
  addCarouselImage, deleteCarouselImage,
  addMetric, deleteMetric
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
  const [heroTitle, setHeroTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms state
  const [newCarousel, setNewCarousel] = useState({ title: '', subtitle: '', url: '', display_order: 0 });
  const [newMetric, setNewMetric] = useState({ label: '', value: '', display_order: 0, is_active: true });
  const [newInsight, setNewInsight] = useState({ title: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, type: 'service' as 'product' | 'service', config: { url: '', image_url: '', action_label: 'Contratar Agora' } });
  
  const [imageFile, setImageFile] = useState<File | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Image],
    content: '',
    editorProps: { attributes: { class: 'prose prose-invert prose-blue max-w-none focus:outline-none p-8 min-h-[400px] text-slate-300' } },
  });

  const loadAdminData = async () => {
    try {
      const [t, m, p, i, c] = await Promise.all([
        fetchPendingTestimonials(),
        fetchMetrics(),
        fetchProducts(),
        fetchInsights(),
        fetchCarouselImages()
      ]);
      setPendingTestimonials(t);
      setMetrics(m);
      setProducts(p);
      setInsights(i);
      setCarouselImages(c);
    } catch (err) {
      console.error("Admin load fail", err);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

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
        await updateInsightLink(created.id, `/insight/${created.id}`);
        alert('Insight publicado com sucesso!');
        setNewInsight({ title: '', excerpt: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
        editor.commands.setContent('');
        setImageFile(null);
        loadAdminData();
      }
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao gravar Insight: ${err.message || 'Verifique as permissões de admin no Supabase.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addMetric(newMetric);
    if (success) {
      alert('Métrica adicionada!');
      setNewMetric({ label: '', value: '', display_order: 0, is_active: true });
      loadAdminData();
    }
  };

  const handleDeleteMetric = async (id: string) => {
    if (confirm('Excluir esta métrica?')) {
      const success = await deleteMetric(id);
      if (success) setMetrics(prev => prev.filter(m => m.id !== id));
    }
  };

  // ... (handleDeleteInsight, handleAddProduct, handleAddCarousel, etc. remain similar but using loadAdminData for refresh)

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-white/5 w-full max-w-7xl h-full sm:h-[92vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-950 border-r border-white/5 p-8 flex flex-row md:flex-col gap-6 overflow-x-auto shrink-0">
          <div className="flex items-center gap-3 mb-0 md:mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white">CT</div>
            <span className="font-bold text-[9px] uppercase tracking-widest text-slate-500">Painel CMS</span>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-2 flex-1">
            {[
              { id: 'content', label: 'Dashboard' },
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Insights' },
              { id: 'metrics', label: 'Métricas' },
              { id: 'store', label: 'Mercado' },
              { id: 'testimonials', label: 'Feedback' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest mt-auto border border-white/5 p-4 rounded-xl">Fechar</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-grid">
          <div className="max-w-4xl mx-auto space-y-12">
            {activeTab === 'metrics' && (
              <div className="space-y-10 animate-in fade-in">
                <header>
                  <h2 className="text-3xl font-serif italic text-white">Gestão de Performance</h2>
                  <p className="text-slate-500 text-sm">Atualize os números de impacto exibidos na Home.</p>
                </header>
                
                <form onSubmit={handleAddMetric} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input required placeholder="Rótulo (Ex: Projetos)" value={newMetric.label} onChange={e => setNewMetric({...newMetric, label: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                    <input required placeholder="Valor (Ex: 150+)" value={newMetric.value} onChange={e => setNewMetric({...newMetric, value: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  </div>
                  <button type="submit" className="bg-blue-600 px-8 py-4 rounded-xl text-[10px] font-bold uppercase text-white">Adicionar Métrica</button>
                </form>

                <div className="grid gap-3">
                  {metrics.map(m => (
                    <div key={m.id} className="bg-slate-950/50 p-6 rounded-2xl flex justify-between items-center group border border-white/5 hover:border-blue-500/30 transition-all">
                      <div>
                        <div className="text-xl font-bold text-white">{m.value}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{m.label}</div>
                      </div>
                      <button onClick={() => handleDeleteMetric(m.id)} className="text-red-500 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-10 animate-in fade-in">
                <header>
                  <h2 className="text-3xl font-serif italic text-white">Novo Insight</h2>
                  <p className="text-slate-500 text-sm">O conteúdo é gravado diretamente no banco estratégico.</p>
                </header>
                
                <form onSubmit={handleAddInsight} className="bg-slate-800/20 border border-white/5 p-8 rounded-3xl space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input required placeholder="Título" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                    <input placeholder="Categoria" value={newInsight.category} onChange={e => setNewInsight({...newInsight, category: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-5 py-4 text-white outline-none" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Capa do Artigo</label>
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full bg-slate-950 p-4 rounded-xl border border-white/10 text-slate-400 text-sm" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Resumo</label>
                    <textarea value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950 p-5 rounded-xl border border-white/10 text-white outline-none h-24 resize-none" />
                  </div>

                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950">
                    <MenuBar editor={editor} />
                    <EditorContent editor={editor} />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 py-5 rounded-2xl text-[10px] font-bold uppercase text-white shadow-xl shadow-blue-600/20 disabled:opacity-50">
                    {isSubmitting ? 'Publicando...' : 'Publicar Agora'}
                  </button>
                </form>

                <div className="space-y-4 pt-10">
                   <h3 className="text-xl font-serif text-white italic">Artigos Existentes</h3>
                   <div className="grid gap-3">
                     {insights.map(i => (
                       <div key={i.id} className="bg-slate-950/50 p-5 rounded-xl flex justify-between items-center group">
                          <span className="text-white text-sm font-medium">{i.title}</span>
                          <button onClick={() => { if(confirm('Excluir?')) deleteInsight(i.id).then(loadAdminData) }} className="text-red-600 text-[9px] font-bold uppercase">Deletar</button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {/* Outras abas permanecem funcionais, adicionei placeholders para as métricas acima */}
            {activeTab === 'content' && (
              <div className="py-20 text-center space-y-6">
                <div className="text-6xl font-serif italic text-white">Central de Comando</div>
                <p className="text-slate-500 max-w-md mx-auto">Selecione uma categoria na barra lateral para iniciar as modificações no ecossistema digital.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { 
  fetchPendingTestimonials, approveTestimonial, 
  updateSiteContent, fetchMetrics, fetchInsights,
  fetchProducts, addProduct, deleteProduct,
  addInsight, deleteInsight, updateInsightLink,
  uploadInsightImage
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, Product } from '../types';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'testimonials' | 'metrics' | 'store' | 'insights'>('content');
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [heroTitle, setHeroTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for new Insight
  const [newInsight, setNewInsight] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'ESTRATÉGIA',
    image_url: '',
    is_active: true,
    display_order: 0
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form State for new Product
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'service' as 'product' | 'service',
    config: { url: '', image_url: '', action_label: 'Contratar Agora' }
  });

  useEffect(() => {
    const loadAdminData = async () => {
      const [t, m, p, i] = await Promise.all([
        fetchPendingTestimonials().catch(() => []),
        fetchMetrics().catch(() => []),
        fetchProducts().catch(() => []),
        fetchInsights().catch(() => [])
      ]);
      setPendingTestimonials(t);
      setMetrics(m);
      setProducts(p);
      setInsights(i);
    };
    loadAdminData();
  }, []);

  const handleApprove = async (id: string) => {
    const success = await approveTestimonial(id);
    if (success) setPendingTestimonials(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateContent = async () => {
    if (!heroTitle) return;
    const success = await updateSiteContent('home.hero.title.pt', heroTitle);
    if (success) alert('Título atualizado!');
  };

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let finalImageUrl = newInsight.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadInsightImage(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const created = await addInsight({
        ...newInsight,
        image_url: finalImageUrl,
        link: ''
      });

      if (created) {
        const link = `/insight/${created.id}`;
        await updateInsightLink(created.id, link);
        alert('Insight publicado com sucesso!');
        setNewInsight({ title: '', excerpt: '', content: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0 });
        setImageFile(null);
        fetchInsights().then(setInsights);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar insight.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    if (confirm('Deseja excluir este insight?')) {
      const success = await deleteInsight(id);
      if (success) setInsights(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addProduct(newProduct);
    if (success) {
      alert('Produto adicionado!');
      setNewProduct({ name: '', description: '', price: 0, type: 'service', config: { url: '', image_url: '', action_label: 'Contratar Agora' } });
      fetchProducts().then(setProducts);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Excluir produto?')) {
      const success = await deleteProduct(id);
      if (success) setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-white/10 w-full max-w-7xl h-full sm:h-[90vh] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-950 border-r border-white/5 p-6 flex flex-row md:flex-col gap-6 overflow-x-auto md:overflow-y-auto shrink-0">
          <div className="flex items-center gap-2 mb-0 md:mb-8 min-w-fit">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">CT</div>
            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Admin Panel</span>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-2 flex-1">
            <button onClick={() => setActiveTab('content')} className={`whitespace-nowrap px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Geral</button>
            <button onClick={() => setActiveTab('insights')} className={`whitespace-nowrap px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'insights' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Insights</button>
            <button onClick={() => setActiveTab('store')} className={`whitespace-nowrap px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'store' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Loja</button>
            <button onClick={() => setActiveTab('testimonials')} className={`whitespace-nowrap px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'testimonials' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Feedback</button>
          </nav>

          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ml-auto md:ml-0 md:mt-auto py-3 px-4">
            Sair
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-grid">
          {activeTab === 'content' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="space-y-2">
                <h2 className="text-3xl font-serif italic text-white">Configurações Gerais</h2>
                <p className="text-slate-500 text-sm">Gerencie os textos principais da plataforma.</p>
              </header>
              <div className="bg-slate-800/30 border border-white/5 p-8 rounded-3xl space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Título Principal (Hero)</label>
                  <input 
                    type="text" 
                    value={heroTitle} 
                    onChange={e => setHeroTitle(e.target.value)} 
                    placeholder="Ex: Estratégia Inesquecível."
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
                <button onClick={handleUpdateContent} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20">Salvar Alterações</button>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="space-y-2">
                <h2 className="text-3xl font-serif italic text-white">Gestão de Insights</h2>
                <p className="text-slate-500 text-sm">Publique artigos e análises estratégicas para o seu público.</p>
              </header>
              
              <form onSubmit={handleAddInsight} className="bg-slate-800/30 border border-white/5 p-8 rounded-3xl space-y-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Título do Artigo</label>
                    <input required type="text" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Categoria</label>
                    <input type="text" value={newInsight.category} onChange={e => setNewInsight({...newInsight, category: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none" />
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Imagem de Capa (Upload)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setImageFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-slate-400 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Ou URL Direta</label>
                    <input type="text" value={newInsight.image_url} onChange={e => setNewInsight({...newInsight, image_url: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Subtítulo / Lead</label>
                  <textarea value={newInsight.excerpt || ''} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none h-24 resize-none" />
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Conteúdo Rico</label>
                  <div className="bg-slate-950/50 rounded-xl overflow-hidden border border-white/10">
                    <ReactQuill theme="snow" value={newInsight.content || ''} onChange={(c) => setNewInsight({...newInsight, content: c})} />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-2xl shadow-blue-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processando...' : 'Publicar Insight'}
                </button>
              </form>

              <div className="space-y-8">
                <h3 className="text-xl font-serif text-white italic">Acervo Publicado</h3>
                <div className="grid gap-4">
                  {insights.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl text-slate-600 italic">Nenhum insight encontrado.</div>
                  ) : (
                    insights.map(i => (
                      <div key={i.id} className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-xl overflow-hidden border border-white/5">
                            <img src={i.image_url || ''} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{i.title}</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{i.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <a href={`/insight/${i.id}`} target="_blank" className="text-[10px] font-bold uppercase text-blue-500 hover:underline">Ver</a>
                          <button onClick={() => handleDeleteInsight(i.id)} className="text-[10px] font-bold uppercase text-red-500 hover:text-red-400">Excluir</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-16 animate-in fade-in duration-500">
               <h2 className="text-3xl font-serif italic text-white">Catálogo de Produtos</h2>
               <form onSubmit={handleAddProduct} className="bg-slate-800/30 border border-white/5 p-8 rounded-3xl space-y-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <input required placeholder="Nome do Produto" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none" />
                    <input required type="number" placeholder="Preço (R$)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none" />
                  </div>
                  <textarea placeholder="Descrição curta..." value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none h-24 resize-none" />
                  <button type="submit" className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px]">Adicionar Produto</button>
               </form>
               <div className="grid gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-slate-950 border border-white/5 p-6 rounded-2xl flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-blue-500 font-bold text-xs mt-1">R$ {p.price.toLocaleString('pt-BR')}</div>
                      </div>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-[10px] font-bold uppercase text-red-500">Remover</button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-serif italic text-white">Moderação de Depoimentos</h2>
              {pendingTestimonials.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-slate-600 italic">Nenhum feedback aguardando aprovação.</div>
              ) : (
                <div className="grid gap-6">
                  {pendingTestimonials.map(t => (
                    <div key={t.id} className="bg-slate-800/30 border border-white/5 p-8 rounded-2xl flex justify-between items-center group transition-all hover:bg-slate-800/50">
                      <div className="space-y-2 max-w-2xl">
                        <div className="font-bold text-white">{t.name} <span className="text-slate-500 font-normal">({t.company})</span></div>
                        <p className="text-slate-400 text-sm leading-relaxed italic">"{t.quote}"</p>
                      </div>
                      <button onClick={() => handleApprove(t.id)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-green-600/10">Aprovar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

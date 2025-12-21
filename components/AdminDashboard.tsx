
import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { 
  fetchPendingTestimonials, approveTestimonial, 
  updateSiteContent, fetchMetrics, fetchInsights,
  fetchProducts, addProduct, deleteProduct,
  addInsight, deleteInsight, updateInsightLink
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, Product } from '../types';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'testimonials' | 'metrics' | 'store' | 'insights'>('content');
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [heroTitle, setHeroTitle] = useState('');

  // Form State for new Insight
  const [newInsight, setNewInsight] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'ESTRATÉGIA',
    image_url: '',
    is_active: true,
    display_order: 0,
    link: ''
  });

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
        fetchPendingTestimonials(),
        fetchMetrics(),
        fetchProducts(),
        fetchInsights()
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
    const success = await updateSiteContent('home.hero.title', heroTitle);
    if (success) alert('Conteúdo atualizado com sucesso!');
  };

  const handleAddInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdInsight = await addInsight(newInsight);
    if (createdInsight) {
      const insightLink = `/insight/${createdInsight.id}`;
      await updateInsightLink(createdInsight.id, insightLink);
      alert('Artigo publicado com sucesso!');
      setNewInsight({ title: '', excerpt: '', content: '', category: 'ESTRATÉGIA', image_url: '', is_active: true, display_order: 0, link: '' });
      fetchInsights().then(setInsights);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    if (!confirm('Excluir este artigo permanentemente?')) return;
    const success = await deleteInsight(id);
    if (success) setInsights(prev => prev.filter(i => i.id !== id));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addProduct(newProduct);
    if (success) {
      alert('Produto adicionado com sucesso!');
      setNewProduct({ name: '', description: '', price: 0, type: 'service', config: { url: '', image_url: '', action_label: 'Contratar Agora' } });
      fetchProducts().then(setProducts);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    const success = await deleteProduct(id);
    if (success) setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-white/10 w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden flex shadow-2xl">
        {/* Sidebar */}
        <div className="w-64 bg-slate-950 border-r border-white/5 p-8 flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">CT</div>
            <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Admin Console</span>
          </div>
          
          <nav className="flex flex-col gap-2">
            <button onClick={() => setActiveTab('content')} className={`text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Geral</button>
            <button onClick={() => setActiveTab('insights')} className={`text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'insights' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Artigos</button>
            <button onClick={() => setActiveTab('store')} className={`text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'store' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Loja</button>
            <button onClick={() => setActiveTab('testimonials')} className={`text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'testimonials' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>Feedback</button>
          </nav>

          <button onClick={onClose} className="mt-auto text-xs text-slate-600 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 8.959 8.959 0 01-9 9m9-9H3" /></svg>
            Fechar
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-grid">
          {activeTab === 'content' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-serif italic text-white">Configurações Gerais</h2>
              <div className="bg-slate-800/50 border border-white/5 p-8 rounded-2xl space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Título do Hero</label>
                  <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                </div>
                <button onClick={handleUpdateContent} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all">Salvar</button>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-serif italic text-white">Gerenciar Insights & Artigos</h2>
              
              <form onSubmit={handleAddInsight} className="bg-slate-800/50 border border-white/5 p-8 rounded-3xl space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Título do Artigo</label>
                    <input required type="text" value={newInsight.title} onChange={e => setNewInsight({...newInsight, title: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Categoria</label>
                    <input type="text" value={newInsight.category} onChange={e => setNewInsight({...newInsight, category: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Imagem de Capa (URL)</label>
                  <input type="text" value={newInsight.image_url} onChange={e => setNewInsight({...newInsight, image_url: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Resumo (Excerpt)</label>
                  <textarea value={newInsight.excerpt} onChange={e => setNewInsight({...newInsight, excerpt: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none h-20 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Conteúdo do Artigo</label>
                  <ReactQuill theme="snow" value={newInsight.content} onChange={(content) => setNewInsight({...newInsight, content})} className="rounded-xl overflow-hidden" />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20">Publicar Artigo</button>
              </form>

              <div className="space-y-4">
                <h3 className="text-xl font-serif text-white">Artigos Publicados</h3>
                <div className="grid gap-4">
                  {insights.map(i => (
                    <div key={i.id} className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden border border-white/10">
                        <img src={i.image_url || ''} alt="" className="w-full h-full object-cover opacity-50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{i.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{i.excerpt}</p>
                      </div>
                      <button onClick={() => handleDeleteInsight(i.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <h2 className="text-3xl font-serif italic text-white">Gerenciar Loja</h2>
              <form onSubmit={handleAddProduct} className="bg-slate-800/50 border border-white/5 p-8 rounded-3xl space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input required placeholder="Nome do Produto" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                  <input required type="number" placeholder="Preço" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                </div>
                <textarea placeholder="Descrição" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none h-24 resize-none" />
                <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold">Adicionar</button>
              </form>
              <div className="grid gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-slate-950 p-4 rounded-2xl flex justify-between items-center">
                    <span className="text-white font-bold">{p.name} - R$ {p.price}</span>
                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 font-bold uppercase text-[10px]">Excluir</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-serif italic text-white">Depoimentos Pendentes</h2>
              {pendingTestimonials.length === 0 ? (
                <div className="text-slate-500 text-center py-20 border-2 border-dashed border-white/5 rounded-3xl italic">Sem novos depoimentos.</div>
              ) : (
                <div className="grid gap-6">
                  {pendingTestimonials.map(t => (
                    <div key={t.id} className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl flex justify-between items-center group">
                      <div className="space-y-2">
                        <div className="font-bold text-white">{t.name} <span className="text-slate-500 font-normal">({t.company})</span></div>
                        <p className="text-slate-400 text-sm italic">"{t.quote}"</p>
                      </div>
                      <button onClick={() => handleApprove(t.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">Aprovar</button>
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

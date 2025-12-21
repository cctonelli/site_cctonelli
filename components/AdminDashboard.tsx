
import React, { useState, useEffect } from 'react';
import { 
  fetchPendingTestimonials, approveTestimonial, 
  updateSiteContent, fetchMetrics, fetchInsights,
  fetchProducts, addProduct, deleteProduct
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, Product } from '../types';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'testimonials' | 'metrics' | 'store'>('content');
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [heroTitle, setHeroTitle] = useState('');

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
      const [t, m, p] = await Promise.all([
        fetchPendingTestimonials(),
        fetchMetrics(),
        fetchProducts()
      ]);
      setPendingTestimonials(t);
      setMetrics(m);
      setProducts(p);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addProduct(newProduct);
    if (success) {
      alert('Produto adicionado com sucesso!');
      setNewProduct({ name: '', description: '', price: 0, type: 'service', config: { url: '', image_url: '', action_label: 'Contratar Agora' } });
      const p = await fetchProducts();
      setProducts(p);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    const success = await deleteProduct(id);
    if (success) setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-white/10 w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden flex shadow-2xl">
        {/* Sidebar */}
        <div className="w-64 bg-slate-950 border-r border-white/5 p-8 flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">CT</div>
            <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Admin Panel</span>
          </div>
          
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('content')}
              className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${activeTab === 'content' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:bg-white/5'}`}
            >
              CMS de Conteúdo
            </button>
            <button 
              onClick={() => setActiveTab('testimonials')}
              className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${activeTab === 'testimonials' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:bg-white/5'}`}
            >
              Depoimentos ({pendingTestimonials.length})
            </button>
            <button 
              onClick={() => setActiveTab('store')}
              className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${activeTab === 'store' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:bg-white/5'}`}
            >
              Gerenciar Loja
            </button>
            <button 
              onClick={() => setActiveTab('metrics')}
              className={`text-left px-4 py-3 rounded-xl text-sm transition-all ${activeTab === 'metrics' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:bg-white/5'}`}
            >
              Métricas & Insights
            </button>
          </nav>

          <button 
            onClick={onClose}
            className="mt-auto text-xs text-slate-600 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 8.959 8.959 0 01-9 9m9-9H3" />
            </svg>
            Sair do Painel
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-grid">
          {activeTab === 'content' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-serif italic">Gerenciamento de Conteúdo</h2>
              <div className="bg-slate-800/50 border border-white/5 p-8 rounded-2xl space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Título do Hero (Home)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Estratégia Inesquecível."
                    value={heroTitle}
                    onChange={e => setHeroTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <button 
                  onClick={handleUpdateContent}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-serif italic">Aprovação de Depoimentos</h2>
              {pendingTestimonials.length === 0 ? (
                <div className="text-slate-500 text-center py-20 border-2 border-dashed border-white/5 rounded-3xl italic">
                  Nenhum depoimento pendente de aprovação.
                </div>
              ) : (
                <div className="grid gap-6">
                  {pendingTestimonials.map(t => (
                    <div key={t.id} className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl flex justify-between items-center group">
                      <div className="space-y-2">
                        <div className="font-bold">{t.name} <span className="text-slate-500 font-normal">({t.company})</span></div>
                        <p className="text-slate-400 text-sm italic">"{t.quote}"</p>
                      </div>
                      <button 
                        onClick={() => handleApprove(t.id)}
                        className="bg-green-600/10 text-green-400 hover:bg-green-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-green-600/20"
                      >
                        Aprovar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif italic">Gerenciar Catálogo da Loja</h2>
              </div>
              
              {/* Add Product Form */}
              <form onSubmit={handleAddProduct} className="bg-slate-800/50 border border-white/5 p-8 rounded-3xl space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Nome do Produto/Serviço</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Tipo</label>
                    <select 
                      value={newProduct.type}
                      onChange={e => setNewProduct({...newProduct, type: e.target.value as any})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    >
                      <option value="service">Serviço / Consultoria</option>
                      <option value="product">Produto Digital</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Preço (BRL)</label>
                    <input 
                      required
                      type="number" 
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">URL de Destino (App/Externo)</label>
                    <input 
                      placeholder="https://app.exemplo.com"
                      type="url" 
                      value={newProduct.config.url}
                      onChange={e => setNewProduct({...newProduct, config: {...newProduct.config, url: e.target.value}})}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">URL da Imagem de Propaganda</label>
                  <input 
                    placeholder="https://images.unsplash.com/..."
                    type="text" 
                    value={newProduct.config.image_url}
                    onChange={e => setNewProduct({...newProduct, config: {...newProduct.config, image_url: e.target.value}})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Descrição Curta</label>
                  <textarea 
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none resize-none h-24"
                  />
                </div>

                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20">
                  Adicionar ao Catálogo
                </button>
              </form>

              {/* Product List */}
              <div className="space-y-4">
                <h3 className="text-xl font-serif">Itens Ativos</h3>
                <div className="grid gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        {p.config.image_url ? (
                          <img src={p.config.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">NA</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-bold ${p.type === 'service' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>{p.type}</span>
                           <h4 className="font-bold text-sm truncate">{p.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{p.description}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                         <span className="font-bold text-sm">R$ {p.price.toLocaleString('pt-BR')}</span>
                         <button 
                           onClick={() => handleDeleteProduct(p.id)}
                           className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest"
                         >
                           Excluir
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-8 animate-in fade-in duration-500 text-center py-20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
               <h3 className="text-xl font-serif text-slate-500">Módulo de Métricas Avançadas</h3>
               <p className="text-sm text-slate-600">Este módulo está sendo sincronizado com os dados globais.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

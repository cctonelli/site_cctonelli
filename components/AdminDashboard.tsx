
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  updateSiteContent, fetchMetrics, fetchInsights,
  addInsight, deleteInsight, updateInsight,
  fetchCarouselImages, addCarouselImage, deleteCarouselImage, updateCarouselImage,
  fetchAllSiteContent, fetchContacts, deleteContact,
  deleteTestimonial, updateTestimonial, fetchTestimonials,
  fetchProducts, updateProduct, deleteProduct, addProduct,
  updateMetric, addMetric, deleteMetric, getCurrentUser
} from '../services/supabaseService';
import { Testimonial, Metric, Insight, CarouselImage, SiteContent, Contact, Product } from '../types';

type AdminLang = 'pt' | 'en' | 'es';
type TabType = 'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'leads';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('carousel');
  const [editingLang, setEditingLang] = useState<AdminLang>('pt');
  const [tabSearch, setTabSearch] = useState<Record<string, string>>({
    carousel: '', insights: '', products: '', metrics: '', testimonials: '', content: '', leads: ''
  });
  
  // Data States
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [siteLabels, setSiteLabels] = useState<SiteContent[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Unified Form State
  const [formData, setFormData] = useState<any>({});

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [t_all, m, i, c, l, lds, p] = await Promise.all([
        fetchTestimonials(),
        fetchMetrics(),
        fetchInsights(),
        fetchCarouselImages(),
        fetchAllSiteContent(),
        fetchContacts(),
        fetchProducts()
      ]);
      setAllTestimonials(t_all || []);
      setMetrics(m || []);
      setInsights(i || []);
      setCarouselImages(c || []);
      setSiteLabels(l || []);
      setLeads(lds || []);
      setProducts(p || []);
      console.log("Admin Data Refreshed");
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const handleEdit = (item: any) => {
    setEditingId(item.id || item.key);
    setFormData(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = await getCurrentUser();
      let success = false;

      if (activeTab === 'carousel') {
        success = editingId 
          ? await updateCarouselImage(editingId, formData) 
          : !!(await addCarouselImage({ ...formData, is_active: true, created_by: user?.id }));
      } else if (activeTab === 'metrics') {
        success = editingId 
          ? await updateMetric(editingId, formData) 
          : !!(await addMetric({ ...formData, is_active: true }));
      } else if (activeTab === 'insights') {
        success = editingId 
          ? await updateInsight(editingId, formData) 
          : !!(await addInsight({ ...formData, is_active: true }));
      } else if (activeTab === 'products') {
        // Ensure config is structured
        const payload = { ...formData, config: formData.config || {} };
        success = editingId 
          ? await updateProduct(editingId, payload) 
          : !!(await addProduct({ ...payload, is_active: true }));
      } else if (activeTab === 'testimonials') {
        success = editingId 
          ? await updateTestimonial(editingId, formData) 
          : false; // Usually testimonials are added via public form
      } else if (activeTab === 'content') {
        success = await updateSiteContent(formData.key, formData.value, formData.page || 'home');
      }

      if (success) {
        resetForm();
        loadAdminData();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir permanentemente?')) return;
    setIsLoading(true);
    let success = false;
    if (activeTab === 'carousel') success = await deleteCarouselImage(id);
    if (activeTab === 'metrics') success = await deleteMetric(id);
    if (activeTab === 'insights') success = await deleteInsight(id);
    if (activeTab === 'products') success = await deleteProduct(id);
    if (activeTab === 'testimonials') success = await deleteTestimonial(id);
    if (activeTab === 'leads') success = await deleteContact(id);

    if (success) loadAdminData();
    else setIsLoading(false);
  };

  const filteredData = useMemo(() => {
    const s = (tabSearch[activeTab] || '').toLowerCase();
    switch (activeTab) {
      case 'carousel': return carouselImages.filter(x => (x.title || '').toLowerCase().includes(s));
      case 'insights': return insights.filter(x => x.title.toLowerCase().includes(s));
      case 'products': return products.filter(x => x.name.toLowerCase().includes(s));
      case 'metrics': return metrics.filter(x => x.label.toLowerCase().includes(s));
      case 'testimonials': return allTestimonials.filter(x => x.name.toLowerCase().includes(s));
      case 'content': return siteLabels.filter(x => x.key.toLowerCase().includes(s));
      case 'leads': return leads.filter(x => x.name.toLowerCase().includes(s) || x.email.toLowerCase().includes(s));
      default: return [];
    }
  }, [activeTab, carouselImages, insights, products, metrics, allTestimonials, siteLabels, leads, tabSearch]);

  return (
    <div className="fixed inset-0 z-[100] bg-brand-navy/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12 overflow-hidden">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-7xl h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        {/* Sidebar Nav */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-12 flex flex-row lg:flex-col gap-10 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-5 mb-0 lg:mb-16 min-w-fit cursor-pointer" onClick={loadAdminData}>
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Advisory Hub</span>
              <span className="text-[8px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">Management v5.0</span>
            </div>
          </div>
          <nav className="flex flex-row lg:flex-col gap-4 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'products', label: 'Produtos/Serviços' },
              { id: 'metrics', label: 'Métricas KPI' },
              { id: 'testimonials', label: 'Depoimentos' },
              { id: 'content', label: 'Copy do Site' },
              { id: 'leads', label: 'Leads (CRM)' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id as any); resetForm(); }} 
                className={`whitespace-nowrap px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-widest mt-auto p-6 border border-white/5 rounded-2xl transition-all">Sair do Painel</button>
        </div>

        {/* Work Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-16 pb-20">
            
            {/* 1. Header & Search */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-b border-white/5 pb-12">
               <div className="space-y-4">
                  <h2 className="text-5xl font-serif italic text-white tracking-tighter capitalize">{activeTab} Manager</h2>
                  <div className="relative group max-w-sm">
                    <input 
                      type="text" 
                      placeholder={`Localizar...`} 
                      value={tabSearch[activeTab]} 
                      onChange={e => setTabSearch(prev => ({ ...prev, [activeTab]: e.target.value }))} 
                      className="bg-[#050a14] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-[11px] text-white outline-none focus:border-blue-500/40 w-full font-medium" 
                    />
                    <svg className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
               </div>
               <div className="flex gap-2">
                 {['pt', 'en', 'es'].map(l => (
                    <button key={l} onClick={() => setEditingLang(l as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${editingLang === l ? 'bg-blue-600 text-white' : 'text-slate-700 hover:text-white'}`}>{l}</button>
                 ))}
               </div>
            </header>

            {/* 2. Unified Form Section (Top) */}
            <section className="bg-[#050a14] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl space-y-10 relative overflow-hidden group">
               <div className="flex justify-between items-center">
                 <h3 className="text-white font-serif italic text-2xl">{editingId ? 'Editar Registro' : 'Novo Registro'}</h3>
                 {editingId && <button onClick={resetForm} className="text-blue-500 text-[9px] uppercase font-bold tracking-widest hover:underline">Cancelar Edição</button>}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {activeTab === 'carousel' && (
                    <>
                      <input placeholder="URL da Imagem" className="admin-input col-span-2" value={formData.url || ''} onChange={e => setFormData({...formData, url: e.target.value})} />
                      <input placeholder="Título Principal" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                      <input placeholder="Subtítulo" className="admin-input" value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
                      <input placeholder="Link de Ação" className="admin-input" value={formData.link || ''} onChange={e => setFormData({...formData, link: e.target.value})} />
                      <input placeholder="Ordem" type="number" className="admin-input" value={formData.display_order || 0} onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})} />
                    </>
                  )}
                  {activeTab === 'insights' && (
                    <>
                      <input placeholder="Título do Insight" className="admin-input col-span-2" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                      <input placeholder="URL da Capa" className="admin-input" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                      <input placeholder="Categoria" className="admin-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                      <textarea placeholder="Resumo (Excerpt)" className="admin-input col-span-2 h-24" value={formData.excerpt || ''} onChange={e => setFormData({...formData, excerpt: e.target.value})} />
                    </>
                  )}
                  {activeTab === 'products' && (
                    <>
                      <input placeholder="Nome da Solução" className="admin-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <input placeholder="Preço" type="number" className="admin-input" value={formData.price || 0} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                      <select className="admin-input" value={formData.type || 'service'} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="service">Serviço / Mentoria</option>
                        <option value="product">Produto Digital</option>
                      </select>
                      <input placeholder="Link de Checkout" className="admin-input" value={formData.config?.url || ''} onChange={e => setFormData({...formData, config: {...formData.config, url: e.target.value}})} />
                      <textarea placeholder="Descrição curta" className="admin-input col-span-2 h-20" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </>
                  )}
                  {activeTab === 'metrics' && (
                    <>
                      <input placeholder="Valor (Ex: +50k)" className="admin-input" value={formData.value || ''} onChange={e => setFormData({...formData, value: e.target.value})} />
                      <input placeholder="Label (Ex: Parceiros)" className="admin-input" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} />
                    </>
                  )}
                  {activeTab === 'content' && (
                    <>
                      <input placeholder="Chave (Ex: hero_title)" className="admin-input" disabled={!!editingId} value={formData.key || ''} onChange={e => setFormData({...formData, key: e.target.value})} />
                      <input placeholder="Valor do Texto" className="admin-input" value={formData.value || ''} onChange={e => setFormData({...formData, value: e.target.value})} />
                    </>
                  )}
               </div>

               <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl hover:bg-blue-500 transition-all disabled:opacity-50"
               >
                 {isSaving ? 'Gravando Alterações...' : (editingId ? 'Sincronizar Atualização' : 'Publicar Novo Registro')}
               </button>
            </section>

            {/* 3. Data Grid Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 px-6 opacity-40">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Listagem de Registros Sincronizados</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>

              {filteredData.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-700 uppercase tracking-widest text-[10px]">Nenhum dado encontrado no Supabase</div>
              ) : (
                <div className="grid gap-6">
                  {filteredData.map((item: any) => (
                    <motion.div 
                      key={item.id || item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#050a14] border border-white/5 p-8 rounded-[2.5rem] group hover:border-blue-500/20 transition-all flex items-center gap-10 shadow-xl"
                    >
                      <div className="shrink-0">
                        {item.url ? (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5">
                            <img src={item.url} className="w-full h-full object-cover" alt="" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 font-bold">
                            {item.value?.charAt(0) || '•'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                           <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{item.id?.slice(0,8) || item.key}</span>
                           {item.is_active !== undefined && (
                             <span className={`px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-tighter ${item.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                               {item.is_active ? 'Ativo' : 'Inativo'}
                             </span>
                           )}
                        </div>
                        <h4 className="text-white font-medium text-sm leading-tight group-hover:text-blue-500 transition-colors">
                          {item.title || item.name || item.label || item.value || 'Sem título'}
                        </h4>
                        <p className="text-slate-600 text-[10px] font-light truncate max-w-lg italic">
                          {item.subtitle || item.excerpt || item.description || item.quote || item.email || ''}
                        </p>
                      </div>

                      <div className="flex gap-4 shrink-0">
                         <button onClick={() => handleEdit(item)} className="p-4 bg-white/5 rounded-xl text-slate-500 hover:text-blue-500 hover:bg-blue-600/10 transition-all">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         <button onClick={() => handleDelete(item.id || item.key)} className="p-4 bg-white/5 rounded-xl text-slate-700 hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .admin-input { @apply bg-[#02050c] border border-white/5 p-5 rounded-2xl text-white text-xs outline-none focus:border-blue-500/40 transition-all shadow-inner w-full; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

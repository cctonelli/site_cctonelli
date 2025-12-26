
import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order } from '../types';
import { fetchAllOrders, updateOrder, createUserProduct, createUsageEntry, supabase } from '../services/supabaseService';

type TabType = 'carousel' | 'insights' | 'products' | 'variants' | 'canvas' | 'metrics' | 'testimonials' | 'content' | 'leads' | 'orders' | 'tools' | 'app_versions' | 'usage';

const ADMIN_VERSION = "v10.0-ELITE";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  const handleApproveOrder = async (order: Order) => {
    const link = prompt("Insira o Link de Download / FTP para este ativo:", order.download_link || "https://ftp.claudiotonelli.com.br/assets/");
    if (link === null) return;

    setLoadingOrders(true);
    try {
      // 1. Update Order
      const resOrder = await updateOrder(order.id, { 
        status: 'approved', 
        approved_by_admin: true,
        download_link: link 
      });

      if (!resOrder.isError) {
        // 2. Create User Product
        const { data: userAsset, error: assetError } = await createUserProduct({
          user_id: order.user_id,
          product_id: order.product_id,
          variant_id: order.variant_id,
          status: 'active',
          approved_by_admin: true,
          download_link: link
        });

        if (!assetError.isError && userAsset) {
          // 3. Optional: Initialize Usage for products like V8 MATRIX
          // In a real scenario, you'd check product type here.
          const isV8Matrix = order.product_id.toLowerCase().includes('v8');
          if (isV8Matrix) {
            await createUsageEntry({
              user_product_id: userAsset.id,
              remaining_disparos: 5000, // Initial limit
              threads: 2,
              daily_count: 0,
              total_count: 0,
              last_reset: new Date().toISOString()
            });
          }

          alert("PROTOCOLO ELITE: Ativo liberado e limites inicializados!");
          await loadOrders();
        } else {
          alert(`Erro na liberação do ativo: ${assetError.message}`);
        }
      } else {
        alert(`Erro ao atualizar pedido: ${resOrder.message}`);
      }
    } catch (err) {
      console.error("Critical Approval Error:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const refreshSchema = () => {
    const sql = "NOTIFY pgrst, 'reload schema';";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sql);
      alert("Comando de sincronia SQL copiado!");
    }
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-2 lg:p-8 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1500px] h-full rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
        
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-8 flex flex-row lg:flex-col gap-8 shrink-0 overflow-x-auto scrollbar-none relative z-10">
          <div className="flex items-center gap-4 mb-0 lg:mb-12 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-600/20">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Elite Admin</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-row lg:flex-col gap-2 flex-1">
            {[
              { id: 'orders', label: 'Gestão de Pedidos' },
              { id: 'app_versions', label: 'Versões do App' },
              { id: 'usage', label: 'Uso & Métricas' },
              { id: 'products', label: 'Catálogo de Ativos' },
              { id: 'variants', label: 'Preços & Features' },
              { id: 'tools', label: 'Strategic Tools' },
              { id: 'carousel', label: 'Hero Display' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'canvas', label: 'Canvas Dinâmico' },
              { id: 'metrics', label: 'Impact KPIs' },
              { id: 'testimonials', label: 'Social Proof' },
              { id: 'content', label: 'Site Copy' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`whitespace-nowrap px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all text-left border ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'text-slate-600 border-transparent hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden lg:flex flex-col gap-4">
            <button onClick={refreshSchema} className="w-full py-4 px-6 border border-blue-500/30 bg-blue-600/10 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Reload Schema</button>
            <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] p-4 border border-white/5 rounded-xl transition-all">Sair do Dashboard</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-32">
            <header className="mb-16">
               <h2 className="text-4xl lg:text-5xl font-serif text-white italic mb-4 capitalize">{activeTab.replace('_', ' ')} Management</h2>
               <div className="w-20 h-1 bg-blue-600"></div>
            </header>

            <div key={activeTab}>
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {loadingOrders ? (
                    <div className="py-20 text-center">
                      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando Pedidos...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-4">
                       <p className="text-slate-500 italic font-serif text-xl">Nenhum pedido aguardando protocolo.</p>
                       <button onClick={loadOrders} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-white">Recarregar Lista</button>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-center gap-8 group hover:border-blue-600/20 transition-all shadow-2xl backdrop-blur-md">
                          <div className="space-y-4 flex-1">
                             <div className="flex items-center gap-6">
                               <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 text-slate-500 font-bold text-xs uppercase">
                                 {order.profiles?.full_name?.charAt(0) || '?'}
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-xl font-serif italic text-white leading-none">{order.profiles?.full_name || 'Partner'}</span>
                                 <span className="text-[9px] text-slate-500 font-mono mt-1">{order.profiles?.whatsapp || 'Sem Contato'}</span>
                               </div>
                               <span className={`ml-4 text-[7px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                                 order.status === 'approved' ? 'bg-green-600/20 text-green-400 border border-green-600/20' : 
                                 order.status === 'pending' ? 'bg-amber-600/20 text-amber-400 border border-amber-600/20 animate-pulse' : 'bg-red-600/20 text-red-400 border border-red-600/20'
                               }`}>
                                 {order.status}
                               </span>
                             </div>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">VALOR</span> <span className="text-white">R$ {order.amount.toLocaleString('pt-BR')}</span></div>
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">METODO</span> <span className="text-white uppercase">{order.payment_method}</span></div>
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">ID</span> <span className="text-slate-600 font-mono">{order.id.slice(0,8).toUpperCase()}</span></div>
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">DATA</span> <span className="text-white">{new Date(order.created_at || '').toLocaleDateString('pt-BR')}</span></div>
                             </div>
                          </div>
                          <div className="flex gap-4 w-full lg:w-auto">
                            {order.status !== 'approved' && (
                              <button onClick={() => handleApproveOrder(order)} className="flex-1 lg:flex-none px-10 py-4 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">Aprovar Elite</button>
                            )}
                            <button onClick={() => { if(confirm('Rejeitar pedido?')) updateOrder(order.id, { status: 'rejected' }).then(() => loadOrders()); }} className="px-6 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Rejeitar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'app_versions' && <AdminCrudSection tableName="app_versions" title="Versão do App" fields={[{ key: 'app_name', label: 'Nome do App' }, { key: 'version_code', label: 'Código da Versão' }, { key: 'download_url', label: 'Download URL (Storage)', type: 'text' }, { key: 'is_forced', label: 'Update Obrigatório', type: 'toggle' }, { key: 'release_notes', label: 'Release Notes', type: 'textarea' }]} displayColumns={['app_name', 'version_code', 'is_forced']} />}
              {activeTab === 'usage' && <AdminCrudSection tableName="v8_matrix_usage" title="Métrica de Uso" fields={[{ key: 'user_product_id', label: 'ID Ativo Usuário' }, { key: 'remaining_disparos', label: 'Disparos Restantes', type: 'number' }, { key: 'threads', label: 'Limite de Threads', type: 'number' }, { key: 'daily_count', label: 'Contagem Diária', type: 'number' }, { key: 'total_count', label: 'Total Histórico', type: 'number' }]} displayColumns={['user_product_id', 'remaining_disparos']} />}
              {activeTab === 'carousel' && <AdminCrudSection tableName="carousel_images" title="Slide" fields={[{ key: 'url', label: 'URL Imagem', type: 'image' }, { key: 'title', label: 'Título' }, { key: 'subtitle', label: 'Subtítulo' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['url', 'title', 'is_active']} />}
              {activeTab === 'insights' && <AdminCrudSection tableName="insights" title="Insight" fields={[{ key: 'title', label: 'Título' }, { key: 'excerpt', label: 'Resumo', type: 'textarea' }, { key: 'image_url', label: 'Capa', type: 'image' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['title', 'is_active']} />}
              {activeTab === 'products' && <AdminCrudSection tableName="products" title="Produto" fields={[{ key: 'title', label: 'Título' }, { key: 'slug', label: 'URL Slug' }, { key: 'pricing_type', label: 'Tipo' }, { key: 'image_url', label: 'Imagem', type: 'image' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['title', 'slug', 'is_active']} />}
              {activeTab === 'variants' && <AdminCrudSection tableName="product_variants" title="Variante" fields={[{ key: 'product_id', label: 'ID Produto' }, { key: 'name', label: 'Nome' }, { key: 'price', label: 'Preço', type: 'number' }, { key: 'features', label: 'Features (JSON)', type: 'json' }]} displayColumns={['name', 'price']} />}
              {activeTab === 'tools' && <AdminCrudSection tableName="tools" title="Ferramenta" fields={[{ key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição' }, { key: 'access_level', label: 'Acesso' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['name', 'access_level']} />}
              {activeTab === 'content' && <AdminCrudSection tableName="site_content" title="Conteúdo" idColumn="key" fields={[{ key: 'key', label: 'Chave' }, { key: 'value', label: 'Valor', type: 'rich-text' }]} displayColumns={['key', 'page']} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


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
      // 1. Update Order status and link
      const resOrder = await updateOrder(order.id, { 
        status: 'approved', 
        approved_by_admin: true,
        download_link: link 
      });

      if (!resOrder.isError) {
        // 2. Create actual Asset record for the user
        const { data: userAsset, error: assetError } = await createUserProduct({
          user_id: order.user_id,
          product_id: order.product_id,
          variant_id: order.variant_id,
          status: 'active',
          approved_by_admin: true,
          download_link: link
        });

        if (!assetError.isError && userAsset) {
          // 3. Matrix Edition Logic: Initialize Usage if product is V8 or similar
          const isMatrixProduct = order.product_id.toLowerCase().includes('v8') || order.product_id.toLowerCase().includes('matrix');
          if (isMatrixProduct) {
            await createUsageEntry({
              user_product_id: userAsset.id,
              remaining_disparos: 5000, 
              threads: 2,
              daily_count: 0,
              total_count: 0,
              last_reset: new Date().toISOString()
            });
          }

          alert("PROTOCOLO ELITE: Ativo liberado com sucesso. O parceiro já pode visualizar no Executive Hub.");
          await loadOrders();
        } else {
          alert(`Falha na geração do ativo: ${assetError.message}`);
        }
      } else {
        alert(`Falha na atualização do pedido: ${resOrder.message}`);
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
      alert("Comando de sincronia SQL copiado para o clipboard!");
    }
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[120] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-2 lg:p-8 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1500px] h-full rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-8 flex flex-row lg:flex-col gap-8 shrink-0 overflow-x-auto scrollbar-none relative z-10">
          <div className="flex items-center gap-4 mb-0 lg:mb-12 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-600/20">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white leading-none">Elite Admin</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-2">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-row lg:flex-col gap-2 flex-1">
            {[
              { id: 'orders', label: 'Gestão de Pedidos' },
              { id: 'app_versions', label: 'Versões do App' },
              { id: 'usage', label: 'Uso & Métricas' },
              { id: 'products', label: 'Catálogo de Ativos' },
              { id: 'variants', label: 'Planos & Features' },
              { id: 'canvas', label: 'Canvas Builder' },
              { id: 'tools', label: 'Strategic Tools' },
              { id: 'carousel', label: 'Hero Display' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'metrics', label: 'Impact KPIs' },
              { id: 'testimonials', label: 'Social Proof' },
              { id: 'content', label: 'Copy & Texto' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`whitespace-nowrap px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all text-left border ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/20' : 'text-slate-600 border-transparent hover:bg-white/5 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden lg:flex flex-col gap-4">
            <button onClick={refreshSchema} className="w-full py-4 px-6 border border-blue-500/30 bg-blue-600/10 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Sincronizar Schema</button>
            <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] p-4 border border-white/5 rounded-xl transition-all">Encerrar Sessão</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-32">
            <header className="mb-16">
               <h2 className="text-4xl lg:text-5xl font-serif text-white italic mb-4 capitalize">{activeTab.replace('_', ' ')} Hub</h2>
               <div className="w-20 h-1 bg-blue-600"></div>
            </header>

            <div key={activeTab}>
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {loadingOrders ? (
                    <div className="py-20 text-center">
                      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Sincronizando Pedidos Financeiros...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-6">
                       <p className="text-slate-500 italic font-serif text-xl">Aguardando novos protocolos de adesão.</p>
                       <button onClick={loadOrders} className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] hover:text-white transition-colors">Verificar Novamente</button>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] flex flex-col lg:flex-row justify-between items-center gap-8 group hover:border-blue-600/20 transition-all shadow-2xl backdrop-blur-md">
                          <div className="space-y-4 flex-1">
                             <div className="flex items-center gap-6">
                               <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 text-slate-500 font-bold text-xs uppercase">
                                 {order.profiles?.full_name?.charAt(0) || 'P'}
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-xl font-serif italic text-white leading-none">{order.profiles?.full_name || 'Anonymous Partner'}</span>
                                 <span className="text-[9px] text-slate-500 font-mono mt-1 tracking-widest uppercase">{order.profiles?.whatsapp || 'Sem WhatsApp'}</span>
                               </div>
                               <span className={`ml-4 text-[7px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                                 order.status === 'approved' ? 'bg-green-600/20 text-green-400 border border-green-600/20' : 
                                 order.status === 'pending' ? 'bg-amber-600/20 text-amber-400 border border-amber-600/20 animate-pulse' : 'bg-red-600/20 text-red-400 border border-red-600/20'
                               }`}>
                                 {order.status}
                               </span>
                             </div>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">INVESTIMENTO</span> <span className="text-white">R$ {order.amount.toLocaleString('pt-BR')}</span></div>
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">MÉTODO</span> <span className="text-white uppercase">{order.payment_method}</span></div>
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">PROTOCOLO</span> <span className="text-slate-600 font-mono">{order.id.slice(0,8).toUpperCase()}</span></div>
                                <div className="flex flex-col"><span className="text-blue-500/50 mb-1">TIMESTAMP</span> <span className="text-white">{new Date(order.created_at || '').toLocaleDateString('pt-BR')}</span></div>
                             </div>
                          </div>
                          <div className="flex gap-4 w-full lg:w-auto">
                            {order.status !== 'approved' && (
                              <button onClick={() => handleApproveOrder(order)} className="flex-1 lg:flex-none px-10 py-4 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">Liberar Ativo</button>
                            )}
                            <button onClick={() => { if(confirm('Rejeitar este protocolo?')) updateOrder(order.id, { status: 'rejected' }).then(() => loadOrders()); }} className="px-6 py-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Rejeitar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'app_versions' && <AdminCrudSection tableName="app_versions" title="Versão do App" fields={[{ key: 'app_name', label: 'Nome do App' }, { key: 'version_code', label: 'Versão' }, { key: 'download_url', label: 'Link Storage', type: 'text' }, { key: 'is_forced', label: 'Forçar Update', type: 'toggle' }, { key: 'release_notes', label: 'Notas de Lançamento', type: 'textarea' }]} displayColumns={['app_name', 'version_code', 'is_forced']} />}
              {activeTab === 'usage' && <AdminCrudSection tableName="v8_matrix_usage" title="Métrica de Uso" fields={[{ key: 'user_product_id', label: 'ID do Ativo' }, { key: 'remaining_disparos', label: 'Disparos Disponíveis', type: 'number' }, { key: 'threads', label: 'Threads Permitidas', type: 'number' }, { key: 'daily_count', label: 'Contagem Diária', type: 'number' }, { key: 'total_count', label: 'Total Acumulado', type: 'number' }]} displayColumns={['user_product_id', 'remaining_disparos']} />}
              {activeTab === 'products' && <AdminCrudSection tableName="products" title="Ativo Digital" fields={[{ key: 'title', label: 'Título' }, { key: 'slug', label: 'Slug / URL' }, { key: 'pricing_type', label: 'Modelo' }, { key: 'image_url', label: 'Imagem Principal', type: 'image' }, { key: 'is_active', label: 'Público', type: 'toggle' }, { key: 'featured', label: 'Destaque', type: 'toggle' }]} displayColumns={['title', 'slug', 'is_active']} />}
              {activeTab === 'variants' && <AdminCrudSection tableName="product_variants" title="Variante de Plano" fields={[{ key: 'product_id', label: 'ID do Produto' }, { key: 'name', label: 'Nome do Plano' }, { key: 'price', label: 'Preço Final', type: 'number' }, { key: 'features', label: 'Features (JSON List)', type: 'json' }]} displayColumns={['name', 'price']} />}
              {activeTab === 'canvas' && <AdminCrudSection tableName="product_content_blocks" title="Canvas Block" fields={[{ key: 'product_id', label: 'ID Produto' }, { key: 'block_type', label: 'Tipo de Bloco' }, { key: 'order', label: 'Ordem', type: 'number' }, { key: 'content', label: 'Conteúdo (JSON)', type: 'json' }]} displayColumns={['block_type', 'product_id', 'order']} />}
              {activeTab === 'carousel' && <AdminCrudSection tableName="carousel_images" title="Slide Hero" fields={[{ key: 'url', label: 'Imagem', type: 'image' }, { key: 'title', label: 'H1 Title' }, { key: 'subtitle', label: 'P Subtitle' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }, { key: 'display_order', label: 'Ordem', type: 'number' }]} displayColumns={['title', 'is_active']} />}
              {activeTab === 'insights' && <AdminCrudSection tableName="insights" title="Knowledge Post" fields={[{ key: 'title', label: 'Título' }, { key: 'category', label: 'Categoria' }, { key: 'excerpt', label: 'Excerpt', type: 'textarea' }, { key: 'content', label: 'Conteúdo Rich', type: 'rich-text' }, { key: 'image_url', label: 'Capa', type: 'image' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['title', 'category', 'is_active']} />}
              {activeTab === 'tools' && <AdminCrudSection tableName="tools" title="Utility Tool" fields={[{ key: 'name', label: 'Nome' }, { key: 'description', label: 'Briefing' }, { key: 'icon', label: 'Icon / Emoji' }, { key: 'access_level', label: 'Nível de Acesso' }, { key: 'external_url', label: 'Link Externo' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['name', 'access_level']} />}
              {activeTab === 'content' && <AdminCrudSection tableName="site_content" title="Dynamic Copy" idColumn="key" fields={[{ key: 'key', label: 'Database Key' }, { key: 'page', label: 'Page Context' }, { key: 'value', label: 'Conteúdo Central', type: 'rich-text' }]} displayColumns={['key', 'page']} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

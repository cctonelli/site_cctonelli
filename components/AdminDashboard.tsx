
import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile, Order } from '../types';
import { fetchAllOrders, updateOrder, createUserProduct } from '../services/supabaseService';

type TabType = 'carousel' | 'insights' | 'products' | 'variants' | 'canvas' | 'metrics' | 'testimonials' | 'content' | 'leads' | 'orders' | 'tools';

const ADMIN_VERSION = "v9.0-ELITE";

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

    // 1. Atualiza Pedido
    const resOrder = await updateOrder(order.id, { 
      status: 'approved', 
      approved_by_admin: true,
      download_link: link 
    });

    if (!resOrder.isError) {
      // 2. Insere em User Products (Liberação definitiva)
      const resAsset = await createUserProduct({
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        status: 'active',
        approved_by_admin: true,
        download_link: link
      });

      if (!resAsset.isError) {
        alert("PROTOCOLO ELITE: Pedido aprovado e ativo liberado no Executive Hub!");
        loadOrders();
      } else {
        alert("Pedido aprovado, mas falha ao inserir em user_products. Verifique permissões RLS.");
      }
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
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Advisory Admin</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-row lg:flex-col gap-2 flex-1">
            {[
              { id: 'orders', label: 'Gestão de Pedidos' },
              { id: 'products', label: 'Produtos Loja' },
              { id: 'variants', label: 'Variantes/Preços' },
              { id: 'tools', label: 'Strategic Tools' },
              { id: 'carousel', label: 'Hero Carousel' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'canvas', label: 'Canvas Dinâmico' },
              { id: 'metrics', label: 'Impact KPIs' },
              { id: 'testimonials', label: 'Social Proof' },
              { id: 'content', label: 'Copywriting' }
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
            <button onClick={refreshSchema} className="w-full py-4 px-6 border border-blue-500/30 bg-blue-600/10 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Sincronia SQL</button>
            <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] p-4 border border-white/5 rounded-xl transition-all">Desconectar</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-32">
            <header className="mb-16">
               <h2 className="text-4xl lg:text-5xl font-serif text-white italic mb-4 capitalize">{activeTab.replace('_', ' ')} Control</h2>
               <div className="w-20 h-1 bg-blue-600"></div>
            </header>

            <div key={activeTab}>
              {activeTab === 'orders' ? (
                <div className="space-y-6">
                  {loadingOrders ? (
                    <div className="py-20 text-center"><div className="w-10 h-10 border-t-2 border-blue-600 rounded-full animate-spin mx-auto"></div></div>
                  ) : orders.length === 0 ? (
                    <p className="text-slate-500 italic text-center py-20">Nenhum pedido registrado no sistema.</p>
                  ) : (
                    <div className="grid gap-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-slate-900/60 border border-white/5 p-8 rounded-[2rem] flex flex-col lg:flex-row justify-between items-center gap-8 group hover:border-blue-600/20 transition-all">
                          <div className="space-y-3 flex-1">
                             <div className="flex items-center gap-4">
                               <span className="text-xl font-serif italic text-white">{order.profiles?.full_name || 'Desconhecido'}</span>
                               <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                                 order.status === 'approved' ? 'bg-green-600 text-white' : 
                                 order.status === 'pending' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'
                               }`}>
                                 {order.status}
                               </span>
                             </div>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex flex-col"><span className="text-blue-500">VALOR</span> R$ {order.amount.toLocaleString('pt-BR')}</div>
                                <div className="flex flex-col"><span className="text-blue-500">WHATSAPP</span> {order.profiles?.whatsapp || 'N/A'}</div>
                                <div className="flex flex-col"><span className="text-blue-500">CPF/CNPJ</span> {order.profiles?.cpf_cnpj || 'N/A'}</div>
                                <div className="flex flex-col"><span className="text-blue-500">REF</span> {order.id.slice(0,8).toUpperCase()}</div>
                             </div>
                          </div>
                          <div className="flex gap-4">
                            {order.status !== 'approved' && (
                              <button 
                                onClick={() => handleApproveOrder(order)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
                              >
                                Aprovar & Liberar
                              </button>
                            )}
                            <button 
                              onClick={() => { if(confirm('Rejeitar este pedido?')) updateOrder(order.id, { status: 'rejected' }).then(() => loadOrders()); }}
                              className="px-8 py-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                            >
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {activeTab === 'carousel' && <AdminCrudSection tableName="carousel_images" title="Slide" fields={[{ key: 'url', label: 'URL Imagem', type: 'image' }, { key: 'title', label: 'Título (PT)' }, { key: 'subtitle', label: 'Subtítulo (PT)' }, { key: 'cta_url', label: 'Link' }, { key: 'is_active', label: 'Publicado', type: 'toggle' }]} displayColumns={['url', 'title', 'is_active']} />}
                  {activeTab === 'insights' && <AdminCrudSection tableName="insights" title="Insight" fields={[{ key: 'title', label: 'Título (PT)' }, { key: 'excerpt', label: 'Resumo (PT)', type: 'textarea' }, { key: 'content', label: 'Conteúdo (PT)', type: 'rich-text' }, { key: 'image_url', label: 'Capa', type: 'image' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['title', 'is_active']} />}
                  {activeTab === 'products' && <AdminCrudSection tableName="products" title="Produto" fields={[{ key: 'title', label: 'Título' }, { key: 'slug', label: 'URL Slug' }, { key: 'pricing_type', label: 'Tipo (subscription/one_time/free)' }, { key: 'image_url', label: 'Imagem', type: 'image' }, { key: 'featured', label: 'Destaque', type: 'toggle' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['title', 'slug', 'is_active']} />}
                  {activeTab === 'variants' && <AdminCrudSection tableName="product_variants" title="Variante" fields={[{ key: 'product_id', label: 'ID Produto' }, { key: 'name', label: 'Nome' }, { key: 'price', label: 'Preço', type: 'number' }, { key: 'interval', label: 'Intervalo' }, { key: 'features', label: 'Features (JSON)', type: 'json' }, { key: 'order_index', label: 'Ordem', type: 'number' }]} displayColumns={['name', 'price']} />}
                  {activeTab === 'tools' && <AdminCrudSection tableName="tools" title="Tool" fields={[{ key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição' }, { key: 'icon', label: 'Emoji/Icon' }, { key: 'access_level', label: 'Acesso (public/client/admin)' }, { key: 'external_url', label: 'URL Ferramenta' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['name', 'access_level']} />}
                  {activeTab === 'canvas' && <AdminCrudSection tableName="product_content_blocks" title="Bloco" fields={[{ key: 'product_id', label: 'ID Produto' }, { key: 'block_type', label: 'Tipo' }, { key: 'order', label: 'Ordem', type: 'number' }, { key: 'content', label: 'JSON', type: 'json' }]} displayColumns={['block_type', 'product_id']} />}
                  {activeTab === 'metrics' && <AdminCrudSection tableName="metrics" title="KPI" fields={[{ key: 'label', label: 'Label' }, { key: 'value', label: 'Valor' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['label', 'value']} />}
                  {activeTab === 'content' && <AdminCrudSection tableName="site_content" title="Copy" idColumn="key" fields={[{ key: 'key', label: 'Chave ID' }, { key: 'value', label: 'Conteúdo (PT)', type: 'rich-text' }]} displayColumns={['key', 'page']} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { Profile, Order, Product, ProductContentBlock, ProductVariant, Insight, UserProduct } from '../types';
import { fetchAllOrders, fetchSiteConfig, supabase } from '../services/supabaseService';
import { SITE_CONFIG, LOCAL_INSIGHTS, LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS } from '../services/localRegistry';

type TabType = 'visual_dna' | 'editorial_forge' | 'sovereign_store' | 'insights' | 'orders' | 'hard_build';

const ADMIN_VERSION = "v16.0-SOVEREIGN-MASTER";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const currentConfig = fetchSiteConfig();
  const [config, setConfig] = useState(currentConfig);
  const [registryProducts, setRegistryProducts] = useState<Product[]>((currentConfig as any)._products || LOCAL_PRODUCTS);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  const approveOrder = async (order: Order) => {
    if (!confirm(`Aprovar pedido de R$ ${order.amount} para ${order.profiles?.email}?`)) return;
    
    try {
      // 1. Atualizar status da order
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'approved', approved_by_admin: true })
        .eq('id', order.id);
      
      if (orderError) throw orderError;

      // 2. Definir Expiração (Lógica Elite)
      const expirationDate = new Date();
      if (order.variant_id.includes('mensal')) expirationDate.setMonth(expirationDate.getMonth() + 1);
      else if (order.variant_id.includes('semestral')) expirationDate.setMonth(expirationDate.getMonth() + 6);
      else if (order.variant_id.includes('anual')) expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      else expirationDate.setDate(expirationDate.getDate() + 7);

      // 3. Criar registro em user_products
      const newUserProduct: Partial<UserProduct> = {
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        status: 'active',
        approved_by_admin: true,
        expires_at: expirationDate.toISOString(),
        download_link: 'https://cdn.claudiotonelli.com.br/assets/v8-matrix-setup.exe'
      };

      const { error: upError } = await supabase.from('user_products').insert([newUserProduct]);
      if (upError) throw upError;

      alert("PROTOCOLO ATIVADO: O ativo foi liberado para o cliente com sucesso.");
      loadOrders();
    } catch (e: any) {
      alert(`Erro na aprovação: ${e.message}`);
    }
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm("Rejeitar este pedido permanentemente?")) return;
    await supabase.from('orders').update({ status: 'rejected' }).eq('id', orderId);
    loadOrders();
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden font-sans">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1800px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-10 flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 bg-green-500 rounded-3xl flex items-center justify-center font-bold text-black text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-green-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
            {[
              { id: 'orders', label: 'Sales Vault' },
              { id: 'visual_dna', label: 'DNA Visual' },
              { id: 'sovereign_store', label: 'Sovereign Store' },
              { id: 'hard_build', label: 'Hard Build' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-left transition-all border ${activeTab === tab.id ? 'bg-green-500 text-black border-green-400' : 'text-slate-600 border-transparent hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          
          <div className="pt-6 border-t border-white/5 space-y-4">
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em]">Sair do Core</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">
            {activeTab === 'orders' && (
              <div className="space-y-12">
                <header>
                   <h2 className="text-5xl font-serif text-white italic tracking-tighter">Sales Vault</h2>
                   <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Controle de Fluxo e Aprovações</p>
                </header>
                
                {loadingOrders ? (
                   <div className="py-20 text-center text-green-500 animate-pulse font-black text-xs uppercase tracking-[0.5em]">Lendo Registros...</div>
                ) : orders.length === 0 ? (
                   <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-600 font-black uppercase tracking-widest text-[10px]">Sem pedidos no momento.</div>
                ) : (
                   <div className="grid gap-6">
                      {orders.map(order => (
                        <div key={order.id} className={`p-10 rounded-[3rem] border transition-all ${order.status === 'pending' ? 'bg-slate-900/60 border-blue-600/30' : 'bg-slate-950/40 border-white/5'}`}>
                           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-4">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-500'}`}>{order.status}</span>
                                    <span className="text-slate-500 text-[10px] font-mono">#{order.id.slice(0, 8)}</span>
                                 </div>
                                 <h4 className="text-2xl font-serif italic text-white">{order.profiles?.email || 'Cliente corporativo'}</h4>
                                 <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <span>Ativo: {order.product_id}</span>
                                    <span>Valor: R$ {order.amount.toFixed(2)}</span>
                                 </div>
                              </div>
                              {order.status === 'pending' && (
                                <div className="flex gap-4">
                                   <button onClick={() => approveOrder(order)} className="px-10 py-5 bg-green-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-400">APROVAR</button>
                                   <button onClick={() => rejectOrder(order.id)} className="px-10 py-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white">REJEITAR</button>
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                )}
              </div>
            )}
            <div className="py-20 text-center text-slate-800 text-[8px] font-black uppercase tracking-widest">Protocol v16.0 Sovereign Master</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
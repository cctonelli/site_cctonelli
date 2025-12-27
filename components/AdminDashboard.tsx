
import React, { useState, useEffect } from 'react';
import { Profile, Order, UserProduct } from '../types';
import { fetchAllOrders, fetchSiteConfig, supabase } from '../services/supabaseService';

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
    const clientEmail = order.profiles?.email || 'Cliente';
    if (!confirm(`Confirmar recebimento de R$ ${order.amount.toFixed(2)} e ativar licença para ${clientEmail}?`)) return;
    
    try {
      // 1. Atualizar status do pedido no banco
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'approved', approved_by_admin: true })
        .eq('id', order.id);
      
      if (orderError) throw orderError;

      // 2. Calcular expiração baseado na variante
      const expirationDate = new Date();
      let disparosIniciais = 50;
      let threads = 1;

      const variantName = order.variant_id.toLowerCase();
      if (variantName.includes('anual')) {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        disparosIniciais = 32000;
        threads = 3;
      } else if (variantName.includes('semestral')) {
        expirationDate.setMonth(expirationDate.getMonth() + 6);
        disparosIniciais = 12800;
        threads = 2;
      } else if (variantName.includes('mensal')) {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        disparosIniciais = 2400;
        threads = 1;
      } else {
        expirationDate.setDate(expirationDate.getDate() + 7); // Trial padrão
      }

      // 3. Criar Ativo Digital (UserProduct)
      const newUserProduct: Partial<UserProduct> = {
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        status: 'active',
        approved_by_admin: true,
        expires_at: expirationDate.toISOString(),
        download_link: 'https://cdn.claudiotonelli.com.br/assets/v8-matrix-setup.exe'
      };

      const { data: upData, error: upError } = await supabase
        .from('user_products')
        .insert([newUserProduct])
        .select()
        .single();

      if (upError) throw upError;

      // 4. Inicializar métricas V8 Matrix
      const isV8 = order.product_id.toLowerCase().includes('v8') || order.product_id.toLowerCase().includes('matrix');
      if (isV8) {
        await supabase.from('v8_matrix_usage').insert([{
          user_product_id: upData.id,
          remaining_disparos: disparosIniciais,
          threads: threads,
          daily_count: 0,
          total_count: 0,
          last_reset: new Date().toISOString()
        }]);
      }

      alert("PROTOCOLO ATIVADO: Ativo liberado com sucesso via Realtime Sync.");
      loadOrders();
    } catch (e: any) {
      alert(`Falha na ativação: ${e.message}`);
    }
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm("Rejeitar este protocolo permanentemente?")) return;
    await supabase.from('orders').update({ status: 'rejected' }).eq('id', orderId);
    loadOrders();
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden font-sans">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1800px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        <aside className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-10 flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 bg-green-500 rounded-3xl flex items-center justify-center font-bold text-black text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-green-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
            <button onClick={() => setActiveTab('orders')} className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-left transition-all border ${activeTab === 'orders' ? 'bg-green-500 text-black border-green-400' : 'text-slate-600 border-transparent hover:text-white'}`}>Sales Vault</button>
            <button onClick={() => setActiveTab('visual_dna')} className={`px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-left transition-all border ${activeTab === 'visual_dna' ? 'bg-green-500 text-black border-green-400' : 'text-slate-600 border-transparent hover:text-white'}`}>DNA Visual</button>
          </nav>
          
          <div className="pt-6 border-t border-white/5">
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em]">Sair do Core</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">
            {activeTab === 'orders' && (
              <div className="space-y-12">
                <header>
                   <h2 className="text-5xl font-serif text-white italic tracking-tighter">Sales Vault.</h2>
                   <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Auditoria e Ativação de Protocolos de Compra</p>
                </header>
                
                {loadingOrders ? (
                   <div className="py-20 text-center text-green-500 animate-pulse font-black text-xs uppercase tracking-[0.5em]">Acessando registros criptografados...</div>
                ) : orders.length === 0 ? (
                   <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-600 font-black uppercase tracking-widest text-[10px]">Sem solicitações no momento.</div>
                ) : (
                   <div className="grid gap-6">
                      {orders.map(order => (
                        <div key={order.id} className={`p-10 rounded-[3rem] border transition-all ${order.status === 'pending' ? 'bg-slate-900/60 border-blue-600/30 shadow-lg shadow-blue-600/5' : 'bg-slate-950/40 border-white/5 opacity-60'}`}>
                           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-4">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-500'}`}>{order.status}</span>
                                    <span className="text-slate-500 text-[10px] font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                                 </div>
                                 <h4 className="text-2xl font-serif italic text-white">{order.profiles?.email || 'Partner Corporativo'}</h4>
                                 <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <span>Produto: {order.product_id}</span>
                                    <span className="text-blue-500">Valor: R$ {order.amount.toFixed(2)}</span>
                                 </div>
                              </div>
                              {order.status === 'pending' && (
                                <div className="flex gap-4">
                                   <button onClick={() => approveOrder(order)} className="px-10 py-5 bg-green-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-400 active:scale-95 transition-all">ATIVAR LICENÇA</button>
                                   <button onClick={() => rejectOrder(order.id)} className="px-10 py-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white active:scale-95 transition-all">REJEITAR</button>
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                )}
              </div>
            )}
            <div className="py-20 text-center text-slate-800 text-[8px] font-black uppercase tracking-widest">System Governance v16.0 MASTER // CLAUDIO TONELLI ADVISORY</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

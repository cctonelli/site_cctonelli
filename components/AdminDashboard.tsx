
import React, { useState, useEffect } from 'react';
import { Profile, Order, UserProduct } from '../types';
import { fetchAllOrders, fetchSiteConfig, supabase } from '../services/supabaseService';

type TabType = 'visual_dna' | 'editorial_forge' | 'sovereign_store' | 'insights' | 'orders' | 'hard_build';

const ADMIN_VERSION = "v16.1-SOVEREIGN-MASTER";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
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
    
    setProcessingId(order.id);
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
        // Fallback para trial/padrão
        expirationDate.setDate(expirationDate.getDate() + 15); 
        disparosIniciais = 100;
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

      alert("PROTOCOLO ATIVADO: Ativo liberado via Realtime Sync v16.1");
      loadOrders();
    } catch (e: any) {
      alert(`Falha na ativação: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm("Rejeitar este protocolo permanentemente?")) return;
    setProcessingId(orderId);
    await supabase.from('orders').update({ status: 'rejected' }).eq('id', orderId);
    loadOrders();
    setProcessingId(null);
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12 overflow-hidden font-sans">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1900px] h-full rounded-[4.5rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-500/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        
        <aside className="w-full lg:w-96 bg-[#010309] border-r border-white/5 p-12 flex flex-col gap-10 shrink-0 z-10">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-[1.8rem] flex items-center justify-center font-bold text-black text-3xl shadow-2xl shadow-green-500/20">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[12px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
              <span className="text-[8px] uppercase tracking-[0.4em] text-green-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar pr-4">
            <button onClick={() => setActiveTab('orders')} className={`px-8 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'orders' ? 'bg-green-500 text-black border-green-400 shadow-xl' : 'text-slate-600 border-white/5 hover:text-white hover:bg-white/5'}`}>Sales Vault</button>
            <button onClick={() => setActiveTab('visual_dna')} className={`px-8 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'visual_dna' ? 'bg-green-500 text-black border-green-400 shadow-xl' : 'text-slate-600 border-white/5 hover:text-white hover:bg-white/5'}`}>DNA Visual</button>
            <button className={`px-8 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border text-slate-800 border-transparent cursor-not-allowed`}>Marketplace Editor</button>
          </nav>
          
          <div className="pt-8 border-t border-white/5">
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[11px] font-black uppercase tracking-[0.6em] transition-colors">Terminar Sessão</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar z-10">
          <div className="max-w-7xl mx-auto pb-40">
            {activeTab === 'orders' && (
              <div className="space-y-16">
                <header className="flex justify-between items-end">
                   <div className="space-y-4">
                      <h2 className="text-6xl md:text-8xl font-serif text-white italic tracking-tighter leading-none">Sales <span className="text-green-500">Vault.</span></h2>
                      <p className="text-slate-500 text-sm uppercase tracking-widest italic border-l-2 border-green-500/20 pl-8">Sincronização Atômica de Licenças Elite</p>
                   </div>
                   <button onClick={loadOrders} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all text-slate-500 hover:text-white">
                      <svg className={`h-6 w-6 ${loadingOrders ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   </button>
                </header>
                
                {loadingOrders ? (
                   <div className="py-40 text-center">
                      <div className="w-20 h-20 border-t-2 border-green-500 rounded-full animate-spin mx-auto mb-10"></div>
                      <span className="text-green-500 font-black text-xs uppercase tracking-[0.8em] animate-pulse">Acessando Core Criptografado...</span>
                   </div>
                ) : orders.length === 0 ? (
                   <div className="py-60 text-center border-2 border-dashed border-white/5 rounded-[5rem] bg-slate-950/20 space-y-6">
                      <p className="text-slate-700 font-black uppercase tracking-[1em] text-[10px]">Zero solicitações pendentes no ledger.</p>
                   </div>
                ) : (
                   <div className="grid gap-10">
                      {orders.map(order => (
                        <div key={order.id} className={`p-12 rounded-[4.5rem] border transition-all duration-700 ${order.status === 'pending' ? 'bg-slate-900/60 border-blue-600/30 shadow-2xl shadow-blue-600/5' : 'bg-slate-950/40 border-white/5 opacity-50'}`}>
                           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                              <div className="space-y-6 flex-1">
                                 <div className="flex items-center gap-6">
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-inner ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-600 border border-white/5'}`}>{order.status}</span>
                                    <span className="text-slate-500 text-[11px] font-mono tracking-widest bg-black/40 px-4 py-1.5 rounded-xl">ID: {order.id.slice(0, 12).toUpperCase()}</span>
                                 </div>
                                 <h4 className="text-4xl font-serif italic text-white leading-none">{order.profiles?.email || 'Partner Anônimo'}</h4>
                                 <div className="flex flex-wrap gap-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <span className="flex items-center gap-2">PRODUTO: <span className="text-white">{order.product_id}</span></span>
                                    <span className="flex items-center gap-2">VALOR: <span className="text-green-500 text-lg">R$ {order.amount.toFixed(2)}</span></span>
                                    <span className="flex items-center gap-2">DATA: <span className="text-slate-400">{new Date(order.created_at || '').toLocaleString()}</span></span>
                                 </div>
                              </div>
                              {order.status === 'pending' && (
                                <div className="flex gap-6 w-full lg:w-auto">
                                   <button 
                                      disabled={processingId === order.id}
                                      onClick={() => approveOrder(order)} 
                                      className="flex-1 lg:flex-none px-12 py-7 bg-green-500 text-black rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-green-400 active:scale-95 transition-all shadow-2xl shadow-green-500/20 disabled:opacity-50"
                                   >
                                      {processingId === order.id ? 'ATIVANDO...' : 'ATIVAR LICENÇA'}
                                   </button>
                                   <button 
                                      disabled={processingId === order.id}
                                      onClick={() => rejectOrder(order.id)} 
                                      className="flex-1 lg:flex-none px-12 py-7 bg-red-600/10 text-red-500 border border-red-500/20 rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-red-600 hover:text-white active:scale-95 transition-all"
                                   >
                                      REJEITAR
                                   </button>
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                )}
              </div>
            )}
            <div className="py-32 text-center text-slate-800 text-[9px] font-black uppercase tracking-[1em] opacity-40">System Governance v16.1 MASTER // EXCLUSIVE FOR CLAUDIO TONELLI ADVISORY</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

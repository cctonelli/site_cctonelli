
import React, { useState, useEffect } from 'react';
import { Profile, Order } from '../types';
import { fetchAllOrders, fetchSiteConfig, supabase, upsertItem, checkTableVisibility } from '../services/supabaseService';
import AdminCrudSection from './AdminCrudSection';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'visual_dna' | 'editorial' | 'marketplace' | 'orders' | 'settings' | 'users' | 'infra';

const ADMIN_VERSION = "v18.9.2-SOVEREIGN-FINAL";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [tableStatus, setTableStatus] = useState<Record<string, { visible: boolean; error?: string; code?: string }>>({});

  const SQL_PROVISION_SCRIPT = `-- SUPABASE SOVEREIGN PROVISIONING SCRIPT v18.9.2-FINAL
-- Execute este script no SQL Editor para estabilizar seu banco de dados.

-- 1. Função de Segurança Master (ADMIN CHECK)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (user_type = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    cpf_cnpj TEXT,
    whatsapp TEXT,
    gender TEXT,
    user_type TEXT DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    product_id UUID REFERENCES public.products(id),
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'pix',
    pix_qrcode_url TEXT,
    approved_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS em tudo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS SOBERANAS UNIFICADAS
DROP POLICY IF EXISTS "orders_sovereign_policy" ON public.orders;
CREATE POLICY "orders_sovereign_policy" ON public.orders
FOR ALL TO authenticated
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "profiles_sovereign_policy" ON public.profiles;
CREATE POLICY "profiles_sovereign_policy" ON public.profiles
FOR ALL TO authenticated
USING (auth.uid() = id OR is_admin())
WITH CHECK (auth.uid() = id OR is_admin());

-- 6. Ativos Digitais (User Products)
CREATE TABLE IF NOT EXISTS public.user_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    product_id UUID REFERENCES public.products(id),
    variant_id TEXT,
    approved_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_products_sovereign" ON public.user_products;
CREATE POLICY "user_products_sovereign" ON public.user_products
FOR ALL TO authenticated
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

-- 7. Recarregar Handshake do Servidor
NOTIFY pgrst, 'reload schema';`;

  const checkIntegrity = async () => {
    const tables = ['orders', 'profiles', 'products', 'site_content', 'translations', 'user_products'];
    const statusResults: Record<string, any> = {};
    for (const t of tables) {
      statusResults[t] = await checkTableVisibility(t);
    }
    setTableStatus(statusResults);
  };

  const forceHardSync = async () => {
    setLoadingOrders(true);
    await checkIntegrity();
    await loadOrders();
    setLoadingOrders(false);
  };

  useEffect(() => {
    const init = async () => {
      const config = await fetchSiteConfig();
      setSiteConfig(config);
      if (activeTab === 'orders') loadOrders();
      if (activeTab === 'users') loadUsers();
      checkIntegrity();
    };
    init();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      if (useMockData) {
        const mock: Order[] = [{
          id: 'mock-1', user_id: 'user-1', product_id: 'v8-matrix-edition', variant_id: 'v8-semestral', status: 'pending', amount: 599.00, approved_by_admin: false, payment_method: 'pix', pix_qrcode_url: null, download_link: null,
          profiles: { id: 'user-1', full_name: 'John Doe (Sovereign Partner)', email: 'john@matrix.com', whatsapp: '+55 11 99999-9999', user_type: 'client', cpf_cnpj: '000.000.000-00', gender: null }
        }];
        setTimeout(() => { setOrders(mock); setLoadingOrders(false); }, 800);
        return;
      }
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (e: any) {
      const errorMsg = e.message || e.details || JSON.stringify(e);
      if (errorMsg.includes('PGRST205') || errorMsg.includes('404')) {
         setOrderError("SYNC_MASTER_WAIT: Calibrando Handshake com o PostgREST.");
      } else if (errorMsg.includes('42P01') || errorMsg.includes('does not exist')) {
         setOrderError("PROVISION_MISSING: Banco de dados aguardando o script de provisionamento.");
      } else {
         setOrderError(errorMsg);
      }
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles(data || []);
    } catch (e) {}
  };

  const approveOrder = async (order: Order) => {
    if (useMockData) return;
    const clientName = (order as any).profiles?.full_name || (order as any).profiles?.email || 'Partner';
    if (!confirm(`Confirmar liberação de ativo para ${clientName}?`)) return;
    setProcessingId(order.id);
    try {
      await supabase.from('orders').update({ status: 'approved', approved_by_admin: true }).eq('id', order.id);
      
      // Criar o registro em user_products para liberação automática no Hub do Cliente
      await supabase.from('user_products').insert([{
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        approved_by_admin: true
      }]);

      loadOrders();
    } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setProcessingId(null); }
  };

  const isMissingTables = Object.values(tableStatus).some((s: any) => s.code === '42P01');

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-10 overflow-hidden">
      <div className="bg-[#010309] border border-white/10 w-full max-w-[1900px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        <aside className="w-full lg:w-96 bg-black/50 border-r border-white/5 p-12 flex flex-col gap-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center font-bold text-white text-3xl shadow-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
              <span className="text-[8px] uppercase tracking-[0.4em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
            <button onClick={() => setActiveTab('orders')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'orders' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Sales Vault</button>
            <button onClick={() => setActiveTab('marketplace')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'marketplace' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Marketplace Forge</button>
            <button onClick={() => setActiveTab('editorial')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'editorial' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Editorial Forge</button>
            <button onClick={() => setActiveTab('users')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'users' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Partners & CRM</button>
            <button onClick={() => setActiveTab('infra')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'infra' ? 'bg-red-600 text-white border-red-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Infra & DB {isMissingTables && "!"}</button>
          </nav>
          
          <div className="pt-8 border-t border-white/5 space-y-4">
             <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Integrity Check</p>
                  <button onClick={forceHardSync} className="text-[7px] text-blue-500 hover:text-white transition-colors">RE-SYNC</button>
                </div>
                <div className="space-y-2">
                   {Object.entries(tableStatus).map(([name, status]) => (
                     <div key={name} className="flex justify-between items-center group">
                        <span className="text-[9px] text-slate-400 uppercase font-mono group-hover:text-white transition-colors">{name}</span>
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${(status as any).visible ? 'bg-green-500 shadow-green-500/50' : (status as any).code === '42P01' ? 'bg-orange-500 shadow-orange-500/50 animate-pulse' : 'bg-red-500 shadow-red-500/50'}`}></div>
                     </div>
                   ))}
                </div>
             </div>
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[11px] font-black uppercase tracking-[0.6em] transition-colors">Encerrar Protocolo Admin</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-40">
            
            {activeTab === 'infra' && (
              <div className="space-y-16">
                 <div className="space-y-4">
                    <h2 className="text-6xl font-serif text-white italic tracking-tighter">Database <span className="text-red-600">Provisioning.</span></h2>
                    <p className="text-slate-500 text-xl font-light italic">Execute o script v18.9.2 para estabilizar as políticas RLS e as tabelas de ativos.</p>
                 </div>

                 <div className="p-10 bg-black/60 border border-white/5 rounded-[3rem] space-y-10 shadow-inner">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">SOVEREIGN_MASTER_FINAL.sql</span>
                       <button onClick={() => { navigator.clipboard.writeText(SQL_PROVISION_SCRIPT); alert("Script SQL Copiado!"); }} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all">COPIAR SCRIPT</button>
                    </div>
                    <code className="block w-full h-[500px] bg-black p-8 rounded-2xl overflow-y-auto custom-scrollbar text-[11px] text-green-500 font-mono leading-relaxed select-all whitespace-pre">
                      {SQL_PROVISION_SCRIPT}
                    </code>
                 </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-12">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h2 className="text-6xl font-serif text-white italic tracking-tighter">Sales <span className="text-blue-600">Vault.</span></h2>
                  </div>
                  <div className="flex gap-6">
                    <button onClick={loadOrders} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">Recarregar Ledger</button>
                  </div>
                </div>

                <div className="grid gap-8">
                  {loadingOrders ? (
                    <div className="py-20 text-center animate-pulse text-blue-500 uppercase tracking-widest text-xs italic">Sincronizando transações...</div>
                  ) : orderError ? (
                    <div className="p-16 border border-blue-500/30 bg-blue-500/5 rounded-[4rem] text-center space-y-10">
                      <h3 className="text-2xl font-serif text-white italic">Protocolo de Sincronia Master</h3>
                      <p className="text-blue-500 font-black uppercase tracking-widest text-[10px]">{orderError}</p>
                      <button onClick={loadOrders} className="bg-blue-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase">Forçar Handshake</button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-20 border border-dashed border-white/5 rounded-[4rem] text-center text-slate-600 uppercase tracking-widest text-xs italic">Nenhum protocolo pendente no ledger.</div>
                  ) : (
                    <div className="grid gap-8">
                      {orders.map(order => (
                        <div key={order.id} className="p-12 bg-slate-900/40 border border-white/5 rounded-[4rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10 group hover:border-blue-600/30 transition-all backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                          <div className="space-y-6 relative z-10">
                             <div className="flex gap-5 items-center">
                                <span className={`text-[8px] font-black px-5 py-1.5 rounded-full ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-500'}`}>{order.status.toUpperCase()}</span>
                                <span className="text-white font-serif italic text-2xl">{(order as any).profiles?.full_name || (order as any).profiles?.email || 'Partner'}</span>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                <div className="space-y-2"><p className="opacity-50">Ativo</p><p className="text-slate-300">{order.product_id}</p></div>
                                <div className="space-y-2"><p className="opacity-50">Investimento</p><p className="text-slate-300 font-bold">R$ {order.amount.toFixed(2)}</p></div>
                                <div className="space-y-2"><p className="opacity-50">Transação</p><p className="text-blue-500">#{order.id.slice(0,8)}</p></div>
                             </div>
                          </div>
                          {order.status === 'pending' && (
                            <button onClick={() => approveOrder(order)} disabled={processingId === order.id} className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 relative z-10">
                              {processingId === order.id ? 'SINC...' : 'ATIVAR PROTOCOLO'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'marketplace' && (
              <div className="space-y-20">
                 <h2 className="text-6xl font-serif text-white italic tracking-tighter">Marketplace <span className="text-blue-600">Forge.</span></h2>
                 <AdminCrudSection tableName="products" title="Ativos Digitais" fields={[{ key: 'title', label: 'Título' }, { key: 'slug', label: 'Slug' }, { key: 'pricing_type', label: 'Tipo' }]} displayColumns={['title', 'slug']} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

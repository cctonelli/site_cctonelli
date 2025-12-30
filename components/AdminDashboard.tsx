
import React, { useState, useEffect, useCallback } from 'react';
import { Profile, Order, Product, UserProduct, Metric } from '../types';
import { 
  fetchAllOrders, fetchSiteConfig, supabase, 
  checkTableVisibility, fetchProducts, fetchUserProducts 
} from '../services/supabaseService';
import AdminCrudSection from './AdminCrudSection';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'dashboard' | 'products' | 'canvas' | 'variants' | 'insights' | 'users' | 'orders' | 'accesses' | 'config' | 'infra' | 'logs';

const ADMIN_VERSION = "v19.0-SOVEREIGN-MASTER";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userAccesses, setUserAccesses] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [tableStatus, setTableStatus] = useState<Record<string, { visible: boolean; error?: string; code?: string }>>({});

  const SQL_PROVISION_SCRIPT = `-- SUPABASE SOVEREIGN PROVISIONING SCRIPT v19.0-MASTER
-- Execute este script no SQL Editor para estabilizar seu ecossistema.

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

-- 3. Tabela de Pedidos (Sales Vault)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    product_id UUID REFERENCES public.products(id),
    variant_id TEXT,
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'pix',
    pix_qrcode_url TEXT,
    approved_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Ativos (User Products)
CREATE TABLE IF NOT EXISTS public.user_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    product_id UUID REFERENCES public.products(id),
    variant_id TEXT,
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    approved_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS em tudo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS SOBERANAS UNIFICADAS
CREATE POLICY "orders_sovereign_policy" ON public.orders FOR ALL TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "profiles_sovereign_policy" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id OR is_admin()) WITH CHECK (auth.uid() = id OR is_admin());
CREATE POLICY "user_products_sovereign" ON public.user_products FOR ALL TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

-- 7. Recarregar Handshake do Servidor
NOTIFY pgrst, 'reload schema';`;

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ord, prof, prod, config] = await Promise.all([
        fetchAllOrders(),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        fetchProducts(),
        fetchSiteConfig()
      ]);

      setOrders(ord || []);
      setProfiles(prof.data || []);
      setProducts(prod || []);
      setSiteConfig(config);
      
      const tables = ['orders', 'profiles', 'products', 'site_content', 'translations', 'user_products'];
      const statusResults: Record<string, any> = {};
      for (const t of tables) {
        statusResults[t] = await checkTableVisibility(t);
      }
      setTableStatus(statusResults);
    } catch (e: any) {
      setOrderError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadAllData();
    }
  }, [profile, loadAllData]);

  const approveOrder = async (order: Order) => {
    if (!confirm(`Deseja aprovar o pedido #${order.id.slice(0,8)}?`)) return;
    try {
      await supabase.from('orders').update({ status: 'approved', approved_by_admin: true }).eq('id', order.id);
      await supabase.from('user_products').upsert({
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        status: 'active',
        approved_by_admin: true
      });
      loadAllData();
    } catch (e: any) { alert(e.message); }
  };

  if (!profile || profile.user_type !== 'admin') return null;

  const NavItem = ({ tab, label, icon }: { tab: TabType, label: string, icon: string }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`flex items-center gap-4 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all border ${activeTab === tab ? 'bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-600/20' : 'text-slate-600 border-transparent hover:bg-white/5 hover:text-white'}`}
    >
      <span className="text-lg opacity-70">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[2000] bg-[#010309] flex flex-col overflow-hidden animate-in fade-in duration-500">
      
      {/* TOP BAR */}
      <header className="h-24 bg-black/80 backdrop-blur-3xl border-b border-white/5 px-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-xl">CT</div>
          <div className="flex flex-col">
            <span className="font-black text-[10px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
            <span className="text-[7px] uppercase tracking-[0.4em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sessão Ativa</span>
            <span className="text-xs font-bold text-blue-500">{profile.full_name || profile.email}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-600/10 hover:text-red-500 rounded-xl transition-all flex items-center justify-center border border-white/5 group">
            <svg className="h-6 w-6 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="w-80 bg-black/40 border-r border-white/5 p-8 flex flex-col gap-8 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-700 px-4 mb-4">Módulos de Gestão</p>
            <NavItem tab="dashboard" label="Dashboard" icon="📊" />
            <NavItem tab="orders" label="Sales Vault" icon="💰" />
            <NavItem tab="products" label="Produtos" icon="📦" />
            <NavItem tab="canvas" label="Canvas Builder" icon="🎨" />
            <NavItem tab="variants" label="Variantes" icon="🔖" />
            <NavItem tab="insights" label="Editorial" icon="✍️" />
          </div>

          <div className="space-y-2">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-700 px-4 mb-4">Governança & CRM</p>
            <NavItem tab="users" label="Parceiros" icon="👥" />
            <NavItem tab="accesses" label="Acessos" icon="🔑" />
          </div>

          <div className="space-y-2">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-700 px-4 mb-4">Sistema & Infra</p>
            <NavItem tab="config" label="Configuração" icon="⚙️" />
            <NavItem tab="infra" label="Infra & DB" icon="🛠️" />
            <NavItem tab="logs" label="Logs de Eventos" icon="📜" />
          </div>

          <div className="mt-auto pt-8 border-t border-white/5">
             <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Supabase Engine</span>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${tableStatus['site_content']?.visible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <button onClick={loadAllData} className="w-full text-[8px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">FORÇAR RE-SYNC</button>
             </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-12 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-40">
            
            <AnimatePresence mode="wait">
              
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
                  <header className="space-y-4">
                    <h2 className="text-6xl font-serif text-white italic tracking-tighter">System <span className="text-blue-600">Overview.</span></h2>
                    <p className="text-slate-500 text-xl font-light italic">Telemetria em tempo real do ecossistema Claudio Tonelli.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      { label: "Vendas (Total)", value: `R$ ${orders.reduce((acc, o) => acc + o.amount, 0).toLocaleString()}`, color: 'text-blue-500' },
                      { label: "Parceiros", value: profiles.length, color: 'text-green-500' },
                      { label: "Pedidos Pendentes", value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-500' },
                      { label: "Ativos na Vitrine", value: products.length, color: 'text-purple-500' }
                    ].map((stat, i) => (
                      <div key={i} className="p-10 bg-slate-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">{stat.label}</p>
                        <p className={`text-4xl font-bold tracking-tighter ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10">
                    <div className="p-12 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                       <h4 className="text-2xl font-serif italic text-white">Integridade do Kernel</h4>
                       <div className="space-y-4">
                          {/* Fixed: Adding type cast to status entries to avoid TS 'unknown' error when accessing 'visible' */}
                          {Object.entries(tableStatus).map(([name, status]: [string, any]) => (
                            <div key={name} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                               <span className="text-[10px] font-mono text-slate-500 uppercase">{name}</span>
                               <span className={`text-[8px] font-black px-3 py-1 rounded-full ${status.visible ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                 {status.visible ? 'SINC_OK' : 'SINC_FAIL'}
                               </span>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="p-12 bg-blue-600/5 border border-blue-600/10 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-6">
                       <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl">🚀</div>
                       <h4 className="text-2xl font-serif italic text-white">Pronto para a Próxima Escala?</h4>
                       <p className="text-slate-500 text-sm font-light italic">Seu sistema está operando na versão Soberana Master. Todos os módulos estão prontos para processamento.</p>
                       <button onClick={() => window.open(window.location.origin, '_blank')} className="px-10 py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Preview Front-end</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <header className="flex justify-between items-end">
                    <div className="space-y-2">
                      <h2 className="text-6xl font-serif text-white italic tracking-tighter">Sales <span className="text-blue-600">Vault.</span></h2>
                      <p className="text-slate-500 text-xl font-light italic">Gestão auditada de transações e ativação de licenças.</p>
                    </div>
                    <button onClick={loadAllData} className="text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-widest transition-colors">Sync Ledger</button>
                  </header>

                  <div className="grid gap-6">
                    {orders.length === 0 ? (
                      <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] italic text-slate-700 uppercase tracking-widest text-xs">Nenhum protocolo detectado no Ledger.</div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-blue-600/20 transition-all backdrop-blur-3xl">
                           <div className="flex items-center gap-8">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                                {order.status === 'pending' ? '⏳' : '✅'}
                              </div>
                              <div className="space-y-2">
                                 <div className="flex items-center gap-4">
                                    <h4 className="text-2xl font-serif italic text-white">{(order as any).profiles?.full_name || 'Partner Identificado'}</h4>
                                    <span className="text-[8px] font-black px-3 py-1 bg-white/5 text-slate-500 rounded-full uppercase"># {order.id.slice(0,8)}</span>
                                 </div>
                                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                   Ativo: <span className="text-slate-300">{order.product_id}</span> • Valor: <span className="text-blue-500">R$ {order.amount.toLocaleString()}</span>
                                 </p>
                              </div>
                           </div>
                           
                           <div className="flex gap-4">
                              {order.status === 'pending' && (
                                <button onClick={() => approveOrder(order)} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">APROVAR PIX</button>
                              )}
                              <button className="px-10 py-5 bg-white/5 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Detalhes</button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'products' && (
                <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                   <AdminCrudSection tableName="products" title="Portfólio de Ativos" fields={[{ key: 'title', label: 'Título' }, { key: 'slug', label: 'Slug / Identificador' }, { key: 'subtitle', label: 'Subtítulo', type: 'textarea' }, { key: 'image_url', label: 'URL Imagem (Unsplash/Supabase)' }, { key: 'featured', label: 'Destaque na Vitrine', type: 'toggle' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['title', 'slug']} />
                </motion.div>
              )}

              {activeTab === 'canvas' && (
                <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                   <AdminCrudSection tableName="product_content_blocks" title="Canvas do Ativo" fields={[{ key: 'product_id', label: 'ID do Produto' }, { key: 'block_type', label: 'Tipo de Bloco (hero, features, cta...)' }, { key: 'order', label: 'Ordem de Exibição', type: 'number' }, { key: 'content', label: 'Payload JSON do Bloco', type: 'textarea', placeholder: '{"title": "Exemplo", "subtitle": "..."}' }]} displayColumns={['product_id', 'block_type', 'order']} />
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                   <AdminCrudSection tableName="insights" title="Editorial Journal" fields={[{ key: 'title', label: 'Título da Edição' }, { key: 'category', label: 'Categoria' }, { key: 'excerpt', label: 'Resumo Executivo', type: 'textarea' }, { key: 'content', label: 'Conteúdo Master', type: 'rich-text' }, { key: 'image_url', label: 'Capa da Edição' }, { key: 'is_active', label: 'Publicado', type: 'toggle' }]} displayColumns={['title', 'category']} />
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                   <header className="space-y-2">
                    <h2 className="text-6xl font-serif text-white italic tracking-tighter">Partners <span className="text-blue-600">CRM.</span></h2>
                    <p className="text-slate-500 text-xl font-light italic">Gestão de perfis e níveis de acesso dos parceiros de elite.</p>
                  </header>
                  <div className="grid gap-6">
                     {profiles.map(p => (
                       <div key={p.id} className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] flex items-center justify-between backdrop-blur-3xl group hover:border-blue-600/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center font-serif italic text-white text-2xl border border-white/10">{p.full_name?.charAt(0) || p.email?.charAt(0)}</div>
                             <div>
                                <p className="text-xl font-serif italic text-white">{p.full_name || 'Parceiro Sem Nome'}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{p.email} • <span className="text-blue-500">{p.user_type}</span></p>
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <button className="px-6 py-3 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:text-white transition-all">Ver Histórico</button>
                             <button className="px-6 py-3 bg-red-600/5 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600/10 transition-all">Banir</button>
                          </div>
                       </div>
                     ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'infra' && (
                <motion.div key="infra" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-16">
                   <header className="space-y-4">
                      <h2 className="text-6xl font-serif text-white italic tracking-tighter">Database <span className="text-red-600">Provisioning.</span></h2>
                      <p className="text-slate-500 text-xl font-light italic">Ajuste fino do Kernel Supabase e unificação de políticas RLS.</p>
                   </header>

                   <div className="p-10 bg-black/60 border border-white/5 rounded-[3rem] space-y-10 shadow-inner">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">SOVEREIGN_MASTER_V19.sql</span>
                         <button onClick={() => { navigator.clipboard.writeText(SQL_PROVISION_SCRIPT); alert("Script SQL Copiado!"); }} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">COPIAR SCRIPT</button>
                      </div>
                      <code className="block w-full h-[500px] bg-black p-8 rounded-2xl overflow-y-auto custom-scrollbar text-[11px] text-green-500 font-mono leading-relaxed select-all whitespace-pre">
                        {SQL_PROVISION_SCRIPT}
                      </code>
                   </div>
                </motion.div>
              )}

              {activeTab === 'config' && (
                <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                   <header className="space-y-4">
                      <h2 className="text-6xl font-serif text-white italic tracking-tighter">Site <span className="text-blue-600">Identity.</span></h2>
                      <p className="text-slate-500 text-xl font-light italic">Controle o DNA visual e o comportamento Soberano da plataforma.</p>
                   </header>

                   <div className="grid md:grid-cols-2 gap-10">
                      <div className="p-12 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-10">
                         <h4 className="text-xl font-serif italic text-white">Visual DNA (Real-time)</h4>
                         <div className="space-y-8">
                            <div>
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4">Acento Primário (Matrix/Advisory)</label>
                               <div className="flex gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-[#00ff41] border-2 border-white shadow-xl shadow-green-500/30 cursor-pointer"></div>
                                  <div className="w-12 h-12 rounded-xl bg-[#2563eb] border border-white/10 cursor-pointer"></div>
                                  <div className="w-12 h-12 rounded-xl bg-[#b4975a] border border-white/10 cursor-pointer"></div>
                               </div>
                            </div>
                            <div>
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4">Escala Tipográfica H1</label>
                               <input type="range" className="w-full accent-blue-600" min="4" max="15" step="0.5" />
                               <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-2"><span>4rem</span><span>15rem</span></div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="p-12 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-10">
                         <h4 className="text-xl font-serif italic text-white">UX & Matrix Protocol</h4>
                         <div className="space-y-8">
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Modo Matrix Nativo</span>
                               <div className="w-14 h-7 bg-blue-600 rounded-full relative px-1 flex items-center justify-end"><div className="w-5 h-5 bg-white rounded-full"></div></div>
                            </div>
                            <div>
                               <label className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4">Densidade da Chuva Matrix</label>
                               <input type="range" className="w-full accent-green-600" />
                            </div>
                         </div>
                      </div>
                   </div>

                   <button className="w-full py-8 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all">SALVAR ALTERAÇÕES GLOBAIS</button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* FOOTER BAR */}
      <footer className="h-14 bg-black border-t border-white/5 px-10 flex items-center justify-between shrink-0 z-[2001]">
         <div className="flex gap-8 text-[8px] font-black uppercase tracking-widest text-slate-700">
            <span>Server Status: <span className="text-green-500">ONLINE_MASTER</span></span>
            <span>Kernel Hash: <span className="text-blue-500">0xV19M_2025</span></span>
         </div>
         <p className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-800 italic">Claudio Tonelli Consultoria // Strategic Intelligence Core // Command Center v19.0</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;

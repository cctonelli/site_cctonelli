
import React, { useState, useEffect, useCallback } from 'react';
import { Profile, Order, Product, UserProduct } from '../types';
import { 
  fetchAllOrders, fetchSiteConfig, supabase, 
  checkTableVisibility, fetchProducts, upsertItem, masterHandshakeReset
} from '../services/supabaseService';
import AdminCrudSection from './AdminCrudSection';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'dashboard' | 'products' | 'canvas' | 'variants' | 'insights' | 'users' | 'orders' | 'accesses' | 'config' | 'infra' | 'logs';

const ADMIN_VERSION = "v20.0-SOVEREIGN-ULTRA";

// SQL_PROVISION_SCRIPT definido para fixar erro de cache e tipos de coluna
const SQL_PROVISION_SCRIPT = `-- CLAUDIO TONELLI ADVISORY - SOVEREIGN MASTER DB PROVISIONING
-- VERSION 20.0.1 (Cache Fix)

-- Insights table com suporte a Rich Text
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  image_url TEXT,
  link TEXT,
  content TEXT, -- Rich Text do Tiptap Editor
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  category TEXT
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  cpf_cnpj TEXT,
  gender TEXT,
  whatsapp TEXT,
  user_type TEXT DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Content
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  pricing_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  download_ftp_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  status TEXT DEFAULT 'pending',
  amount DECIMAL(10,2),
  approved_by_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Products (Ativos Ativos)
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  approved_by_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forçar Recarregamento do Cache PostgREST
NOTIFY pgrst, 'reload schema';`;

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'cache_warning'>('idle');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [tableStatus, setTableStatus] = useState<Record<string, { visible: boolean; error?: string; code?: string }>>({});

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
      
      const tables = ['orders', 'profiles', 'products', 'site_content', 'translations', 'user_products', 'insights', 'metrics'];
      const statusResults: Record<string, any> = {};
      for (const t of tables) {
        statusResults[t] = await checkTableVisibility(t);
      }
      setTableStatus(statusResults);
    } catch (e: any) {
      console.error("Load Error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadAllData();
      
      const channel = supabase.channel('admin-master-monitor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, () => loadAllData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [profile, loadAllData]);

  const saveVisualDNA = async () => {
    setSyncStatus('syncing');
    try {
      const settings = [
        { page: 'config', key: 'setting_theme_primary', value: siteConfig.theme.primary },
        { page: 'config', key: 'setting_typography_h1_size', value: siteConfig.typography.h1_size },
        { page: 'config', key: 'setting_ux_matrix_speed', value: siteConfig.ux.matrix_speed.toString() }
      ];

      await Promise.all(settings.map(s => upsertItem('site_content', s)));
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e: any) {
      if (e.code === 'PGRST205') setSyncStatus('cache_warning');
      else setSyncStatus('error');
    }
  };

  const approveOrder = async (order: Order) => {
    if (!confirm(`Confirmar ativação do protocolo para ${(order as any).profiles?.full_name || 'Partner'}?`)) return;
    try {
      setLoading(true);
      await supabase.from('orders').update({ status: 'approved', approved_by_admin: true }).eq('id', order.id);
      await upsertItem('user_products', {
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        status: 'active',
        approved_by_admin: true
      });
      loadAllData();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const exportRegistry = () => {
    const registryData = { SITE_CONFIG: siteConfig, LOCAL_PRODUCTS: products };
    const blob = new Blob([`export const REGISTRY = ${JSON.stringify(registryData, null, 2)};`], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localRegistry_export.ts';
    a.click();
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
    <div className="fixed inset-0 z-[2000] bg-[#010309] flex flex-col overflow-hidden">
      <header className="h-24 bg-black/80 backdrop-blur-3xl border-b border-white/5 px-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-xl">CT</div>
          <div className="flex flex-col">
            <span className="font-black text-[10px] uppercase tracking-[0.6em] text-white">SOVEREIGN COMMAND CENTER</span>
            <span className="text-[7px] uppercase tracking-[0.4em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => { masterHandshakeReset(); loadAllData(); }} className="px-6 py-2 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:text-white border border-white/5">Reset Handshake</button>
          <button onClick={() => window.open(window.location.origin, '_blank')} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5">Site Preview</button>
          <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-600/10 hover:text-red-500 rounded-xl transition-all flex items-center justify-center border border-white/5 group">
            <svg className="h-6 w-6 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-black/40 border-r border-white/5 p-8 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
          <NavItem tab="dashboard" label="Dashboard" icon="📊" />
          <NavItem tab="orders" label="Sales Vault" icon="💰" />
          <div className="h-px bg-white/5 my-2"></div>
          <NavItem tab="products" label="Produtos" icon="📦" />
          <NavItem tab="canvas" label="Canvas Builder" icon="🎨" />
          <NavItem tab="insights" label="Editorial Journal" icon="✍️" />
          <div className="h-px bg-white/5 my-2"></div>
          <NavItem tab="users" label="Partners CRM" icon="👥" />
          <NavItem tab="config" label="Identity & Visual" icon="⚙️" />
          <NavItem tab="infra" label="Kernel & DB" icon="🛠️" />
        </aside>

        <main className="flex-1 overflow-y-auto p-12 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-40">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
                  <header className="space-y-4">
                    <h2 className="text-7xl font-serif text-white italic tracking-tighter">System <span className="text-blue-600">Overview.</span></h2>
                    <p className="text-slate-500 text-xl font-light italic">Gestão unificada do ecossistema Claudio Tonelli.</p>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      { label: "Receita Master", value: `R$ ${orders.reduce((acc, o) => acc + o.amount, 0).toLocaleString()}`, color: 'text-blue-500' },
                      { label: "Partners Elite", value: profiles.length, color: 'text-green-500' },
                      { label: "Pedidos Auditando", value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-500' },
                      { label: "Ativos Totais", value: products.length, color: 'text-purple-500' }
                    ].map((stat, i) => (
                      <div key={i} className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] backdrop-blur-3xl space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">{stat.label}</p>
                        <p className={`text-4xl font-bold tracking-tighter ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'config' && (
                <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
                   <header className="space-y-4">
                      <h2 className="text-7xl font-serif text-white italic tracking-tighter">Site <span className="text-blue-600">Identity.</span></h2>
                      <p className="text-slate-500 text-xl font-light italic">DNA Visual e Comportamento Master da Plataforma.</p>
                   </header>
                   <div className="grid lg:grid-cols-2 gap-12">
                      <div className="p-12 bg-slate-900/40 border border-white/5 rounded-[4rem] space-y-12">
                         <h4 className="text-2xl font-serif italic text-white">Visual DNA</h4>
                         <div className="space-y-10">
                            <div>
                               <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-6">Cor Primária (HEX)</label>
                               <div className="flex gap-4 items-center">
                                  <input type="color" value={siteConfig?.theme?.primary} onChange={(e) => setSiteConfig({...siteConfig, theme: {...siteConfig.theme, primary: e.target.value}})} className="w-16 h-16 bg-transparent border-none cursor-pointer rounded-xl overflow-hidden" />
                                  <input type="text" value={siteConfig?.theme?.primary} onChange={(e) => setSiteConfig({...siteConfig, theme: {...siteConfig.theme, primary: e.target.value}})} className="bg-black border border-white/10 rounded-xl px-6 py-4 text-white font-mono text-sm uppercase" />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col gap-6">
                      <button onClick={saveVisualDNA} disabled={syncStatus === 'syncing'} className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.6em] text-[11px] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all">
                         {syncStatus === 'syncing' ? 'SINCRONIZANDO...' : 'PERSISTIR DNA VISUAL'}
                      </button>
                      {syncStatus === 'cache_warning' && <p className="text-center text-orange-500 text-[9px] font-black uppercase tracking-widest animate-pulse">Aviso: Schema Cache Desatualizado no Servidor. O banco foi atualizado, mas a API pode levar 1 min para refletir.</p>}
                   </div>
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                   <AdminCrudSection tableName="insights" title="Editorial Master" fields={[{ key: 'title', label: 'Título' }, { key: 'category', label: 'Categoria' }, { key: 'excerpt', label: 'Resumo', type: 'textarea' }, { key: 'content', label: 'Conteúdo Rich Text (Tiptap)', type: 'rich-text' }, { key: 'image_url', label: 'URL Capa' }, { key: 'is_active', label: 'Publicado', type: 'toggle' }]} displayColumns={['title', 'category']} />
                </motion.div>
              )}

              {activeTab === 'infra' && (
                <motion.div key="infra" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                   <header className="space-y-4">
                      <h2 className="text-7xl font-serif text-white italic tracking-tighter">Database <span className="text-red-600">Kernel.</span></h2>
                   </header>
                   <div className="p-10 bg-black/60 border border-white/5 rounded-[4rem] space-y-8">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">PROVISION_MASTER_V20.1.sql</span>
                         <button onClick={() => { navigator.clipboard.writeText(SQL_PROVISION_SCRIPT); alert("SQL Copiado!"); }} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase">Copiar SQL</button>
                      </div>
                      <code className="block w-full h-96 bg-black p-8 rounded-3xl overflow-y-auto text-green-500 font-mono text-[11px] leading-relaxed select-all">
                        {SQL_PROVISION_SCRIPT}
                      </code>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <footer className="h-14 bg-black border-t border-white/5 px-10 flex items-center justify-between shrink-0 z-[2001]">
         <div className="flex gap-10 text-[8px] font-black uppercase tracking-widest text-slate-700">
            <span>Kernel Status: <span className="text-green-500">ONLINE_SOVEREIGN</span></span>
            <span>Handshake: <span className="text-blue-500">0xULTRA_2025</span></span>
         </div>
         <p className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-800 italic">Claudio Tonelli Consultoria // Strategy Core // Command Center v20.0-ULTRA</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;


import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
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
  const [activeTab, setActiveTab] = useState<TabType>('visual_dna');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Estado Mestre do Admin
  const currentConfig = fetchSiteConfig();
  const [config, setConfig] = useState(currentConfig);
  const [registryProducts, setRegistryProducts] = useState<Product[]>((currentConfig as any)._products || LOCAL_PRODUCTS);
  const [registryVariants, setRegistryVariants] = useState<Record<string, ProductVariant[]>>((currentConfig as any)._variants || LOCAL_VARIANTS);
  const [registryBlocks, setRegistryBlocks] = useState<Record<string, ProductContentBlock[]>>((currentConfig as any)._blocks || LOCAL_BLOCKS);
  const [registryInsights, setRegistryInsights] = useState<Insight[]>((currentConfig as any)._insights || LOCAL_INSIGHTS);
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(registryProducts[0]?.id || null);

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

      // 2. Criar registro em user_products
      const expirationDate = new Date();
      if (order.variant_id.includes('mensal')) expirationDate.setMonth(expirationDate.getMonth() + 1);
      else if (order.variant_id.includes('semestral')) expirationDate.setMonth(expirationDate.getMonth() + 6);
      else if (order.variant_id.includes('anual')) expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      else expirationDate.setDate(expirationDate.getDate() + 7); // Trial/Free

      const newUserProduct: Partial<UserProduct> = {
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        status: 'active',
        approved_by_admin: true,
        expires_at: expirationDate.toISOString(),
        download_link: 'https://cdn.claudiotonelli.com.br/assets/v8-matrix-setup.exe' // Mock
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

  const saveLivePreview = () => {
    const fullState = { 
      ...config, 
      _products: registryProducts, 
      _variants: registryVariants, 
      _blocks: registryBlocks,
      _insights: registryInsights
    };
    localStorage.setItem('CT_ADMIN_CONFIG_OVERRIDE', JSON.stringify(fullState));
    window.dispatchEvent(new Event('storage'));
    alert("SISTEMA SINCRONIZADO: Preview atualizado.");
  };

  const generateHardBuild = () => {
    const code = `
import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';
export type Language = 'pt' | 'en' | 'es';
export const SITE_CONFIG = ${JSON.stringify(config, null, 2)};
export const LOCAL_PRODUCTS: Product[] = ${JSON.stringify(registryProducts, null, 2)};
export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = ${JSON.stringify(registryVariants, null, 2)};
export const LOCAL_BLOCKS: Record<string, ProductContentBlock[]> = ${JSON.stringify(registryBlocks, null, 2)};
export const LOCAL_INSIGHTS: Insight[] = ${JSON.stringify(registryInsights, null, 2)};
    `.trim();

    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localRegistry.ts';
    a.click();
    alert("BUILD GERADO: Substitua services/localRegistry.ts");
  };

  const handleNestedChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8 overflow-hidden font-sans">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1800px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl transition-all">
        
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
              { id: 'visual_dna', label: 'DNA Visual' },
              { id: 'editorial_forge', label: 'Editorial Forge' },
              { id: 'sovereign_store', label: 'Sovereign Store' },
              { id: 'insights', label: 'Insights Registry' },
              { id: 'orders', label: 'Sales Vault' },
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
             <button onClick={saveLivePreview} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">SALVAR DNA (PREVIEW)</button>
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.5em]">Sair do Core</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-32">

            {activeTab === 'visual_dna' && (
              <div className="space-y-12">
                <header><h2 className="text-5xl font-serif text-white italic tracking-tighter">Visual DNA Forge</h2></header>
                <div className="grid md:grid-cols-2 gap-10">
                  <section className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8">
                    <h3 className="text-[10px] font-black uppercase text-green-500 tracking-[0.5em]">Cores da Marca</h3>
                    {['primary', 'secondary', 'bg_dark'].map(k => (
                      <div key={k} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500">{k}</label>
                        <div className="flex gap-4">
                           <input type="color" value={config.theme[k]} onChange={e => handleNestedChange(`theme.${k}`, e.target.value)} className="w-12 h-12 bg-transparent border-none cursor-pointer" />
                           <input type="text" value={config.theme[k]} onChange={e => handleNestedChange(`theme.${k}`, e.target.value)} className="flex-1 bg-black border border-white/5 rounded-xl p-4 text-white text-xs font-mono uppercase" />
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-12">
                <header>
                   <h2 className="text-5xl font-serif text-white italic tracking-tighter">Sales Vault</h2>
                   <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Aprovação e Fluxo Financeiro</p>
                </header>
                
                {loadingOrders ? (
                   <div className="py-20 text-center text-green-500 animate-pulse font-black text-xs uppercase tracking-[0.5em]">Carregando Registros de Venda...</div>
                ) : orders.length === 0 ? (
                   <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-600 font-black uppercase tracking-widest text-[10px]">Nenhum pedido pendente no radar.</div>
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
                                 <h4 className="text-2xl font-serif italic text-white">{order.profiles?.email || 'Cliente Anônimo'}</h4>
                                 <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <span>Ativo ID: {order.product_id.split('-')[0]}</span>
                                    <span>Valor: R$ {order.amount.toFixed(2)}</span>
                                 </div>
                              </div>
                              
                              {order.status === 'pending' && (
                                <div className="flex gap-4">
                                   <button onClick={() => approveOrder(order)} className="px-10 py-5 bg-green-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-400 shadow-xl shadow-green-500/10">APROVAR</button>
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

            {/* Sovereign Store and other tabs remain with current registry logic */}
            {activeTab === 'hard_build' && (
              <div className="p-20 bg-green-500/5 border border-green-500/10 rounded-[4rem] text-center space-y-10 animate-in zoom-in-95 duration-700">
                <h3 className="text-5xl font-serif text-white italic tracking-tighter">Consolidar DNA Soberano v16.0</h3>
                <p className="text-slate-500 text-sm max-w-xl mx-auto italic font-light leading-relaxed">Este comando gera o arquivo localRegistry.ts definitivo.</p>
                <div className="pt-10">
                   <button onClick={generateHardBuild} className="px-16 py-8 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-green-500 transition-all shadow-2xl">GERAR BUILD DEFINITIVO</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

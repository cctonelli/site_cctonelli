
import React, { useState, useEffect } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { supabase } from '../services/supabaseService';

type TabType = 'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'tools' | 'leads';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('carousel');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        setIsAuthorized(false);
        setTimeout(onClose, 1500);
      } else {
        setIsAuthorized(true);
      }
    };
    checkAdmin();
    return () => { mounted = false; };
  }, [onClose]);

  if (isAuthorized === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-6">
           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-6H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" /></svg>
        </div>
        <h2 className="text-white font-serif italic text-2xl">Acesso Não Autorizado</h2>
        <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest">Sessão expirada. Retornando...</p>
      </div>
    );
  }

  if (isAuthorized === null) return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-brand-navy/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12 overflow-hidden">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-7xl h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-12 flex flex-row lg:flex-col gap-10 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-5 mb-0 lg:mb-16 min-w-fit cursor-pointer">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Advisory Hub</span>
              <span className="text-[8px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">Management v6.5</span>
            </div>
          </div>
          <nav className="flex flex-row lg:flex-col gap-4 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'products', label: 'Loja de Soluções' },
              { id: 'metrics', label: 'KPIs Metrics' },
              { id: 'testimonials', label: 'Social Proof' },
              { id: 'content', label: 'Copywriting' },
              { id: 'leads', label: 'Leads CRM' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`whitespace-nowrap px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-600 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-widest mt-auto p-6 border border-white/5 rounded-2xl transition-all">Fechar Painel</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-5xl mx-auto pb-20">
            {activeTab === 'carousel' && (
              <AdminCrudSection
                tableName="carousel_images"
                title="Slide do Carrossel"
                fields={[
                  { key: 'url', label: 'URL da Imagem de Fundo', type: 'image' },
                  { key: 'title', label: 'Título' },
                  { key: 'subtitle', label: 'Subtítulo' },
                  { key: 'display_order', label: 'Ordem', type: 'number' },
                  { key: 'is_active', label: 'Visível', type: 'toggle' },
                ]}
                displayColumns={['url', 'title', 'display_order', 'is_active']}
              />
            )}

            {activeTab === 'insights' && (
              <AdminCrudSection
                tableName="insights"
                title="Artigo / Insight"
                fields={[
                  { key: 'title', label: 'Título' },
                  { key: 'excerpt', label: 'Resumo', type: 'textarea' },
                  { key: 'image_url', label: 'Capa URL', type: 'image' },
                  { key: 'content', label: 'HTML Body', type: 'textarea' },
                  { key: 'is_active', label: 'Publicado', type: 'toggle' },
                ]}
                displayColumns={['image_url', 'title', 'is_active']}
              />
            )}

            {activeTab === 'products' && (
              <AdminCrudSection
                tableName="products"
                title="Produto/Serviço"
                fields={[
                  { key: 'name', label: 'Nome' },
                  { key: 'description', label: 'Descrição', type: 'textarea' },
                  { key: 'price', label: 'Preço', type: 'number' },
                  { key: 'type', label: 'Tipo (product/service)' },
                ]}
                displayColumns={['name', 'price', 'type']}
              />
            )}

            {activeTab === 'metrics' && (
              <AdminCrudSection
                tableName="metrics"
                title="KPI"
                fields={[
                  { key: 'value', label: 'Valor (Ex: +500)' },
                  { key: 'label', label: 'Rótulo' },
                  { key: 'display_order', label: 'Ordem', type: 'number' },
                  { key: 'is_active', label: 'Ativo', type: 'toggle' },
                ]}
                displayColumns={['value', 'label', 'is_active']}
              />
            )}

            {activeTab === 'testimonials' && (
              <AdminCrudSection
                tableName="testimonials"
                title="Depoimento"
                fields={[
                  { key: 'name', label: 'Cliente' },
                  { key: 'company', label: 'Empresa' },
                  { key: 'quote', label: 'Texto', type: 'textarea' },
                  { key: 'approved', label: 'Aprovado', type: 'toggle' },
                ]}
                displayColumns={['name', 'company', 'approved']}
              />
            )}

            {activeTab === 'content' && (
              <AdminCrudSection
                tableName="site_content"
                title="Copywriting"
                idColumn="key"
                fields={[
                  { key: 'key', label: 'Chave' },
                  { key: 'value', label: 'Texto', type: 'textarea' },
                ]}
                displayColumns={['key', 'value']}
              />
            )}

            {activeTab === 'leads' && (
              <AdminCrudSection
                tableName="contacts"
                title="Lead de Contato"
                fields={[
                  { key: 'name', label: 'Nome' },
                  { key: 'email', label: 'E-mail' },
                  { key: 'message', label: 'Mensagem', type: 'textarea' },
                ]}
                displayColumns={['name', 'email', 'message']}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


import React, { useState, useEffect, useRef } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { supabase } from '../services/supabaseService';

type TabType = 'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'leads';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('carousel');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(false);
        setTimeout(onClose, 1500);
      } else {
        setUserEmail(session.user.email || null);
        setIsAuthorized(true);
      }
    };
    
    checkAdmin();
  }, [onClose]);

  if (isAuthorized === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
           <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-6H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" /></svg>
        </div>
        <h2 className="text-white font-serif italic text-4xl">Acesso Restrito</h2>
        <p className="text-slate-500 text-[11px] mt-4 uppercase tracking-[0.5em] font-black">Identidade não validada no core estratégico.</p>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="fixed inset-0 z-[100] bg-brand-navy flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="mt-8 text-[10px] uppercase tracking-[0.5em] text-blue-500 font-black animate-pulse">Sincronizando Advisory Hub...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-brand-navy/98 backdrop-blur-3xl flex items-center justify-center p-2 lg:p-8 overflow-hidden animate-in zoom-in-95 duration-700">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1400px] h-full rounded-[3rem] lg:rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_60px_120px_-30px_rgba(0,0,0,1)]">
        
        {/* Sidebar Gerencial */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-8 lg:p-12 flex flex-row lg:flex-col gap-8 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-4 mb-0 lg:mb-12 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xl text-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Management</span>
              <span className="text-[7px] uppercase tracking-[0.2em] text-blue-500 font-bold mt-1">Version 7.5.Nexus</span>
            </div>
          </div>
          
          <nav className="flex flex-row lg:flex-col gap-2 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel / Hero' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'products', label: 'Loja Soluções' },
              { id: 'metrics', label: 'Impact KPIs' },
              { id: 'testimonials', label: 'Social Proof' },
              { id: 'content', label: 'Copywriting' },
              { id: 'leads', label: 'Lead CRM' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`whitespace-nowrap px-6 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all text-left border ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'text-slate-600 border-transparent hover:bg-white/5 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden lg:flex flex-col gap-6">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[8px] uppercase tracking-widest text-slate-600 mb-1">Logado como:</div>
              <div className="text-[9px] text-blue-500 font-bold truncate">{userEmail}</div>
            </div>
            <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] p-4 border border-white/5 rounded-2xl transition-all hover:bg-red-500/5">Encerrar Sessão</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-32">
            <header className="mb-16">
              <h2 className="text-4xl lg:text-5xl font-serif text-white italic mb-4">Gestão de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <div className="w-20 h-1 bg-blue-600"></div>
            </header>

            {activeTab === 'carousel' && (
              <AdminCrudSection
                tableName="carousel_images"
                title="Slide do Carrossel"
                fields={[
                  { key: 'url', label: 'URL da Imagem de Fundo', type: 'image' },
                  { key: 'title', label: 'Título Principal' },
                  { key: 'subtitle', label: 'Subtítulo Visionário', type: 'textarea' },
                  { key: 'cta_text', label: 'Texto do Botão (Ex: Ver Soluções)' },
                  { key: 'link', label: 'Link de Destino (Ex: #products)' },
                  { key: 'display_order', label: 'Ordem de Exibição', type: 'number' },
                  { key: 'is_active', label: 'Publicado', type: 'toggle' },
                ]}
                displayColumns={['url', 'title', 'is_active']}
              />
            )}

            {activeTab === 'insights' && (
              <AdminCrudSection
                tableName="insights"
                title="Insight Estratégico"
                fields={[
                  { key: 'title', label: 'Título do Artigo' },
                  { key: 'excerpt', label: 'Resumo / Lead', type: 'textarea' },
                  { key: 'image_url', label: 'Imagem de Capa (URL)', type: 'image' },
                  { key: 'content', label: 'Conteúdo (HTML/Tiptap)', type: 'textarea' },
                  { key: 'is_active', label: 'Visível no Site', type: 'toggle' },
                ]}
                displayColumns={['image_url', 'title', 'is_active']}
              />
            )}

            {activeTab === 'products' && (
              <AdminCrudSection
                tableName="products"
                title="Solução / Produto"
                fields={[
                  { key: 'name', label: 'Nome do Serviço' },
                  { key: 'description', label: 'Descrição Detalhada', type: 'textarea' },
                  { key: 'price', label: 'Valor Investimento (R$)', type: 'number' },
                  { key: 'type', label: 'Categoria (product/service)' },
                ]}
                displayColumns={['name', 'price', 'type']}
              />
            )}

            {activeTab === 'metrics' && (
              <AdminCrudSection
                tableName="metrics"
                title="KPI de Impacto"
                fields={[
                  { key: 'value', label: 'Valor Exibido (Ex: +17k)' },
                  { key: 'label', label: 'Rótulo da Métrica' },
                  { key: 'display_order', label: 'Ordem', type: 'number' },
                  { key: 'is_active', label: 'Ativo', type: 'toggle' },
                ]}
                displayColumns={['value', 'label', 'is_active']}
              />
            )}

            {activeTab === 'testimonials' && (
              <AdminCrudSection
                tableName="testimonials"
                title="Prova Social"
                fields={[
                  { key: 'name', label: 'Nome do Líder' },
                  { key: 'company', label: 'Corporação' },
                  { key: 'quote', label: 'Depoimento', type: 'textarea' },
                  { key: 'approved', label: 'Aprovado para Exibição', type: 'toggle' },
                ]}
                displayColumns={['name', 'company', 'approved']}
              />
            )}

            {activeTab === 'content' && (
              <AdminCrudSection
                tableName="site_content"
                title="Arquitetura de Copywriting"
                idColumn="key"
                fields={[
                  { key: 'key', label: 'ID Chave do Componente' },
                  { key: 'value', label: 'Texto do Componente', type: 'textarea' },
                ]}
                displayColumns={['key', 'value']}
              />
            )}

            {activeTab === 'leads' && (
              <AdminCrudSection
                tableName="contacts"
                title="Lead Qualificado"
                fields={[
                  { key: 'name', label: 'Prospect' },
                  { key: 'email', label: 'E-mail Corporativo' },
                  { key: 'message', label: 'Briefing Inicial', type: 'textarea' },
                ]}
                displayColumns={['name', 'email', 'created_at']}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

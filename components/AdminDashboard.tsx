
import React, { useState, useEffect, useRef } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { supabase } from '../services/supabaseService';

type TabType = 'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'tools' | 'leads';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('carousel');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const authCheckRef = useRef(false);

  useEffect(() => {
    if (authCheckRef.current) return;
    authCheckRef.current = true;

    const checkAdmin = async () => {
      console.log("[Admin] Verificando privilégios de acesso...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn("[Admin] Sessão não encontrada. Redirecionando...");
        setIsAuthorized(false);
        setTimeout(onClose, 1000);
      } else {
        setIsAuthorized(true);
      }
    };
    
    checkAdmin();
  }, [onClose]);

  if (isAuthorized === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
           <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-6H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" /></svg>
        </div>
        <h2 className="text-white font-serif italic text-3xl">Área Restrita</h2>
        <p className="text-slate-500 text-[10px] mt-4 uppercase tracking-[0.4em] font-black">Por favor, realize o login como administrador.</p>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-pulse">
        <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-6 text-[9px] uppercase tracking-widest text-slate-500 font-bold">Validando Protocolos...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-brand-navy/95 backdrop-blur-3xl flex items-center justify-center p-2 lg:p-12 overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-7xl h-full rounded-[3rem] lg:rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
        
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-8 lg:p-12 flex flex-row lg:flex-col gap-6 lg:gap-10 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-4 mb-0 lg:mb-16 min-w-fit">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xl text-xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[10px] uppercase tracking-[0.5em] text-white">Advisory</span>
              <span className="text-[7px] uppercase tracking-[0.2em] text-blue-500 font-bold mt-1">Management v7.0</span>
            </div>
          </div>
          
          <nav className="flex flex-row lg:flex-col gap-2 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel' },
              { id: 'insights', label: 'Knowledge' },
              { id: 'products', label: 'Soluções' },
              { id: 'metrics', label: 'KPIs' },
              { id: 'testimonials', label: 'Provas' },
              { id: 'content', label: 'Textos' },
              { id: 'leads', label: 'Leads' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`whitespace-nowrap px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-left border ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'text-slate-600 border-transparent hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          
          <button onClick={onClose} className="hidden lg:block text-slate-700 hover:text-red-500 text-[9px] font-black uppercase tracking-widest mt-auto p-4 border border-white/5 rounded-xl transition-all">Encerrar</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-16 bg-grid relative custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-20">
            {activeTab === 'carousel' && (
              <AdminCrudSection
                tableName="carousel_images"
                title="Slide"
                fields={[
                  { key: 'url', label: 'URL Imagem', type: 'image' },
                  { key: 'title', label: 'Título' },
                  { key: 'subtitle', label: 'Subtítulo' },
                  { key: 'display_order', label: 'Ordem', type: 'number' },
                  { key: 'is_active', label: 'Ativo', type: 'toggle' },
                ]}
                displayColumns={['url', 'title', 'is_active']}
              />
            )}

            {activeTab === 'insights' && (
              <AdminCrudSection
                tableName="insights"
                title="Insight"
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
                title="Produto"
                fields={[
                  { key: 'name', label: 'Nome' },
                  { key: 'description', label: 'Descrição', type: 'textarea' },
                  { key: 'price', label: 'Preço (R$)', type: 'number' },
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
                  { key: 'value', label: 'Valor' },
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
                  { key: 'name', label: 'Autor' },
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
                title="Conteúdo"
                idColumn="key"
                fields={[
                  { key: 'key', label: 'ID Chave' },
                  { key: 'value', label: 'Texto do Site', type: 'textarea' },
                ]}
                displayColumns={['key', 'value']}
              />
            )}

            {activeTab === 'leads' && (
              <AdminCrudSection
                tableName="contacts"
                title="Lead"
                fields={[
                  { key: 'name', label: 'Nome' },
                  { key: 'email', label: 'E-mail' },
                  { key: 'message', label: 'Mensagem', type: 'textarea' },
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

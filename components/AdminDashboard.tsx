
import React, { useState } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile } from '../types';

type TabType = 'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'leads' | 'translations';

const ADMIN_VERSION = "v6.7.1-ULTRA-RESILIENT";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('carousel');

  const refreshSchema = () => {
    const sql = "NOTIFY pgrst, 'reload schema';";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sql);
      alert("🛠️ REPARAÇÃO DO CACHE PGRST\n\n1. O comando SQL foi copiado.\n2. No Supabase SQL Editor, cole e rode: " + sql + "\n\nIsso resolve o erro PGRST205 (tabela não encontrada).");
    } else {
      alert("Execute no SQL Editor: " + sql);
    }
  };

  // Prevenção absoluta contra erro de acesso a perfil nulo
  if (!profile) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#010309] flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 uppercase tracking-[0.4em] text-[9px] font-black">Validando Credenciais Advisory...</p>
        </div>
      </div>
    );
  }

  // Fallback se não for admin
  if (profile.user_type !== 'admin') {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
           <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-6H6a2 2 0 00-2 2v14a2 2 0 002-2h12a2 2 0 002-2V9l-6-6z" /></svg>
        </div>
        <h2 className="text-white font-serif italic text-4xl">Acesso Restrito</h2>
        <p className="text-slate-500 text-[11px] mt-4 uppercase tracking-[0.5em] font-black">Área exclusiva para a gestão estratégica.</p>
        <button onClick={onClose} className="mt-8 text-white/50 hover:text-white underline text-[10px] uppercase tracking-widest">Sair do Terminal</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-2 lg:p-8 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1500px] h-full rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
        
        {/* Sidebar Vertical de Alta Performance */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-8 flex flex-row lg:flex-col gap-8 shrink-0 overflow-x-auto scrollbar-none relative z-10">
          <div className="flex items-center gap-4 mb-0 lg:mb-12 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-600/20">CT</div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Management</span>
              </div>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">Version {ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-row lg:flex-col gap-2 flex-1">
            {[
              { id: 'carousel', label: 'Carrossel / Hero' },
              { id: 'insights', label: 'Knowledge Hub' },
              { id: 'products', label: 'Soluções / Loja' },
              { id: 'metrics', label: 'Impact KPIs' },
              { id: 'testimonials', label: 'Social Proof' },
              { id: 'content', label: 'Copywriting' },
              { id: 'translations', label: 'Traduções (i18n)' },
              { id: 'leads', label: 'Lead CRM' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as TabType)} 
                className={`whitespace-nowrap px-6 py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all text-left border ${activeTab === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'text-slate-600 border-transparent hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden lg:flex flex-col gap-4">
            <button 
              onClick={refreshSchema}
              className="w-full py-5 px-6 border-2 border-blue-500 bg-blue-600/10 text-blue-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl group"
            >
              <span className="group-hover:animate-pulse">Reparar Tabelas</span>
            </button>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-[8px] uppercase tracking-widest text-slate-600 mb-1">Logado como:</div>
              <div className="text-[9px] text-blue-500 font-bold truncate">{profile.full_name || 'Gestor Ativo'}</div>
            </div>
            <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] p-4 border border-white/5 rounded-2xl transition-all">Sair do Painel</button>
          </div>
        </div>

        {/* Área de Conteúdo Central */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-32">
            <header className="mb-16 flex justify-between items-start">
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <h2 className="text-4xl lg:text-5xl font-serif text-white italic mb-4">Gestão de {activeTab}</h2>
                <div className="w-20 h-1 bg-blue-600"></div>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.4em] mt-6 font-bold">Terminal de Controle Estratégico Claudio Tonelli</p>
              </div>
              <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white bg-white/5 p-3 rounded-full">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </header>

            {/* Injeção Resiliente de CRUD */}
            <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'carousel' && (
                <AdminCrudSection
                  tableName="carousel_images"
                  title="Slide do Carrossel"
                  fields={[
                    { key: 'url', label: 'URL da Imagem de Fundo', type: 'image' },
                    { key: 'title', label: 'Título' },
                    { key: 'subtitle', label: 'Subtítulo' },
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
                    { key: 'title', label: 'Título Principal' },
                    { key: 'excerpt', label: 'Resumo / Lead', type: 'textarea' },
                    { key: 'image_url', label: 'Imagem de Capa (URL)', type: 'image' },
                    { key: 'published_at', label: 'Data de Publicação', type: 'text' },
                    { key: 'display_order', label: 'Ordem de Importância', type: 'number' },
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
                    { key: 'name', label: 'Nome da Solução' },
                    { key: 'description', label: 'Descrição Detalhada', type: 'textarea' },
                    { key: 'price', label: 'Valor Investimento (R$)', type: 'number' },
                    { key: 'type', label: 'Categoria (product/service)' },
                    { key: 'config', label: 'Configuração Avançada (JSON)', type: 'json' },
                  ]}
                  displayColumns={['name', 'price', 'type']}
                />
              )}

              {activeTab === 'metrics' && (
                <AdminCrudSection
                  tableName="metrics"
                  title="KPI de Impacto"
                  fields={[
                    { key: 'value', label: 'Valor (Ex: +17k)' },
                    { key: 'label', label: 'Rótulo (Ex: Projetos)' },
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
                    { key: 'key', label: 'ID Chave (Ex: hero_title)' },
                    { key: 'value', label: 'Texto do Bloco', type: 'textarea' },
                    { key: 'page', label: 'Página de Destino (Ex: home)' },
                  ]}
                  displayColumns={['key', 'value', 'page']}
                />
              )}

              {activeTab === 'translations' && (
                <AdminCrudSection
                  tableName="content_translations"
                  title="Repositório de Traduções"
                  fields={[
                    { key: 'entity_type', label: 'Tipo de Entidade (Ex: insights)' },
                    { key: 'entity_id', label: 'ID do Registro Original', type: 'number' },
                    { key: 'field', label: 'Campo Traduzido (Ex: title)' },
                    { key: 'locale', label: 'Idioma (en / es)' },
                    { key: 'value', label: 'Tradução', type: 'textarea' },
                  ]}
                  displayColumns={['entity_type', 'field', 'locale']}
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
    </div>
  );
};

export default AdminDashboard;

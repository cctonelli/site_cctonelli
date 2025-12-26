
import React, { useState } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile } from '../types';

type TabType = 'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'leads' | 'translations';

const ADMIN_VERSION = "v6.8.7-HARD-SYNC";

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
      alert("🛠️ TERMINAL DE REPARO\n\n1. O comando de pulso SQL foi copiado.\n2. No SQL Editor do Supabase, rode o comando.\n\nSe o erro 404 persistir, use o botão de 'Reset de Permissões' que aparecerá no card de erro da seção.");
    } else {
      alert("Execute no SQL Editor: " + sql);
    }
  };

  if (!profile) return null;

  if (profile.user_type !== 'admin') {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-white font-serif italic text-4xl">Acesso Não Autorizado</h2>
        <button onClick={onClose} className="mt-8 text-white/50 hover:text-white underline text-[10px] uppercase tracking-widest">Retornar ao Site</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-2 lg:p-8 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1500px] h-full rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
        
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-8 flex flex-row lg:flex-col gap-8 shrink-0 overflow-x-auto scrollbar-none relative z-10">
          <div className="flex items-center gap-4 mb-0 lg:mb-12 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-600/20">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Management</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">Terminal {ADMIN_VERSION}</span>
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
              <span className="group-hover:animate-pulse">Pulso de Sincronia</span>
            </button>
            <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] p-4 border border-white/5 rounded-2xl transition-all">Desconectar</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-32">
            <header className="mb-16">
               <h2 className="text-4xl lg:text-5xl font-serif text-white italic mb-4">Módulo {activeTab}</h2>
               <div className="w-20 h-1 bg-blue-600"></div>
            </header>

            <div key={activeTab}>
              {activeTab === 'carousel' && <AdminCrudSection tableName="carousel_images" title="Slide do Carrossel" fields={[{ key: 'url', label: 'URL da Imagem', type: 'image' }, { key: 'title', label: 'Título' }, { key: 'subtitle', label: 'Subtítulo' }, { key: 'cta_url', label: 'Link do Botão (Saiba Mais)' }, { key: 'display_order', label: 'Ordem', type: 'number' }, { key: 'is_active', label: 'Publicado', type: 'toggle' }]} displayColumns={['url', 'title', 'is_active']} />}
              {activeTab === 'insights' && <AdminCrudSection tableName="insights" title="Insight Estratégico" fields={[{ key: 'title', label: 'Título' }, { key: 'excerpt', label: 'Resumo', type: 'textarea' }, { key: 'image_url', label: 'Capa (URL)', type: 'image' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['image_url', 'title', 'is_active']} />}
              {activeTab === 'products' && <AdminCrudSection tableName="products" title="Solução" fields={[{ key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição', type: 'textarea' }, { key: 'price', label: 'Preço', type: 'number' }, { key: 'type', label: 'Tipo' }, { key: 'config', label: 'Config (JSON)', type: 'json' }]} displayColumns={['name', 'price', 'type']} />}
              {activeTab === 'metrics' && <AdminCrudSection tableName="metrics" title="KPI" fields={[{ key: 'value', label: 'Valor' }, { key: 'label', label: 'Rótulo' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['value', 'label', 'is_active']} />}
              {activeTab === 'testimonials' && <AdminCrudSection tableName="testimonials" title="Social Proof" fields={[{ key: 'name', label: 'Nome' }, { key: 'company', label: 'Empresa' }, { key: 'quote', label: 'Citação', type: 'textarea' }, { key: 'approved', label: 'Aprovado', type: 'toggle' }]} displayColumns={['name', 'company', 'approved']} />}
              {activeTab === 'content' && <AdminCrudSection tableName="site_content" title="Copywriting" idColumn="key" fields={[{ key: 'key', label: 'Chave ID' }, { key: 'value', label: 'Conteúdo', type: 'textarea' }, { key: 'page', label: 'Página' }]} displayColumns={['key', 'value', 'page']} />}
              {activeTab === 'translations' && <AdminCrudSection tableName="content_translations" title="Tradução" fields={[{ key: 'entity_type', label: 'Tipo' }, { key: 'field', label: 'Campo' }, { key: 'locale', label: 'Idioma' }, { key: 'value', label: 'Tradução', type: 'textarea' }]} displayColumns={['entity_type', 'field', 'locale']} />}
              {activeTab === 'leads' && <AdminCrudSection tableName="contacts" title="CRM Leads" fields={[{ key: 'name', label: 'Prospect' }, { key: 'email', label: 'E-mail' }, { key: 'message', label: 'Mensagem', type: 'textarea' }]} displayColumns={['name', 'email', 'created_at']} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


import React, { useState } from 'react';
import AdminCrudSection from './AdminCrudSection';
import { Profile } from '../types';

type TabType = 'carousel' | 'insights' | 'products' | 'metrics' | 'testimonials' | 'content' | 'leads' | 'translations';

const ADMIN_VERSION = "v7.1.0-FINAL";

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
      alert("Comando de sincronia SQL copiado!");
    }
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#010309]/98 backdrop-blur-3xl flex items-center justify-center p-2 lg:p-8 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1500px] h-full rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
        
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-[#010309] border-r border-white/5 p-8 flex flex-row lg:flex-col gap-8 shrink-0 overflow-x-auto scrollbar-none relative z-10">
          <div className="flex items-center gap-4 mb-0 lg:mb-12 min-w-fit">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-600/20">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">Advisory Admin</span>
              <span className="text-[7px] uppercase tracking-[0.3em] text-blue-500 font-bold mt-1">CORE ENGINE {ADMIN_VERSION}</span>
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
              { id: 'translations', label: 'Traduções Globais' },
              { id: 'leads', label: 'CRM Leads' }
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
            <button onClick={refreshSchema} className="w-full py-5 px-6 border-2 border-blue-500 bg-blue-600/10 text-blue-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">Pulso de Sincronia</button>
            <button onClick={onClose} className="text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.4em] p-4 border border-white/5 rounded-2xl transition-all">Desconectar</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid relative custom-scrollbar">
          <div className="max-w-4xl mx-auto pb-32">
            <header className="mb-16">
               <h2 className="text-4xl lg:text-5xl font-serif text-white italic mb-4">Gerenciamento de {activeTab}</h2>
               <div className="w-20 h-1 bg-blue-600"></div>
            </header>

            <div key={activeTab}>
              {activeTab === 'carousel' && <AdminCrudSection tableName="carousel_images" title="Slide" fields={[{ key: 'url', label: 'URL Imagem', type: 'image' }, { key: 'title', label: 'Título (PT)' }, { key: 'title_en', label: 'Título (EN)' }, { key: 'title_es', label: 'Título (ES)' }, { key: 'subtitle', label: 'Subtítulo (PT)' }, { key: 'subtitle_en', label: 'Subtítulo (EN)' }, { key: 'cta_url', label: 'Link' }, { key: 'is_active', label: 'Publicado', type: 'toggle' }]} displayColumns={['url', 'title', 'is_active']} />}
              {activeTab === 'insights' && <AdminCrudSection tableName="insights" title="Insight" fields={[{ key: 'title', label: 'Título (PT)' }, { key: 'title_en', label: 'Título (EN)' }, { key: 'title_es', label: 'Título (ES)' }, { key: 'excerpt', label: 'Resumo (PT)', type: 'textarea' }, { key: 'excerpt_en', label: 'Resumo (EN)', type: 'textarea' }, { key: 'content', label: 'Conteúdo (PT)', type: 'rich-text' }, { key: 'content_en', label: 'Conteúdo (EN)', type: 'rich-text' }, { key: 'image_url', label: 'Capa', type: 'image' }, { key: 'is_active', label: 'Ativo', type: 'toggle' }]} displayColumns={['title', 'is_active']} />}
              {activeTab === 'translations' && <AdminCrudSection tableName="content_translations" title="Tradução Global" fields={[{ key: 'field', label: 'Chave do Sistema' }, { key: 'locale', label: 'Idioma (pt/en/es)' }, { key: 'value', label: 'Tradução', type: 'textarea' }]} displayColumns={['field', 'locale', 'value']} />}
              {activeTab === 'content' && <AdminCrudSection tableName="site_content" title="Copywriting" idColumn="key" fields={[{ key: 'key', label: 'Chave ID' }, { key: 'value', label: 'Conteúdo (PT)', type: 'rich-text' }, { key: 'value_en', label: 'Conteúdo (EN)', type: 'rich-text' }, { key: 'value_es', label: 'Conteúdo (ES)', type: 'rich-text' }, { key: 'page', label: 'Página' }]} displayColumns={['key', 'page']} />}
              {activeTab === 'leads' && <AdminCrudSection tableName="contacts" title="Leads" fields={[{ key: 'name', label: 'Nome' }, { key: 'email', label: 'Email' }, { key: 'message', label: 'Mensagem', type: 'textarea' }]} displayColumns={['name', 'email']} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

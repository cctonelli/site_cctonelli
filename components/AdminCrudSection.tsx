
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseService';

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'toggle' | 'number' | 'json';
}

interface AdminCrudSectionProps {
  tableName: string;
  title: string;
  fields: Field[];
  displayColumns: string[];
  idColumn?: string;
}

const AdminCrudSection: React.FC<AdminCrudSectionProps> = ({ 
  tableName, 
  title, 
  fields, 
  displayColumns,
  idColumn = 'id' 
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const query = supabase.from(tableName).select('*');
    
    // Tentativa de ordenação padrão se as colunas existirem
    if (fields.some(f => f.key === 'display_order')) {
      query.order('display_order', { ascending: true });
    } else if (fields.some(f => f.key === 'created_at')) {
      query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      setMessage({ text: 'Erro ao carregar dados: ' + error.message, type: 'error' });
    } else {
      setItems(data || []);
      setFilteredItems(data || []);
    }
    setLoading(false);
  }, [tableName, fields]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const filtered = items.filter(item =>
      Object.values(item).some(val =>
        val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const handleEdit = (item: any) => {
    setEditingId(item[idColumn]);
    
    // Processar campos JSON para exibição no textarea
    const processedData = { ...item };
    fields.forEach(f => {
      if (f.type === 'json' && typeof item[f.key] === 'object') {
        processedData[f.key] = JSON.stringify(item[f.key], null, 2);
      }
    });
    
    setFormData(processedData);
    document.getElementById(`form-${tableName}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({});
    setEditingId(null);
    setMessage(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    const payload = { ...formData };
    
    // Processar campos JSON de volta para objeto
    try {
      fields.forEach(f => {
        if (f.type === 'json' && typeof payload[f.key] === 'string') {
          payload[f.key] = JSON.parse(payload[f.key]);
        }
      });
    } catch (e) {
      setMessage({ text: 'Erro de formatação JSON inválido.', type: 'error' });
      setLoading(false);
      return;
    }

    // Remover IDs do payload para insert
    if (!editingId && payload[idColumn]) delete payload[idColumn];

    let error;
    if (editingId) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update(payload)
        .eq(idColumn, editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      setMessage({ text: 'Erro ao salvar: ' + error.message, type: 'error' });
    } else {
      setMessage({ 
        text: editingId ? 'Atualizado com sucesso!' : 'Criado com sucesso!', 
        type: 'success' 
      });
      resetForm();
      loadData();
    }
    setLoading(false);
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente?')) return;
    const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
    if (error) {
      setMessage({ text: 'Erro ao excluir: ' + error.message, type: 'error' });
    } else {
      loadData();
    }
  };

  const handleToggle = async (id: any, column: string, currentValue: boolean) => {
    const { error } = await supabase
      .from(tableName)
      .update({ [column]: !currentValue })
      .eq(idColumn, id);
    if (!error) loadData();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Formulário de Gestão */}
      <section id={`form-${tableName}`} className="bg-[#050a14] border border-white/5 p-8 lg:p-12 rounded-[3.5rem] shadow-2xl space-y-10">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-serif italic text-3xl">
            {editingId ? `Editar ${title}` : `Novo ${title}`}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-blue-500 text-[10px] uppercase font-black tracking-widest hover:underline">
              Cancelar e Criar Novo
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {fields.map((field) => (
            <div key={field.key} className={field.type === 'textarea' || field.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3 ml-2">
                {field.label}
              </label>
              {field.type === 'textarea' || field.type === 'json' ? (
                <textarea
                  className="admin-input h-32 resize-none"
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.type === 'json' ? '{"chave": "valor"}' : ''}
                />
              ) : field.type === 'toggle' ? (
                <button 
                  onClick={() => setFormData({ ...formData, [field.key]: !formData[field.key] })}
                  className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${formData[field.key] ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                >
                  {formData[field.key] ? 'Ativado' : 'Desativado'}
                </button>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  className="admin-input"
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                  placeholder={field.type === 'image' ? 'URL da imagem' : ''}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Sincronizando...' : editingId ? 'Salvar Alterações' : `Publicar ${title}`}
          </button>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
          >
            {message.text}
          </motion.div>
        )}
      </section>

      {/* Busca e Listagem */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-6">
          <div className="flex items-center gap-4 opacity-40 w-full md:w-auto">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Repositório de Dados</span>
            <div className="h-[1px] flex-1 md:w-24 bg-white/5"></div>
          </div>
          
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Localizar registro..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#050a14] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-[10px] text-white outline-none focus:border-blue-500/40 w-full font-medium" 
            />
            <svg className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-700 uppercase tracking-widest text-[10px]"
              >
                Nenhum dado localizado nesta seção.
              </motion.div>
            ) : (
              filteredItems.map((item) => (
                <motion.div 
                  layout
                  key={item[idColumn]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#050a14] border border-white/5 p-6 lg:p-8 rounded-[2.5rem] group hover:border-blue-500/20 transition-all flex flex-col md:flex-row items-center gap-8 shadow-xl"
                >
                  {/* Preview Image if exists */}
                  {(item.url || item.image_url) && (
                    <div className="shrink-0 w-24 h-16 rounded-2xl overflow-hidden border border-white/5 bg-slate-900">
                      <img src={item.url || item.image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                       <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest truncate max-w-[100px]">
                         {item[idColumn]?.toString().slice(0, 8)}
                       </span>
                       {(item.is_active !== undefined || item.approved !== undefined) && (
                         <button 
                            onClick={() => handleToggle(item[idColumn], item.is_active !== undefined ? 'is_active' : 'approved', item.is_active ?? item.approved)}
                            className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-tighter transition-all ${ (item.is_active ?? item.approved) ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                         >
                           {(item.is_active ?? item.approved) ? 'Ativo' : 'Inativo'}
                         </button>
                       )}
                    </div>
                    <h4 className="text-white font-medium text-sm leading-tight truncate">
                      {item.title || item.name || item.label || item.key || 'Sem Título'}
                    </h4>
                    <p className="text-slate-600 text-[10px] font-light truncate italic">
                      {item.subtitle || item.excerpt || item.value || item.company || ''}
                    </p>
                  </div>

                  <div className="flex gap-4 shrink-0">
                     <button 
                        onClick={() => handleEdit(item)} 
                        className="p-4 bg-white/5 rounded-xl text-slate-500 hover:text-blue-500 hover:bg-blue-600/10 transition-all"
                        title="Editar"
                     >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                     </button>
                     <button 
                        onClick={() => handleDelete(item[idColumn])} 
                        className="p-4 bg-white/5 rounded-xl text-slate-700 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Excluir"
                     >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                     </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`
        .admin-input { 
          @apply bg-[#02050c] border border-white/5 p-5 rounded-2xl text-white text-xs outline-none focus:border-blue-500/40 transition-all shadow-inner w-full; 
        }
      `}</style>
    </div>
  );
};

export default AdminCrudSection;

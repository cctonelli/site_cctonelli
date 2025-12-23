
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
    if (loading) return;
    setLoading(true);
    console.log(`[Admin] Carregando tabela: ${tableName}`);
    
    try {
      let query = supabase.from(tableName).select('*');
      
      // Ordenação Inteligente Fallback
      if (fields.some(f => f.key === 'display_order')) {
        query = query.order('display_order', { ascending: true });
      } else if (fields.some(f => f.key === 'created_at')) {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order(idColumn, { ascending: true });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setItems(data || []);
      setFilteredItems(data || []);
    } catch (err: any) {
      console.error(`[Admin] Erro na tabela ${tableName}:`, err);
      setMessage({ text: 'Erro ao carregar banco: ' + (err.message || 'Desconhecido'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tableName, fields, idColumn]);

  useEffect(() => {
    loadData();
  }, [tableName]); // Recarrega apenas quando a tabela mudar

  useEffect(() => {
    const filtered = items.filter(item =>
      Object.values(item || {}).some(val =>
        val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const handleEdit = (item: any) => {
    setEditingId(item[idColumn]);
    const processedData = { ...item };
    fields.forEach(f => {
      if (f.type === 'json' && typeof item[f.key] === 'object') {
        processedData[f.key] = JSON.stringify(item[f.key], null, 2);
      }
    });
    setFormData(processedData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    const payload = { ...formData };
    
    try {
      fields.forEach(f => {
        if (f.type === 'json' && typeof payload[f.key] === 'string') {
          payload[f.key] = JSON.parse(payload[f.key]);
        }
      });

      if (!editingId && payload[idColumn]) delete payload[idColumn];

      const { error } = editingId
        ? await supabase.from(tableName).update(payload).eq(idColumn, editingId)
        : await supabase.from(tableName).insert([payload]);

      if (error) throw error;

      setMessage({ text: 'Sincronizado com sucesso!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      console.error("[Admin Save Error]", e);
      setMessage({ text: 'Falha ao salvar: ' + (e.message || 'JSON inválido ou erro de banco'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Excluir este registro?')) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const handleToggle = async (id: any, column: string, val: any) => {
    try {
      // Normalização para o toggle
      const currentBool = val === true || val === 'true' || val === 1;
      const newVal = !currentBool;
      const { error } = await supabase.from(tableName).update({ [column]: newVal }).eq(idColumn, id);
      if (error) throw error;
      loadData();
    } catch (e: any) {
      console.error("Toggle Error:", e);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section className="bg-slate-900/40 border border-white/5 p-8 lg:p-12 rounded-[3rem] shadow-2xl space-y-8">
        <h3 className="text-white font-serif italic text-2xl">{editingId ? `Editar ${title}` : `Novo ${title}`}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {fields.map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-2">{f.label}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea className="admin-input h-32" value={formData[f.key] || ''} onChange={e => setFormData({...formData, [f.key]: e.target.value})} />
              ) : f.type === 'toggle' ? (
                <button onClick={() => setFormData({...formData, [f.key]: !formData[f.key]})} className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${formData[f.key] ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                  {formData[f.key] ? 'Ativado' : 'Desativado'}
                </button>
              ) : (
                <input className="admin-input" type={f.type === 'number' ? 'number' : 'text'} value={formData[f.key] || ''} onChange={e => setFormData({...formData, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value})} />
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50">
          {loading ? 'Processando...' : 'Publicar Alterações'}
        </button>
        {message && <div className={`p-4 rounded-xl text-center text-[10px] font-bold uppercase ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{message.text}</div>}
      </section>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base de Dados ({filteredItems.length})</span>
          <input placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-900 border border-white/5 p-3 rounded-xl w-64 text-white text-xs" />
        </div>
        
        {loading && items.length === 0 ? (
          <div className="py-20 text-center text-slate-600 animate-pulse text-[10px] uppercase font-black tracking-widest">Acessando Supabase...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-700 border-2 border-dashed border-white/5 rounded-[3rem] text-[10px] uppercase font-black tracking-widest">Nenhum registro encontrado.</div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item, idx) => (
              <div key={item[idColumn] || idx} className="bg-slate-900/20 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:border-blue-500/30 transition-all group">
                <div className="flex items-center gap-6">
                  {(item.url || item.image_url) && <img src={item.url || item.image_url} className="w-16 h-10 object-cover rounded-xl opacity-60 group-hover:opacity-100 transition-opacity" />}
                  <div>
                    <h4 className="text-white font-medium text-sm">{item.title || item.name || item.label || item.key}</h4>
                    <p className="text-slate-600 text-[10px] italic truncate max-w-md">{item.subtitle || item.value || item.excerpt || item.page}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(item.is_active !== undefined || item.approved !== undefined) && (
                    <button onClick={() => handleToggle(item[idColumn], item.is_active !== undefined ? 'is_active' : 'approved', item.is_active ?? item.approved)} className={`p-3 rounded-xl text-[8px] font-bold uppercase transition-all ${ (item.is_active === true || item.is_active === 'true' || item.approved === true || item.approved === 'true' || item.is_active === 1) ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                      {(item.is_active === true || item.is_active === 'true' || item.approved === true || item.approved === 'true' || item.is_active === 1) ? 'Ativo' : 'Off'}
                    </button>
                  )}
                  <button onClick={() => handleEdit(item)} className="p-3 bg-white/5 text-slate-500 hover:text-blue-500 rounded-xl transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                  <button onClick={() => handleDelete(item[idColumn])} className="p-3 bg-white/5 text-slate-700 hover:text-red-500 rounded-xl transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`.admin-input { @apply bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs w-full focus:border-blue-500 outline-none; }`}</style>
    </div>
  );
};

export default AdminCrudSection;


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, logSupabaseError } from '../services/supabaseService';
import RichTextEditor from './RichTextEditor';

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'toggle' | 'number' | 'json' | 'rich-text';
}

interface AdminCrudSectionProps {
  tableName: string;
  title: string;
  fields: Field[];
  displayColumns: string[];
  idColumn?: string;
}

const AdminCrudSection: React.FC<AdminCrudSectionProps> = ({ 
  tableName: rawTableName, 
  title, 
  fields = [], 
  displayColumns = [],
  idColumn = 'id' 
}) => {
  const tableName = useMemo(() => (rawTableName || '').replace('public.', '').trim(), [rawTableName]);

  const [items, setItems] = useState<any[]>([]); 
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const loadData = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(idColumn, { ascending: true });

      if (error) throw error;
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("[Admin Crud] Load fail:", e);
      setStatus({ text: "Usando fallback local ou offline.", type: 'warning' });
    } finally {
      setLoading(false);
    }
  }, [tableName, idColumn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (item: any) => {
    setEditingId(item[idColumn]);
    setFormData({ ...item });
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const { error } = editingId
        ? await supabase.from(tableName).update(formData).eq(idColumn, editingId)
        : await supabase.from(tableName).insert([formData]);

      if (error) throw error;

      setStatus({ text: 'Registro atualizado com sucesso!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      setStatus({ text: e.message || "Falha na sincronização.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Deseja excluir este item permanentemente?')) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
      if (error) throw error;
      await loadData();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  return (
    <div className="space-y-10">
      <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl backdrop-blur-md">
        <h3 className="text-2xl font-serif italic text-white flex items-center gap-3">
          <span className="w-1.5 h-10 bg-green-500 rounded-full"></span>
          {editingId ? 'Editar' : 'Criar'} {title}
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          {(fields || []).map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'rich-text' ? 'md:col-span-2' : ''}>
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 block mb-3">{f.label}</label>
              {f.type === 'rich-text' ? (
                <RichTextEditor 
                  content={formData[f.key] || ''} 
                  onChange={(html) => setFormData({...formData, [f.key]: html})} 
                />
              ) : f.type === 'textarea' ? (
                <textarea 
                  className="w-full bg-black border border-white/5 rounded-2xl p-6 text-sm text-slate-300 h-40 focus:border-green-500 outline-none"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              ) : (
                <input 
                  className="w-full bg-black border border-white/5 rounded-xl p-5 text-sm text-white focus:border-green-500 outline-none"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button onClick={handleSave} className="flex-1 bg-green-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">
            {editingId ? 'ATUALIZAR' : 'PUBLICAR'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setFormData({}); }} className="px-10 bg-white/5 text-slate-500 py-5 rounded-2xl font-black uppercase text-[10px]">CANCELAR</button>
          )}
        </div>
        {status && <div className={`p-4 rounded-xl text-[10px] font-black uppercase text-center ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{status.text}</div>}
      </div>

      <div className="grid gap-4">
        {items.map(item => (
          <div key={item[idColumn]} className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
            <div className="text-white font-serif italic text-lg">{item.title || item.name || 'Sem título'}</div>
            <div className="flex gap-4">
              <button onClick={() => handleEdit(item)} className="p-3 text-slate-600 hover:text-green-500 transition-all">EDIT</button>
              <button onClick={() => handleDelete(item[idColumn])} className="p-3 text-slate-800 hover:text-red-500 transition-all">DELETE</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCrudSection;

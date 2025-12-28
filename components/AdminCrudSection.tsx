
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseService';
import RichTextEditor from './RichTextEditor';

interface Field {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'toggle' | 'number' | 'json' | 'rich-text';
  placeholder?: string;
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
  // Ensure the table name is sanitized for PostgREST
  const tableName = useMemo(() => (rawTableName || '').replace('public.', '').trim(), [rawTableName]);

  const [items, setItems] = useState<any[]>([]); 
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const loadData = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(idColumn, { ascending: true });

      if (error) throw error;
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const errorMsg = e.message || e.details || (typeof e === 'string' ? e : JSON.stringify(e));
      console.error(`[Admin Crud] Load fail for ${tableName}:`, errorMsg);
      setStatus({ 
        text: `Erro ao carregar ${tableName}: ${errorMsg}`, 
        type: 'error' 
      });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const { error } = editingId
        ? await supabase.from(tableName).update(formData).eq(idColumn, editingId)
        : await supabase.from(tableName).insert([formData]);

      if (error) throw error;

      setStatus({ text: 'Registro sincronizado com o Kernel!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      const errorMsg = e.message || e.details || (typeof e === 'string' ? e : JSON.stringify(e));
      setStatus({ text: `Erro ao salvar: ${errorMsg}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Deseja excluir este item permanentemente do banco de dados?')) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
      if (error) throw error;
      await loadData();
    } catch (e: any) {
      const errorMsg = e.message || e.details || (typeof e === 'string' ? e : JSON.stringify(e));
      alert(`Erro ao excluir: ${errorMsg}`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-slate-900/60 p-10 lg:p-14 rounded-[4rem] border border-white/5 space-y-10 shadow-3xl backdrop-blur-3xl">
        <h3 className="text-3xl font-serif italic text-white flex items-center gap-5">
          <span className="w-1.5 h-12 bg-blue-600 rounded-full"></span>
          {editingId ? 'Refinar' : 'Forjar'} {title}
        </h3>

        <div className="grid md:grid-cols-2 gap-10">
          {(fields || []).map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'rich-text' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-4">{f.label}</label>
              
              {f.type === 'rich-text' ? (
                <RichTextEditor 
                  content={formData[f.key] || ''} 
                  onChange={(html) => setFormData({...formData, [f.key]: html})} 
                />
              ) : f.type === 'textarea' ? (
                <textarea 
                  placeholder={f.placeholder || "Descreva os detalhes aqui..."}
                  className="w-full bg-black border border-white/5 rounded-[2rem] p-8 text-sm text-slate-300 h-48 focus:border-blue-600 outline-none transition-all placeholder:opacity-30"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              ) : f.type === 'number' ? (
                <input 
                  type="number"
                  className="w-full bg-black border border-white/5 rounded-2xl p-6 text-sm text-white focus:border-blue-600 outline-none"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: parseFloat(e.target.value)})}
                />
              ) : f.type === 'toggle' ? (
                <button 
                  onClick={() => setFormData({...formData, [f.key]: !formData[f.key]})}
                  className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData[f.key] ? 'bg-blue-600 text-white' : 'bg-black text-slate-600 border border-white/5'}`}
                >
                  {formData[f.key] ? 'ATIVO' : 'DESATIVADO'}
                </button>
              ) : (
                <input 
                  placeholder={f.placeholder || "Insira o valor..."}
                  className="w-full bg-black border border-white/5 rounded-2xl p-6 text-sm text-white focus:border-blue-600 outline-none transition-all placeholder:opacity-30"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-6">
          <button 
            disabled={loading}
            onClick={handleSave} 
            className="flex-1 bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-600/20 disabled:opacity-50 hover:bg-blue-500 transition-all active:scale-95"
          >
            {editingId ? 'SINCRONIZAR ATUALIZAÇÃO' : 'PUBLICAR NO KERNEL'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setFormData({}); }} className="px-12 bg-white/5 text-slate-500 py-6 rounded-2xl font-black uppercase text-[11px] hover:text-white transition-colors">DESCARTAR</button>
          )}
        </div>
        {status && (
          <div className={`p-6 rounded-2xl text-[10px] font-black uppercase text-center transition-all ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 animate-pulse border border-red-500/20'}`}>
            {status.text}
          </div>
        )}
      </div>

      {/* Grid de Registros */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.length === 0 && !loading && !status && (
          <div className="col-span-full text-center py-20 text-slate-700 uppercase tracking-widest text-[10px] border border-dashed border-white/10 rounded-[3rem] italic">
            Ledger Vazio. Nenhum registro detectado.
          </div>
        )}
        {items.map(item => (
          <div key={item[idColumn]} className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 flex flex-col justify-between gap-8 group hover:border-blue-600/30 transition-all backdrop-blur-3xl shadow-xl">
            <div className="space-y-3">
               <div className="text-white font-serif italic text-2xl group-hover:text-blue-500 transition-colors">{item.title || item.name || item.label || 'Sem Identificação'}</div>
               <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 truncate">{item.slug || item.id}</div>
            </div>
            <div className="flex gap-4 border-t border-white/5 pt-6">
              <button onClick={() => handleEdit(item)} className="flex-1 py-3 text-slate-500 hover:text-white bg-white/5 rounded-xl transition-all text-[10px] font-black tracking-widest uppercase">EDITAR</button>
              <button onClick={() => handleDelete(item[idColumn])} className="px-6 py-3 text-slate-800 hover:text-red-500 bg-black/50 rounded-xl transition-all text-[10px] font-black tracking-widest uppercase">DEL</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCrudSection;

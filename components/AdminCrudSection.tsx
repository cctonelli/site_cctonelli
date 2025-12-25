
import React, { useState, useEffect, useCallback } from 'react';
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
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(idColumn, { ascending: false });

      if (error) {
        console.error(`Error loading ${tableName}:`, error);
        setStatus({ text: `Erro 404/API: Tabela ${tableName} não encontrada ou RLS bloqueado.`, type: 'error' });
        setItems([]);
      } else {
        setItems(data || []);
      }
    } catch (e: any) {
      console.error("Critical Fetch Error:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tableName, idColumn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (item: any) => {
    setEditingId(item[idColumn]);
    const processed = { ...item };
    if (fields) {
      fields.forEach(f => {
        if (f.type === 'json' && item[f.key] && typeof item[f.key] === 'object') {
          processed[f.key] = JSON.stringify(item[f.key], null, 2);
        }
      });
    }
    setFormData(processed);
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = { ...formData };
    
    try {
      if (fields) {
        fields.forEach(f => {
          if (f.type === 'json' && typeof payload[f.key] === 'string') {
            try {
              payload[f.key] = JSON.parse(payload[f.key]);
            } catch (e) {
              console.warn("Invalid JSON in field", f.key);
            }
          }
        });
      }

      const { error } = editingId
        ? await supabase.from(tableName).update(payload).eq(idColumn, editingId)
        : await supabase.from(tableName).insert([payload]);

      if (error) throw error;

      setStatus({ text: 'Sincronizado com Sucesso!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      setStatus({ text: e.message, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Deseja excluir este registro?')) return;
    const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
    if (!error) loadData();
  };

  return (
    <div className="space-y-10">
      <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
        <h3 className="text-xl font-serif italic text-white">{editingId ? 'Editar' : 'Adicionar'} {title}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {fields && fields.map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{f.label}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea 
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none h-32 font-mono"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              ) : f.type === 'toggle' ? (
                <button 
                  onClick={() => setFormData({...formData, [f.key]: !formData[f.key]})}
                  className={`px-6 py-3 rounded-xl text-[10px] font-bold border transition-all ${formData[f.key] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-600'}`}
                >
                  {formData[f.key] ? 'ATIVO' : 'INATIVO'}
                </button>
              ) : (
                <input 
                  type={f.type === 'number' ? 'number' : 'text'}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all">
          {loading ? 'Processando...' : 'Salvar Alterações'}
        </button>
        {status && <div className={`text-center text-[10px] font-bold uppercase tracking-widest ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>{status.text}</div>}
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 px-4">Registros ({Array.isArray(items) ? items.length : 0})</h4>
        <div className="grid gap-3">
          {Array.isArray(items) && items.map(item => (
            <div key={item[idColumn]} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                {(item.url || item.image_url) && <img src={item.url || item.image_url} className="w-12 h-12 object-cover rounded-lg opacity-50" />}
                <div>
                  <div className="text-white font-medium text-sm">{item.title || item.name || item.label || item.key}</div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest">{item[idColumn]}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(item[idColumn])} className="p-2 text-slate-800 hover:text-red-500 transition-colors">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
          {(!Array.isArray(items) || items.length === 0) && !loading && (
            <div className="text-center p-10 text-slate-700 text-[10px] uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
              Nenhum dado disponível. Verifique o banco de dados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCrudSection;

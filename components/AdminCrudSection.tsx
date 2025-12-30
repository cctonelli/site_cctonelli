
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, mutateWithRetry, masterHandshakeReset } from '../services/supabaseService';
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
      setStatus({ text: `Erro de Sincronia: ${e.message}`, type: 'error' });
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

  const forceReset = () => {
    masterHandshakeReset();
    setStatus({ text: 'Handshake resetado. Tente salvar novamente.', type: 'warning' });
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const payload = { ...formData };
      if (!editingId && tableName === 'insights') {
        payload.published_at = new Date().toISOString();
      }

      // Usando o motor de mutação resiliente
      const { error } = editingId
        ? await mutateWithRetry((client) => client.from(tableName).update(payload).eq(idColumn, editingId))
        : await mutateWithRetry((client) => client.from(tableName).insert([payload]));

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('column')) {
          setStatus({ text: 'Sincronia de Esquema Pendente: A API ainda não reconhece as colunas. Aguarde 1 min ou resete o handshake.', type: 'warning' });
          return;
        }
        throw error;
      }

      setStatus({ text: 'Protocolo de Dados Persistido com Sucesso!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      setStatus({ text: `Falha na Persistência: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Deseja deletar este registro permanentemente do Kernel?')) return;
    try {
      const { error } = await mutateWithRetry((client) => client.from(tableName).delete().eq(idColumn, id));
      if (error) throw error;
      await loadData();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-slate-900/40 p-12 lg:p-16 rounded-[4rem] border border-white/5 space-y-12 shadow-3xl backdrop-blur-3xl">
        <header className="flex justify-between items-center">
           <h3 className="text-3xl font-serif italic text-white flex items-center gap-6">
             <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
             {editingId ? 'Refinar' : 'Forjar'} {title}
           </h3>
           <div className="flex gap-4">
             {status?.type === 'warning' && (
               <button onClick={forceReset} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white border border-blue-500/20 px-4 py-2 rounded-xl">Forçar Handshake</button>
             )}
             {editingId && (
                <button onClick={() => { setEditingId(null); setFormData({}); }} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Cancelar Edição</button>
             )}
           </div>
        </header>

        <div className="grid md:grid-cols-2 gap-10">
          {(fields || []).map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'rich-text' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block mb-5">{f.label}</label>
              
              {f.type === 'rich-text' ? (
                <RichTextEditor 
                  content={formData[f.key] || ''} 
                  onChange={(html) => setFormData({...formData, [f.key]: html})} 
                />
              ) : f.type === 'textarea' ? (
                <textarea 
                  placeholder={f.placeholder}
                  className="w-full bg-black border border-white/5 rounded-[2.5rem] p-10 text-sm text-slate-300 h-64 focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              ) : f.type === 'toggle' ? (
                <button 
                  onClick={() => setFormData({...formData, [f.key]: !formData[f.key]})}
                  className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData[f.key] ? 'bg-blue-600 text-white' : 'bg-black text-slate-600 border border-white/5'}`}
                >
                  {formData[f.key] ? 'STATUS_ACTIVE' : 'STATUS_OFFLINE'}
                </button>
              ) : (
                <input 
                  placeholder={f.placeholder}
                  className="w-full bg-black border border-white/5 rounded-2xl p-6 text-sm text-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-700"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        
        <button 
          disabled={loading}
          onClick={handleSave} 
          className="w-full py-8 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl shadow-blue-600/20 disabled:opacity-50 hover:bg-blue-500 transition-all active:scale-95"
        >
          {loading ? 'Sincronizando...' : (editingId ? 'SALVAR NO SUPABASE' : 'PUBLICAR REGISTRO')}
        </button>

        {status && (
          <div className={`p-6 rounded-2xl text-[10px] font-black uppercase text-center transition-all ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : status.type === 'warning' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {status.text}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map(item => (
          <div key={item[idColumn]} className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 flex flex-col justify-between gap-10 group hover:border-blue-600/40 transition-all backdrop-blur-3xl shadow-xl">
            <div className="space-y-4">
               <div className="text-white font-serif italic text-2xl group-hover:text-blue-500 transition-colors">{item.title || item.name || item.label || 'Sem Identificador'}</div>
               <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 truncate">{item.slug || item.id}</div>
            </div>
            <div className="flex gap-4 border-t border-white/5 pt-8">
              <button onClick={() => handleEdit(item)} className="flex-1 py-4 text-slate-500 hover:text-white bg-white/5 rounded-2xl transition-all text-[10px] font-black tracking-widest uppercase">EDIT</button>
              <button onClick={() => handleDelete(item[idColumn])} className="px-8 py-4 text-slate-800 hover:text-red-500 bg-black/50 rounded-2xl transition-all text-[10px] font-black tracking-widest uppercase">DEL</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCrudSection;

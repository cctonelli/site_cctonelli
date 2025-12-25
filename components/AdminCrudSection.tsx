
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, logSupabaseError } from '../services/supabaseService';

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
  tableName: rawTableName, 
  title, 
  fields = [], 
  displayColumns = [],
  idColumn = 'id' 
}) => {
  const tableName = useMemo(() => (rawTableName || '').replace('public.', ''), [rawTableName]);

  const [items, setItems] = useState<any[]>([]); 
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{message: string, isMissing: boolean, sql?: string | null} | null>(null);
  const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const loadData = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    setStatus(null);
    setErrorDetails(null);
    try {
      // Adicionando cache-busting sutil na query para forçar o PostgREST
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(idColumn, { ascending: true });

      const errorInfo = logSupabaseError(`Admin - ${tableName}`, error);
      
      if (errorInfo.isError) {
        setErrorDetails({
          message: errorInfo.message,
          isMissing: errorInfo.isMissingTable,
          sql: errorInfo.suggestedSql
        });
        setStatus({ 
          text: errorInfo.isMissingTable 
            ? `SCHEMA LOCK: Acesso à tabela '${tableName}' negado ou cache travado.` 
            : `FALHA DB: ${errorInfo.code}`, 
          type: errorInfo.isMissingTable ? 'warning' : 'error' 
        });
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      console.error("[Admin Crud] Critical fail:", e);
      setStatus({ text: "Desconexão súbita com o servidor.", type: 'error' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tableName, idColumn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (item: any) => {
    if (!item) return;
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
    if (!tableName) return;
    setLoading(true);
    setStatus(null);
    const payload = { ...formData };
    
    try {
      if (fields) {
        fields.forEach(f => {
          if (f.type === 'json' && typeof payload[f.key] === 'string' && payload[f.key].trim() !== '') {
            try {
              payload[f.key] = JSON.parse(payload[f.key]);
            } catch (e) {
              console.warn("JSON Parse Error em:", f.key);
            }
          }
        });
      }

      const { error } = editingId
        ? await supabase.from(tableName).update(payload).eq(idColumn, editingId)
        : await supabase.from(tableName).insert([payload]);

      if (error) throw error;

      setStatus({ text: 'Sucesso: Sincronia de Ativo completa!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      console.error("[Admin Crud] Save Error:", e);
      setStatus({ text: `Falha na Persistência: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(prev => prev?.type === 'success' ? null : prev), 3000);
    }
  };

  const handleDelete = async (id: any) => {
    if (!id || !tableName || !confirm('Confirmar exclusão definitiva?')) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
      if (error) throw error;
      await loadData();
    } catch (e: any) {
      alert(`Erro crítico na exclusão: ${e.message}`);
    }
  };

  const copySql = () => {
    if (errorDetails?.sql && navigator.clipboard) {
      navigator.clipboard.writeText(errorDetails.sql);
      alert('MODO HARD RESET: Script de permissões e reconstrução copiado!\n\nSe o NOTIFY falhou, este script garante o uso do schema public.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Recovery Wizard Avançado */}
      {errorDetails?.isMissing && (
        <div className="bg-red-600/5 border border-red-600/20 p-8 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-top-4 backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600/20 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-serif italic text-2xl text-white">Falha Crítica de Mapeamento</h4>
              <p className="text-[10px] uppercase tracking-[0.4em] text-red-400 font-bold mt-1">Status: PostgREST ignorando esquema public</p>
            </div>
          </div>
          
          <div className="space-y-4 bg-black/40 p-6 rounded-2xl border border-white/5">
            <p className="text-slate-400 text-sm leading-relaxed">
              O comando <code className="text-blue-400">NOTIFY</code> foi ignorado. Isso acontece se o papel do banco de dados perdeu o acesso de **USAGE** ao esquema. Clique abaixo para obter o script de **Reset de Permissões Totais**.
            </p>
            <button 
              onClick={copySql}
              className="bg-red-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 flex items-center gap-3"
            >
              Copiar Script de Reset de Permissões
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Editor Principal */}
      <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {loading && <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>}

        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-serif italic text-white flex items-center gap-3">
            <span className="w-1.5 h-10 bg-blue-600 rounded-full"></span>
            {editingId ? 'Refinar' : 'Novo'} Ativo: {title}
          </h3>
          <span className="text-[8px] font-mono text-slate-700 bg-white/5 px-3 py-1 rounded-full">{tableName}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {(fields || []).map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-3 block">{f.label}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea 
                  className="w-full bg-black border border-white/5 rounded-2xl p-6 text-sm text-slate-300 focus:border-blue-500/50 outline-none h-40 font-mono transition-all placeholder:opacity-20"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              ) : f.type === 'toggle' ? (
                <button 
                  onClick={() => setFormData({...formData, [f.key]: !formData[f.key]})}
                  className={`px-8 py-4 rounded-xl text-[10px] font-black tracking-widest border transition-all ${formData[f.key] ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-700'}`}
                >
                  {formData[f.key] ? 'ATIVO' : 'RASCUNHO'}
                </button>
              ) : (
                <input 
                  type={f.type === 'number' ? 'number' : 'text'}
                  className="w-full bg-black border border-white/5 rounded-xl p-5 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-6 pt-4">
          <button 
            onClick={handleSave} 
            disabled={loading || errorDetails?.isMissing} 
            className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-20 shadow-2xl shadow-blue-600/20"
          >
            {editingId ? 'Confirmar Mudanças' : 'Implantar no Core'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setFormData({}); }} className="px-10 bg-white/5 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/10 transition-all">
              Cancelar
            </button>
          )}
        </div>

        {status && (
          <div className={`p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 ${
            status.type === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-500' : 
            'bg-red-500/5 border-red-500/20 text-red-500'
          }`}>
            {status.text}
          </div>
        )}
      </div>

      {/* Grid de Itens */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">Inventário de Dados ({items?.length || 0})</h4>
          <button onClick={loadData} className="text-blue-600 text-[9px] font-black uppercase tracking-widest hover:text-blue-500 transition-colors">Forçar Recarregamento</button>
        </div>

        <div className="grid gap-4">
          {items && items.length > 0 ? items.map(item => (
            <div key={item[idColumn] || Math.random()} className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-blue-500/20 transition-all group backdrop-blur-sm">
              <div className="flex items-center gap-6">
                {(item?.url || item?.image_url) && <img src={item.url || item.image_url} className="w-16 h-16 object-cover rounded-2xl border border-white/10 opacity-50 group-hover:opacity-100 transition-all" alt="" />}
                <div className="max-w-md">
                  <div className="text-white font-serif italic text-lg truncate group-hover:text-blue-400 transition-colors">
                    {item?.title || item?.name || item?.label || item?.key || item?.full_name || 'Item Indefinido'}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleEdit(item)} className="p-3 text-slate-700 hover:text-blue-500 transition-all">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(item?.[idColumn])} className="p-3 text-slate-800 hover:text-red-500 transition-all">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          )) : !loading && (
            <div className="text-center py-20 bg-slate-950/20 border border-dashed border-white/5 rounded-[3rem]">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 italic">
                {errorDetails?.isMissing ? `Schema Offline. Aplique o Script de Reset.` : 'Banco de dados vazio ou inacessível.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCrudSection;

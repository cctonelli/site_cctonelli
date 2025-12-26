
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
  const tableName = useMemo(() => (rawTableName || '').replace('public.', '').trim(), [rawTableName]);

  const [items, setItems] = useState<any[]>([]); 
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{message: string, isMissing: boolean, isRls: boolean, sql?: string | null} | null>(null);
  const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const loadData = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    setStatus(null);
    setErrorDetails(null);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(idColumn, { ascending: true });

      const errorInfo = logSupabaseError(`Admin - ${tableName}`, error);
      
      if (errorInfo.isError) {
        setErrorDetails({
          message: errorInfo.message,
          isMissing: errorInfo.isMissingTable,
          isRls: errorInfo.isRlsError,
          sql: errorInfo.suggestedSql
        });
        setStatus({ 
          text: errorInfo.isMissingTable 
            ? `SCHEMA LOCK: Acesso à tabela '${tableName}' negado ou cache travado.` 
            : errorInfo.isRlsError 
            ? `RLS BLOCK: Permissão de leitura negada na tabela '${tableName}'.`
            : `FALHA DB: ${errorInfo.code}`, 
          type: (errorInfo.isMissingTable || errorInfo.isRlsError) ? 'warning' : 'error' 
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

  const insertJsonTemplate = (key: string) => {
    const template = {
      image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop",
      url: "https://pay.hotmart.com/EXEMPLO",
      action_label: "Aderir Agora",
      action_label_en: "Join Now",
      action_label_es: "Unirse Ahora"
    };
    setFormData({
      ...formData,
      [key]: JSON.stringify(template, null, 2)
    });
  };

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
              throw new Error(`Erro no JSON do campo ${f.label}: Verifique vírgulas e aspas.`);
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
      setStatus({ text: e.message || "Falha na persistência.", type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(prev => prev?.type === 'success' ? null : prev), 4000);
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

  return (
    <div className="space-y-10">
      {(errorDetails?.isMissing || errorDetails?.isRls) && (
        <div className="bg-red-600/5 border border-red-600/20 p-8 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-top-4 backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600/20 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-serif italic text-2xl text-white">
                {errorDetails.isMissing ? 'Falha de Mapeamento' : 'Bloqueio de Segurança (RLS)'}
              </h4>
              <p className="text-[10px] uppercase tracking-[0.4em] text-red-400 font-bold mt-1">
                {errorDetails.isMissing ? 'Status: PostgREST ignorando esquema public' : `Status: Acesso negado à tabela '${tableName}'`}
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-xs font-light leading-relaxed">
            {errorDetails.isRls 
              ? `O Supabase está bloqueando operações nesta tabela. Isso acontece porque não há políticas RLS definidas ou o usuário atual não tem permissão.`
              : `A tabela não foi localizada ou o cache do servidor está desatualizado.`}
          </p>
          <button 
            onClick={() => {
              if (errorDetails.sql) {
                navigator.clipboard.writeText(errorDetails.sql);
                alert('Script de Reparo Copiado! Rode no SQL Editor do Supabase para corrigir as permissões (incluindo perfis de usuários).');
              }
            }}
            className="w-full bg-red-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            Copiar Script de Reparo (SQL)
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
        </div>
      )}

      <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-serif italic text-white flex items-center gap-3">
            <span className="w-1.5 h-10 bg-blue-600 rounded-full"></span>
            {editingId ? 'Editar' : 'Criar'} {title}
          </h3>
          <span className="text-[8px] font-mono text-slate-700 bg-white/5 px-3 py-1 rounded-full">{tableName}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {(fields || []).map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">{f.label}</label>
                {f.type === 'json' && (
                  <button 
                    onClick={() => insertJsonTemplate(f.key)}
                    className="text-[8px] font-black uppercase text-blue-500 hover:text-blue-400 tracking-widest border border-blue-500/20 px-2 py-1 rounded"
                  >
                    + Usar Template Loja
                  </button>
                )}
              </div>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea 
                  placeholder={f.type === 'json' ? '{"image_url": "...", "url": "..."}' : ''}
                  className="w-full bg-black border border-white/5 rounded-2xl p-6 text-sm text-slate-300 focus:border-blue-500/50 outline-none h-40 font-mono transition-all"
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
            {editingId ? 'Atualizar Ativo' : 'Publicar no Core'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setFormData({}); }} className="px-10 bg-white/5 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/10 transition-all">
              Cancelar
            </button>
          )}
        </div>

        {status && (
          <div className={`p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center animate-pulse ${
            status.type === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-500' : 
            'bg-red-500/5 border-red-500/20 text-red-500'
          }`}>
            {status.text}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {items && items.length > 0 ? items.map(item => (
          <div key={item[idColumn]} className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-blue-500/20 transition-all group backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="text-white font-serif italic text-lg truncate group-hover:text-blue-400 transition-colors">
                {item?.name || item?.title || item?.label || item?.key || 'Sem Título'}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => handleEdit(item)} className="p-3 text-slate-700 hover:text-blue-500 transition-all">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => handleDelete(item[idColumn])} className="p-3 text-slate-800 hover:text-red-500 transition-all">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        )) : !loading && (
          <div className="text-center py-20 bg-slate-950/20 border border-dashed border-white/5 rounded-[3rem]">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-800 italic animate-pulse">
              Banco de dados inacessível ou vazio.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCrudSection;

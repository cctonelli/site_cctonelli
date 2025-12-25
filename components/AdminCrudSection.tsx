
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
            ? `API CACHE ERROR: Tabela '${tableName}' offline.` 
            : `FALHA DB: ${errorInfo.code}`, 
          type: errorInfo.isMissingTable ? 'warning' : 'error' 
        });
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      console.error("[Admin Crud] Critical fail:", e);
      setStatus({ text: "Conexão de dados interrompida.", type: 'error' });
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

      setStatus({ text: 'Sincronizado com o Core!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      console.error("[Admin Crud] Save Error:", e);
      setStatus({ text: `Erro de Salvamento: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(prev => prev?.type === 'success' ? null : prev), 3000);
    }
  };

  const handleDelete = async (id: any) => {
    if (!id || !tableName || !confirm('Confirmar deleção permanente deste ativo?')) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
      if (error) throw error;
      await loadData();
    } catch (e: any) {
      alert(`Falha na exclusão: ${e.message}`);
    }
  };

  const copySql = () => {
    if (errorDetails?.sql && navigator.clipboard) {
      navigator.clipboard.writeText(errorDetails.sql);
      alert('Comando de reparo copiado. Use o SQL Editor do Supabase.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Mensagem de Erro Proativa para PGRST205 */}
      {errorDetails?.isMissing && (
        <div className="bg-amber-600/10 border border-amber-500/20 p-8 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4 text-amber-500">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-serif italic text-xl text-white">Desconexão de Schema Detectada</h4>
              <p className="text-[9px] uppercase tracking-widest text-amber-400 font-bold">A tabela '{tableName}' não foi mapeada na API.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
              Este erro ocorre quando o Supabase ainda não indexou a tabela. Clique no botão abaixo para copiar o comando de correção e execute-o no SQL Editor do Supabase.
            </p>
            <button 
              onClick={copySql}
              className="bg-amber-600 text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl active:scale-95"
            >
              Copiar Comando de Reparo
            </button>
          </div>
        </div>
      )}

      {/* Formulário de Edição/Inserção */}
      <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
        {loading && <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>}

        <h3 className="text-xl font-serif italic text-white flex items-center gap-3">
          <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
          {editingId ? 'Refinar Registro' : 'Novo Registro'} em {title}
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {(fields || []).map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{f.label}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea 
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none h-32 font-mono transition-colors"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                  placeholder={f.type === 'json' ? '{ "image_url": "...", "action_label": "..." }' : ''}
                />
              ) : f.type === 'toggle' ? (
                <button 
                  onClick={() => setFormData({...formData, [f.key]: !formData[f.key]})}
                  className={`px-6 py-3 rounded-xl text-[10px] font-bold border transition-all ${formData[f.key] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-600'}`}
                >
                  {formData[f.key] ? 'ATIVADO' : 'DESATIVADO'}
                </button>
              ) : (
                <input 
                  type={f.type === 'number' ? 'number' : 'text'}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none transition-colors"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleSave} 
            disabled={loading || errorDetails?.isMissing} 
            className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-30"
          >
            {editingId ? 'Confirmar Alterações' : 'Publicar Agora'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setFormData({}); }} className="px-8 bg-white/5 text-slate-500 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
              Cancelar
            </button>
          )}
        </div>

        {status && (
          <div className={`p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 ${
            status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
            status.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
            'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {status.text}
          </div>
        )}
      </div>

      {/* Listagem de Itens */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Registros Ativos ({items?.length || 0})</h4>
          <button onClick={loadData} className="text-blue-500 text-[9px] font-bold uppercase tracking-widest hover:underline">Recarregar Grid</button>
        </div>

        <div className="grid gap-3">
          {items && items.length > 0 ? items.map(item => (
            <div key={item[idColumn] || Math.random()} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all group">
              <div className="flex items-center gap-4">
                {(item?.url || item?.image_url) && <img src={item.url || item.image_url} className="w-12 h-12 object-cover rounded-lg opacity-40 group-hover:opacity-80 transition-opacity" alt="" />}
                <div className="max-w-[200px] sm:max-w-md">
                  <div className="text-white font-medium text-sm truncate">
                    {item?.title || item?.name || item?.label || item?.key || item?.full_name || 'Sem Título'}
                  </div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    ID: {item?.[idColumn] || '---'}
                    {item?.is_active === false && <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[8px]">OFFLINE</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => handleDelete(item?.[idColumn])} className="p-2 text-slate-800 hover:text-red-500 transition-colors">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          )) : !loading && (
            <div className="text-center p-16 text-slate-700 text-[10px] uppercase tracking-widest border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
              {errorDetails?.isMissing ? `Sincronize o banco de dados para ver itens.` : 'Nenhum registro encontrado nesta categoria.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCrudSection;

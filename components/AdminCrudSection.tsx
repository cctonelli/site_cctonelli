
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
  const [status, setStatus] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(idColumn, { ascending: idColumn === 'display_order' });

      if (error) {
        console.warn(`[Admin Crud - ${tableName}]`, error.message);
        
        let errorMsg = `Erro na API: ${error.message}`;
        if (error.message.includes('schema cache') || error.code === 'PGRST116') {
          errorMsg = `Tabela '${tableName}' não encontrada. Certifique-se que ela existe e o RLS está configurado.`;
        }
        
        setStatus({ text: errorMsg, type: 'error' });
        setItems([]);
      } else {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e: any) {
      console.error("[Admin Crud] Fatal Error:", e);
      setStatus({ text: "Erro crítico de conexão com o Supabase.", type: 'error' });
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
              console.warn("JSON inválido no campo", f.key);
            }
          }
        });
      }

      const { error } = editingId
        ? await supabase.from(tableName).update(payload).eq(idColumn, editingId)
        : await supabase.from(tableName).insert([payload]);

      if (error) throw error;

      setStatus({ text: 'Operação realizada com sucesso!', type: 'success' });
      setFormData({});
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      console.error("[Admin Crud] Save Error:", e);
      setStatus({ text: `Falha ao salvar: ${e.message || "Verifique permissões RLS."}`, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(prev => prev?.type === 'success' ? null : prev), 5000);
    }
  };

  const handleDelete = async (id: any) => {
    if (!id || !confirm('Deseja excluir definitivamente este registro?')) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
      if (error) throw error;
      await loadData();
    } catch (e: any) {
      console.error("[Admin Crud] Delete Error:", e);
      alert(`Erro ao excluir: ${e.message}`);
    }
  };

  return (
    <div className="space-y-10">
      <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
        {loading && <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>}

        <h3 className="text-xl font-serif italic text-white flex items-center gap-3">
          <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
          {editingId ? 'Refinar Registro' : 'Novo Registro'} em {title}
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {fields && fields.map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{f.label}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea 
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none h-32 font-mono transition-colors"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                  placeholder={f.type === 'json' ? '{ "chave": "valor" }' : ''}
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
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white focus:border-blue-500 outline-none transition-colors"
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50">
            {editingId ? 'Salvar Alterações' : 'Publicar no Core'}
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
            status.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
            'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {status.text}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Base de Dados ({Array.isArray(items) ? items.length : 0})</h4>
          <button onClick={loadData} className="text-blue-500 text-[9px] font-bold uppercase tracking-widest hover:underline">Atualizar Grid</button>
        </div>

        <div className="grid gap-3">
          {Array.isArray(items) && items.length > 0 ? items.map(item => (
            <div key={item[idColumn] || Math.random()} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all group">
              <div className="flex items-center gap-4">
                {(item.url || item.image_url) && <img src={item.url || item.image_url} className="w-12 h-12 object-cover rounded-lg opacity-40 group-hover:opacity-80 transition-opacity" alt="" />}
                <div className="max-w-[200px] sm:max-w-md">
                  <div className="text-white font-medium text-sm truncate">{item.title || item.name || item.label || item.key || 'Sem Título'}</div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    ID: {item[idColumn] || '---'}
                    {item.is_active === false && <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[8px]">INATIVO</span>}
                    {item.approved === false && <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-[8px]">PENDENTE</span>}
                  </div>
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
          )) : !loading && (
            <div className="text-center p-16 text-slate-700 text-[10px] uppercase tracking-widest border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
              {status?.type === 'error' ? 'Falha ao sincronizar com o banco de dados.' : 'Não foram encontrados registros para esta seção.'}
            </div>
          )}
          {loading && !items.length && (
             <div className="text-center p-10 animate-pulse text-[10px] text-blue-500 uppercase tracking-widest">Acessando Terminal...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCrudSection;

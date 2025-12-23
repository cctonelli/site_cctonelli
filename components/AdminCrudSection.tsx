
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
    let query = supabase.from(tableName).select('*');
    
    // Detecção Inteligente de Ordenação
    if (fields.some(f => f.key === 'display_order')) {
      query = query.order('display_order', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Fetch Error [${tableName}]:`, error);
      setMessage({ text: 'Falha na conexão: ' + error.message, type: 'error' });
    } else {
      setItems(data || []);
      setFilteredItems(data || []);
    }
    setLoading(false);
  }, [tableName, fields]);

  useEffect(() => { loadData(); }, [loadData]);

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
    const processedData = { ...item };
    fields.forEach(f => {
      if (f.type === 'json' && typeof item[f.key] === 'object') {
        processedData[f.key] = JSON.stringify(item[f.key], null, 2);
      }
    });
    setFormData(processedData);
    document.getElementById(`form-${tableName}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = { ...formData };
    try {
      fields.forEach(f => {
        if (f.type === 'json' && typeof payload[f.key] === 'string') {
          payload[f.key] = JSON.parse(payload[f.key]);
        }
      });
    } catch (e) {
      setMessage({ text: 'JSON inválido no campo de configuração.', type: 'error' });
      setLoading(false);
      return;
    }

    if (!editingId && payload[idColumn]) delete payload[idColumn];

    const { error } = editingId
      ? await supabase.from(tableName).update(payload).eq(idColumn, editingId)
      : await supabase.from(tableName).insert([payload]);

    if (error) {
      setMessage({ text: 'Erro ao persistir dados: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: 'Sincronizado com sucesso!', type: 'success' });
      setFormData({});
      setEditingId(null);
      loadData();
    }
    setLoading(false);
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Deseja excluir este registro permanentemente?')) return;
    const { error } = await supabase.from(tableName).delete().eq(idColumn, id);
    if (!error) loadData();
  };

  const handleToggle = async (id: any, column: string, currentValue: boolean) => {
    const { error } = await supabase.from(tableName).update({ [column]: !currentValue }).eq(idColumn, id);
    if (!error) loadData();
  };

  return (
    <div className="space-y-12">
      <section id={`form-${tableName}`} className="bg-[#050a14] border border-white/5 p-10 rounded-[3rem] shadow-2xl space-y-8">
        <h3 className="text-white font-serif italic text-2xl">{editingId ? `Editando ${title}` : `Novo ${title}`}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {fields.map(f => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'json' ? 'md:col-span-2' : ''}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-2">{f.label}</label>
              {f.type === 'textarea' || f.type === 'json' ? (
                <textarea className="admin-input h-32" value={formData[f.key] || ''} onChange={e => setFormData({...formData, [f.key]: e.target.value})} />
              ) : f.type === 'toggle' ? (
                <button onClick={() => setFormData({...formData, [f.key]: !formData[f.key]})} className={`px-4 py-2 rounded-xl text-[10px] font-bold border ${formData[f.key] ? 'bg-blue-600/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                  {formData[f.key] ? 'Ativo' : 'Inativo'}
                </button>
              ) : (
                <input className="admin-input" type={f.type === 'number' ? 'number' : 'text'} value={formData[f.key] || ''} onChange={e => setFormData({...formData, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value})} />
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all disabled:opacity-50 shadow-xl shadow-blue-600/20">
          {loading ? 'Processando...' : 'Salvar no Supabase'}
        </button>
        {message && <div className={`p-4 rounded-xl text-center text-[10px] font-bold uppercase ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{message.text}</div>}
      </section>

      <div className="space-y-6">
        <input placeholder="Buscar no banco..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-900 border border-white/5 p-4 rounded-2xl w-full text-white text-xs" />
        <div className="grid gap-4">
          {filteredItems.map(item => (
            <div key={item[idColumn]} className="bg-[#050a14] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-6">
                {(item.url || item.image_url) && <img src={item.url || item.image_url} className="w-16 h-10 object-cover rounded-xl" />}
                <div>
                  <h4 className="text-white font-medium">{item.title || item.name || item.label || item.key}</h4>
                  <p className="text-slate-600 text-[10px] italic">{item.subtitle || item.value || item.page}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="p-3 bg-white/5 text-slate-500 hover:text-blue-500 rounded-xl transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                <button onClick={() => handleDelete(item[idColumn])} className="p-3 bg-white/5 text-slate-700 hover:text-red-500 rounded-xl transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`.admin-input { @apply bg-slate-950 border border-white/5 p-4 rounded-xl text-white text-xs w-full focus:border-blue-500 outline-none; }`}</style>
    </div>
  );
};

export default AdminCrudSection;

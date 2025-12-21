
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp } from '../services/supabaseService';
import { Profile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [taxId, setTaxId] = useState(''); // CPF/CNPJ
  const [whatsapp, setWhatsapp] = useState('');
  const [gender, setGender] = useState<Profile['gender']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await signUp(email, password, {
          full_name: fullName,
          cpf_cnpj: taxId,
          whatsapp: whatsapp,
          gender: gender,
        });
        
        if (signUpError) {
          // Captura amigável para erro de RLS (Row Level Security)
          if (signUpError.message?.toLowerCase().includes('row-level security')) {
            throw new Error('Erro de Permissão (RLS): O banco de dados bloqueou a criação do seu perfil. Verifique as políticas de segurança no painel Supabase.');
          }
          throw signUpError;
        }
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro na Autenticação:", err);
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-12 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-3xl shadow-xl shadow-blue-600/20">CT</div>
            <h2 className="text-3xl font-serif text-white">
              {mode === 'login' ? 'Acesso Exclusivo' : 'Crie sua Conta'}
            </h2>
            <p className="text-slate-500 text-sm font-light">
              {mode === 'login' ? 'Entre no ecossistema de alta performance.' : 'Junte-se à vanguarda da consultoria estratégica.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <input 
                    required
                    type="text" 
                    placeholder="Nome Completo"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      required
                      type="text" 
                      placeholder="CPF ou CNPJ"
                      value={taxId}
                      onChange={e => setTaxId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
                    />
                    <input 
                      required
                      type="tel" 
                      placeholder="WhatsApp"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>
                  <select 
                    required
                    value={gender || ''}
                    onChange={e => setGender(e.target.value as Profile['gender'])}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-slate-300 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Selecione seu Gênero</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <input 
              required
              type="email" 
              placeholder="E-mail Corporativo"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
            />
            
            <input 
              required
              type="password" 
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
            />

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl"
              >
                <p className="text-red-500 text-[11px] text-center font-bold tracking-tight leading-relaxed">
                  {error}
                </p>
              </motion.div>
            )}

            <button 
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Processando...' : (mode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro')}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              {mode === 'login' ? 'Não possui conta? Associe-se' : 'Já é um associado? Entre aqui'}
            </button>
          </div>
        </div>
        
        <div className="bg-slate-950 py-4 text-center border-t border-white/5">
          <p className="text-[9px] uppercase tracking-[0.4em] text-slate-600 font-bold">Protocolo de Segurança Ativo</p>
        </div>
      </motion.div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(37, 99, 235, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AuthModal;

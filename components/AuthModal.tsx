
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
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState<{message: string, isRls: boolean} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNeedsConfirmation(false);

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        onSuccess();
        onClose();
      } else {
        const { data, error: signUpError } = await signUp(email, password, {
          full_name: fullName,
          cpf_cnpj: taxId,
          whatsapp: whatsapp,
          gender: gender,
        });
        
        if (signUpError) {
          const isRls = signUpError.message?.toLowerCase().includes('row-level security');
          setError({
            message: isRls 
              ? 'Protocolo de Segurança Ativo: Verifique as permissões do banco (RLS) para criação de perfis.'
              : signUpError.message,
            isRls
          });
          setIsLoading(false);
          return;
        }

        // Se o usuário foi criado mas não há sessão aberta, requer confirmação de e-mail
        if (data.user && !data.session) {
          setNeedsConfirmation(true);
        } else {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      console.error("[Auth UI] Exceção:", err);
      setError({
        message: err.message || 'Falha na comunicação com o servidor de segurança.',
        isRls: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-serif text-white italic">Verifique seu E-mail</h2>
          <p className="text-slate-400 text-sm font-light leading-relaxed">
            Sua conta foi criada. Por favor, valide seu acesso clicando no link enviado para <strong>{email}</strong>.
          </p>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
            Dica: Se você não recebeu o e-mail, verifique a pasta de spam ou desative o "Confirm Email" no painel Supabase se estiver em teste.
          </div>
          <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all">Fechar</button>
        </motion.div>
      </div>
    );
  }

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
            <h2 className="text-3xl font-serif text-white italic">
              {mode === 'login' ? 'Acesso Exclusivo' : 'Nova Conta'}
            </h2>
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
                    <option value="" disabled>Gênero</option>
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
              placeholder="E-mail"
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">
                {error.message}
              </motion.div>
            )}

            <button 
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Sincronizando...' : (mode === 'login' ? 'Entrar' : 'Finalizar Registro')}
            </button>
          </form>

          <div className="text-center pt-4">
            <button 
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-[9px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors font-bold"
            >
              {mode === 'login' ? 'Não tem conta? Registre-se' : 'Já possui conta? Conecte-se'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;

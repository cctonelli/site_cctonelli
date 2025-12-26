
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, signUp, createProfile } from '../services/supabaseService';
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
  const [taxId, setTaxId] = useState(''); 
  const [whatsapp, setWhatsapp] = useState('');
  const [gender, setGender] = useState<Profile['gender']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { data, error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        
        console.debug("[Auth Modal] Login efetuado com sucesso.");
        onSuccess();
        onClose();
      } else {
        // 1. Criar o usuário no Supabase Auth
        const { data, error: signUpError } = await signUp(email, password, {
          full_name: fullName,
          cpf_cnpj: taxId,
          whatsapp: whatsapp,
          gender: gender,
        });
        
        if (signUpError) throw signUpError;

        if (data.user) {
          // 2. Tentar criar o perfil manualmente na tabela public.profiles
          // Isso garante que os dados sejam salvos mesmo que o trigger falhe ou demore
          const profilePayload: Profile = {
            id: data.user.id,
            full_name: fullName,
            cpf_cnpj: taxId,
            whatsapp: whatsapp,
            gender: gender,
            user_type: 'client' // Padrão para novos registros via site
          };

          const profileResult = await createProfile(profilePayload);
          
          if (profileResult.isError) {
            console.warn("[Auth Modal] Perfil não foi criado via API (possível trigger duplicado ou RLS), mas o Auth prosseguiu.");
          }

          if (!data.session) {
            setNeedsConfirmation(true);
          } else {
            onSuccess();
            onClose();
          }
        }
      }
    } catch (err: any) {
      console.error("[Auth Modal Error]", err);
      setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
             <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-3xl font-serif text-white italic">Validar E-mail</h2>
          <p className="text-slate-400 text-sm font-light leading-relaxed">Clique no link enviado para <strong>{email}</strong> para ativar seu acesso exclusivo.</p>
          <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all">Fechar</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-10 lg:p-14 space-y-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <header className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-3xl shadow-xl shadow-blue-600/20">CT</div>
            <h2 className="text-3xl font-serif text-white italic">{mode === 'login' ? 'Identificação' : 'Novo Partner'}</h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">Core Estratégico Tonelli</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <input required placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="CPF ou CNPJ" value={taxId} onChange={e => setTaxId(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all" />
                    <input required placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <select required value={gender || ''} onChange={e => setGender(e.target.value as Profile['gender'])} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-slate-300 focus:border-blue-500 outline-none transition-all">
                    <option value="" disabled>Gênero</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <input required type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all" />
            <input required type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none transition-all" />

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-bold uppercase tracking-widest text-center animate-shake">{error}</div>}

            <button disabled={isLoading} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50">
              {isLoading ? 'Acessando Core...' : (mode === 'login' ? 'Entrar Agora' : 'Finalizar Registro')}
            </button>
          </form>

          <div className="text-center pt-2">
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="text-[9px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors font-bold">
              {mode === 'login' ? 'Ainda não é parceiro? Registre-se' : 'Já possui acesso? Conecte-se'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;

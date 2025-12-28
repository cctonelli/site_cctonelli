
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

  const validateEmailFormat = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanTaxId = taxId.trim();
    const cleanWhatsapp = whatsapp.trim();

    if (!validateEmailFormat(cleanEmail)) {
      setError(`O e-mail "${cleanEmail}" é inválido.`);
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(cleanEmail, password);
        if (signInError) throw signInError;
        onSuccess();
        onClose();
      } else {
        // 1. Registro no Supabase Auth
        const { data, error: signUpError } = await signUp(cleanEmail, password, {
          full_name: cleanName,
          cpf_cnpj: cleanTaxId,
          whatsapp: cleanWhatsapp,
          gender: gender,
        });
        
        if (signUpError) throw signUpError;

        if (data.user) {
          // 2. Gravação de Perfil forçada (John Doe deve estar aqui!)
          const profilePayload: Profile = {
            id: data.user.id,
            full_name: cleanName,
            email: cleanEmail,
            cpf_cnpj: cleanTaxId,
            whatsapp: cleanWhatsapp,
            gender: gender,
            user_type: 'client'
          };

          const { error: profileError } = await createProfile(profilePayload);
          if (profileError) {
             console.warn("Perfil não persistido publicamente (RLS Check):", profileError.message);
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
      setError(err.message || 'Falha na operação.');
    } finally {
      setIsLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-12 text-center space-y-8">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
             <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-3xl font-serif text-white italic">Confirmar E-mail</h2>
          <p className="text-slate-400 text-sm">Enviamos um link para <strong>{email}</strong>.</p>
          <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px]">Fechar</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-10 lg:p-14 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <header className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-3xl">CT</div>
            <h2 className="text-3xl font-serif text-white italic">{mode === 'login' ? 'Identificação' : 'Novo Partner'}</h2>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-4">
                <input required placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="CPF ou CNPJ" value={taxId} onChange={e => setTaxId(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none" />
                  <input required placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none" />
                </div>
              </div>
            )}
            <input required type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none" />
            <input required type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-blue-500 outline-none" />

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-bold uppercase text-center">{error}</div>}

            <button disabled={isLoading} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50">
              {isLoading ? 'Conectando...' : (mode === 'login' ? 'Entrar' : 'Registrar')}
            </button>
          </form>
          <div className="text-center">
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-[9px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
              {mode === 'login' ? 'Ainda não é parceiro? Registre-se' : 'Já possui acesso? Conecte-se'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;

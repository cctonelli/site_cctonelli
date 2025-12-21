
import React, { useState } from 'react';
import { submitContact } from '../services/supabaseService';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const success = await submitContact(formData);
    if (success) {
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      setStatus('error');
    }
  };

  return (
    <section id="contact-form" className="py-32 bg-slate-950 reveal">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-serif">Vamos conversar?</h2>
            <p className="text-slate-400 font-light leading-relaxed">
              Dúvidas sobre nossas mentorias ou interessado em uma consultoria personalizada? Nossa equipe retornará em até 24h úteis.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 text-slate-300">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>contato@claudiotonelli.com.br</span>
              </div>
              <div className="flex items-center gap-4 text-slate-300">
                <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span>São Paulo - SP, Brasil</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input 
                required
                type="text" 
                placeholder="Nome Completo"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-6 py-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <input 
                required
                type="email" 
                placeholder="E-mail Corporativo"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-6 py-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <textarea 
                required
                placeholder="Como podemos ajudar seu negócio?"
                rows={4}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-6 py-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
              ></textarea>
            </div>
            <button 
              disabled={status === 'loading'}
              className={`w-full py-4 rounded-xl font-bold transition-all btn-premium ${
                status === 'loading' ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
            {status === 'success' && <p className="text-green-400 text-center text-sm">Mensagem enviada com sucesso!</p>}
            {status === 'error' && <p className="text-red-400 text-center text-sm">Erro ao enviar. Tente novamente.</p>}
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;

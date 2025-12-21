
import React, { useState } from 'react';
import { submitContact } from '../services/supabaseService';
import { Language, translations } from '../services/i18nService';

interface ContactFormProps {
  language: Language;
}

const ContactForm: React.FC<ContactFormProps> = ({ language }) => {
  const t = translations[language];
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
    <section id="contact-form" className="py-40 bg-white dark:bg-slate-950 reveal transition-colors duration-500">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-24">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Ready to Scale?</div>
              <h2 className="text-5xl font-serif dark:text-white text-slate-900">{t.contact_title}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-light text-lg leading-relaxed">
                {t.contact_subtitle}
              </p>
            </div>
            
            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Global Desk</div>
                  <span className="dark:text-white text-slate-900 font-medium">contato@claudiotonelli.com.br</span>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Corporate HQ</div>
                  <span className="dark:text-white text-slate-900 font-medium">São Paulo - SP, Brasil</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl">
            <div className="space-y-4">
              <input 
                required
                type="text" 
                placeholder={t.contact_name}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl px-8 py-5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
              <input 
                required
                type="email" 
                placeholder={t.contact_email}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl px-8 py-5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
              <textarea 
                required
                placeholder={t.contact_message}
                rows={4}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl px-8 py-5 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-400"
              ></textarea>
            </div>
            <button 
              disabled={status === 'loading'}
              className="w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95"
            >
              {status === 'loading' ? t.contact_sending : t.contact_send}
            </button>
            {status === 'success' && <p className="text-green-500 text-center text-xs font-bold uppercase tracking-widest">Sent Successfully</p>}
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;

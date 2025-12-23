
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchInsightById } from '../services/supabaseService';
import { Insight } from '../types';
import { Language } from '../services/i18nService';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const lang = (queryParams.get('lang') as Language) || 'pt';

  const [article, setArticle] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  // Fix: Fetched Insight directly and rely on its translation fields (title_en, etc.)
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchInsightById(id).then((data) => {
        setArticle(data);
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }).catch((err) => {
        console.error("Article fetch error:", err);
        setLoading(false);
      });
    }
  }, [id]);

  // Fix: Updated resolve function to use the Insight object's localized fields
  const resolve = (field: string, base: string) => {
    if (!article || lang === 'pt') return base;
    const translatedValue = (article as any)[`${field}_${lang}`];
    return translatedValue || base;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Arquitetando Insight...</span>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 p-6 text-center">
      <h1 className="text-4xl font-serif text-white italic">Insight indisponível</h1>
      <p className="text-slate-500 max-w-md font-light">Este conteúdo estratégico não foi localizado no servidor.</p>
      <Link to="/" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-2xl shadow-blue-600/20 hover:bg-blue-500 transition-all">Voltar para Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">CT</div>
            <span className="font-bold tracking-tighter dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors">Claudio Tonelli</span>
          </Link>
          <div className="flex items-center gap-6">
             <div className="hidden md:block text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400">{article.category || 'ADVISORY'}</div>
             <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors border-b border-transparent hover:border-blue-500 pb-1">Fechar Artigo</Link>
          </div>
        </div>
      </header>

      <main className="pt-48 pb-32 container mx-auto px-6 max-w-4xl">
        <article className="space-y-16">
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-block px-5 py-2 bg-blue-600/10 text-blue-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
               {article.category || 'ESTRATÉGIA CORPORATIVA'}
            </div>
            <h1 className="text-5xl md:text-8xl font-serif dark:text-white text-slate-900 leading-[1.1] italic">
              {resolve('title', article.title)}
            </h1>
            {article.excerpt && (
              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-light italic max-w-3xl mx-auto leading-relaxed border-l-2 border-blue-500/30 pl-8 text-left inline-block">
                {resolve('excerpt', article.excerpt)}
              </p>
            )}
            <div className="flex items-center justify-center gap-6 pt-6">
               <div className="w-12 h-[1px] bg-slate-200 dark:bg-white/10"></div>
               <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500">
                 {new Date(article.published_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
               </div>
               <div className="w-12 h-[1px] bg-slate-200 dark:bg-white/10"></div>
            </div>
          </div>

          {article.image_url && (
            <div className="relative aspect-[21/10] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 animate-in fade-in duration-[1.5s] delay-500">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent"></div>
            </div>
          )}

          <div className="relative animate-in fade-in duration-1000 delay-700">
            <div 
              className="rich-text dark:prose-invert prose prose-blue prose-2xl max-w-none text-slate-700 dark:text-slate-300 font-light leading-relaxed space-y-10"
              style={{ fontFamily: "'Inter', sans-serif" }}
              dangerouslySetInnerHTML={{ __html: resolve('content', article.content || '') }}
            />
          </div>
        </article>
      </main>

      <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#010309] transition-colors relative">
         <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
         <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl shadow-2xl shadow-blue-600/30">CT</div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-slate-500">Claudio Tonelli Group &copy; 2025</p>
              <p className="text-slate-400 font-light text-sm italic">Arquitetando o amanhã com rigor e visão.</p>
            </div>
            <Link to="/" className="inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-10 py-4 rounded-2xl text-[10px] uppercase tracking-widest text-blue-500 font-bold hover:bg-blue-600 hover:text-white transition-all shadow-xl">
              Solicitar Advisory Global
            </Link>
         </div>
      </footer>

      <style>{`
        .rich-text h2 { font-family: 'Playfair Display', serif; font-style: italic; font-size: 3rem; margin-top: 5rem; color: #fff; line-height: 1.1; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 1rem; }
        .rich-text h3 { font-family: 'Playfair Display', serif; font-size: 2.25rem; margin-top: 3.5rem; color: #fff; }
        .rich-text p { margin-bottom: 2.5rem; font-size: 1.25rem; }
        .rich-text strong { font-weight: 700; color: #3b82f6; }
        .rich-text blockquote { border-left: 6px solid #3b82f6; padding-left: 3.5rem; font-style: italic; color: #94a3b8; margin: 5rem 0; font-family: 'Playfair Display', serif; font-size: 2rem; background: rgba(59, 130, 246, 0.03); padding-top: 2rem; padding-bottom: 2rem; border-radius: 0 2rem 2rem 0; }
        .rich-text img { border-radius: 3rem; margin: 5rem 0; width: 100%; box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.6); }
        .rich-text ul { list-style-type: none; padding-left: 1rem; margin-bottom: 3rem; }
        .rich-text li { position: relative; padding-left: 2rem; margin-bottom: 1.25rem; }
        .rich-text li::before { content: "•"; color: #3b82f6; font-weight: bold; position: absolute; left: 0; font-size: 1.5rem; top: -0.2rem; }
      `}</style>
    </div>
  );
};

export default ArticlePage;

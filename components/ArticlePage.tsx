
import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchInsightById, fetchSiteConfig } from '../services/supabaseService';
import { SITE_CONFIG } from '../services/localRegistry';
import { Insight } from '../types';
import { Language } from '../services/i18nService';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const lang = (queryParams.get('lang') as Language) || 'pt';
  // Fix: fetchSiteConfig is async, use state with local fallback to avoid accessing Promise properties
  const [config, setConfig] = useState<any>(SITE_CONFIG);

  useEffect(() => {
    fetchSiteConfig().then(setConfig);
  }, []);

  const [article, setArticle] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

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

  const resolve = (field: string, base: string) => {
    if (!article || lang === 'pt') return base;
    const translatedValue = (article as any)[`${field}_${lang}`];
    return translatedValue || base;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#010309] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-t-2 border-green-500 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Compondo Edição...</span>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-[#010309] flex flex-col items-center justify-center space-y-6 p-6 text-center">
      <h1 className="text-4xl font-serif text-white italic">Edição Não Encontrada</h1>
      <Link to="/" className="bg-green-600 text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Voltar</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#010309] transition-colors duration-500 selection:bg-green-500 selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#010309]/95 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 dark:bg-green-600 rounded-xl flex items-center justify-center font-bold text-white dark:text-black text-xl shadow-lg transition-transform group-hover:scale-105">CT</div>
            <span className="font-serif italic text-xl dark:text-white text-slate-900">The Tonelli Journal</span>
          </Link>
          <div className="flex items-center gap-6">
             <div className="hidden md:block text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Digital Intelligence Desk</div>
             <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-green-500 hover:opacity-70 transition-all border-b border-transparent hover:border-current pb-1">Sair do Insight</Link>
          </div>
        </div>
      </header>

      <main className="pt-48 pb-40 container mx-auto px-6 max-w-5xl">
        <article className="space-y-20">
          <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="inline-block px-8 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-full text-[9px] font-black uppercase tracking-[0.5em] border border-white/5">
               {article.category || 'EXECUTIVE ADVISORY'}
            </div>
            <h1 
                className="font-serif dark:text-white text-slate-900 leading-[1] italic tracking-tighter"
                style={{ fontSize: `var(--h2-size, 4.5rem)` }}
            >
              {resolve('title', article.title)}
            </h1>
            {article.excerpt && (
              <p 
                className="font-light italic max-w-4xl mx-auto leading-relaxed border-y border-slate-100 dark:border-white/5 py-10"
                style={{ fontSize: '1.5rem', color: 'var(--text-secondary, #94a3b8)' }}
              >
                {resolve('excerpt', article.excerpt)}
              </p>
            )}
            <div className="flex items-center justify-center gap-6 pt-4">
               <div className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">
                 ESTABELECIDO EM {new Date(article.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
               </div>
            </div>
          </div>

          {article.image_url && (
            <div className="relative aspect-[16/7] rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 group animate-in zoom-in-95 duration-[1.5s]">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#010309]/40 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-[9px] font-black uppercase tracking-[0.4em] text-white bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">FIG_01 // VISUAL_INTEL</div>
            </div>
          )}

          <div className={`relative animate-in fade-in duration-1000 delay-500 ${config.typography.cap_drop ? 'drop-cap-enabled' : ''}`}>
            <div 
              className="editorial-canvas prose prose-blue dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 font-light leading-relaxed space-y-12"
              style={{ 
                fontFamily: "var(--font-sans)", 
                fontSize: `var(--body-size, 1.125rem)`,
                color: 'var(--text-main, #f8fafc)'
              }}
              dangerouslySetInnerHTML={{ __html: resolve('content', article.content || article.excerpt || '') }}
            />
          </div>
        </article>
      </main>

      <footer className="py-32 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#010309] transition-colors relative">
         <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
         <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
            <div className="w-14 h-14 bg-green-600 text-black rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl shadow-2xl shadow-green-600/30">CT</div>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-500">Claudio Tonelli Publishing &copy; 2025</p>
              <div className="flex justify-center gap-10">
                <Link to="/" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-green-500 transition-colors">LinkedIn</Link>
                <Link to="/" className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-green-500 transition-colors">Intelligence Report</Link>
              </div>
            </div>
         </div>
      </footer>

      <style>{`
        :root {
          --h1-size: ${config.typography.h1_size};
          --h2-size: ${config.typography.h2_size};
          --body-size: ${config.typography.body_size};
          --text-main: ${config.theme.text_main};
          --text-secondary: ${config.theme.text_secondary};
          --font-serif: ${config.theme.font_family_serif};
          --font-sans: ${config.theme.font_family_sans};
        }

        .editorial-canvas h2 { font-family: var(--font-serif); font-style: italic; font-size: 3rem; margin-top: 6rem; color: var(--text-main); line-height: 1.1; letter-spacing: -0.04em; }
        .editorial-canvas h3 { font-family: var(--font-serif); font-size: 2rem; margin-top: 4rem; color: var(--text-main); }
        .editorial-canvas p { margin-bottom: 3rem; font-size: var(--body-size); line-height: 1.8; color: var(--text-main); }
        .editorial-canvas strong { font-weight: 900; color: var(--text-main); border-bottom: 2px solid #00ff41; }
        
        .drop-cap-enabled .editorial-canvas > p:first-of-type::first-letter {
          float: left;
          font-family: var(--font-serif);
          font-size: 6.5rem;
          line-height: 1;
          padding-right: 1.5rem;
          padding-top: 0.5rem;
          color: #00ff41;
          font-style: italic;
          font-weight: bold;
        }

        .editorial-canvas blockquote { border-left: none; padding-left: 0; font-style: italic; color: var(--text-secondary); margin: 6rem 0; font-family: var(--font-serif); font-size: 2.5rem; text-align: center; border-y: 1px solid rgba(255,255,255,0.05); padding: 4rem 0; }
        .editorial-canvas img { border-radius: 4rem; margin: 6rem 0; width: 100%; box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8); border: 1px solid rgba(255,255,255,0.1); }
        .editorial-canvas ul { list-style-type: none; padding-left: 0; margin-bottom: 4rem; }
        .editorial-canvas li { position: relative; padding-left: 2.5rem; margin-bottom: 1.5rem; font-style: italic; }
        .editorial-canvas li::before { content: "—"; color: #00ff41; font-weight: bold; position: absolute; left: 0; }
      `}</style>
    </div>
  );
};

export default ArticlePage;


import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInsightById } from '../services/supabaseService';
import { Insight } from '../types';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchInsightById(id).then(data => {
        setArticle(data);
        setLoading(false);
        window.scrollTo(0, 0);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 p-6 text-center">
      <h1 className="text-4xl font-serif text-white">Artigo não encontrado.</h1>
      <p className="text-slate-500 max-w-md">O insight solicitado pode ter sido removido ou o link está incorreto.</p>
      <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20">Voltar para Home</Link>
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
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{article.category || 'INSIGHT'}</div>
             <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400">Voltar</Link>
          </div>
        </div>
      </header>

      <main className="pt-40 pb-32 container mx-auto px-6 max-w-4xl">
        <article className="space-y-16">
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-block px-4 py-1.5 bg-blue-600/10 text-blue-500 rounded-full text-[9px] font-bold uppercase tracking-widest border border-blue-500/20">
               {article.category || 'ESTRATÉGIA CORPORATIVA'}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif dark:text-white text-slate-900 leading-[1.15]">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-light italic max-w-2xl mx-auto leading-relaxed">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 pt-4">
               <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10"></div>
               <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">
                 {new Date(article.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
               </div>
               <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10"></div>
            </div>
          </div>

          {article.image_url && (
            <div className="relative aspect-[21/10] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 animate-in fade-in duration-1000 delay-300">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
            </div>
          )}

          <div className="relative animate-in fade-in duration-1000 delay-500">
            <div 
              className="rich-text dark:prose-invert prose prose-blue prose-xl max-w-none text-slate-700 dark:text-slate-300 font-light leading-relaxed space-y-8"
              style={{ fontFamily: "'Inter', sans-serif" }}
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />
          </div>
        </article>
      </main>

      <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#010309] transition-colors">
         <div className="container mx-auto px-6 text-center space-y-6">
            <div className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl mx-auto flex items-center justify-center font-bold text-xl">CT</div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500">Claudio Tonelli Group &copy; 2025</p>
            <Link to="/" className="inline-block text-[9px] uppercase tracking-widest text-blue-500 font-bold hover:underline">Solicitar Advisory Estratégico</Link>
         </div>
      </footer>

      <style>{`
        .rich-text h2 { font-family: 'Playfair Display', serif; font-style: italic; font-size: 2.25rem; margin-top: 3.5rem; color: var(--tw-prose-headings); line-height: 1.2; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 0.5rem; }
        .rich-text h3 { font-family: 'Playfair Display', serif; font-size: 1.75rem; margin-top: 2.5rem; color: var(--tw-prose-headings); }
        .rich-text p { margin-bottom: 2rem; font-size: 1.125rem; }
        .rich-text strong { font-weight: 700; color: #3b82f6; }
        .rich-text blockquote { border-left: 4px solid #3b82f6; padding-left: 2.5rem; font-style: italic; color: #94a3b8; margin: 4rem 0; font-family: 'Playfair Display', serif; font-size: 1.5rem; }
        .rich-text img { border-radius: 2.5rem; margin: 4rem 0; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .rich-text ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 2rem; }
        .rich-text li { margin-bottom: 0.75rem; }
      `}</style>
    </div>
  );
};

export default ArticlePage;

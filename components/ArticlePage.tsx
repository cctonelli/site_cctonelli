
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
      fetchInsightById(id).then(data => {
        setArticle(data);
        setLoading(false);
        window.scrollTo(0, 0);
      });
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
      <h1 className="text-4xl font-serif text-white">Artigo não encontrado.</h1>
      <Link to="/" className="text-blue-500 font-bold uppercase tracking-widest text-sm">Voltar para Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">CT</div>
            <span className="font-bold tracking-tighter dark:text-white text-slate-900">Voltar</span>
          </Link>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">{article.category}</div>
        </div>
      </header>

      <main className="pt-40 pb-32 container mx-auto px-6 max-w-4xl">
        <article className="space-y-12">
          <div className="space-y-6 text-center">
            <h1 className="text-5xl md:text-7xl font-serif dark:text-white text-slate-900 leading-tight">
              {article.title}
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light italic max-w-2xl mx-auto">
              {article.excerpt}
            </p>
            <div className="pt-6 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">
              Publicado em {new Date(article.published_at).toLocaleDateString('pt-BR')}
            </div>
          </div>

          {article.image_url && (
            <div className="aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div 
            className="prose prose-invert prose-blue max-w-none text-slate-700 dark:text-slate-300 font-light text-lg leading-loose space-y-6"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        </article>
      </main>

      <footer className="py-20 border-t border-slate-200 dark:border-white/5 text-center">
         <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500">Claudio Tonelli Consultoria Executive</p>
      </footer>
    </div>
  );
};

export default ArticlePage;

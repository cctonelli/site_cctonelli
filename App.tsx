
import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ThreeGlobe from './components/ThreeGlobe';
import ChatBot from './components/ChatBot';
import ProductsSection from './components/ProductsSection';
import TestimonialsSection from './components/TestimonialsSection';
import { fetchMetrics, fetchInsights, fetchProducts, fetchTestimonials } from './services/supabaseService';
import { Metric, Insight, Product, Testimonial } from './types';

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [m, i, p, t] = await Promise.all([
        fetchMetrics(), 
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials()
      ]);
      setMetrics(m);
      setInsights(i);
      setProducts(p);
      setTestimonials(t);
    };
    loadData();

    // Intersection Observer for reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [insights, products]); // Re-run when data loads to catch new elements

  return (
    <div className="relative min-h-screen selection:bg-blue-500/30">
      <Navbar />

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <ThreeGlobe />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Consultoria Estratégica 2025
            </div>
            <h1 className="text-6xl md:text-8xl font-serif leading-tight">
              Estratégia <br />
              <span className="italic text-slate-400">Inesquecível.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-light">
              Elevando o C-Level através de inteligência artificial, design imersivo e resultados exponenciais. Bem-vindo à nova era da Claudio Tonelli Consultoria.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg font-bold transition-all shadow-xl shadow-blue-600/20 btn-premium">
                Agendar Consulta
              </button>
              <button className="bg-transparent border border-white/20 hover:bg-white/5 px-8 py-4 rounded-lg font-bold transition-all">
                Nossa Metodologia
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
          <span className="text-[10px] uppercase tracking-[0.3em]">Arraste para baixo</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-blue-500 to-transparent"></div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="py-24 bg-slate-950 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {metrics.map((m) => (
              <div key={m.id} className="text-center group reveal">
                <div className="text-5xl font-bold mb-2 text-white group-hover:text-blue-500 transition-colors">
                  {m.value}{m.suffix}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-blue-500/80 mb-3">
                  {m.label}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[160px] mx-auto">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section id="insights" className="py-32 bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl reveal">
              <h2 className="text-4xl font-serif mb-4">Insights de Futuro</h2>
              <p className="text-slate-400 font-light">
                Análises exclusivas sobre as tendências que estão redefinindo o mercado global e as indústrias em transformação.
              </p>
            </div>
            <button className="text-blue-400 text-sm font-bold uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-2 reveal">
              Ver Todos os Artigos
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {insights.map((insight) => (
              <article key={insight.id} className="group cursor-pointer reveal">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6">
                  <img 
                    src={insight.imageUrl} 
                    alt={insight.title} 
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-slate-950/80 backdrop-blur-md text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                      {insight.category}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {insight.date}
                  </span>
                  <h3 className="text-2xl font-serif group-hover:text-blue-400 transition-colors">
                    {insight.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-light">
                    {insight.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Products & Services Section */}
      <ProductsSection products={products} />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-10 reveal">
            <h2 className="text-5xl font-serif leading-tight">
              Pronto para elevar o nível da sua operação?
            </h2>
            <p className="text-xl text-slate-400 font-light">
              Estamos prontos para desenhar o seu próximo capítulo de sucesso. Fale com um de nossos consultores seniores hoje.
            </p>
            <div className="pt-6">
              <button className="bg-white text-slate-950 px-12 py-5 rounded-full font-bold text-lg hover:bg-blue-600 hover:text-white transition-all shadow-2xl shadow-white/5 btn-premium">
                Solicitar Diagnóstico Estratégico
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-20 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">CT</div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-blue-500">Claudio</span> Tonelli
                </span>
              </div>
              <p className="text-slate-500 max-w-sm font-light">
                Consultoria boutique focada em excelência operacional, transformação digital e estratégia de alto nível para o mercado brasileiro e internacional.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-300">Navegação</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#hero" className="hover:text-blue-400">Home</a></li>
                <li><a href="#products" className="hover:text-blue-400">Serviços</a></li>
                <li><a href="#insights" className="hover:text-blue-400">Insights</a></li>
                <li><a href="#contact" className="hover:text-blue-400">Metodologia</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-300">Redes Sociais</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-400">LinkedIn</a></li>
                <li><a href="#" className="hover:text-blue-400">Instagram</a></li>
                <li><a href="#" className="hover:text-blue-400">Twitter (X)</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-white/5 text-xs text-slate-600 font-medium uppercase tracking-[0.2em]">
            <span>© 2025 Claudio Tonelli Consultoria. Todos os direitos reservados.</span>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Consultant */}
      <ChatBot />
    </div>
  );
};

export default App;


import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ThreeGlobe from './components/ThreeGlobe';
import ChatBot from './components/ChatBot';
import ProductsSection from './components/ProductsSection';
import TestimonialsSection from './components/TestimonialsSection';
import ContactForm from './components/ContactForm';
import { 
  fetchMetrics, fetchInsights, fetchProducts, 
  fetchTestimonials, fetchCarouselImages, fetchSiteContent 
} from './services/supabaseService';
import { Metric, Insight, Product, Testimonial, CarouselImage } from './types';

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carousel, setCarousel] = useState<CarouselImage[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [m, i, p, t, c, s] = await Promise.all([
          fetchMetrics(),
          fetchInsights(),
          fetchProducts(),
          fetchTestimonials(),
          fetchCarouselImages(),
          fetchSiteContent('home')
        ]);
        setMetrics(m);
        setInsights(i);
        setProducts(p);
        setTestimonials(t);
        setCarousel(c);
        setContent(s);
      } catch (err) {
        console.error("App: Fatal data loading error", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();

    // Intersection Observer for scroll reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    const setupObserver = () => {
      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach(el => observer.observe(el));
    };

    // Delay to allow DOM to populate from state
    const timeout = setTimeout(setupObserver, 500);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  const heroTitle = content['home.hero.title'] || 'Estratégia Inesquecível.';
  const heroSubtitle = content['home.hero.subtitle'] || 'Transformamos visão em realidade através de excelência operacional e IA.';

  return (
    <div className="relative min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
           <ThreeGlobe />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 reveal active">
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Consultoria de Elite 2025
            </div>
            <h1 className="text-6xl md:text-8xl font-serif leading-tight">
              {heroTitle.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {i === heroTitle.split(' ').length - 1 ? <span className="italic text-slate-400">{word}</span> : word + ' '}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-light">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a href="#contact-form" className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg font-bold transition-all shadow-xl shadow-blue-600/20 btn-premium text-center">
                Solicitar Diagnóstico
              </a>
              <a href="#insights" className="bg-transparent border border-white/20 hover:bg-white/5 px-8 py-4 rounded-lg font-bold transition-all text-center">
                Insights Estratégicos
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Carousel Indicators if needed */}
        {carousel.length > 0 && (
          <div className="absolute bottom-20 right-10 flex flex-col gap-4">
            {carousel.map((_, i) => (
              <div key={i} className="w-1 h-8 bg-white/10 rounded-full overflow-hidden">
                <div className="w-full h-full bg-blue-500 origin-top scale-y-0 animate-progress"></div>
              </div>
            ))}
          </div>
        )}

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 opacity-50">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scrollytelling</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-blue-500 to-transparent"></div>
        </div>
      </section>

      {/* Metrics Section */}
      {metrics.length > 0 && (
        <section id="metrics" className="py-24 bg-slate-950 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {metrics.map((m) => (
                <div key={m.id} className="text-center group reveal">
                  <div className="text-5xl font-bold mb-2 text-white group-hover:text-blue-500 transition-colors">
                    {m.value}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-widest text-blue-500/80 mb-3">
                    {m.label}
                  </div>
                  {/* Metric icon could be rendered here if m.icon is specified */}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Insights Section */}
      {insights.length > 0 && (
        <section id="insights" className="py-32 bg-slate-900/50">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl reveal">
                <h2 className="text-4xl font-serif mb-4 italic">Visionary Insights</h2>
                <p className="text-slate-400 font-light">
                  Antecipando tendências globais para líderes que não apenas seguem, mas criam o futuro.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {insights.map((insight) => (
                <article key={insight.id} className="group cursor-pointer reveal">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-white/5">
                    <img 
                      src={insight.image_url || `https://picsum.photos/seed/${insight.id}/800/600`} 
                      alt={insight.title} 
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-slate-950/80 backdrop-blur-md text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-white/10">
                        {insight.category || 'Consultoria'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-serif group-hover:text-blue-400 transition-colors leading-tight">
                      {insight.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-light line-clamp-3">
                      {insight.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products & Services Section */}
      {products.length > 0 && <ProductsSection products={products} />}

      {/* Testimonials Section */}
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}

      {/* Contact Form Section */}
      <ContactForm />

      {/* Footer */}
      <footer id="contact" className="py-20 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-600/20">CT</div>
                <span className="text-2xl font-bold tracking-tight">
                  <span className="text-blue-500">Claudio</span> Tonelli
                </span>
              </div>
              <p className="text-slate-500 max-w-sm font-light leading-relaxed">
                Referência em gestão estratégica e operações de alta performance. Redefinindo o padrão de consultoria empresarial para o século XXI.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-300">Hub</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#hero" className="hover:text-blue-400">Início</a></li>
                <li><a href="#products" className="hover:text-blue-400">Soluções</a></li>
                <li><a href="#insights" className="hover:text-blue-400">Insights</a></li>
                <li><a href="#testimonials" className="hover:text-blue-400">Casos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-300">Conectar</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-400 flex items-center gap-2">LinkedIn</a></li>
                <li><a href="#" className="hover:text-blue-400 flex items-center gap-2">Instagram</a></li>
                <li><a href="#" className="hover:text-blue-400 flex items-center gap-2">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-white/5 text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
            <span>© 2025 Claudio Tonelli Consultoria Executive.</span>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
};

export default App;

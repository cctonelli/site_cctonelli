
import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ThreeGlobe from './components/ThreeGlobe';
import ChatBot from './components/ChatBot';
import ProductsSection from './components/ProductsSection';
import TestimonialsSection from './components/TestimonialsSection';
import ContactForm from './components/ContactForm';
import AdminDashboard from './components/AdminDashboard';
import ClientPortal from './components/ClientPortal';
import AuthModal from './components/AuthModal';
import ArticlePage from './components/ArticlePage';
import { 
  fetchMetrics, fetchInsights, fetchProducts, 
  fetchTestimonials, fetchCarouselImages, fetchSiteContent,
  getCurrentUser, getProfile, supabase, signOut
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, CarouselImage, Profile } from './types';

const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carousel, setCarousel] = useState<CarouselImage[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);
  
  // Settings States
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const t = translations[language];
  
  // UI States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Auth State
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setErrorOccurred(false);
      console.log("Initializing Claudio Tonelli Experience...");

      // Wrap calls in Promise.allSettled to prevent total failure if one table is empty
      const results = await Promise.allSettled([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchCarouselImages(),
        fetchSiteContent('home'),
        getCurrentUser()
      ]);

      const [m, i, p, test, c, s, userResult] = results;

      if (m.status === 'fulfilled') setMetrics(m.value);
      if (i.status === 'fulfilled') setInsights(i.value);
      if (p.status === 'fulfilled') setProducts(p.value);
      if (test.status === 'fulfilled') setTestimonials(test.value);
      if (c.status === 'fulfilled') setCarousel(c.value);
      if (s.status === 'fulfilled') setContent(s.value);

      if (userResult.status === 'fulfilled' && userResult.value) {
        const profile = await getProfile(userResult.value.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
    } catch (err) {
      console.error("Critical error during app initialization:", err);
      setErrorOccurred(true);
    } finally {
      // Small artificial delay for aesthetic transition
      setTimeout(() => setLoading(false), 1000);
    }
  };

  useEffect(() => {
    loadAllData();
    if (supabase) {
      const channel = supabase
        .channel('public_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts().then(setProducts))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'metrics' }, () => fetchMetrics().then(setMetrics))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => fetchTestimonials().then(setTestimonials))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insights' }, () => fetchInsights().then(setInsights))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.15 });

    const setupObserver = () => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    const timeout = setTimeout(setupObserver, 200);
    return () => { clearTimeout(timeout); observer.disconnect(); };
  }, [loading, insights, products]);

  const heroTitle = useMemo(() => {
    return content[`home.hero.title.${language}`] || t.hero_title;
  }, [content, language, t.hero_title]);

  const heroSubtitle = useMemo(() => {
    return content[`home.hero.subtitle.${language}`] || t.hero_subtitle;
  }, [content, language, t.hero_subtitle]);

  const handleAreaClick = () => {
    if (!userProfile) {
      setIsAuthOpen(true);
    } else if (userProfile.user_type === 'admin') {
      setIsAdminOpen(true);
    } else {
      setIsClientPortalOpen(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUserProfile(null);
    setIsAdminOpen(false);
    setIsClientPortalOpen(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#030712] z-[100] flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 mb-12">
           <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin"></div>
           <div className="absolute inset-2 border-t-2 border-slate-700 rounded-full animate-spin duration-[2000ms]"></div>
           <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-500 font-serif italic">CT</div>
        </div>
        <div className="text-[10px] tracking-[0.5em] uppercase font-bold text-slate-500 animate-pulse text-center px-6">
          Arquitetando Excelência Estratégica
        </div>
      </div>
    );
  }

  if (errorOccurred) {
    return (
      <div className="fixed inset-0 bg-[#030712] z-[100] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-serif text-white mb-4">Serviço Temporariamente Indisponível</h1>
        <p className="text-slate-500 max-w-md mb-8">Estamos realizando ajustes técnicos para garantir a melhor experiência. Por favor, retorne em breve.</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px]">Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500">
      <Navbar 
        onAdminClick={handleAreaClick} 
        userProfile={userProfile} 
        onLogout={handleLogout} 
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />

      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={loadAllData} />
      )}

      {isAdminOpen && userProfile?.user_type === 'admin' && (
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />
      )}
      
      {isClientPortalOpen && userProfile && (
        <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />
      )}

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-60"><ThreeGlobe /></div>
        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 reveal active">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>{t.hero_badge}
            </div>
            <h1 className="text-6xl md:text-8xl font-serif leading-[1.1] text-slate-900 dark:text-white transition-colors duration-500">
              {heroTitle.split(' ').map((word, i, arr) => (
                <span key={i} className="inline-block">
                  {i === arr.length - 1 ? <span className="italic text-slate-500 font-light">{word}</span> : word + '\u00A0'}
                  {i === 0 && <br className="hidden md:block" />}
                </span>
              ))}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed font-light border-l-2 border-blue-500/30 pl-6">{heroSubtitle}</p>
            <div className="flex flex-wrap gap-6 pt-4">
              <a href="#contact-form" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-xl font-bold transition-all shadow-2xl shadow-blue-600/30 btn-premium group flex items-center gap-3 active:scale-95">
                {t.btn_diagnosis}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
              <a href="#insights" className="glass px-10 py-5 rounded-xl font-bold transition-all hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-3 dark:text-white text-slate-900 active:scale-95">{t.btn_insights}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      {metrics.length > 0 && (
        <section id="metrics" className="py-32 bg-slate-50 dark:bg-[#050a18] border-y border-slate-200 dark:border-white/5 relative overflow-hidden transition-colors duration-500">
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400 mb-20">{t.metrics_title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
              {metrics.map((m) => (
                <div key={m.id} className="text-center group reveal">
                  <div className="text-6xl font-bold mb-4 text-slate-900 dark:text-white font-serif tracking-tighter group-hover:text-blue-500 transition-colors">{m.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/60 mb-3">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Insights Section */}
      {insights.length > 0 && (
        <section id="insights" className="py-40 bg-white dark:bg-slate-950 transition-colors duration-500">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-8">
              <div className="max-w-2xl reveal">
                <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">{t.insights_badge}</div>
                <h2 className="text-5xl font-serif mb-6 leading-tight dark:text-white text-slate-900">{t.insights_title}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-light text-lg leading-relaxed">{t.insights_subtitle}</p>
              </div>
              <div className="reveal">
                <button className="group dark:text-white text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:text-blue-500 transition-colors flex items-center gap-4 pb-2 border-b border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all">
                  {t.insights_all}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {insights.map((insight) => (
                <Link key={insight.id} to={`/insight/${insight.id}`} className="group cursor-pointer reveal">
                  <div className="relative aspect-[16/10] rounded-3xl overflow-hidden mb-8 shadow-2xl transition-all group-hover:shadow-blue-500/10 border border-slate-100 dark:border-white/5">
                    <img src={insight.image_url || 'https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80'} alt={insight.title} className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute top-6 left-6">
                      <span className="glass text-[9px] px-4 py-1.5 rounded-full uppercase tracking-widest font-bold text-white border border-white/10">{insight.category || 'ESTRATÉGIA'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors leading-snug">{insight.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-light line-clamp-2">{insight.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && <ProductsSection products={products} language={language} />}
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} language={language} />}
      <ContactForm language={language} />

      <footer id="contact" className="py-32 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#010309] relative transition-colors duration-500">
        <div className="container mx-auto px-6 text-center">
          <div className="flex flex-col items-center gap-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-blue-600/20">CT</div>
            <p className="text-slate-500 max-w-sm font-light leading-loose text-lg italic">{t.footer_desc}</p>
            <div className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.5em]">{t.copyright}</div>
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/insight/:id" element={<ArticlePage />} />
      </Routes>
    </Router>
  );
};

export default App;

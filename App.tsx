
import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import ProductsSection from './components/ProductsSection';
import TestimonialsSection from './components/TestimonialsSection';
import ContactForm from './components/ContactForm';
import AdminDashboard from './components/AdminDashboard';
import ClientPortal from './components/ClientPortal';
import AuthModal from './components/AuthModal';
import ArticlePage from './components/ArticlePage';
import HeroCarousel from './components/HeroCarousel';
import { 
  fetchMetrics, fetchInsights, fetchProducts, 
  fetchTestimonials, fetchSiteContent, fetchCarouselImages,
  getProfile, signOut, subscribeToChanges, supabase
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

// TAG DE CONTROLE DE DEPLOY - v6.8.7
const APP_VERSION = "v6.8.7-PLATINUM-ULTRA";

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [dbContent, setDbContent] = useState<Record<string, any>>({});
  
  const [isLive, setIsLive] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system');
  const t = translations[language];
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const syncData = useCallback(async () => {
    try {
      const [m, i, p, test, s, car] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages()
      ]);

      setMetrics(Array.isArray(m) ? m : []);
      setInsights(Array.isArray(i) ? i : []);
      setProducts(Array.isArray(p) ? p : []);
      setTestimonials(Array.isArray(test) ? test : []);
      setDbContent(s || {});
      setCarouselImages(Array.isArray(car) ? car : []);
      
      setIsLive(true);
    } catch (err) {
      console.error(`[App Core] Sync Failure:`, err);
      setIsLive(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch {
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lang', language);
    document.title = {
      pt: 'Claudio Tonelli Consultoria | Estratégia de Elite',
      en: 'Claudio Tonelli Consulting | Elite Strategy',
      es: 'Claudio Tonelli Consultoría | Estrategia de Élite'
    }[language];
  }, [language]);

  useEffect(() => {
    refreshUser();
    const timer = setTimeout(() => syncData(), 400);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refreshUser();
      else setUserProfile(null);
    });

    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, syncData));
    
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
      subs.forEach(s => s.unsubscribe());
    };
  }, [syncData, refreshUser]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const resolveTranslation = (item: any, field: string, fallback: string) => {
    if (!item) return fallback;
    if (language === 'pt') return item[field] || fallback;
    return item[`${field}_${language}`] || item[field] || fallback;
  };

  const resolveContent = (key: string, localFallback: string) => {
    const item = dbContent[key];
    if (!item) return localFallback;
    if (language === 'pt') return item.value || localFallback;
    return item[`value_${language}`] || item.value || localFallback;
  };

  return (
    <Router>
      <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500 selection:bg-blue-600 selection:text-white">
        
        {/* Auditor de Versão */}
        <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-1 pointer-events-none select-none">
          <div className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all duration-1000 ${isLive ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-2'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-300">
              {isLive ? 'Pulse: Synchronized' : 'Pulse: Initializing'}
            </span>
            <div className="w-px h-2 bg-white/10 mx-1"></div>
            <span className="text-[7px] font-mono text-blue-500 font-bold">{APP_VERSION}</span>
          </div>
        </div>

        <Navbar 
          onAdminClick={() => {
            if (!userProfile) setIsAuthOpen(true);
            else if (userProfile.user_type === 'admin') setIsAdminOpen(true);
            else setIsClientPortalOpen(true);
          }} 
          userProfile={userProfile} 
          onLogout={() => signOut().then(() => refreshUser())} 
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          labels={{
            strategy: resolveContent('nav_strategy', t.nav_strategy),
            insights: resolveContent('nav_insights', t.nav_insights),
            performance: resolveContent('nav_performance', t.nav_performance),
            connection: resolveContent('nav_connection', t.nav_connection),
            client_area: resolveContent('nav_client_area', t.nav_client_area)
          }}
        />

        {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={() => { refreshUser(); syncData(); }} />}
        {isAdminOpen && userProfile && <AdminDashboard profile={userProfile} onClose={() => setIsAdminOpen(false)} />}
        {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

        <Routes>
          <Route path="/" element={
            <main className="pt-20 lg:pt-24 transition-all duration-700">
              <HeroCarousel 
                slides={carouselImages} 
                t={t} 
                resolveContent={resolveContent} 
                language={language} 
                isLive={isLive} 
              />

              <section id="metrics" className="py-24 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5 transition-colors">
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                    {metrics.length > 0 ? metrics.map(m => (
                      <div key={m.id} className="text-center group">
                        <div className="text-5xl lg:text-6xl font-serif font-bold text-blue-600 mb-2">{m.value}</div>
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">{resolveTranslation(m, 'label', m.label)}</div>
                      </div>
                    )) : (
                      <div className="col-span-full text-center text-slate-400 text-[10px] uppercase tracking-[0.5em] animate-pulse py-10">Conectando ao Dashboard Estratégico...</div>
                    )}
                  </div>
                </div>
              </section>

              <section id="insights" className="py-32 bg-white dark:bg-slate-950 transition-colors">
                <div className="container mx-auto px-6">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-4">
                    <div>
                      <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[9px] mb-2">{t.insights_badge}</div>
                      <h2 className="text-4xl lg:text-5xl font-serif italic dark:text-white text-slate-900">{resolveContent('insights_title', t.insights_title)}</h2>
                    </div>
                    <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border-b-2 border-blue-600/10 hover:border-blue-600 pb-1 transition-all">{t.insights_all}</Link>
                  </div>
                  <div className="grid md:grid-cols-3 gap-12">
                    {insights.length > 0 ? insights.map(insight => (
                      <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group block space-y-6">
                        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 relative shadow-xl">
                          <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt="" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-2xl font-serif italic dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{resolveTranslation(insight, 'title', insight.title)}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 italic font-light">{resolveTranslation(insight, 'excerpt', insight.excerpt || '')}</p>
                        </div>
                      </Link>
                    )) : (
                       <div className="col-span-full py-20 text-center text-slate-400 text-[10px] uppercase tracking-[0.5em] animate-pulse italic">Sincronizando Knowledge Hub...</div>
                    )}
                  </div>
                </div>
              </section>

              <ProductsSection products={products} language={language} resolveTranslation={resolveTranslation} />
              <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={resolveTranslation} />
              <ContactForm language={language} />
            </main>
          } />
          <Route path="/insight/:id" element={<ArticlePage />} />
        </Routes>

        <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-brand-navy text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
          <div className="container mx-auto px-6 space-y-10 relative z-10">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl text-white shadow-2xl">CT</div>
            <div className="space-y-4">
              <h4 className="text-xl font-serif dark:text-white italic">Claudio Tonelli Group</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-600 font-black uppercase tracking-[0.6em] max-w-xl mx-auto leading-loose">{resolveContent('copyright', t.copyright)}</p>
            </div>
          </div>
        </footer>
        <ChatBot />
      </div>
    </Router>
  );
};

export default App;

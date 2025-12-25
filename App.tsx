
import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

const SEED_METRICS: Metric[] = [
  { id: '1', value: '...', label: 'Sincronizando...', icon: null, display_order: 1, is_active: true }
];

const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>(SEED_METRICS);
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
    console.debug("[Sync] Sincronizando dados públicos...");
    try {
      const [m, i, p, test, s, car] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages()
      ]);

      setMetrics(m || []);
      setInsights(i || []);
      setProducts(p || []);
      setTestimonials(test || []);
      setDbContent(s || {});
      setCarouselImages(car || []);
      
      setIsLive(true);
    } catch (err) {
      console.error("[Sync Error]", err);
      setIsLive(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await getProfile(session.user.id);
      setUserProfile(profile);
      console.debug("[Auth] Usuário identificado:", profile?.full_name);
    } else {
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
    syncData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.debug("[Auth Event]", _event);
      if (session) refreshUser();
      else setUserProfile(null);
    });

    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, syncData));
    
    return () => {
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
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500">
      
      {/* Realtime Link Status */}
      <div className={`fixed bottom-6 left-6 z-[100] flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur rounded-full border border-white/5 shadow-2xl transition-all duration-1000 ${isLive ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
        <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">
          {isLive ? 'Advisory Hub: Live' : 'Conectando...'}
        </span>
      </div>

      <Navbar 
        onAdminClick={() => {
          if (!userProfile) setIsAuthOpen(true);
          else if (userProfile.user_type === 'admin') setIsAdminOpen(true);
          else setIsClientPortalOpen(true);
        }} 
        userProfile={userProfile} 
        onLogout={() => signOut().then(() => {
          setUserProfile(null);
          setIsAdminOpen(false);
          setIsClientPortalOpen(false);
        })} 
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
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      <main>
        <HeroCarousel slides={carouselImages} t={t} resolveContent={resolveContent} language={language} />

        <section id="metrics" className="py-24 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5">
          <div className="container mx-auto px-6 text-center">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {metrics.map(m => (
                <div key={m.id} className="group">
                  <div className="text-5xl lg:text-6xl font-serif font-bold text-blue-600 mb-2">{m.value}</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">{resolveTranslation(m, 'label', m.label)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="py-32 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-4">
              <div>
                <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[9px] mb-2">{t.insights_badge}</div>
                <h2 className="text-4xl lg:text-5xl font-serif italic dark:text-white text-slate-900">{resolveContent('insights_title', t.insights_title)}</h2>
              </div>
              <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border-b-2 border-blue-600/10 hover:border-blue-600 pb-1 transition-all">{t.insights_all}</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              {insights.map(insight => (
                <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group block space-y-6">
                  <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 relative shadow-xl">
                    <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt="" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-serif italic dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{resolveTranslation(insight, 'title', insight.title)}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 italic font-light">{resolveTranslation(insight, 'excerpt', insight.excerpt || '')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ProductsSection products={products} language={language} resolveTranslation={resolveTranslation} />
        <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={resolveTranslation} />
        <ContactForm language={language} />
      </main>

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

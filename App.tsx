
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import WorkInProgress from './components/WorkInProgress';
import StoreGrid from './components/Store/StoreGrid';
import ProductPage from './components/Store/ProductPage';
import CheckoutPage from './components/Store/CheckoutPage';

import { 
  fetchMetrics, fetchInsights, fetchProducts, 
  fetchTestimonials, fetchSiteContent, fetchCarouselImages,
  getProfile, signOut, subscribeToChanges, supabase, fetchGlobalTranslations
} from './services/supabaseService';
import { Language, staticTranslations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

const APP_VERSION = "v8.0.0-ELITE";

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [dbContent, setDbContent] = useState<Record<string, any>>({});
  const [dbTranslations, setDbTranslations] = useState<Record<string, string>>({});
  
  const [isLive, setIsLive] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system');
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // UNIFIED TRANSLATION ENGINE (v8.0.0)
  const t = useMemo(() => {
    const base = staticTranslations[language] || staticTranslations['pt'];
    return { ...base, ...dbTranslations };
  }, [language, dbTranslations]);

  const syncData = useCallback(async () => {
    try {
      const [m, i, p, test, s, car, translationsMap] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(true),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages(),
        fetchGlobalTranslations(language)
      ]);

      setMetrics(m);
      setInsights(i);
      setProducts(p);
      setTestimonials(test);
      setDbContent(s);
      setCarouselImages(car);
      setDbTranslations(translationsMap);
      
      setIsLive(true);
    } catch (err) {
      console.error(`[App Core] Sync Failure:`, err);
      setIsLive(false);
    }
  }, [language]);

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
    document.title = `Claudio Tonelli Consultoria | ${language.toUpperCase()}`;
  }, [language]);

  useEffect(() => {
    refreshUser();
    syncData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => refreshUser());

    const tables = ['metrics', 'insights', 'products', 'product_variants', 'testimonials', 'carousel_images', 'site_content', 'content_translations', 'orders', 'user_products'];
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

  const resolveTranslation = useCallback((item: any, field: string, fallbackKey: string) => {
    if (!item) return t[fallbackKey] || '';
    if (language !== 'pt' && item[`${field}_${language}`]) return item[`${field}_${language}`];
    return item[field] || t[fallbackKey] || '';
  }, [language, t]);

  const resolveContent = useCallback((key: string, localFallback: string) => {
    const item = dbContent[key];
    if (item) {
      if (language !== 'pt' && item[`value_${language}`]) return item[`value_${language}`];
      if (item.value) return item.value;
    }
    return t[key] || localFallback;
  }, [language, dbContent, t]);

  return (
    <Router>
      <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500 selection:bg-blue-600 selection:text-white">
        
        {/* Connection Pulse */}
        <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-1 pointer-events-none select-none">
          <div className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl transition-all duration-1000 ${isLive ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-2'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-300">
              {isLive ? 'ELITE ENGINE ACTIVE' : 'SYNC CALIBRATING'}
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
          labels={t}
        />

        {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={() => { refreshUser(); syncData(); }} />}
        {isAdminOpen && userProfile && <AdminDashboard profile={userProfile} onClose={() => setIsAdminOpen(false)} />}
        {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

        <Routes>
          <Route path="/" element={
            <main className="pt-20 lg:pt-24">
              <HeroCarousel slides={carouselImages} t={t} resolveContent={resolveContent} language={language} isLive={isLive} />

              <section id="metrics" className="py-24 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5 transition-colors">
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                    {metrics.map(m => (
                      <div key={m.id} className="text-center group">
                        <div className="text-5xl lg:text-6xl font-serif font-bold text-blue-600 mb-2">{m.value}</div>
                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">{resolveTranslation(m, 'label', '')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="insights" className="py-32 bg-white dark:bg-slate-950 transition-colors">
                <div className="container mx-auto px-6">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-4">
                    <div>
                      <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[9px] mb-2">{resolveContent('insights_badge', t.insights_badge)}</div>
                      <h2 className="text-4xl lg:text-5xl font-serif italic dark:text-white text-slate-900">{resolveContent('insights_title', t.insights_title)}</h2>
                    </div>
                    <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border-b-2 border-blue-600/10 hover:border-blue-600 pb-1 transition-all">{resolveContent('insights_all', t.insights_all)}</Link>
                  </div>
                  <div className="grid md:grid-cols-3 gap-12">
                    {insights.map(insight => (
                      <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group block space-y-6">
                        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 relative shadow-xl">
                          <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt="" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-2xl font-serif italic dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{resolveTranslation(insight, 'title', '')}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 italic font-light">{resolveTranslation(insight, 'excerpt', '')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              <ProductsSection products={products} language={language} resolveTranslation={resolveTranslation} t={t} />
              <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={resolveTranslation} t={t} />
              <ContactForm language={language} t={t} />
            </main>
          } />
          <Route path="/loja" element={<StoreGrid language={language} t={t} resolveTranslation={resolveTranslation} />} />
          <Route path="/loja/:slug" element={<ProductPage language={language} t={t} resolveTranslation={resolveTranslation} />} />
          <Route path="/loja/:slug/checkout" element={<CheckoutPage profile={userProfile} onAuthRequest={() => setIsAuthOpen(true)} language={language} t={t} />} />
          <Route path="/insight/:id" element={<ArticlePage />} />
          <Route path="/wip" element={<WorkInProgress />} />
        </Routes>

        <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-brand-navy text-center relative">
          <div className="container mx-auto px-6 space-y-10">
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

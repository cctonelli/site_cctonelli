
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import FloatingCTA from './components/FloatingCTA';
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
import ToolsGrid from './components/Store/ToolsGrid';
import GlobalStrategyMap from './components/GlobalStrategyMap';

import { 
  fetchMetrics, fetchInsights, fetchProducts, 
  fetchTestimonials, fetchSiteContent, fetchCarouselImages,
  getProfile, signOut, supabase, fetchGlobalTranslations, fetchSiteConfig
} from './services/supabaseService';
import { Language, staticTranslations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

const APP_VERSION = "v15.5-EDITORIAL";

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
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'dark');
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // KERNEL CONFIGURATION
  const siteConfig = useMemo(() => fetchSiteConfig(), []);

  const t = useMemo(() => {
    const base = staticTranslations[language] || staticTranslations['pt'];
    return { ...base, ...dbTranslations };
  }, [language, dbTranslations]);

  const syncData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages(),
        fetchGlobalTranslations(language)
      ]);

      if (results[0].status === 'fulfilled') setMetrics(results[0].value);
      if (results[1].status === 'fulfilled') setInsights(results[1].value);
      if (results[2].status === 'fulfilled') setProducts(results[2].value);
      if (results[3].status === 'fulfilled') setTestimonials(results[3].value);
      if (results[4].status === 'fulfilled') setDbContent(results[4].value);
      if (results[5].status === 'fulfilled') setCarouselImages(results[5].value);
      if (results[6].status === 'fulfilled') setDbTranslations(results[6].value);
      
      setIsLive(true);
    } catch (err) {
      console.error(`[App Core] Sync Failure:`, err);
      setIsLive(true); // Garante que a tela saia do loading mesmo em erro
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
    refreshUser(); 
    syncData();
    
    // INJETAR CONFIGURAÇÃO DO KERNEL EM TEMPO REAL
    const root = document.documentElement;
    if (siteConfig && siteConfig.theme) {
      root.style.setProperty('--accent-blue', siteConfig.theme.primary || '#2563eb');
      root.style.setProperty('--brand-gold', siteConfig.theme.secondary || '#b4975a');
      root.style.setProperty('--bg-navy', siteConfig.theme.bg_dark || '#010309');
      root.style.setProperty('--text-main', siteConfig.theme.text_main || '#f8fafc');
      root.style.setProperty('--text-secondary', siteConfig.theme.text_secondary || '#94a3b8');
    }
    
    if (siteConfig && siteConfig.ux) {
      root.style.setProperty('--global-radius', siteConfig.ux.border_radius_global || '2.5rem');
      root.style.setProperty('--glow-opacity', siteConfig.ux.glow_intensity || '0.6');
      root.style.setProperty('--scanline-opacity', (siteConfig.ux.scanline_opacity || 0.08).toString());
    }
    
    if (siteConfig && siteConfig.typography) {
      root.style.setProperty('--h1-size', siteConfig.typography.h1_size || '9.5rem');
      root.style.setProperty('--h2-size', siteConfig.typography.h2_size || '4.5rem');
      root.style.setProperty('--body-size', siteConfig.typography.body_size || '1.125rem');
    }
    
    if (siteConfig && siteConfig.seo && siteConfig.seo.title) {
      document.title = siteConfig.seo.title[language] || siteConfig.seo.title['pt'] || 'Claudio Tonelli Consultoria';
    }
  }, [syncData, refreshUser, siteConfig, language]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  const resolveTranslation = useCallback((item: any, field: string, fallbackKey: string) => {
    if (!item) return t[fallbackKey] || '';
    if (language !== 'pt' && item[`${field}_${language}`]) return item[`${field}_${language}`];
    return item[field] || t[fallbackKey] || '';
  }, [language, t]);

  const resolveContent = useCallback((key: string, localFallback: string) => {
    const item = dbContent[key];
    if (item && language !== 'pt' && item[`value_${language}`]) return item[`value_${language}`];
    return item?.value || t[key] || localFallback;
  }, [language, dbContent, t]);

  return (
    <Router>
      <div className="relative min-h-screen bg-white dark:bg-[#010309] transition-colors duration-500" style={{ backgroundColor: 'var(--bg-navy)' }}>
        
        {/* Status Protocol v15.5 */}
        <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-1 pointer-events-none select-none">
          <div className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 rounded-full border border-white/10 shadow-2xl transition-all duration-1000 ${isLive ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-2'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-300">EDITORIAL COMMAND</span>
            <div className="w-px h-2 bg-white/10 mx-1"></div>
            <span className="text-[7px] font-mono text-green-500 font-bold">{APP_VERSION}</span>
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
        />

        {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={() => { refreshUser(); syncData(); }} />}
        {isAdminOpen && userProfile && <AdminDashboard profile={userProfile} onClose={() => setIsAdminOpen(false)} />}
        {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

        <Routes>
          <Route path="/" element={
            <main className="pt-20 lg:pt-24">
              {siteConfig.visibility?.hero && <HeroCarousel slides={carouselImages} t={t} resolveContent={resolveContent} language={language} isLive={isLive} />}
              
              {siteConfig.visibility?.metrics && (
                <section id="metrics" className="py-24 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5">
                  <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                      {metrics.map(m => (
                        <div key={m.id} className="text-center group">
                          <div className="text-5xl lg:text-7xl font-serif font-bold text-blue-600 dark:text-green-600 mb-2 transition-transform group-hover:scale-110 duration-500">{m.value}</div>
                          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">{resolveTranslation(m, 'label', '')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {siteConfig.visibility?.insights && (
                <section id="insights" className="py-32 bg-white dark:bg-[#010309]">
                  <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-4">
                      <div className="space-y-4">
                        <div className="text-blue-500 dark:text-green-500 font-black uppercase tracking-[0.5em] text-[9px] mb-2">{resolveContent('insights_badge', t.insights_badge)}</div>
                        <h2 className="text-5xl md:text-[5rem] font-serif italic dark:text-white text-slate-900 leading-[0.9] tracking-tighter">{resolveContent('insights_title', t.insights_title)}</h2>
                      </div>
                      <Link to="/wip" className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-green-500 border-b-2 border-current pb-2 transition-all">Folhear Acervo</Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-16">
                      {insights.map(insight => (
                        <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group block space-y-8">
                          <div className="aspect-[3/4] overflow-hidden bg-slate-900 border border-white/5 relative shadow-2xl" style={{ borderRadius: 'var(--global-radius)' }}>
                            <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-8 left-8 right-8 text-white">
                               <div className="text-[9px] font-black uppercase tracking-widest text-green-500 mb-2">{insight.category || 'INSIGHT'}</div>
                               <h3 className="text-3xl font-serif italic leading-tight">{resolveTranslation(insight, 'title', '')}</h3>
                            </div>
                          </div>
                          <p className="text-slate-500 text-base font-light italic leading-relaxed line-clamp-2">{resolveTranslation(insight, 'excerpt', '')}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {siteConfig.visibility?.products && <ProductsSection products={products} language={language} resolveTranslation={resolveTranslation} t={t} />}
              {siteConfig.visibility?.strategy_map && <GlobalStrategyMap />}
              {siteConfig.visibility?.tools && <ToolsGrid />}
              {siteConfig.visibility?.testimonials && <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={resolveTranslation} t={t} />}
              {siteConfig.visibility?.contact_form && <ContactForm language={language} t={t} />}
            </main>
          } />
          <Route path="/loja" element={<StoreGrid language={language} t={t} resolveTranslation={resolveTranslation} />} />
          <Route path="/ferramentas" element={<div className="pt-32"><ToolsGrid /></div>} />
          <Route path="/loja/:slug" element={<ProductPage language={language} t={t} resolveTranslation={resolveTranslation} />} />
          <Route path="/loja/:slug/checkout" element={<CheckoutPage profile={userProfile} onAuthRequest={() => setIsAuthOpen(true)} language={language} t={t} />} />
          <Route path="/insight/:id" element={<ArticlePage />} />
          <Route path="/wip" element={<WorkInProgress />} />
        </Routes>

        {siteConfig.visibility?.footer && (
          <footer className="py-32 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#010309] text-center">
            <div className="container mx-auto px-6 space-y-12">
              <div className="w-14 h-14 bg-blue-600 dark:bg-green-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl text-white dark:text-black shadow-2xl">CT</div>
              <div className="flex justify-center gap-12">
                 <a href={siteConfig.contact?.linkedin} className="text-slate-500 hover:text-green-500 text-[10px] font-black uppercase tracking-widest transition-colors">LinkedIn</a>
                 <a href={siteConfig.contact?.instagram} className="text-slate-500 hover:text-green-500 text-[10px] font-black uppercase tracking-widest transition-colors">Instagram</a>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-600 font-black uppercase tracking-[0.6em] max-w-xl mx-auto leading-loose">{resolveContent('copyright', t.copyright)}</p>
              <p className="text-[8px] text-slate-700 uppercase tracking-widest">{siteConfig.contact?.address}</p>
            </div>
          </footer>
        )}
        <ChatBot />
        <FloatingCTA t={t} />
      </div>
    </Router>
  );
};

export default App;

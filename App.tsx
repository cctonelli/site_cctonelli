
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
  fetchTestimonials, fetchSiteContent, fetchCarouselImages,
  getCurrentUser, getProfile, signOut, fetchTranslationsForEntity,
  subscribeToChanges
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

const HomePage: React.FC = () => {
  // States estruturais
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [translationsCache, setTranslationsCache] = useState<Record<string, any>>({});
  const [content, setContent] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const t = translations[language];
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const root = window.document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return () => { isMounted.current = false; };
  }, [theme]);

  const loadAllData = useCallback(async (silent = false) => {
    if (!isMounted.current) return;
    
    try {
      if (!silent && !initialLoadDone.current) setLoading(true);
      
      const [m, i, p, test, s, car, user] = await Promise.all([
        fetchMetrics().catch(() => []),
        fetchInsights().catch(() => []),
        fetchProducts().catch(() => []),
        fetchTestimonials().catch(() => []),
        fetchSiteContent('home').catch(() => ({})),
        fetchCarouselImages().catch(() => []),
        getCurrentUser().catch(() => null)
      ]);
      
      if (!isMounted.current) return;

      const checkActive = (item: any) => {
        if (item.is_active === undefined || item.is_active === null) return true;
        const val = String(item.is_active).toLowerCase();
        return val === 'true' || val === '1' || item.is_active === true;
      };

      const activeCarousel = (car || [])
        .filter(checkActive)
        .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
      
      setCarouselImages(activeCarousel);
      setMetrics((m || []).filter(checkActive));
      setInsights((i || []).filter(checkActive));
      setProducts(p || []);
      setTestimonials((test || []).filter(t => t.approved));
      setContent(s || {});

      // Carregamento inteligente de traduções
      const entities = [
        ...activeCarousel.map(c => ({ type: 'carousel_images', id: c.id })),
        ...(i || []).filter(checkActive).map(ins => ({ type: 'insights', id: ins.id })),
        ...(p || []).map(prod => ({ type: 'products', id: prod.id })),
        ...(m || []).filter(checkActive).map(met => ({ type: 'metrics', id: met.id })),
        ...(test || []).filter(t => t.approved).map(at => ({ type: 'testimonials', id: at.id }))
      ];

      if (entities.length > 0) {
        const trans: Record<string, any> = {};
        const transResults = await Promise.all(
          entities.map(async (ent) => {
            const data = await fetchTranslationsForEntity(ent.type, ent.id).catch(() => ({}));
            return { id: String(ent.id), data };
          })
        );
        transResults.forEach(res => {
          if (res.data && Object.keys(res.data).length > 0) trans[res.id] = res.data;
        });
        setTranslationsCache(trans);
      }

      if (user && !silent) {
        const profile = await getProfile(user.id);
        setUserProfile(profile);
      }

      initialLoadDone.current = true;
    } catch (err) {
      console.error("Critical Load Failure:", err);
    } finally {
      if (isMounted.current && !silent) {
        setTimeout(() => setLoading(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const tables = ['metrics', 'insights', 'products', 'testimonials', 'site_content', 'carousel_images', 'content_translations'];
    const subs = tables.map(table => subscribeToChanges(table, () => loadAllData(true)));
    return () => { subs.forEach(s => s.unsubscribe()); };
  }, [loadAllData]);

  useEffect(() => {
    if (activeCarouselIndex >= carouselImages.length) setActiveCarouselIndex(0);
  }, [carouselImages.length]);

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCarouselIndex(prev => (prev + 1) % carouselImages.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const resolveTranslation = (entityId: any, field: string, baseValue: string) => {
    if (language === 'pt') return baseValue;
    const cacheKey = String(entityId);
    return translationsCache[cacheKey]?.[field]?.[language] || baseValue;
  };

  const getL = (key: string, defaultVal: string) => {
    const langKey = `${key}.${language}`;
    const baseKey = `${key}.pt`;
    return content[langKey] || content[baseKey] || content[key] || defaultVal;
  };

  const currentTitle = useMemo(() => {
    const slide = carouselImages[activeCarouselIndex];
    if (!slide) return getL('home.hero.title', t.hero_title);
    return resolveTranslation(slide.id, 'title', slide.title || t.hero_title);
  }, [activeCarouselIndex, carouselImages, language, content, t.hero_title, translationsCache]);

  const currentSubtitle = useMemo(() => {
    const slide = carouselImages[activeCarouselIndex];
    if (!slide) return getL('home.hero.subtitle', t.hero_subtitle);
    return resolveTranslation(slide.id, 'subtitle', slide.subtitle || t.hero_subtitle);
  }, [activeCarouselIndex, carouselImages, language, content, t.hero_subtitle, translationsCache]);

  const handleAreaClick = () => {
    if (!userProfile) setIsAuthOpen(true);
    else if (userProfile.user_type === 'admin') setIsAdminOpen(true);
    else setIsClientPortalOpen(true);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-brand-navy flex flex-col items-center justify-center z-[1000]">
      <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="mt-8 text-[11px] font-black uppercase tracking-[0.6em] text-blue-500 animate-pulse">
        Sincronizando Advisory Global...
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500 overflow-x-hidden">
      <Navbar 
        onAdminClick={handleAreaClick} 
        userProfile={userProfile} 
        onLogout={() => { signOut(); window.location.reload(); }} 
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        labels={{
          strategy: getL('nav.strategy', t.nav_strategy),
          insights: getL('nav.insights', t.nav_insights),
          performance: getL('nav.performance', t.nav_performance),
          connection: getL('nav.connection', t.nav_connection),
          client_area: getL('nav.client_area', t.nav_client_area)
        }}
      />

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={() => loadAllData(true)} />}
      {isAdminOpen && userProfile?.user_type === 'admin' && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      <section id="hero" className="relative h-screen flex items-center overflow-hidden min-h-[600px]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-20 md:opacity-40 z-10 pointer-events-none"><ThreeGlobe /></div>
          {carouselImages.length > 0 ? (
            carouselImages.map((img, idx) => (
              <div 
                key={img.id} 
                className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${idx === activeCarouselIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'}`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'https://nmrk.imgix.net/uploads/fields/hero-image/Global-Strategy-Consulting.jpeg'; }} />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/60 to-transparent"></div>
              </div>
            ))
          ) : (
            <div className="absolute inset-0 bg-[#010309]"><img src="https://nmrk.imgix.net/uploads/fields/hero-image/Global-Strategy-Consulting.jpeg" className="w-full h-full object-cover opacity-20" /></div>
          )}
        </div>

        <div className="container mx-auto px-6 relative z-20 grid lg:grid-cols-2 h-full items-center">
          <div className="space-y-12 animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-blue-500/5">
               {carouselImages[activeCarouselIndex] ? resolveTranslation(carouselImages[activeCarouselIndex].id, 'title', carouselImages[activeCarouselIndex].title || t.hero_badge) : t.hero_badge}
            </div>
            <div className="space-y-10">
              <h1 className="text-6xl md:text-8xl font-serif leading-[1.05] dark:text-white text-slate-900 drop-shadow-2xl">{currentTitle}</h1>
              <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-light border-l-4 border-blue-600/40 pl-10 italic">{currentSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-8 pt-8">
              <a href="#contact" className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-600/40 hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 group flex items-center gap-3">
                {getL('btn.diagnosis', t.btn_diagnosis)}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
              <a href="#insights" className="glass px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] dark:text-white text-slate-900 border border-white/10 hover:bg-white/5 transition-all hover:scale-105 active:scale-95">
                {getL('btn.insights', t.btn_insights)}
              </a>
            </div>
            {carouselImages.length > 1 && (
              <div className="flex gap-4 pt-16">
                {carouselImages.map((_, idx) => (
                  <button key={idx} onClick={() => setActiveCarouselIndex(idx)} className={`h-1.5 rounded-full transition-all duration-700 ${idx === activeCarouselIndex ? 'w-16 bg-blue-600 shadow-lg shadow-blue-600/30' : 'w-6 bg-slate-800 hover:bg-slate-700'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="metrics" className="py-40 bg-slate-50 dark:bg-[#010309] relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-20">
            {metrics.map(m => (
              <div key={m.id} className="reveal active hover:translate-y-[-10px] transition-transform duration-500">
                <div className="text-7xl font-bold dark:text-white text-slate-900 font-serif mb-6 drop-shadow-2xl">{m.value}</div>
                <div className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 border-t border-slate-200 dark:border-white/5 pt-6 inline-block">
                  {resolveTranslation(m.id, 'label', m.label)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-40 dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="space-y-4">
              <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Strategic Hub</div>
              <h2 className="text-5xl font-serif dark:text-white text-slate-900 italic max-w-xl leading-tight">
                {getL('home.insights_title', t.insights_title)}
              </h2>
            </div>
            <Link to="#contact-form" className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-blue-500 transition-colors border-b-2 border-slate-500/20 hover:border-blue-500/50 pb-2">
              Solicitar Advisory
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {insights.slice(0, 3).map(insight => (
              <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group space-y-8">
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl relative">
                  <img src={insight.image_url || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                  <div className="absolute bottom-8 left-8 right-8"><span className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">{insight.category || 'ADVISORY'}</span></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-serif dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors leading-tight italic">{resolveTranslation(insight.id, 'title', insight.title)}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 italic font-light leading-relaxed">{resolveTranslation(insight.id, 'excerpt', insight.excerpt || '')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductsSection products={products} language={language} resolveTranslation={resolveTranslation} />
      <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={resolveTranslation} />
      <ContactForm language={language} />

      <footer className="py-24 border-t border-white/5 text-center bg-brand-navy relative">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
        <div className="container mx-auto px-6 space-y-10 relative z-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl shadow-2xl shadow-blue-600/30">CT</div>
          <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.6em] max-w-md mx-auto leading-relaxed">
            {getL('footer.copyright', t.copyright)}
          </p>
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

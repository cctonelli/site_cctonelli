
import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  getProfile, signOut, subscribeToChanges, supabase
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [dbContent, setDbContent] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const t = translations[language];
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  const checkActive = (item: any) => {
    if (!item) return false;
    const active = item.is_active ?? item.approved ?? true;
    return active === true || active === 'true' || active === 1;
  };

  const syncSupabaseData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    console.log("[Data Sync] Fetching global assets...");

    try {
      const results = await Promise.allSettled([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages()
      ]);

      if (results[0].status === 'fulfilled') setMetrics((results[0].value as any[]).filter(checkActive));
      if (results[1].status === 'fulfilled') setInsights((results[1].value as any[]).filter(checkActive));
      if (results[2].status === 'fulfilled') setProducts(results[2].value as any[]);
      if (results[3].status === 'fulfilled') setTestimonials((results[3].value as any[]).filter(checkActive));
      if (results[4].status === 'fulfilled') setDbContent(results[4].value as Record<string, string>);
      if (results[5].status === 'fulfilled') setCarouselImages((results[5].value as any[]).filter(checkActive));
    } catch (err) {
      console.error("[Data Sync] Error:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Monitoramento de Sessão e Auth
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth Event]", event);
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setIsAdminOpen(false);
        setIsClientPortalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    syncSupabaseData();
    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, () => syncSupabaseData(true)));
    return () => subs.forEach(s => s.unsubscribe());
  }, [syncSupabaseData]);

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCarouselIndex(prev => (prev + 1) % carouselImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const resolveContent = (key: string, localFallback: string) => dbContent[key] || localFallback;

  if (loading) return (
    <div className="fixed inset-0 bg-brand-navy flex flex-col items-center justify-center z-[1000]">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-blue-500/60 animate-pulse">Sincronizando Advisory Hub...</div>
    </div>
  );

  const currentSlide = carouselImages[activeCarouselIndex];

  return (
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500">
      <Navbar 
        onAdminClick={() => userProfile ? (userProfile.user_type === 'admin' ? setIsAdminOpen(true) : setIsClientPortalOpen(true)) : setIsAuthOpen(true)} 
        userProfile={userProfile} 
        onLogout={() => signOut().then(() => window.location.reload())} 
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

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={() => syncSupabaseData(true)} />}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      <section id="hero" className="relative h-screen flex items-center overflow-hidden bg-brand-navy">
        <AnimatePresence mode="wait">
          {carouselImages.length > 0 ? (
            <motion.div 
              key={currentSlide?.id || activeCarouselIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <img src={currentSlide.url} className="w-full h-full object-cover opacity-40" alt="" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/60 to-transparent"></div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 opacity-20">
              <ThreeGlobe />
            </div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-4xl space-y-10"
          >
            <span className="inline-block px-5 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">
              {resolveContent('hero_badge', t.hero_badge)}
            </span>
            <h1 className="text-6xl lg:text-9xl font-serif text-white italic leading-[0.9] tracking-tighter">
              {currentSlide?.title || resolveContent('hero_title', t.hero_title)}
            </h1>
            <p className="text-xl lg:text-2xl text-slate-400 font-light italic border-l-4 border-blue-600/30 pl-8 max-w-2xl">
              {currentSlide?.subtitle || resolveContent('hero_subtitle', t.hero_subtitle)}
            </p>
            <div className="flex flex-wrap gap-6 pt-6">
              <a href="#contact" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-2xl">
                {resolveContent('btn_diagnosis', t.btn_diagnosis)}
              </a>
              {carouselImages.length > 1 && (
                <div className="flex items-center gap-2">
                  {carouselImages.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${i === activeCarouselIndex ? 'w-12 bg-blue-600' : 'w-4 bg-white/10'}`} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="metrics" className="py-32 bg-[#010309] border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {metrics.length > 0 ? metrics.map(m => (
              <div key={m.id} className="text-center space-y-4">
                <div className="text-6xl font-serif font-bold text-blue-600 tracking-tighter">{m.value}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{m.label}</div>
              </div>
            )) : (
              <div className="col-span-4 text-center text-slate-700 text-[10px] uppercase tracking-widest"> KPIs em Processamento...</div>
            )}
          </div>
        </div>
      </section>

      <section id="insights" className="py-40 dark:bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-5xl font-serif dark:text-white italic">{resolveContent('insights_title', t.insights_title)}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {insights.length > 0 ? insights.map(insight => (
              <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group space-y-6">
                <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/5">
                  <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" />
                </div>
                <h3 className="text-2xl font-serif dark:text-white group-hover:text-blue-500 transition-colors italic">{insight.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 italic">{insight.excerpt}</p>
              </Link>
            )) : (
              <div className="col-span-3 py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-700 uppercase tracking-widest text-[10px]">
                Nenhum Insight Publicado.
              </div>
            )}
          </div>
        </div>
      </section>

      <ProductsSection products={products} language={language} resolveTranslation={(id, f, b) => b} />
      <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={(id, f, b) => b} />
      <ContactForm language={language} />

      <footer className="py-20 border-t border-white/5 bg-brand-navy text-center">
        <div className="container mx-auto px-6 space-y-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center font-bold text-xl text-white">CT</div>
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.6em]">{resolveContent('copyright', t.copyright)}</p>
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

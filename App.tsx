
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

const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [dbContent, setDbContent] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const t = translations[language];
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // --- Lógica de Temas Aprimorada ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      let isDark = false;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const checkActive = (item: any) => {
    if (!item) return false;
    const activeVal = item.is_active !== undefined ? item.is_active : (item.approved !== undefined ? item.approved : true);
    return activeVal === true || activeVal === 'true' || activeVal === 1;
  };

  const syncSupabaseData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      console.log("[App] Sincronizando dados...");
      const [m, i, p, test, s, car] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages()
      ]);

      setMetrics((m || []).filter(checkActive));
      setInsights((i || []).filter(checkActive));
      setProducts(p || []);
      setTestimonials((test || []).filter(checkActive));
      setDbContent(s || {});
      
      const activeSlides = (car || []).filter(checkActive);
      setCarouselImages(activeSlides);
      
      console.log("[App] Slides Ativos:", activeSlides.length);
    } catch (err) {
      console.error("[App] Erro na sincronização:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    syncSupabaseData();
    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, () => {
      console.log(`[Realtime] Mudança em ${table}, atualizando...`);
      syncSupabaseData(true);
    }));
    return () => subs.forEach(s => s.unsubscribe());
  }, [syncSupabaseData]);

  const resolveContent = (key: string, localFallback: string) => dbContent[key] || localFallback;

  if (loading) return (
    <div className="fixed inset-0 bg-brand-navy flex flex-col items-center justify-center z-[1000]">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-blue-500/60 animate-pulse">Iniciando Advisory Hub...</div>
    </div>
  );

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

      <HeroCarousel slides={carouselImages} t={t} resolveContent={resolveContent} />

      <section id="metrics" className="py-32 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5 transition-colors">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {metrics.map(m => (
              <div key={m.id} className="text-center space-y-4">
                <div className="text-6xl font-serif font-bold text-blue-600 tracking-tighter">{m.value}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-40 bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-5xl font-serif text-slate-900 dark:text-white italic">{resolveContent('insights_title', t.insights_title)}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {insights.map(insight => (
              <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group space-y-6">
                <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-80 dark:opacity-60 group-hover:opacity-100 transition-all" alt="" />
                </div>
                <h3 className="text-2xl font-serif text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors italic">{insight.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 italic">{insight.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductsSection products={products} language={language} resolveTranslation={(id, f, b) => b} />
      <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={(id, f, b) => b} />
      <ContactForm language={language} />

      <footer className="py-20 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-brand-navy text-center transition-colors">
        <div className="container mx-auto px-6 space-y-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center font-bold text-xl text-white">CT</div>
          <p className="text-[9px] text-slate-500 dark:text-slate-600 font-black uppercase tracking-[0.6em]">{resolveContent('copyright', t.copyright)}</p>
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

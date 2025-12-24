
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  { id: '1', value: '+17k', label: 'LinkedIn Connections', icon: null, display_order: 1, is_active: true },
  { id: '2', value: '25+', label: 'Anos de Estratégia', icon: null, display_order: 2, is_active: true },
  { id: '3', value: '500+', label: 'Executive Mentorships', icon: null, display_order: 3, is_active: true },
  { id: '4', value: 'ROI', label: 'Operational Excellence', icon: null, display_order: 4, is_active: true }
];

const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>(SEED_METRICS);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [dbContent, setDbContent] = useState<Record<string, string>>({});
  
  const [isLive, setIsLive] = useState(false);
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
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

      if (m?.length) setMetrics(m);
      if (i?.length) setInsights(i);
      if (p?.length) setProducts(p);
      if (test?.length) setTestimonials(test);
      if (s) setDbContent(s);
      if (car?.length) setCarouselImages(car);
      
      setIsLive(true);
    } catch (err) {
      console.error("[Supabase Sync Error]", err);
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      }
      await syncData();
    };

    init();

    // Inscrição em Tempo Real para todas as tabelas
    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, syncData));
    
    return () => subs.forEach(s => s.unsubscribe());
  }, [syncData]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  const resolveContent = (key: string, localFallback: string) => dbContent[key] || localFallback;

  return (
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500">
      
      {/* Indicador de Status Realtime */}
      <div className={`fixed bottom-6 left-6 z-[100] flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur rounded-full border border-white/5 shadow-2xl transition-all duration-1000 ${isLive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Database Connected</span>
      </div>

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

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={syncData} />}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      <main>
        <HeroCarousel slides={carouselImages} t={t} resolveContent={resolveContent} />

        <section id="metrics" className="py-24 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {metrics.map(m => (
                <div key={m.id} className="text-center">
                  <div className="text-5xl font-serif font-bold text-blue-600 mb-2">{m.value}</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="py-32 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-6">
            <div className="flex justify-between items-end mb-16">
              <h2 className="text-4xl font-serif italic dark:text-white text-slate-900">{resolveContent('insights_title', t.insights_title)}</h2>
              <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 border-b border-blue-600/20 pb-1">{t.insights_all}</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              {insights.map(insight => (
                <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group block space-y-6">
                  <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 relative">
                    <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>
                  <h3 className="text-2xl font-serif italic dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors">{insight.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 italic">{insight.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ProductsSection products={products} language={language} resolveTranslation={(id, f, b) => b} />
        <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={(id, f, b) => b} />
        <ContactForm language={language} />
      </main>

      <footer className="py-20 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-brand-navy text-center">
        <div className="container mx-auto px-6 space-y-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center font-bold text-xl text-white shadow-2xl">CT</div>
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

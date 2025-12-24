
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
  
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const t = translations[language];
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const initialLoadRef = useRef(false);

  const syncSupabaseData = useCallback(async (silent = false) => {
    if (!silent) console.log("[AdvisorySync] Iniciando captura de inteligência pública...");
    
    try {
      const [m, i, p, test, s, car] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages()
      ]);

      const filterActive = (list: any[]) => list?.filter(item => {
        const val = item.is_active !== undefined ? item.is_active : (item.approved !== undefined ? item.approved : true);
        return val === true || val === 'true' || val === 1;
      }) || [];

      if (m?.length) setMetrics(filterActive(m));
      if (i?.length) setInsights(filterActive(i));
      if (p?.length) setProducts(p);
      if (test?.length) setTestimonials(filterActive(test));
      if (s) setDbContent(s);
      if (car?.length) setCarouselImages(filterActive(car));
      
      if (!silent) console.log("[AdvisorySync] Ecossistema sincronizado.");
    } catch (err) {
      console.warn("[AdvisorySync] Falha na rede de dados. Operando em modo seguro (Cache/Seed).", err);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const startup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      }
      await syncSupabaseData();
    };

    startup();

    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, () => syncSupabaseData(true)));
    return () => subs.forEach(s => s.unsubscribe());
  }, [syncSupabaseData]);

  const resolveContent = (key: string, localFallback: string) => dbContent[key] || localFallback;

  return (
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500 selection:bg-blue-600 selection:text-white">
      
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

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={syncSupabaseData} />}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      <main className="animate-in fade-in duration-1000">
        <HeroCarousel slides={carouselImages} t={t} resolveContent={resolveContent} />

        <section id="metrics" className="py-32 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent"></div>
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {metrics.map(m => (
                <div key={m.id} className="text-center space-y-4 hover:scale-105 transition-transform duration-500">
                  <div className="text-6xl font-serif font-bold text-blue-600 tracking-tighter drop-shadow-2xl">{m.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-500">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="py-40 bg-white dark:bg-slate-950 transition-colors">
          <div className="container mx-auto px-6">
            <div className="mb-24 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">Strategic Intelligence</div>
                <h2 className="text-6xl font-serif text-slate-900 dark:text-white italic leading-tight">
                  {resolveContent('insights_title', t.insights_title)}
                </h2>
              </div>
              <Link to="/#insights" className="text-blue-600 font-black uppercase tracking-widest text-[10px] border-b-2 border-blue-600/20 pb-2 hover:border-blue-600 transition-all">
                {t.insights_all}
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-16">
              {insights.length > 0 ? insights.map(insight => (
                <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group space-y-8 block">
                  <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl relative">
                    <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-80 dark:opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-10 left-10 right-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">{insight.category || 'Executive'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors italic leading-tight">{insight.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-light italic leading-relaxed line-clamp-3">{insight.excerpt}</p>
                  </div>
                </Link>
              )) : (
                <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[4rem]">
                  <span className="text-[11px] font-black uppercase tracking-[0.8em] text-slate-400 animate-pulse">Sincronizando Insights Estratégicos...</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <ProductsSection products={products} language={language} resolveTranslation={(id, f, b) => b} />
        <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={(id, f, b) => b} />
        <ContactForm language={language} />
      </main>

      <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-brand-navy text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
        <div className="container mx-auto px-6 space-y-12 relative z-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl text-white shadow-2xl shadow-blue-600/30">CT</div>
          <div className="space-y-4">
            <h4 className="text-2xl font-serif dark:text-white italic">Claudio Tonelli Consultoria</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-600 font-black uppercase tracking-[0.8em] max-w-xl mx-auto leading-loose">
              {resolveContent('copyright', t.copyright)}
            </p>
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

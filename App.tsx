
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

// SEED DATA: Garantia de site sempre vivo e profissional
const SEED_METRICS: Metric[] = [
  { id: '1', value: '+17k', label: 'Conexões LinkedIn', icon: null, display_order: 1, is_active: true },
  { id: '2', value: '25+', label: 'Anos de Expertise', icon: null, display_order: 2, is_active: true },
  { id: '3', value: '500+', label: 'Executivos Mentorados', icon: null, display_order: 3, is_active: true },
  { id: '4', value: 'ROI', label: 'Excelência Operacional', icon: null, display_order: 4, is_active: true }
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

  const syncSupabaseData = useCallback(async () => {
    console.log("[Supabase Sync] Iniciando sincronização em segundo plano...");
    
    try {
      const [m, i, p, test, s, car] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages()
      ]);

      const active = (list: any[]) => list?.filter(item => {
        const val = item.is_active !== undefined ? item.is_active : (item.approved !== undefined ? item.approved : true);
        return val === true || val === 'true' || val === 1;
      }) || [];

      if (m?.length) setMetrics(active(m));
      if (i?.length) setInsights(active(i));
      if (p?.length) setProducts(p);
      if (test?.length) setTestimonials(active(test));
      if (s) setDbContent(s);
      if (car?.length) setCarouselImages(active(car));
      
      console.log("[Supabase Sync] Dados sincronizados com sucesso.");
    } catch (err) {
      console.warn("[Supabase Sync] Falha ao ler do banco. Mantendo dados locais.", err);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
      const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
      if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    };
    applyTheme();
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        setUserProfile(profile);
      }
      await syncSupabaseData();
    };
    init();

    // Inscrição Realtime
    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, syncSupabaseData));
    return () => subs.forEach(s => s.unsubscribe());
  }, [syncSupabaseData]);

  const resolveContent = (key: string, localFallback: string) => dbContent[key] || localFallback;

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

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={syncSupabaseData} />}
      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      <HeroCarousel slides={carouselImages} t={t} resolveContent={resolveContent} />

      <section id="metrics" className="py-32 bg-slate-50 dark:bg-[#010309] border-y border-slate-200 dark:border-white/5 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {metrics.map(m => (
              <div key={m.id} className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-6xl font-serif font-bold text-blue-600 tracking-tighter">{m.value}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-40 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-5xl font-serif text-slate-900 dark:text-white italic">{resolveContent('insights_title', t.insights_title)}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {insights.length > 0 ? insights.map(insight => (
              <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group space-y-6">
                <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                  <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-80 dark:opacity-60 group-hover:opacity-100 transition-all duration-700" alt="" />
                </div>
                <h3 className="text-2xl font-serif text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors italic">{insight.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 italic">{insight.excerpt}</p>
              </Link>
            )) : (
              <div className="col-span-full py-20 text-center opacity-30 text-[10px] uppercase font-bold tracking-widest italic">Insights estratégicos em sincronização...</div>
            )}
          </div>
        </div>
      </section>

      <ProductsSection products={products} language={language} resolveTranslation={(id, f, b) => b} />
      <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={(id, f, b) => b} />
      <ContactForm language={language} />

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

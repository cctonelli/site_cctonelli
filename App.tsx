
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
  getCurrentUser, getProfile, signOut, subscribeToChanges
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

const HomePage: React.FC = () => {
  // Estados de Dados
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [dbContent, setDbContent] = useState<Record<string, string>>({});
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const t = translations[language];
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  /**
   * Função Central de Sincronização
   * Prioridade Total ao Supabase
   */
  const syncSupabaseData = useCallback(async (isSilent = false) => {
    const startTime = performance.now();
    if (!isSilent) setLoading(true);

    try {
      console.log("%c CT %c Iniciando Sincronização com Supabase...", "background:#2563eb;color:#fff;padding:2px 5px;border-radius:3px;", "color:#2563eb;font-weight:bold;");

      const [m, i, p, test, s, car, user] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages(),
        getCurrentUser()
      ]);

      const checkActive = (item: any) => {
        if (!item) return false;
        if (item.is_active === undefined || item.is_active === null) return true;
        return String(item.is_active).toLowerCase() === 'true' || item.is_active === true;
      };

      // Processamento de Dados
      const activeCarousel = ((car as CarouselImage[]) || []).filter(checkActive).sort((a,b) => a.display_order - b.display_order);
      const activeMetrics = ((m as Metric[]) || []).filter(checkActive).sort((a,b) => a.display_order - b.display_order);
      const activeInsights = ((i as Insight[]) || []).filter(checkActive).sort((a,b) => a.display_order - b.display_order);
      const activeProducts = (p as Product[]) || [];
      const activeTestimonials = ((test as Testimonial[]) || []).filter(t => t.approved);
      const fetchedContent = (s as Record<string, string>) || {};

      // Relatório de Conexão no Console (Inconfundível)
      const duration = (performance.now() - startTime).toFixed(2);
      console.group(`%c 🚀 RELATÓRIO DE SINCRONIZAÇÃO [${duration}ms] `, "background:#010309;color:#2563eb;padding:5px;border:1px solid #2563eb;");
      console.info("Status da Conexão:", "ESTABELECIDA");
      console.table({
        "Slides Carrossel": activeCarousel.length,
        "Métricas": activeMetrics.length,
        "Insights": activeInsights.length,
        "Produtos/Serviços": activeProducts.length,
        "Depoimentos": activeTestimonials.length,
        "Chaves de Texto": Object.keys(fetchedContent).length
      });
      console.groupEnd();

      // Atualização de Estados
      setCarouselImages(activeCarousel);
      setMetrics(activeMetrics);
      setInsights(activeInsights);
      setProducts(activeProducts);
      setTestimonials(activeTestimonials);
      setDbContent(fetchedContent);

      if (user && !isSilent) {
        const profile = await getProfile((user as any).id);
        setUserProfile(profile);
      }
    } catch (err) {
      console.error("%c ❌ ERRO CRÍTICO NA SINCRONIZAÇÃO ", "background:#ef4444;color:#fff;padding:5px;", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito de Inicialização e Realtime
  useEffect(() => {
    syncSupabaseData();

    // Monitoramento Realtime
    const tables = ['metrics', 'insights', 'products', 'testimonials', 'carousel_images', 'site_content'];
    const subs = tables.map(table => subscribeToChanges(table, () => syncSupabaseData(true)));
    
    return () => subs.forEach(s => s.unsubscribe());
  }, [syncSupabaseData]);

  // Rotação do Carrossel
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCarouselIndex(prev => (prev + 1) % carouselImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  /**
   * Content Resolver com Fallback Estratégico
   */
  const resolveContent = (key: string, localFallback: string) => {
    const dbValue = dbContent[`${key}_${language}`] || dbContent[key];
    return dbValue || localFallback;
  };

  if (loading) return (
    <div className="fixed inset-0 bg-brand-navy flex flex-col items-center justify-center z-[1000]">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-blue-600/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600 text-xs">CT</div>
      </div>
      <div className="mt-10 text-[10px] font-black uppercase tracking-[0.5em] text-blue-500/60 animate-pulse">Sincronizando com Advisory Hub...</div>
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
      {isAdminOpen && userProfile?.user_type === 'admin' && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      {/* Hero Section - Dinâmica Supabase */}
      <section id="hero" className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-brand-navy">
          <AnimatePresence mode="wait">
            {carouselImages.length > 0 ? (
              <motion.div 
                key={currentSlide?.id || 'main-slide'}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute inset-0"
              >
                {currentSlide?.url && (
                   <img src={currentSlide.url} className="w-full h-full object-cover opacity-40" alt="" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/70 to-transparent"></div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                 <ThreeGlobe />
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-navy"></div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 items-center h-full pt-20">
          <div className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-4 px-6 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]"
            >
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              {resolveContent('hero_badge', t.hero_badge)}
            </motion.div>
            
            <h1 className="text-6xl lg:text-9xl font-serif dark:text-white text-slate-900 leading-[0.9] italic tracking-tighter">
              {currentSlide?.title || resolveContent('hero_title', t.hero_title)}
            </h1>
            
            <p className="text-2xl text-slate-400 max-w-xl leading-relaxed font-light italic border-l-4 border-blue-600/30 pl-10">
              {currentSlide?.subtitle || resolveContent('hero_subtitle', t.hero_subtitle)}
            </p>

            <div className="flex flex-wrap gap-8 pt-8 items-center">
              <a href="#contact" className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:-translate-y-1 transition-all">
                {resolveContent('btn_diagnosis', t.btn_diagnosis)}
              </a>
              
              {carouselImages.length > 1 && (
                <div className="flex items-center gap-4">
                  {carouselImages.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveCarouselIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-700 ${i === activeCarouselIndex ? 'w-16 bg-blue-600 shadow-lg shadow-blue-600/40' : 'w-4 bg-slate-800'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section - Somente Supabase */}
      <section id="metrics" className="py-40 bg-slate-50 dark:bg-[#010309] border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 text-center">
            {metrics.length > 0 ? metrics.map((m, idx) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="text-7xl font-serif font-bold text-blue-600 tracking-tighter">{m.value}</div>
                <div className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 max-w-[150px] mx-auto leading-relaxed">
                  {m.label}
                </div>
              </motion.div>
            )) : (
              // Esqueleto se o banco estiver vazio
              [1,2,3,4].map(n => (
                <div key={n} className="space-y-4">
                   <div className="h-16 w-32 bg-slate-200 dark:bg-white/5 rounded-2xl mx-auto animate-pulse"></div>
                   <div className="h-4 w-24 bg-slate-100 dark:bg-white/5 rounded-full mx-auto animate-pulse"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section id="insights" className="py-48 dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="mb-24 space-y-6">
               <span className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] block">Strategic Knowledge Hub</span>
               <h2 className="text-6xl font-serif dark:text-white text-slate-900 italic tracking-tight">
                 {resolveContent('insights_title', t.insights_title)}
               </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-16">
            {insights.length > 0 ? insights.map(insight => (
              <Link key={insight.id} to={`/insight/${insight.id}?lang=${language}`} className="group space-y-8">
                <div className="aspect-[16/10] rounded-[3rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl relative">
                  <img src={insight.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt="" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-serif dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors leading-tight italic">
                    {insight.title}
                  </h3>
                  <p className="text-slate-500 text-sm font-light leading-relaxed line-clamp-2 italic">
                    {insight.excerpt}
                  </p>
                </div>
              </Link>
            )) : (
              <div className="col-span-3 py-20 text-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-700 font-black uppercase tracking-widest text-[10px]">
                Conteúdo Estratégico sendo Arquitetado...
              </div>
            )}
          </div>
        </div>
      </section>

      <ProductsSection products={products} language={language} resolveTranslation={(id, f, b) => b} />
      <TestimonialsSection testimonials={testimonials} language={language} resolveTranslation={(id, f, b) => b} />
      <ContactForm language={language} />

      <footer className="py-32 border-t border-white/5 text-center bg-brand-navy relative">
        <div className="absolute inset-0 bg-grid opacity-5"></div>
        <div className="container mx-auto px-6 space-y-12 relative z-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-3xl text-white shadow-2xl">CT</div>
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.6em]">
            {resolveContent('copyright', t.copyright)}
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

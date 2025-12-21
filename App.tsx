
import React, { useEffect, useState, useMemo } from 'react';
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
  fetchTestimonials, fetchSiteContent,
  getCurrentUser, getProfile, signOut, supabase
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile } from './types';

// Mock Data for Demo Mode
const MOCK_INSIGHTS: Insight[] = [
  { id: '1', title: 'A Era da IA Generativa na Gestão', excerpt: 'Como CEOs estão redefinindo prioridades estratégicas.', content: '', category: 'ESTRATÉGIA', image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80', published_at: new Date().toISOString(), is_active: true, display_order: 1, link: '' },
  { id: '2', title: 'Sustentabilidade como Vantagem', excerpt: 'ESG não é mais opcional, é o motor da nova economia.', content: '', category: 'ESG', image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80', published_at: new Date().toISOString(), is_active: true, display_order: 2, link: '' },
  { id: '3', title: 'Liderança em Tempos de Crise', excerpt: 'Resiliência e visão de longo prazo no mercado global.', content: '', category: 'LIDERANÇA', image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80', published_at: new Date().toISOString(), is_active: true, display_order: 3, link: '' },
];

const MOCK_METRICS: Metric[] = [
  { id: '1', label: 'EBITDA Médio Adicionado', value: '+24%', icon: null, display_order: 1, is_active: true },
  { id: '2', label: 'Projetos Realizados', value: '150+', icon: null, display_order: 2, is_active: true },
  { id: '3', label: 'Retenção de Clientes', value: '98%', icon: null, display_order: 3, is_active: true },
  { id: '4', label: 'Países com Impacto', value: '12', icon: null, display_order: 4, is_active: true },
];

const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const t = translations[language];
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Attempt to load from Supabase if keys exist
      if (supabase) {
        const [m, i, p, test, s, user] = await Promise.all([
          fetchMetrics(),
          fetchInsights(),
          fetchProducts(),
          fetchTestimonials(),
          fetchSiteContent('home'),
          getCurrentUser()
        ]);
        
        setMetrics(m.length > 0 ? m : MOCK_METRICS);
        setInsights(i.length > 0 ? i : MOCK_INSIGHTS);
        setProducts(p);
        setTestimonials(test);
        setContent(s);

        if (user) {
          const profile = await getProfile(user.id);
          setUserProfile(profile);
        }
      } else {
        // Fallback to Demo Data
        setMetrics(MOCK_METRICS);
        setInsights(MOCK_INSIGHTS);
        setLoading(false);
      }
    } catch (err) {
      console.warn("Using fallback demo data due to connection error:", err);
      setMetrics(MOCK_METRICS);
      setInsights(MOCK_INSIGHTS);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, insights]);

  const heroTitle = useMemo(() => content[`home.hero.title.${language}`] || t.hero_title, [content, language, t.hero_title]);
  const heroSubtitle = useMemo(() => content[`home.hero.subtitle.${language}`] || t.hero_subtitle, [content, language, t.hero_subtitle]);

  const handleAreaClick = () => {
    if (!userProfile) setIsAuthOpen(true);
    else if (userProfile.user_type === 'admin') setIsAdminOpen(true);
    else setIsClientPortalOpen(true);
  };

  const handleLogout = async () => {
    await signOut();
    setUserProfile(null);
    setIsAdminOpen(false);
    setIsClientPortalOpen(false);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-[#030712] z-[100] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin mb-6"></div>
      <div className="text-[9px] tracking-[0.5em] uppercase font-bold text-slate-500 animate-pulse">Iniciando Experiência</div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500 overflow-x-hidden">
      <Navbar 
        onAdminClick={handleAreaClick} 
        userProfile={userProfile} 
        onLogout={handleLogout} 
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onSuccess={loadAllData} />}
      {isAdminOpen && userProfile?.user_type === 'admin' && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
      {isClientPortalOpen && userProfile && <ClientPortal profile={userProfile} products={products} onClose={() => setIsClientPortalOpen(false)} />}

      <section id="hero" className="relative h-screen flex items-center">
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-60"><ThreeGlobe /></div>
        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 items-center">
          <div className="space-y-10 reveal active">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>{t.hero_badge}
            </div>
            <h1 className="text-6xl md:text-8xl font-serif leading-[1.1] dark:text-white text-slate-900">
              {heroTitle}
            </h1>
            <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-light border-l-2 border-blue-500/30 pl-6">{heroSubtitle}</p>
            <div className="flex gap-6 pt-4">
              <a href="#contact-form" className="bg-blue-600 text-white px-10 py-5 rounded-xl font-bold transition-all shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95">{t.btn_diagnosis}</a>
              <a href="#insights" className="glass px-10 py-5 rounded-xl font-bold transition-all dark:text-white text-slate-900 border border-white/10">{t.btn_insights}</a>
            </div>
          </div>
        </div>
      </section>

      {metrics.length > 0 && (
        <section id="metrics" className="py-32 bg-slate-50 dark:bg-[#050a18] border-y border-white/5 relative overflow-hidden">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400 mb-20">{t.metrics_title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
              {metrics.map(m => (
                <div key={m.id} className="reveal">
                  <div className="text-6xl font-bold mb-4 dark:text-white text-slate-900 font-serif">{m.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {insights.length > 0 && (
        <section id="insights" className="py-40 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-6">
            <div className="mb-24 reveal">
              <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">{t.insights_badge}</div>
              <h2 className="text-5xl font-serif mb-6 dark:text-white text-slate-900">{t.insights_title}</h2>
              <p className="text-slate-500 max-w-2xl font-light text-lg">{t.insights_subtitle}</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-12">
              {insights.map(insight => (
                <Link key={insight.id} to={`/insight/${insight.id}`} className="group reveal">
                  <div className="aspect-[16/10] rounded-3xl overflow-hidden mb-8 shadow-2xl border border-white/5">
                    <img src={insight.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" alt={insight.title} />
                  </div>
                  <h3 className="text-2xl font-serif dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors mb-4">{insight.title}</h3>
                  <p className="text-slate-500 text-sm font-light line-clamp-2">{insight.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && <ProductsSection products={products} language={language} />}
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} language={language} />}
      <ContactForm language={language} />

      <footer className="py-20 border-t border-white/5 bg-slate-50 dark:bg-[#010309] text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center font-bold text-white mb-8">CT</div>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">{t.footer_desc}</p>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.5em]">{t.copyright}</div>
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

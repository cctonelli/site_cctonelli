
import React, { useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
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
  getCurrentUser, getProfile, signOut, supabase
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

// Fallback Data Premium
const MOCK_CAROUSEL: CarouselImage[] = [
  { id: 'f1', title: 'Expertise Global', subtitle: 'Arquitetando o amanhã através de rigor metodológico e inovação digital.', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80', link: null, display_order: 1, is_active: true },
  { id: 'f2', title: 'Liderança Exponencial', subtitle: 'Transformamos incerteza em vantagem competitiva para o mercado global.', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80', link: null, display_order: 2, is_active: true }
];

const MOCK_INSIGHTS: Insight[] = [
  { id: '1', title: 'A Era da IA Generativa na Gestão', excerpt: 'Como CEOs estão redefinindo prioridades estratégicas para 2026.', content: '', category: 'ESTRATÉGIA', image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80', published_at: new Date().toISOString(), is_active: true, display_order: 1, link: '' },
  { id: '2', title: 'Sustentabilidade como Vantagem', excerpt: 'ESG não é mais opcional, é o motor central da nova economia global.', content: '', category: 'ESG', image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80', published_at: new Date().toISOString(), is_active: true, display_order: 2, link: '' },
];

const MOCK_METRICS: Metric[] = [
  { id: '1', label: 'EBITDA Médio Adicionado', value: '+24%', icon: null, display_order: 1, is_active: true },
  { id: '2', label: 'Projetos Realizados', value: '150+', icon: null, display_order: 2, is_active: true },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
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
      const [m, i, p, test, s, car, user] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchSiteContent('home'),
        fetchCarouselImages(),
        getCurrentUser()
      ]);
      
      setMetrics(m.length > 0 ? m : MOCK_METRICS);
      setInsights(i.length > 0 ? i : MOCK_INSIGHTS);
      setProducts(p);
      setTestimonials(test);
      setContent(s);
      setCarouselImages(car.length > 0 ? car : MOCK_CAROUSEL);

      if (user) {
        const profile = await getProfile(user.id);
        setUserProfile(profile);
      }
    } catch (err) {
      console.warn("Using fallbacks:", err);
      setMetrics(MOCK_METRICS);
      setInsights(MOCK_INSIGHTS);
      setCarouselImages(MOCK_CAROUSEL);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCarouselIndex(prev => (prev + 1) % carouselImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [carouselImages]);

  const handleCarouselClick = (link: string | null) => {
    if (!link) return;
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  const heroTitle = useMemo(() => content[`home.hero.title.${language}`] || content['home.hero.title.pt'] || t.hero_title, [content, language, t.hero_title]);
  
  const currentSubtitle = useMemo(() => {
    const slideSubtitle = carouselImages[activeCarouselIndex]?.subtitle;
    if (slideSubtitle) return slideSubtitle;
    return content[`home.hero.subtitle.${language}`] || content['home.hero.subtitle.pt'] || t.hero_subtitle;
  }, [activeCarouselIndex, carouselImages, content, language, t.hero_subtitle]);

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
    window.location.reload();
  };

  if (loading) return (
    <div className="fixed inset-0 bg-[#010309] z-[100] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin mb-8"></div>
      <div className="text-[10px] tracking-[0.6em] uppercase font-bold text-slate-500 animate-pulse">Claudio Tonelli Consultoria</div>
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

      <section id="hero" className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-40 dark:opacity-60"><ThreeGlobe /></div>
          {carouselImages.map((img, idx) => (
            <div 
              key={img.id}
              onClick={() => handleCarouselClick(img.link)}
              className={`absolute inset-0 transition-opacity duration-[2.5s] ease-in-out ${idx === activeCarouselIndex ? 'opacity-30' : 'opacity-0'} ${img.link ? 'cursor-pointer' : ''}`}
            >
              <img src={img.url} className="w-full h-full object-cover scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#010309] via-[#010309]/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#010309] via-transparent to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 items-center pointer-events-none">
          <div className="space-y-12 reveal active pointer-events-auto">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              {carouselImages[activeCarouselIndex]?.title || t.hero_badge}
            </div>
            <h1 className="text-6xl md:text-8xl font-serif leading-[1.05] dark:text-white text-slate-900 transition-all duration-700">
              {heroTitle}
            </h1>
            <div className="relative overflow-hidden h-24 md:h-32">
              <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-light border-l-2 border-blue-500/30 pl-8 transition-all duration-1000">
                {currentSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 pt-6">
              <a href="#contact" className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-105 active:scale-95">
                {t.btn_diagnosis}
              </a>
              <a href="#insights" className="glass px-12 py-6 rounded-2xl font-bold uppercase tracking-widest text-[11px] dark:text-white text-slate-900 border border-white/10 hover:bg-white/5 transition-all">
                {t.btn_insights}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Outras seções... */}
      <section id="metrics" className="py-40 bg-slate-50 dark:bg-[#010309] border-y border-white/5 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-500 mb-24">{t.metrics_title}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-20">
            {metrics.map(m => (
              <div key={m.id} className="reveal active group">
                <div className="text-6xl md:text-7xl font-bold mb-6 dark:text-white text-slate-900 font-serif group-hover:text-blue-500 transition-colors duration-500">{m.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-48 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="mb-24 reveal active max-w-4xl">
            <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-6">{t.insights_badge}</div>
            <h2 className="text-5xl md:text-6xl font-serif mb-8 dark:text-white text-slate-900 italic leading-tight">{t.insights_title}</h2>
            <p className="text-slate-500 max-w-2xl font-light text-xl leading-relaxed">{t.insights_subtitle}</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-16">
            {insights.slice(0, 3).map(insight => (
              <Link key={insight.id} to={`/insight/${insight.id}`} className="group reveal active">
                <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-10 shadow-2xl border border-white/5 relative">
                  <img src={insight.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" alt={insight.title} />
                  <div className="absolute top-6 left-6 px-4 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest text-blue-400 border border-white/10">
                    {insight.category || 'ESTRATÉGIA'}
                  </div>
                </div>
                <h3 className="text-2xl font-serif dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors mb-4 italic leading-snug">{insight.title}</h3>
                <p className="text-slate-500 text-base font-light line-clamp-2 leading-relaxed">{insight.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="strategy">
        {products.length > 0 && <ProductsSection products={products} language={language} />}
      </section>
      
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} language={language} />}
      
      <section id="contact">
        <ContactForm language={language} />
      </section>

      <footer className="py-32 border-t border-white/5 bg-slate-50 dark:bg-[#010309] transition-colors relative">
        <div className="container mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-white text-2xl mb-12 shadow-2xl shadow-blue-600/30">CT</div>
          <p className="text-slate-400 text-base max-w-sm mx-auto mb-10 font-light leading-relaxed">{t.footer_desc}</p>
          <div className="text-[9px] text-slate-700 font-bold uppercase tracking-[0.6em]">{t.copyright}</div>
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

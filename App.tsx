
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
  getCurrentUser, getProfile, signOut
} from './services/supabaseService';
import { Language, translations } from './services/i18nService';
import { Metric, Insight, Product, Testimonial, Profile, CarouselImage } from './types';

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
      
      setMetrics(m);
      setInsights(i);
      setProducts(p);
      setTestimonials((test || []).filter(t => t.approved));
      setContent(s);
      
      const activeCarousel = (car || [])
        .filter(img => img.is_active)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
      setCarouselImages(activeCarousel);

      if (user) {
        const profile = await getProfile(user.id);
        setUserProfile(profile);
      }
    } catch (err) {
      console.warn("Load error:", err);
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

  const getL = (key: string, defaultVal: string) => {
    return content[`${key}.${language}`] || content[`${key}.pt`] || defaultVal;
  };

  const currentTitle = useMemo(() => {
    const slide = carouselImages[activeCarouselIndex];
    if (!slide) return getL('home.hero.title', t.hero_title);
    if (language === 'en') return slide.title_en || slide.title || t.hero_title;
    if (language === 'es') return slide.title_es || slide.title || t.hero_title;
    return slide.title || t.hero_title;
  }, [activeCarouselIndex, carouselImages, language, content, t.hero_title]);

  const currentSubtitle = useMemo(() => {
    const slide = carouselImages[activeCarouselIndex];
    if (!slide) return getL('home.hero.subtitle', t.hero_subtitle);
    if (language === 'en') return slide.subtitle_en || slide.subtitle || t.hero_subtitle;
    if (language === 'es') return slide.subtitle_es || slide.subtitle || t.hero_subtitle;
    return slide.subtitle || t.hero_subtitle;
  }, [activeCarouselIndex, carouselImages, language, content, t.hero_subtitle]);

  const handleCarouselClick = (link: string | null) => {
    if (!link) return;
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  const handleAreaClick = () => {
    if (!userProfile) setIsAuthOpen(true);
    else if (userProfile.user_type === 'admin') setIsAdminOpen(true);
    else setIsClientPortalOpen(true);
  };

  if (loading) return (
    <div className="fixed inset-0 bg-[#010309] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-white dark:bg-brand-navy transition-colors duration-500">
      <Navbar 
        onAdminClick={handleAreaClick} 
        userProfile={userProfile} 
        onLogout={() => { signOut(); window.location.reload(); }} 
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
              className={`absolute inset-0 transition-opacity duration-[2.5s] ${idx === activeCarouselIndex ? 'opacity-30' : 'opacity-0'} ${img.link ? 'cursor-pointer' : ''}`}
            >
              <img src={img.url} className="w-full h-full object-cover scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/50 to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2">
          <div className="space-y-12">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              {carouselImages[activeCarouselIndex]?.title || t.hero_badge}
            </div>
            <h1 className="text-6xl md:text-8xl font-serif leading-[1.05] dark:text-white text-slate-900">
              {currentTitle}
            </h1>
            <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-light border-l-2 border-blue-500/30 pl-8">
              {currentSubtitle}
            </p>
            <div className="flex gap-6 pt-6">
              <a href="#contact" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-600/30">
                {t.btn_diagnosis}
              </a>
              <a href="#insights" className="glass px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] dark:text-white text-slate-900 border border-white/10">
                {t.btn_insights}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="metrics" className="py-40 bg-slate-50 dark:bg-[#010309]">
        <div className="container mx-auto px-6 text-center">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-20">
            {metrics.map(m => (
              <div key={m.id} className="reveal active">
                <div className="text-6xl font-bold dark:text-white text-slate-900 font-serif mb-4">{m.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {language === 'en' ? m.label_en || m.label : language === 'es' ? m.label_es || m.label : m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-40 dark:bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-4xl font-serif dark:text-white text-slate-900 italic">{t.insights_title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {insights.slice(0, 3).map(insight => (
              <Link key={insight.id} to={`/insight/${insight.id}`} className="group">
                <div className="aspect-video rounded-3xl overflow-hidden mb-6 bg-slate-900">
                  <img src={insight.image_url || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={insight.title} />
                </div>
                <h3 className="text-xl font-serif dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors">
                  {language === 'en' ? insight.title_en || insight.title : language === 'es' ? insight.title_es || insight.title : insight.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductsSection products={products} language={language} />
      <TestimonialsSection testimonials={testimonials} language={language} />
      <ContactForm language={language} />

      <footer className="py-20 border-t border-white/5 text-center">
        <p className="text-[9px] text-slate-700 font-bold uppercase tracking-[0.6em]">{t.copyright}</p>
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

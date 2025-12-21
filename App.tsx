
import React, { useEffect, useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import ThreeGlobe from './components/ThreeGlobe';
import ChatBot from './components/ChatBot';
import ProductsSection from './components/ProductsSection';
import TestimonialsSection from './components/TestimonialsSection';
import ContactForm from './components/ContactForm';
import AdminDashboard from './components/AdminDashboard';
import ClientPortal from './components/ClientPortal';
import AuthModal from './components/AuthModal';
import { 
  fetchMetrics, fetchInsights, fetchProducts, 
  fetchTestimonials, fetchCarouselImages, fetchSiteContent,
  getCurrentUser, getProfile, supabase, signOut
} from './services/supabaseService';
import { Metric, Insight, Product, Testimonial, CarouselImage, Profile } from './types';

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [carousel, setCarousel] = useState<CarouselImage[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Auth State
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  const loadAllData = async () => {
    try {
      const [m, i, p, t, c, s, user] = await Promise.all([
        fetchMetrics(),
        fetchInsights(),
        fetchProducts(),
        fetchTestimonials(),
        fetchCarouselImages(),
        fetchSiteContent('home'),
        getCurrentUser()
      ]);
      
      setMetrics(m);
      setInsights(i);
      setProducts(p);
      setTestimonials(t);
      setCarousel(c);
      setContent(s);

      if (user) {
        const profile = await getProfile(user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error("App: Fatal data loading error", err);
    } finally {
      setTimeout(() => setLoading(false), 1200);
    }
  };

  useEffect(() => {
    loadAllData();
    
    // Setup Realtime Listeners
    if (supabase) {
      const channel = supabase
        .channel('public_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts().then(setProducts))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'metrics' }, () => fetchMetrics().then(setMetrics))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => fetchTestimonials().then(setTestimonials))
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Intersection Observer for Reveal Animations
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.15 });

    const setupObserver = () => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    const timeout = setTimeout(setupObserver, 200);
    return () => { clearTimeout(timeout); observer.disconnect(); };
  }, [loading, insights, products]);

  const heroTitle = useMemo(() => content['home.hero.title'] || 'Estratégia Inesquecível.', [content]);
  const heroSubtitle = useMemo(() => content['home.hero.subtitle'] || 'Redefinindo o futuro corporativo através de excelência operacional e inteligência estratégica.', [content]);

  const handleAreaClick = () => {
    if (!userProfile) {
      setIsAuthOpen(true);
    } else if (userProfile.user_type === 'admin') {
      setIsAdminOpen(true);
    } else {
      setIsClientPortalOpen(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUserProfile(null);
    setIsAdminOpen(false);
    setIsClientPortalOpen(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#030712] z-[100] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-2 border-blue-500 rounded-full animate-spin mb-6"></div>
        <div className="text-sm tracking-[0.4em] uppercase font-bold text-slate-500 animate-pulse">
          Claudio Tonelli Consultoria
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Navbar onAdminClick={handleAreaClick} userProfile={userProfile} onLogout={handleLogout} />

      {isAuthOpen && (
        <AuthModal 
          onClose={() => setIsAuthOpen(false)} 
          onSuccess={loadAllData} 
        />
      )}

      {isAdminOpen && userProfile?.user_type === 'admin' && (
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />
      )}
      
      {isClientPortalOpen && userProfile && (
        <ClientPortal 
          profile={userProfile} 
          products={products} 
          onClose={() => setIsClientPortalOpen(false)} 
        />
      )}

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60">
           <ThreeGlobe />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 reveal active">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
              Consultoria Estratégica Visionária
            </div>
            
            <h1 className="text-6xl md:text-8xl font-serif leading-[1.1] text-white">
              {heroTitle.split(' ').map((word, i, arr) => (
                <span key={i} className="inline-block">
                  {i === arr.length - 1 ? (
                    <span className="italic text-slate-400 font-light">{word}</span>
                  ) : (
                    word + '\u00A0'
                  )}
                  {i === 0 && <br className="hidden md:block" />}
                </span>
              ))}
            </h1>
            
            <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-light border-l-2 border-blue-500/30 pl-6">
              {heroSubtitle}
            </p>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <a href="#contact-form" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-xl font-bold transition-all shadow-2xl shadow-blue-600/30 btn-premium group flex items-center gap-3 particle-hover">
                Solicitar Diagnóstico
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a href="#insights" className="glass px-10 py-5 rounded-xl font-bold transition-all hover:bg-white/10 flex items-center gap-3">
                Nossos Insights
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-slate-600">
          <span className="text-[9px] uppercase tracking-[0.5em] font-bold">Explorar Experiência</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-blue-500 to-transparent"></div>
        </div>
      </section>

      {metrics.length > 0 && (
        <section id="metrics" className="py-32 bg-[#050a18] border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 blur-[120px] -translate-x-1/2"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
              {metrics.map((m) => (
                <div key={m.id} className="text-center group reveal">
                  <div className="text-6xl font-bold mb-4 text-white font-serif tracking-tighter group-hover:text-blue-500 transition-colors">
                    {m.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/60 mb-3">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {insights.length > 0 && (
        <section id="insights" className="py-40 bg-slate-950">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-8">
              <div className="max-w-2xl reveal">
                <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">Conhecimento Estratégico</div>
                <h2 className="text-5xl font-serif mb-6 leading-tight">Antecipando a Próxima <br/><span className="italic text-slate-500">Grande Ruptura.</span></h2>
                <p className="text-slate-400 font-light text-lg leading-relaxed">
                  Insights proprietários que transformam incerteza em vantagem competitiva.
                </p>
              </div>
              <div className="reveal">
                <button className="group text-white text-sm font-bold uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-4 pb-2 border-b border-white/10 hover:border-blue-400/50">
                  Ver Todo o Acervo
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {insights.map((insight) => (
                <article key={insight.id} className="group cursor-pointer reveal">
                  <div className="relative aspect-[16/10] rounded-3xl overflow-hidden mb-8 shadow-2xl transition-all group-hover:shadow-blue-500/10 border border-white/5">
                    <img 
                      src={insight.image_url || `https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop`} 
                      alt={insight.title} 
                      className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute top-6 left-6">
                      <span className="glass text-[9px] px-4 py-1.5 rounded-full uppercase tracking-widest font-bold">
                        {insight.category || 'ESTRATÉGIA'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-serif text-white group-hover:text-blue-400 transition-colors leading-snug">
                      {insight.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-light line-clamp-2">
                      {insight.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && <ProductsSection products={products} />}
      {testimonials.length > 0 && <TestimonialsSection testimonials={testimonials} />}
      <ContactForm />

      <footer id="contact" className="py-32 border-t border-white/5 bg-[#010309] relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-blue-600/5 blur-[150px] rounded-full"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-5 gap-20 mb-24">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-xl shadow-blue-600/30">CT</div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold tracking-tight text-white">Claudio Tonelli</span>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">Consultoria Executive</span>
                </div>
              </div>
              <p className="text-slate-500 max-w-sm font-light leading-loose text-lg">
                Arquitetando o amanhã através de rigor metodológico e inovação digital. O parceiro estratégico para o C-Level de vanguarda.
              </p>
            </div>
            
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h4 className="font-bold mb-8 text-[11px] uppercase tracking-[0.3em] text-slate-300">Arquitetura</h4>
                <ul className="space-y-4 text-sm text-slate-500">
                  <li><a href="#hero" className="hover:text-blue-400 transition-colors">Vision</a></li>
                  <li><a href="#products" className="hover:text-blue-400 transition-colors">Solutions</a></li>
                  <li><a href="#insights" className="hover:text-blue-400 transition-colors">Knowledge</a></li>
                  <li><a href="#testimonials" className="hover:text-blue-400 transition-colors">Success Cases</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-8 text-[11px] uppercase tracking-[0.3em] text-slate-300">Ecosystem</h4>
                <ul className="space-y-4 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-blue-400 transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Intelligence Hub</a></li>
                  <li><a href="#" className="hover:text-blue-400 transition-colors">Partner Portal</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-8 text-[11px] uppercase tracking-[0.3em] text-slate-300">Contact</h4>
                <ul className="space-y-4 text-sm text-slate-500">
                  <li><span className="text-slate-300">São Paulo, BR</span></li>
                  <li><a href="mailto:contato@claudiotonelli.com.br" className="hover:text-blue-400 transition-colors">E-mail Hub</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5 text-[9px] text-slate-600 font-bold uppercase tracking-[0.5em]">
            <span>© 2025 Claudio Tonelli Group. Excellence in Advisory.</span>
            <div className="flex gap-12">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Engagement</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
};

export default App;

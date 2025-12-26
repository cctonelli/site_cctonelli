
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { CarouselImage } from '../types';
import ThreeGlobe from './ThreeGlobe';

interface HeroCarouselProps {
  slides: CarouselImage[];
  t: any;
  resolveContent: (key: string, fallback: string) => string;
  language?: string;
  isLive?: boolean; // Novo prop para controle de sincronia
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, t, resolveContent, language = 'pt', isLive = false }) => {
  const hasSlides = Array.isArray(slides) && slides.length > 0;

  const resolveTranslation = (item: any, field: string, fallback: string) => {
    if (!item) return fallback;
    if (language === 'pt') return item[field] || fallback;
    const localized = item[`${field}_${language}`];
    return localized || item[field] || fallback;
  };

  const renderContent = (slide?: CarouselImage) => {
    const slideCtaText = slide ? resolveTranslation(slide, 'cta_text', slide.cta_text || '') : '';
    const slideCtaUrl = slide?.cta_url || '';
    const mainCtaText = resolveContent('hero_cta_text', t.btn_insights);
    const mainCtaUrl = resolveContent('hero_cta_link', '#insights');

    const showSecondaryCta = slide ? (slideCtaText && slideCtaUrl) : (mainCtaText && mainCtaUrl);

    return (
      <div className="container mx-auto px-6 relative z-20 h-full flex items-center justify-center lg:justify-start">
        <motion.div 
          key={slide?.id || 'main-hero'}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl p-8 lg:p-16 glass rounded-[3rem] space-y-6 lg:space-y-10 border border-white/10 shadow-2xl backdrop-blur-xl text-center lg:text-left"
        >
          <span className="inline-block px-5 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 dark:text-blue-500 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.4em]">
            {resolveContent('hero_badge', t.hero_badge)}
          </span>
          <h1 className="text-4xl lg:text-[6.5rem] font-serif text-slate-900 dark:text-white italic leading-[1] lg:leading-[0.9] tracking-tighter drop-shadow-sm">
            {slide ? resolveTranslation(slide, 'title', slide.title || '') : resolveContent('hero_title', t.hero_title)}
          </h1>
          <p className="text-base lg:text-2xl text-slate-600 dark:text-slate-300 font-light italic border-l-4 border-blue-600/50 pl-6 lg:pl-8 max-w-2xl leading-relaxed mx-auto lg:mx-0">
            {slide ? resolveTranslation(slide, 'subtitle', slide.subtitle || '') : resolveContent('hero_subtitle', t.hero_subtitle)}
          </p>
          
          <div className="flex flex-wrap gap-4 lg:gap-6 pt-4 lg:pt-6 justify-center lg:justify-start">
            <a 
              href="#contact-form" 
              className="bg-blue-600 text-white px-8 lg:px-12 py-4 lg:py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] lg:text-[11px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 inline-block text-center"
            >
              {resolveContent('btn_diagnosis', t.btn_diagnosis)}
            </a>

            {showSecondaryCta && (
              <a 
                href={slide ? slideCtaUrl : mainCtaUrl} 
                target={(slide ? slideCtaUrl : mainCtaUrl).startsWith('http') ? "_blank" : "_self"}
                rel={(slide ? slideCtaUrl : mainCtaUrl).startsWith('http') ? "noopener noreferrer" : ""}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 px-8 lg:px-12 py-4 lg:py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] lg:text-[11px] hover:bg-white dark:hover:bg-white hover:text-blue-600 transition-all active:scale-95 inline-block text-center"
              >
                {slide ? slideCtaText : mainCtaText}
              </a>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <section id="hero" className="relative h-screen bg-white dark:bg-brand-navy overflow-hidden">
      {/* O Globo sempre fica ao fundo como base imersiva */}
      <div className="absolute inset-0 z-0 transform scale-125 lg:scale-110 pointer-events-none">
        <ThreeGlobe />
      </div>
      
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-white dark:from-brand-navy via-white/50 dark:via-brand-navy/40 to-transparent opacity-95 lg:opacity-90"></div>
      
      <div className="relative z-10 h-full w-full">
        <AnimatePresence mode="wait">
          {!isLive ? (
            /* Enquanto não houver sinal do banco, não mostramos texto para evitar o 'flash' */
            <motion.div 
              key="calibrating" 
              exit={{ opacity: 0 }} 
              className="h-full w-full flex items-center justify-center"
            >
              {/* Espaço reservado vazio ou loader sutil se desejado */}
            </motion.div>
          ) : !hasSlides ? (
            /* Se o banco terminar de carregar e estiver vazio, mostramos o fallback fixo */
            <motion.div 
              key="fallback-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="h-full w-full"
            >
              {renderContent()}
            </motion.div>
          ) : (
            /* Carregamento normal dos slides do banco de dados */
            <motion.div 
              key="swiper-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="h-full w-full"
            >
              <Swiper
                modules={[Pagination, Autoplay, EffectFade]}
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 8000, disableOnInteraction: false }}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop={slides.length > 1}
                className="h-full w-full"
              >
                {slides.map((slide) => (
                  <SwiperSlide key={slide.id}>
                    <div className="relative h-full w-full overflow-hidden">
                      <div className="absolute inset-0">
                        <img 
                          src={slide.url} 
                          className="w-full h-full object-cover opacity-20 dark:opacity-30 transition-opacity duration-[2s]" 
                          alt="" 
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                        />
                        <div className="absolute inset-0 bg-brand-navy/5 dark:bg-black/30"></div>
                      </div>
                      {renderContent(slide)}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .swiper-pagination-bullet { background: #fff !important; width: 6px; height: 6px; transition: all 0.3s; opacity: 0.2 !important; }
        .swiper-pagination-bullet-active { width: 32px !important; border-radius: 4px !important; background: #2563eb !important; opacity: 1 !important; }
      `}</style>
    </section>
  );
};

export default HeroCarousel;

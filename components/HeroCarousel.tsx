
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { CarouselImage } from '../types';
import ThreeGlobe from './ThreeGlobe';

interface HeroCarouselProps {
  slides: CarouselImage[];
  t: any;
  resolveContent: (key: string, fallback: string) => string;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, t, resolveContent }) => {
  const hasSlides = slides && slides.length > 0;

  const renderContent = (title?: string | null, subtitle?: string | null) => (
    <div className="container mx-auto px-6 relative z-20 h-full flex items-center">
      <motion.div 
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl p-10 lg:p-16 glass rounded-[3rem] space-y-8 lg:space-y-10 border border-slate-200/50 dark:border-white/10 shadow-2xl backdrop-blur-xl"
      >
        <span className="inline-block px-5 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 dark:text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">
          {resolveContent('hero_badge', t.hero_badge)}
        </span>
        <h1 className="text-5xl lg:text-[8rem] font-serif text-slate-900 dark:text-white italic leading-[0.9] tracking-tighter drop-shadow-sm">
          {title || resolveContent('hero_title', t.hero_title)}
        </h1>
        <p className="text-lg lg:text-3xl text-slate-600 dark:text-slate-300 font-light italic border-l-4 border-blue-600/50 pl-8 max-w-2xl leading-relaxed">
          {subtitle || resolveContent('hero_subtitle', t.hero_subtitle)}
        </p>
        <div className="flex flex-wrap gap-6 pt-6">
          <a 
            href="#contact" 
            className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 inline-block"
          >
            {resolveContent('btn_diagnosis', t.btn_diagnosis)}
          </a>
        </div>
      </motion.div>
    </div>
  );

  return (
    <section id="hero" className="relative h-screen bg-white dark:bg-brand-navy overflow-hidden transition-colors duration-700">
      
      {/* LAYER 0: THE GREAT NETWORK GLOBE (Base Visual Permanente) */}
      <div className="absolute inset-0 z-0 opacity-80 dark:opacity-100 pointer-events-none transform scale-125 lg:scale-110">
        <ThreeGlobe />
      </div>

      {/* GRADIENT OVERLAYS FOR READABILITY */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-white dark:from-brand-navy via-transparent to-transparent opacity-80 lg:opacity-60"></div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-white dark:from-brand-navy via-transparent to-transparent opacity-40"></div>
      
      {/* LAYER 10: CONTENT (Dynamic or Fallback) */}
      <div className="relative z-10 h-full w-full">
        {!hasSlides ? (
          renderContent()
        ) : (
          <Swiper
            modules={[Pagination, Autoplay, EffectFade]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 9000, disableOnInteraction: false }}
            effect="fade"
            loop={slides.length > 1}
            className="h-full w-full"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative h-full w-full overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={slide.url} 
                      className="w-full h-full object-cover opacity-20 dark:opacity-25 ken-burns" 
                      alt="" 
                    />
                  </div>
                  {renderContent(slide.title, slide.subtitle)}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      <style>{`
        .ken-burns {
          animation: kenburns 40s infinite alternate ease-in-out;
        }
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(2%, 2%); }
        }
        .swiper-pagination-bullet { background: #fff !important; width: 12px; height: 12px; }
        .swiper-pagination-bullet-active { width: 40px !important; border-radius: 6px !important; background: #2563eb !important; }
      `}</style>
    </section>
  );
};

export default HeroCarousel;

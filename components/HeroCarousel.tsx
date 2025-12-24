
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

  const renderContent = (title?: string | null, subtitle?: string | null, link?: string | null) => (
    <div className="container mx-auto px-6 relative z-20">
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl p-10 lg:p-16 glass rounded-[3rem] space-y-8 lg:space-y-10 border border-slate-200/50 dark:border-white/10 shadow-2xl backdrop-blur-xl"
      >
        <span className="inline-block px-5 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 dark:text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">
          {resolveContent('hero_badge', t.hero_badge)}
        </span>
        <h1 className="text-5xl lg:text-8xl font-serif text-slate-900 dark:text-white italic leading-[1] tracking-tighter drop-shadow-sm">
          {title || resolveContent('hero_title', t.hero_title)}
        </h1>
        <p className="text-lg lg:text-2xl text-slate-600 dark:text-slate-300 font-light italic border-l-4 border-blue-600/50 pl-8 max-w-2xl leading-relaxed">
          {subtitle || resolveContent('hero_subtitle', t.hero_subtitle)}
        </p>
        <div className="flex flex-wrap gap-6 pt-4">
          <a 
            href={link || "#contact"} 
            className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 inline-block"
          >
            {resolveContent('btn_diagnosis', t.btn_diagnosis)}
          </a>
        </div>
      </motion.div>
    </div>
  );

  return (
    <section id="hero" className="relative h-screen bg-white dark:bg-brand-navy overflow-hidden transition-colors duration-500">
      
      {/* BACKGROUND LAYER 0: THE GREAT NETWORK GLOBE (Always Live) */}
      <div className="absolute inset-0 z-0 opacity-70 dark:opacity-90 pointer-events-none scale-110 lg:scale-100">
        <ThreeGlobe />
      </div>

      {/* OVERLAY GRADIENTS */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-white/20 dark:via-brand-navy/10 to-white dark:to-brand-navy"></div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 h-full w-full">
        {!hasSlides ? (
          <div className="h-full flex items-center">
            {renderContent()}
          </div>
        ) : (
          <Swiper
            modules={[Pagination, Autoplay, EffectFade]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 8000, disableOnInteraction: false }}
            effect="fade"
            loop={slides.length > 1}
            className="h-full w-full"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative h-full w-full flex items-center overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={slide.url} 
                      className="w-full h-full object-cover opacity-20 dark:opacity-20 ken-burns" 
                      alt="" 
                    />
                  </div>
                  {renderContent(slide.title, slide.subtitle, slide.link)}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      <style>{`
        .ken-burns {
          animation: kenburns 30s infinite alternate ease-in-out;
        }
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(2%, 2%); }
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;

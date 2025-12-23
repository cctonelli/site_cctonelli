
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
  if (slides.length === 0) {
    return (
      <section id="hero" className="relative h-screen flex items-center overflow-hidden bg-brand-navy">
        <div className="absolute inset-0 opacity-20">
          <ThreeGlobe />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-4xl space-y-10"
          >
            <span className="inline-block px-5 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">
              {resolveContent('hero_badge', t.hero_badge)}
            </span>
            <h1 className="text-6xl lg:text-9xl font-serif text-white italic leading-[0.9] tracking-tighter">
              {resolveContent('hero_title', t.hero_title)}
            </h1>
            <p className="text-xl lg:text-2xl text-slate-400 font-light italic border-l-4 border-blue-600/30 pl-8 max-w-2xl">
              {resolveContent('hero_subtitle', t.hero_subtitle)}
            </p>
            <div className="flex flex-wrap gap-6 pt-6">
              <a href="#contact" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-2xl">
                {resolveContent('btn_diagnosis', t.btn_diagnosis)}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" className="relative h-screen bg-brand-navy overflow-hidden">
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
              {/* Background Image */}
              <img 
                src={slide.url} 
                className="absolute inset-0 w-full h-full object-cover transform scale-105 animate-[slow-zoom_20s_infinite_alternate]" 
                alt={slide.title || ''} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/60 to-transparent"></div>
              
              <div className="container mx-auto px-6 relative z-10">
                <motion.div 
                  initial={{ x: -50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="max-w-4xl p-12 lg:p-16 glass rounded-[3rem] space-y-10"
                >
                  <span className="inline-block px-5 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">
                    {resolveContent('hero_badge', t.hero_badge)}
                  </span>
                  <h1 className="text-6xl lg:text-8xl font-serif text-white italic leading-[0.9] tracking-tighter">
                    {slide.title || resolveContent('hero_title', t.hero_title)}
                  </h1>
                  <p className="text-xl lg:text-2xl text-slate-400 font-light italic border-l-4 border-blue-600/30 pl-8 max-w-2xl">
                    {slide.subtitle || resolveContent('hero_subtitle', t.hero_subtitle)}
                  </p>
                  <div className="flex flex-wrap gap-6 pt-6">
                    <a href={slide.link || "#contact"} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-2xl">
                      {resolveContent('btn_diagnosis', t.btn_diagnosis)}
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.15); }
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;


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

  return (
    <section id="hero" className="relative h-screen bg-slate-50 dark:bg-brand-navy overflow-hidden transition-colors duration-700">
      
      {/* CAMADA DE FUNDO: A GRANDE REDE 3D */}
      <div className="absolute inset-0 z-0 opacity-80 dark:opacity-100 pointer-events-none transform scale-125 lg:scale-110">
        <ThreeGlobe />
      </div>

      {/* GRADIENTES DE PROFUNDIDADE */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-white/10 dark:from-brand-navy/20 via-transparent to-white/60 dark:to-brand-navy/60"></div>
      
      {/* CAMADA DE CONTEÚDO */}
      <div className="relative z-10 h-full w-full">
        {!hasSlides ? (
          /* FALLBACK CONTENT */
          <div className="h-full flex items-center justify-center">
            <div className="container mx-auto px-6">
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-4xl p-10 lg:p-20 glass rounded-[4rem] space-y-10 border border-slate-200/50 dark:border-white/10 shadow-2xl backdrop-blur-3xl mx-auto text-center"
              >
                <div className="flex flex-col items-center gap-6">
                  <span className="inline-block px-6 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.5em]">
                    {resolveContent('hero_badge', t.hero_badge)}
                  </span>
                  <h1 className="text-6xl lg:text-[9rem] font-serif text-slate-900 dark:text-white italic leading-[0.85] tracking-tighter">
                    {resolveContent('hero_title', t.hero_title)}
                  </h1>
                  <p className="text-xl lg:text-3xl text-slate-500 dark:text-slate-300 font-light italic max-w-2xl leading-relaxed">
                    {resolveContent('hero_subtitle', t.hero_subtitle)}
                  </p>
                  <div className="pt-10">
                    <a href="#contact" className="bg-blue-600 text-white px-14 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 active:scale-95 inline-block">
                      {resolveContent('btn_diagnosis', t.btn_diagnosis)}
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* CAROUSEL CONTENT */
          <Swiper
            modules={[Pagination, Autoplay, EffectFade]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 10000, disableOnInteraction: false }}
            effect="fade"
            loop={slides.length > 1}
            className="h-full w-full"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <div className="relative h-full w-full flex items-center overflow-hidden">
                  {/* Imagem do Slide com Opacidade para revelar o Globo ao fundo */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={slide.url} 
                      className="w-full h-full object-cover opacity-30 dark:opacity-25 ken-burns" 
                      alt={slide.title || ''} 
                    />
                  </div>
                  
                  {/* Mascaramento suave para integração */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-brand-navy via-white/40 dark:via-brand-navy/30 to-transparent"></div>
                  
                  <div className="container mx-auto px-6 relative z-20">
                    <motion.div 
                      initial={{ x: -50, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                      className="max-w-4xl p-12 lg:p-20 glass rounded-[4rem] space-y-10 border border-slate-200/50 dark:border-white/10 shadow-2xl backdrop-blur-2xl"
                    >
                      <span className="inline-block px-6 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 dark:text-blue-500 text-[10px] font-black uppercase tracking-[0.5em]">
                        {resolveContent('hero_badge', t.hero_badge)}
                      </span>
                      <h1 className="text-5xl lg:text-[8rem] font-serif text-slate-900 dark:text-white italic leading-[0.9] tracking-tighter">
                        {slide.title || resolveContent('hero_title', t.hero_title)}
                      </h1>
                      <p className="text-lg lg:text-3xl text-slate-600 dark:text-slate-200 font-light italic border-l-4 border-blue-600/50 pl-10 max-w-2xl leading-relaxed">
                        {slide.subtitle || resolveContent('hero_subtitle', t.hero_subtitle)}
                      </p>
                      <div className="flex flex-wrap gap-8 pt-6">
                        <a 
                          href={slide.link || "#contact"} 
                          className="bg-blue-600 text-white px-14 py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 active:scale-95 inline-block"
                        >
                          {resolveContent('btn_diagnosis', t.btn_diagnosis)}
                        </a>
                      </div>
                    </motion.div>
                  </div>
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
          100% { transform: scale(1.15) translate(2%, 2%); }
        }
        .swiper-pagination {
          bottom: 3rem !important;
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;

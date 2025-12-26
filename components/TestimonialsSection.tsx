
import React from 'react';
import { Testimonial } from '../types';
import { Language, translations } from '../services/i18nService';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  language: Language;
  resolveTranslation: (item: any, field: string, base: string) => string;
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials, language, resolveTranslation }) => {
  const t = translations[language];

  return (
    <section id="testimonials" className="py-40 bg-slate-50 dark:bg-[#030712] transition-colors duration-500">
      <div className="container mx-auto px-6">
        <div className="mb-24">
          <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">Success Stories</div>
          <h2 className="text-5xl font-serif mb-6 leading-tight dark:text-white text-slate-900">
            {t.testimonials_title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-light text-lg">
            {t.testimonials_subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          {Array.isArray(testimonials) && testimonials.length > 0 ? (
            testimonials.map((test) => (
              <div key={test.id} className="relative p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl">
                <svg className="absolute top-10 right-10 h-16 w-16 text-blue-500/10" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <div className="relative z-10 space-y-8">
                  <p className="text-xl text-slate-600 dark:text-slate-300 font-light italic leading-relaxed">
                    "{resolveTranslation(test, 'quote', test.quote)}"
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xl">
                      {test.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold dark:text-white text-slate-900">{test.name}</h4>
                      <p className="text-[10px] text-blue-500 uppercase tracking-widest font-bold">
                        {test.company || 'Private Equity Partner'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem]">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse italic">
                Aguardando aprovação de novos depoimentos estratégicos...
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

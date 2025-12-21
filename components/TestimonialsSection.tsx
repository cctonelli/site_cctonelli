
import React from 'react';
import { Testimonial } from '../types';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  return (
    <section id="testimonials" className="py-32 bg-slate-900/30">
      <div className="container mx-auto px-6">
        <div className="mb-20">
          <h2 className="text-4xl font-serif mb-4 italic">O que dizem os líderes</h2>
          <div className="w-20 h-1 bg-blue-600"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {testimonials.map((t) => (
            <div key={t.id} className="relative p-8 reveal">
              <svg className="absolute top-0 left-0 h-16 w-16 text-white/5 -translate-x-4 -translate-y-4" fill="currentColor" viewBox="0 0 32 32">
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
              <div className="relative z-10">
                <p className="text-xl text-slate-300 font-light italic mb-8 leading-relaxed">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-4">
                  <img src={t.avatarUrl} alt={t.name} className="w-12 h-12 rounded-full border-2 border-blue-500/30" />
                  <div>
                    <h4 className="font-bold text-white">{t.name}</h4>
                    <p className="text-xs text-blue-500 uppercase tracking-widest font-bold">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

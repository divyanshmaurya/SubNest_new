import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Senior Broker, Manhattan',
    quote: 'SubNest transformed how we handle after-hours inquiries. We went from losing 40% of leads to capturing every single one. The AI qualification is incredibly accurate.',
    rating: 5,
  },
  {
    name: 'James L.',
    role: 'Team Lead, Brooklyn',
    quote: 'The multilingual support alone was worth the investment. We now serve Chinese and Japanese-speaking clients seamlessly, opening up an entire market segment.',
    rating: 5,
  },
  {
    name: 'Rachel K.',
    role: 'Independent Agent, UES',
    quote: 'Setup was painless and the lead scoring saves me hours every week. I only focus on hot leads now while warm ones get nurtured automatically.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 mb-6 bg-white border border-slate-200 rounded-full">
            <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">Trusted by Top Agents</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-brand-navy mb-4">What Our Partners Say</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Real results from real estate professionals using SubNest AI.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <Quote className="absolute top-6 right-6 text-slate-100" size={40} />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">"{t.quote}"</p>
              <div className="border-t border-slate-100 pt-4">
                <div className="font-bold text-brand-navy">{t.name}</div>
                <div className="text-sm text-slate-400">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
        >
          {[
            { value: '99%', label: 'Satisfaction Rate' },
            { value: '<2min', label: 'Avg. Response Time' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-extrabold text-brand-navy">{stat.value}</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

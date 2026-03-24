import React from 'react';
import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white/85 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center"
        >
          <div className="relative bg-white rounded-3xl p-12 md:p-16 border border-slate-100 shadow-sm">
            <Quote className="mx-auto text-blue-200 mb-8" size={48} />
            <blockquote className="text-2xl md:text-3xl font-bold text-brand-navy leading-relaxed mb-8">
              "We used to lose leads over the weekend. Now our AI handles Saturday and Sunday like it's Monday morning."
            </blockquote>
            <p className="text-lg text-slate-500 font-medium">
              — Property Manager, NYC Portfolio (Beta User)
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

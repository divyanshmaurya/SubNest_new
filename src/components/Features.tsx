import React from 'react';
import { motion } from 'motion/react';
import { Globe, Tags, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    icon: <Globe className="text-brand-blue" size={28} />,
    title: "Multilingual Instant Engagement",
    description: "Zero-latency response in English, Chinese, Japanese, and Spanish. Never lose a lead due to language barriers."
  },
  {
    icon: <Tags className="text-brand-blue" size={28} />,
    title: "Automated Lead Categorization",
    description: "Instant visual tagging for Hot, Warm, and Cold leads. Focus your energy where the money is."
  },
  {
    icon: <BarChart3 className="text-brand-cyan" size={28} />,
    title: "AI Lead Scoring",
    description: "Every lead gets the same AI-scored 1-10 rating and Hot/Warm/Cold tag used in our Skyline demo flow."
  },
  {
    icon: <Zap className="text-amber-500" size={28} />,
    title: "Frictionless Experience",
    description: "A sophisticated AI-driven interface that replaces static, low-conversion forms with natural dialogue."
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-1.5 mb-6 bg-slate-50 border border-slate-100 rounded-full">
            <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">Platform Capabilities</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-brand-navy">Built for Serious Operators</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Advanced AI capabilities designed specifically for the high-stakes NYC real estate market.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="glass-card p-10 hover:shadow-lg transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />

              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                {f.icon}
              </div>

              <h3 className="text-2xl font-bold mb-4 text-brand-navy">{f.title}</h3>
              <p className="text-slate-500 text-lg leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { Globe, Tags, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    icon: <Globe className="text-brand-purple" size={28} />,
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
    <section id="features" className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-1.5 mb-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full">
            <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">Platform Capabilities</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-brand-navy">Built for Serious Operators</h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Advanced AI capabilities designed specifically for the high-stakes NYC real estate market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-10 hover:shadow-lg transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-purple/5 rounded-full blur-3xl group-hover:bg-brand-purple/10 transition-colors" />

              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform border border-slate-100 dark:border-slate-600">
                {f.icon}
              </div>

              <h3 className="text-2xl font-bold mb-4 text-brand-navy">{f.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { Globe, Tags, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    icon: <Globe className="text-brand-purple" />,
    title: "Multilingual Instant Engagement",
    description: "Zero-latency response in English, Chinese, Japanese, and Spanish. Never lose a lead due to language barriers."
  },
  {
    icon: <Tags className="text-brand-blue" />,
    title: "Automated Lead Categorization",
    description: "Instant visual tagging for Hot, Warm, and Cold leads. Focus your energy where the money is."
  },
  {
    icon: <BarChart3 className="text-brand-cyan" />,
    title: "BANT-Based Scoring",
    description: "Automated extraction of Budget, Authority, Need, and Timeline. Every lead comes with a 0–100 score."
  },
  {
    icon: <Zap className="text-yellow-400" />,
    title: "Frictionless Experience",
    description: "A sophisticated AI-driven interface that replaces static, low-conversion forms with natural dialogue."
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for Serious Operators</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
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
              className="glass-card p-10 hover:bg-white/10 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-purple/5 rounded-full blur-3xl group-hover:bg-brand-purple/10 transition-colors" />
              
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform">
                {f.icon}
              </div>
              
              <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
              <p className="text-gray-400 text-lg leading-relaxed">{f.description}</p>
              
              <div className="mt-8 flex items-center gap-2 text-brand-purple font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <Zap size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

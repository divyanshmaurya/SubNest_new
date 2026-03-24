import React from 'react';
import { motion } from 'motion/react';
import { Zap, BookOpen, CalendarCheck, BarChart3, Globe, Shield } from 'lucide-react';

const features = [
  {
    icon: <Zap className="text-brand-blue" size={28} />,
    title: 'Instant Lead Engagement',
    description: 'Every inquiry gets a knowledgeable, instant response — property details, pricing, availability — no copy-paste templates.',
  },
  {
    icon: <BookOpen className="text-brand-blue" size={28} />,
    title: 'Trained On Your Listings',
    description: "SubNest learns your properties, pricing, and policies. It answers like your best agent — because it knows what they know.",
  },
  {
    icon: <CalendarCheck className="text-brand-cyan" size={28} />,
    title: 'Auto-Books Tours',
    description: 'Leads can schedule viewings right in the chat. Syncs with your calendar. No back-and-forth emails needed.',
  },
  {
    icon: <BarChart3 className="text-brand-cyan" size={28} />,
    title: 'Analytics Dashboard',
    description: 'See every conversation, lead quality score, popular questions, and conversion metrics — all in one place.',
  },
  {
    icon: <Globe className="text-amber-500" size={28} />,
    title: 'Multilingual Instant Engagement',
    description: 'Zero-latency response in 40+ languages. Never lose a lead due to language barriers.',
  },
  {
    icon: <Shield className="text-amber-500" size={28} />,
    title: 'You Stay In Control',
    description: 'Set boundaries on what the AI can and can\'t say. Get notified for complex queries that need a human touch.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white/85 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-1.5 mb-6 bg-slate-50 border border-slate-100 rounded-full">
            <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-brand-navy">Set it up in 5 minutes. Let it work 24/7.</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
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

import React from 'react';
import { motion } from 'motion/react';

const steps = [
  { title: 'Seamless Engagement', desc: 'Instant, high-end greeting and property discovery.' },
  { title: 'Intent Qualification', desc: 'Deep inquiries to understand exact requirements.' },
  { title: 'Natural Capture', desc: 'Secures data within a fluid, professional dialogue.' },
  { title: 'Actionable Intelligence', desc: 'Delivers a structured card with everything you need to close.' },
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
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-12 text-brand-navy">How it works for you:</h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-12">
            Your Professional Digital Associate. Subnest automates lead identification,
            ensuring every visitor is instantly qualified and no opportunity is missed.
          </p>

          <ul className="text-left max-w-4xl mx-auto space-y-4 text-lg text-slate-700">
            {steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                className="flex items-start gap-3"
              >
                <span className="text-brand-blue mt-1.5 font-bold">•</span>
                <span><strong>{step.title}:</strong> {step.desc}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Core Difference Box */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="bg-slate-50 p-12 border border-slate-100 rounded-3xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
              <div className="md:col-span-2">
                <h3 className="text-4xl font-extrabold text-brand-navy leading-tight">
                  Core <br /> Difference
                </h3>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { title: 'Multilingual Instant Engagement', desc: 'Zero-latency response in English, Chinese, Japanese, and Spanish.' },
                  { title: 'Automated Lead Categorization', desc: 'Instant visual tagging for Hot, Warm, and Cold leads.' },
                  { title: 'AI Lead Scoring', desc: 'The same AI-scored 1-10 lead rating and Hot/Warm/Cold tagging used in our Skyline demo flow.' },
                  { title: 'Frictionless Experience', desc: 'A sophisticated AI-driven interface that replaces static, low-conversion forms.' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  >
                    <h4 className="text-brand-blue font-bold text-xl mb-2">{item.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

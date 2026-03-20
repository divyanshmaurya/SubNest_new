import React from 'react';
import { motion } from 'motion/react';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-brand-navy">How it works for you:</h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed mb-12">
            Your Professional Digital Associate. Subnest automates lead identification,
            ensuring every visitor is instantly qualified and no opportunity is missed.
          </p>

          <ul className="text-left max-w-4xl mx-auto space-y-4 text-lg text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-brand-blue mt-1.5">•</span>
              <span><strong>Seamless Engagement:</strong> Instant, high-end greeting and property discovery.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-blue mt-1.5">•</span>
              <span><strong>Intent Qualification:</strong> Deep inquiries to understand exact requirements.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-blue mt-1.5">•</span>
              <span><strong>Natural Capture:</strong> Secures data within a fluid, professional dialogue.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-blue mt-1.5">•</span>
              <span><strong>Actionable Intelligence:</strong> Delivers a structured card with everything you need to close.</span>
            </li>
          </ul>
        </div>

        {/* Core Difference Box */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="bg-slate-50 p-12 border border-slate-100 rounded-3xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
              <div className="md:col-span-2">
                <h3 className="text-4xl font-bold text-brand-navy leading-tight">
                  Core <br /> Difference
                </h3>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                <div>
                  <h4 className="text-brand-blue font-bold text-xl mb-2">Multilingual Instant Engagement</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Zero-latency response in English, Chinese, Japanese, and Spanish.
                  </p>
                </div>
                <div>
                  <h4 className="text-brand-blue font-bold text-xl mb-2">Automated Lead Categorization</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Instant visual tagging for Hot, Warm, and Cold leads.
                  </p>
                </div>
                <div>
                  <h4 className="text-brand-blue font-bold text-xl mb-2">AI Lead Scoring</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    The same AI-scored 1-10 lead rating and Hot/Warm/Cold tagging used in our Skyline demo flow.
                  </p>
                </div>
                <div>
                  <h4 className="text-brand-blue font-bold text-xl mb-2">Frictionless Experience</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    A sophisticated AI-driven interface that replaces static, low-conversion forms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

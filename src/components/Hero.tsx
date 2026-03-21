import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { DEMO_SITES, DEMO_URL } from '../lib/siteConfig';
import CitySkyline from './CitySkyline';


function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref}>{count}{suffix}</div>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export default function Hero() {
  return (
    <section className="relative pt-48 pb-32 overflow-hidden bg-slate-900">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950" />
      {/* City skyline animation */}
      <div className="absolute inset-0 z-0">
        <CitySkyline />
      </div>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
          className="text-center"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="inline-block px-4 py-1.5 mb-8 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm"
          >
            <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">The Future of Real Estate</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-10 leading-[1.05] text-white max-w-5xl mx-auto"
          >
            Your 24/7 AI <br />
            <span className="text-gradient">Real Estate Co-Pilot</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-xl md:text-2xl text-slate-400 mb-14 max-w-3xl mx-auto leading-relaxed"
          >
            Automate lead qualification, property discovery, and showing bookings with zero latency. Built for elite agents and broker teams.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <motion.a
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              href={DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-12 py-5 bg-brand-blue text-white rounded-full font-bold text-xl shadow-2xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:bg-blue-500"
            >
              Book a Demo
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-12 py-5 bg-white/10 text-white border border-white/20 rounded-full font-bold text-xl hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              View Pricing
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-12 max-w-5xl mx-auto rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_30px_90px_-40px_rgba(37,99,235,0.3)] p-5 md:p-7"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 text-left">
              <div>
                <p className="text-xs font-bold tracking-[0.28em] text-blue-400 uppercase">Live Product Demos</p>
                <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white">Explore real SubNest website experiences</h2>
                <p className="mt-2 text-sm md:text-base text-slate-400 max-w-2xl">
                  See how your buyers, renters, brokers, and sellers could experience a branded AI-powered property journey.
                </p>
              </div>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Prefer a guided walkthrough
                <ArrowUpRight size={16} />
              </a>
            </div>

            {/* Live preview thumbnails */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {DEMO_SITES.map((site, i) => (
                <motion.a
                  key={site.url}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.7 + i * 0.15, ease: [0.25, 0.4, 0.25, 1] }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-[1.5rem] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden text-left transition-all hover:border-blue-400/30 hover:shadow-[0_20px_50px_-35px_rgba(37,99,235,0.5)]"
                >
                  {/* Iframe preview */}
                  <div className="relative w-full h-48 overflow-hidden bg-slate-800 pointer-events-none">
                    <iframe
                      src={site.url}
                      title={`${site.name} preview`}
                      className="absolute top-0 left-0 w-[200%] h-[200%] origin-top-left scale-50 border-0"
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin"
                      tabIndex={-1}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/20" />
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-white">{site.name}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{site.description}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-brand-blue group-hover:text-white">
                        <ArrowUpRight size={18} />
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">Open Demo</span>
                      <span className="text-sm font-medium text-blue-400">{site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Animated stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { label: "Availability", value: 24, suffix: "/7" },
              { label: "Latency", value: 0, suffix: "ms" },
              { label: "Lead Capture", value: 100, suffix: "%" },
              { label: "Languages", value: 4, suffix: "+" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-extrabold text-white mb-1">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

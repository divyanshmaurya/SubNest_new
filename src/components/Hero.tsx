import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { DEMO_SITES, DEMO_URL } from '../lib/siteConfig';

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
    <section className="relative pt-48 pb-32 overflow-hidden bg-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#020617_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

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
            className="inline-block px-4 py-1.5 mb-8 bg-slate-50 border border-slate-100 rounded-full"
          >
            <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">The Future of NYC Real Estate</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-10 leading-[1.05] text-brand-navy max-w-5xl mx-auto"
          >
            Your 24/7 AI <br />
            <span className="text-gradient">Real Estate Co-Pilot</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-xl md:text-2xl text-slate-500 mb-14 max-w-3xl mx-auto leading-relaxed"
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
              className="w-full sm:w-auto px-12 py-5 bg-brand-navy text-white rounded-full font-bold text-xl shadow-2xl shadow-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              Book a Demo
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-12 py-5 bg-white text-brand-navy border border-slate-200 rounded-full font-bold text-xl hover:bg-slate-50 transition-all"
            >
              View Pricing
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-12 max-w-5xl mx-auto rounded-[2rem] border border-slate-200 bg-white/80 backdrop-blur-sm shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)] p-5 md:p-7"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 text-left">
              <div>
                <p className="text-xs font-bold tracking-[0.28em] text-slate-400 uppercase">Live Product Demos</p>
                <h2 className="mt-2 text-2xl md:text-3xl font-bold text-brand-navy">Explore real SubNest website experiences</h2>
                <p className="mt-2 text-sm md:text-base text-slate-500 max-w-2xl">
                  See how your buyers, renters, brokers, and sellers could experience a branded AI-powered property journey.
                </p>
              </div>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue"
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
                  className="group rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,1),rgba(255,255,255,0.92))] overflow-hidden text-left transition-all hover:border-brand-blue/30 hover:shadow-[0_20px_50px_-35px_rgba(37,99,235,0.7)]"
                >
                  {/* Iframe preview */}
                  <div className="relative w-full h-48 overflow-hidden bg-slate-50 pointer-events-none">
                    <iframe
                      src={site.url}
                      title={`${site.name} preview`}
                      className="absolute top-0 left-0 w-[200%] h-[200%] origin-top-left scale-50 border-0"
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin"
                      tabIndex={-1}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20" />
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-brand-navy">{site.name}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{site.description}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-brand-navy transition-colors group-hover:bg-brand-navy group-hover:text-white">
                        <ArrowUpRight size={18} />
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                      <span className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">Open Demo</span>
                      <span className="text-sm font-medium text-brand-blue">{site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
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
                <div className="text-3xl font-extrabold text-brand-navy mb-1">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { DEMO_URL } from '../lib/siteConfig';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || mobileOpen ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-900/5 border-b border-slate-100' : 'bg-transparent'}`}>
      <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
        <a href="#" className="flex items-center gap-2">
          <img src="/logo.png" alt="SubNest" className={`rounded-lg bg-white/90 p-1 transition-all duration-300 ${scrolled ? 'h-10' : 'h-12'}`} />
        </a>

        <div className={`hidden md:flex items-center gap-8 text-sm font-medium transition-colors duration-300 ${scrolled ? 'text-slate-500' : 'text-white/70'}`}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={`transition-colors ${scrolled ? 'hover:text-brand-blue' : 'hover:text-white'}`}>{link.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer"
            className={`hidden sm:inline-flex px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${scrolled ? 'bg-brand-blue text-white hover:bg-brand-primary' : 'bg-white text-slate-900 hover:bg-white/90'}`}
          >
            Book a Demo
          </motion.a>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'hover:bg-slate-100 text-brand-navy' : 'hover:bg-white/10 text-white'}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} className="text-brand-navy" /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white border-b border-slate-100"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-blue transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileOpen(false)}
                className="mt-2 py-3 px-4 bg-brand-blue text-white rounded-full text-center font-bold text-sm"
              >
                Book a Demo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

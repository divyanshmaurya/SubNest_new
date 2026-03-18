import React from 'react';
import { motion } from 'motion/react';
import { DEMO_URL } from '../lib/siteConfig';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center font-display font-bold text-xl text-white">S</div>
          <span className="font-display font-bold text-2xl tracking-tight text-brand-navy">SUBNEST</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#how-it-works" className="hover:text-brand-purple transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-brand-purple transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-brand-purple transition-colors">FAQ</a>
          <a href="#contact" className="hover:text-brand-purple transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-4">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer"
            className="bg-brand-navy text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-brand-navy/90 transition-colors"
          >
            Book a Demo
          </motion.a>
        </div>
      </div>
    </nav>
  );
}

import React from 'react';
import { CONTACT_EMAIL, DEMO_URL } from '../lib/siteConfig';

export default function Footer() {
  return (
    <footer className="bg-slate-50 py-12 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center font-display font-bold text-xl text-white">S</div>
            <span className="font-display font-bold text-2xl tracking-tight text-brand-navy">SUBNEST</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 font-medium">
<a href="mailto:contact@subnest.ai" className="hover:text-brand-blue transition-colors">contact@subnest.ai</a>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" className="hover:text-brand-blue transition-colors">Book Demo</a>
          </div>
          
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} SubNest AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

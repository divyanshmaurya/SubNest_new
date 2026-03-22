import React from 'react';
import { CONTACT_EMAIL, DEMO_URL } from '../lib/siteConfig';

export default function Footer() {
  return (
    <footer className="bg-slate-900/90 backdrop-blur-sm py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SubNest" className="h-10" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400 font-medium">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-blue-400 transition-colors">{CONTACT_EMAIL}</a>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Book Demo</a>
          </div>

          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SubNest AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

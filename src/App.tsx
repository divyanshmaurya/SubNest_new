import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import BackToTop from './components/BackToTop';
import { DEMO_URL } from './lib/siteConfig';

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-brand-purple/10 transition-colors duration-300">
      <Navbar />

      <main>
        <Hero />

        <PainPoints />
        <HowItWorks />
        <Features />
        <Testimonials />

        <Pricing />

        {/* Final CTA Section */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-brand-navy">Ready to Automate Your Hustle?</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
              Join our early partner program today and get free setup ($2,500 value). Experience the future of real estate tech.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-brand-navy dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xl shadow-xl shadow-slate-200 dark:shadow-none hover:scale-105 transition-transform text-center"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </section>

        <FAQ />
        <Contact />
      </main>

      <Footer />
      <BackToTop />
      <Chatbot />
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import ROICalculator from './components/ROICalculator';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { DEMO_URL } from './lib/siteConfig';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-200 selection:text-blue-900">
      <Navbar />

      <main>
        <Hero />

        <PainPoints />
        <HowItWorks />
        <Features />
        <Testimonials />

        <ROICalculator />
        <Pricing />

        {/* Final CTA Section */}
        <section className="py-24 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="max-w-4xl mx-auto px-6 text-center"
          >
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8 text-brand-navy">Ready to Automate Your Hustle?</h2>
            <p className="text-xl text-slate-600 mb-12">
              Join our early partner program today and get free setup ($2,500 value). Experience the future of real estate tech.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                href={DEMO_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-10 py-5 bg-brand-blue text-white rounded-full font-bold text-xl shadow-xl shadow-blue-200 transition-transform text-center"
              >
                Book a Demo
              </motion.a>
            </div>
          </motion.div>
        </section>

        <FAQ />
        <Contact />
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}

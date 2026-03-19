import React from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';

const CONTACT_EMAIL = 'contact@subnest.ai';

export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-navy mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Have questions about SubNest? We'd love to hear from you. Reach out and our team will get back to you shortly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 bg-brand-navy/10 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-brand-navy" />
            </div>
            <h3 className="font-bold text-brand-navy text-lg mb-2">Email Us</h3>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-brand-blue hover:underline font-medium"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 bg-brand-navy/10 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-brand-navy" />
            </div>
            <h3 className="font-bold text-brand-navy text-lg mb-2">Response Time</h3>
            <p className="text-slate-600">We typically respond within 24 hours</p>
          </div>

          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 bg-brand-navy/10 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-brand-navy" />
            </div>
            <h3 className="font-bold text-brand-navy text-lg mb-2">Location</h3>
            <p className="text-slate-600">Serving real estate teams worldwide</p>
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

const CONTACT_EMAIL = 'contact@subnest.ai';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`SubNest Inquiry from ${formData.name}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`);
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_self');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-brand-navy mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Have questions about SubNest? We'd love to hear from you. Reach out and our team will get back to you shortly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact info cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {[
              { icon: <Mail className="w-6 h-6 text-brand-navy" />, title: 'Email Us', content: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-blue hover:underline font-medium text-sm">{CONTACT_EMAIL}</a> },
              { icon: <Clock className="w-6 h-6 text-brand-navy" />, title: 'Response Time', content: <p className="text-slate-600 text-sm">We typically respond within 24 hours</p> },
              { icon: <MapPin className="w-6 h-6 text-brand-navy" />, title: 'Location', content: <p className="text-slate-600 text-sm">Serving real estate teams worldwide</p> },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="w-12 h-12 bg-brand-navy/10 rounded-xl flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-bold text-brand-navy text-lg mb-1">{card.title}</h3>
                  {card.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30, filter: 'blur(4px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none"
                  placeholder="Tell us about your needs..."
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-brand-navy text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-brand-navy/90 transition-colors"
              >
                {submitted ? (
                  <>
                    <CheckCircle size={18} />
                    Message Sent!
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

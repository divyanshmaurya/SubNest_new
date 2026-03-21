import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "How quickly does SubNest respond to leads?",
    a: "SubNest responds instantly (zero latency) to every inbound inquiry, 24/7. This ensures you capture the lead's attention while they are still actively looking at your listing."
  },
  {
    q: "Can it work after business hours?",
    a: "Absolutely. SubNest is designed to be your 24/7 co-pilot. It handles late-night and weekend inquiries seamlessly, qualifying them so you can follow up first thing in the morning."
  },
  {
    q: "How are leads categorized?",
    a: "Leads are automatically tagged as Hot, Warm, or Cold using the same AI conversation scoring model as our live demos. High-intent leads are delivered instantly so your team can follow up fast."
  },
  {
    q: "Does it support multiple languages?",
    a: "Yes, SubNest currently supports English, Chinese, Japanese, and Spanish, allowing you to serve the diverse NYC international buyer market without needing a translator."
  },
  {
    q: "Can it help with showing bookings?",
    a: "Yes. SubNest can integrate with your calendar to suggest available slots and collect preferred showing times from qualified leads, reducing the manual scheduling burden."
  },
  {
    q: "Is setup included?",
    a: "Our Setup Package ($2,500) includes a fully branded website, AI assistant configuration, and listing onboarding. Until March 31, this setup fee is completely waived."
  },
  {
    q: "Can it work for small broker teams and larger brokerages?",
    a: "SubNest is built to scale. Whether you're an individual agent with 10 listings or a large brokerage with 200+ agents, we have plans and custom integrations to fit your needs."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white/85 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-brand-navy">Frequently Asked Questions</h2>
          <p className="text-xl text-slate-600">Everything you need to know about your new AI co-pilot.</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-lg text-brand-navy">{faq.q}</span>
                <ChevronDown
                  className={`text-slate-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                  size={20}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-500 leading-relaxed border-t border-slate-50 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

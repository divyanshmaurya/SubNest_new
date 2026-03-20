import React from 'react';
import { motion } from 'motion/react';
import { Clock, MessageSquareOff, UserX, CalendarX } from 'lucide-react';

const problems = [
  {
    icon: <Clock className="text-red-500" />,
    title: "Missed After-Hours Inquiries",
    description: "Leads don't wait. If you miss a 9 PM inquiry, they've already moved to the next listing."
  },
  {
    icon: <MessageSquareOff className="text-orange-500" />,
    title: "Slow Response Times",
    description: "Every minute of delay reduces conversion. Manual replies are the bottleneck of your growth."
  },
  {
    icon: <UserX className="text-amber-500" />,
    title: "Unqualified Lead Waste",
    description: "Spending hours on the phone with 'window shoppers' instead of high-intent buyers."
  },
  {
    icon: <CalendarX className="text-rose-500" />,
    title: "Scheduling Friction",
    description: "The back-and-forth of booking a showing is where most leads drop off."
  }
];

export default function PainPoints() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-brand-navy">The Real Estate Hustle is <span className="text-red-600">Broken</span></h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Inbound leads expect instant gratification. When you're busy showing properties or sleeping, your business is leaking revenue.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {p.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 text-brand-navy">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

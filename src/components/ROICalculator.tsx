import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calculator, DollarSign, TrendingUp } from 'lucide-react';

export default function ROICalculator() {
  const [inquiriesPerMonth, setInquiriesPerMonth] = useState(50);
  const [avgMonthlyRent, setAvgMonthlyRent] = useState(3000);
  const [brokerFeeMonths, setBrokerFeeMonths] = useState(1);

  const results = useMemo(() => {
    const feePerLease = avgMonthlyRent * brokerFeeMonths;
    const convertedPerMonth = inquiriesPerMonth * 0.15; // 15% conversion with instant AI response
    const monthlyEarnings = convertedPerMonth * feePerLease;
    const yearlyEarnings = monthlyEarnings * 12;
    return { feePerLease, monthlyEarnings, yearlyEarnings };
  }, [inquiriesPerMonth, avgMonthlyRent, brokerFeeMonths]);

  const formatCurrency = (val: number) =>
    val >= 1000
      ? `$${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k`
      : `$${val.toLocaleString()}`;

  const formatFull = (val: number) =>
    `$${Math.round(val).toLocaleString()}`;

  return (
    <section id="roi-calculator" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 mb-6 bg-slate-50 border border-slate-100 rounded-full">
            <span className="text-xs font-bold tracking-widest text-brand-blue uppercase">ROI Calculator</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-brand-navy">
            How Much More Could You Be Earning?
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            See the extra revenue SubNest can unlock by capturing every lead, 24/7.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Inputs */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <Calculator className="text-brand-blue" size={24} />
              <h3 className="text-xl font-bold text-brand-navy">Your Numbers</h3>
            </div>

            <div>
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Inquiries per month</span>
                <span className="text-lg font-extrabold text-brand-blue">{inquiriesPerMonth}</span>
              </label>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={inquiriesPerMonth}
                onChange={(e) => setInquiriesPerMonth(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-blue"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>10</span>
                <span>500</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Average monthly rent</span>
                <span className="text-lg font-extrabold text-brand-blue">{formatFull(avgMonthlyRent)}</span>
              </label>
              <input
                type="range"
                min={1000}
                max={20000}
                step={250}
                value={avgMonthlyRent}
                onChange={(e) => setAvgMonthlyRent(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-blue"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>$1,000</span>
                <span>$20,000</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Broker fee (months of rent)</span>
                <span className="text-lg font-extrabold text-brand-blue">{brokerFeeMonths} mo</span>
              </label>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.5}
                value={brokerFeeMonths}
                onChange={(e) => setBrokerFeeMonths(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-blue"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0.5 mo</span>
                <span>2 mo</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col gap-6">
            <div className="flex-1 bg-green-50 border border-green-100 rounded-3xl p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="text-green-600" size={24} />
                <h3 className="text-xl font-bold text-brand-navy">You Could Be Earning</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Extra per month</p>
                  <p className="text-4xl font-extrabold text-green-600">{formatFull(results.monthlyEarnings)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Extra per year</p>
                  <p className="text-5xl font-extrabold text-green-700">{formatFull(results.yearlyEarnings)}</p>
                </div>
              </div>
            </div>

            <div className="bg-brand-blue rounded-3xl p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="text-green-300" size={24} />
                <h3 className="text-lg font-bold">With SubNest</h3>
              </div>
              <p className="text-sm text-blue-200 mb-2">
                At just $750–$3,000/mo, SubNest's 24/7 AI-powered engagement captures leads you'd otherwise miss — turning them into signed leases.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <TrendingUp className="text-green-300" size={20} />
                <span className="text-lg font-bold text-green-300">
                  Up to {formatCurrency(results.yearlyEarnings * 0.5)}/yr in additional revenue
                </span>
              </div>
              <p className="text-[11px] text-blue-300 mt-3">
                * Based on 15% inquiry-to-lease conversion rate with instant AI response. Actual results may vary.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

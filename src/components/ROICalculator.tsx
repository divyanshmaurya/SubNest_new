import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calculator, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ROICalculator() {
  const [numUnits, setNumUnits] = useState(20);
  const [avgMonthlyRent, setAvgMonthlyRent] = useState(3000);
  const [brokerFeeMonths, setBrokerFeeMonths] = useState(1);

  const results = useMemo(() => {
    const feePerLease = avgMonthlyRent * brokerFeeMonths;
    const yearlyLeases = numUnits * 0.7; // assume 70% annual turnover
    const missedPerYear = yearlyLeases * 0.3; // 30% of leads lost without instant response
    const yearlyLoss = missedPerYear * feePerLease;
    const monthlyLoss = yearlyLoss / 12;
    return { feePerLease, monthlyLoss, yearlyLoss };
  }, [numUnits, avgMonthlyRent, brokerFeeMonths]);

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
            How Much Revenue Are You Leaving on the Table?
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Every missed lead is a lost broker fee. See what SubNest can recover for you.
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
                <span className="text-sm font-semibold text-slate-700">Number of units / listings</span>
                <span className="text-lg font-extrabold text-brand-blue">{numUnits}</span>
              </label>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={numUnits}
                onChange={(e) => setNumUnits(Number(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-brand-blue"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5</span>
                <span>200</span>
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
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-amber-500" size={24} />
                <h3 className="text-xl font-bold text-brand-navy">You're Potentially Losing</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Per month</p>
                  <p className="text-4xl font-extrabold text-red-500">{formatFull(results.monthlyLoss)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Per year</p>
                  <p className="text-5xl font-extrabold text-red-600">{formatFull(results.yearlyLoss)}</p>
                </div>
              </div>
            </div>

            <div className="bg-brand-blue rounded-3xl p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-blue-200" size={24} />
                <h3 className="text-lg font-bold">SubNest ROI</h3>
              </div>
              <p className="text-sm text-blue-200 mb-2">
                At just $750–$3,000/mo, SubNest can help recover a significant portion of these missed leads with 24/7 AI-powered engagement.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <DollarSign className="text-green-300" size={20} />
                <span className="text-lg font-bold text-green-300">
                  Up to {formatCurrency(results.yearlyLoss * 0.5)}/yr in recovered revenue
                </span>
              </div>
              <p className="text-[11px] text-blue-300 mt-3">
                * Based on 70% annual turnover, 30% lead loss without instant response, and 50% recovery with SubNest. Actual results may vary.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

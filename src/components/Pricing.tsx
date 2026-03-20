import React from 'react';
import { motion } from 'motion/react';
import { Star, Zap } from 'lucide-react';

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Setup Package Table */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-brand-blue mb-8">Setup Package</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-4 font-medium">Setup Package</th>
                  <th className="px-8 py-4 font-medium">Price</th>
                  <th className="px-8 py-4 font-medium">Includes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-8">
                    <div className="font-bold text-xl text-brand-navy">Website + AI Assistant Setup</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-2xl text-brand-navy">$2,500</div>
                    <div className="text-xs text-slate-500 uppercase">One-time fee</div>
                  </td>
                  <td className="px-8 py-8">
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>• Branded website setup</li>
                      <li>• AI assistant setup</li>
                      <li>• Listing onboarding</li>
                      <li>• Lead delivery workflow setup</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Plans Table */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-brand-blue mb-8">Service Plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-4 font-medium">Plan</th>
                  <th className="px-8 py-4 font-medium">Monthly Price</th>
                  <th className="px-8 py-4 font-medium">Active Slots</th>
                  <th className="px-8 py-4 font-medium">Monthly Updates</th>
                  <th className="px-8 py-4 font-medium">Features & Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Standard */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-8">
                    <div className="font-bold text-xl text-brand-navy">Standard</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-2xl text-brand-blue">$750 <span className="text-sm font-normal text-slate-400">/ mo</span></div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-brand-navy">Up to 20</div>
                    <div className="text-xs text-slate-500">Active Listings</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-brand-navy">40 Updates</div>
                    <div className="text-xs text-slate-500">per month</div>
                  </td>
                  <td className="px-8 py-8">
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li>🔥 <strong>Hot Leads:</strong> Instant delivery</li>
                      <li>☀️ <strong>Warm/Cold Leads:</strong> Daily morning batch</li>
                      <li>Email + CSV reports</li>
                    </ul>
                  </td>
                </tr>
                {/* Pro */}
                <tr className="bg-brand-purple/5 hover:bg-brand-purple/10 transition-colors relative">
                  <td className="px-8 py-8">
                    <div className="font-bold text-xl text-brand-navy">Pro</div>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-brand-blue text-white text-[10px] font-bold rounded uppercase tracking-tighter">Recommended</span>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-2xl text-brand-blue">$1,500 <span className="text-sm font-normal text-slate-400">/ mo</span></div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-brand-navy">Up to 60</div>
                    <div className="text-xs text-slate-500">Active Listings</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-brand-navy">120 Updates</div>
                    <div className="text-xs text-slate-500">per month</div>
                  </td>
                  <td className="px-8 py-8">
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li>🔥 <strong>Hot Leads:</strong> Instant delivery</li>
                      <li>☀️ <strong>Warm/Cold Leads:</strong> Daily morning batch</li>
                      <li>Email + CSV reports</li>
                    </ul>
                  </td>
                </tr>
                {/* Enterprise */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-8">
                    <div className="font-bold text-xl text-brand-navy">Enterprise</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-2xl text-brand-blue">$3,000 <span className="text-sm font-normal text-slate-400">/ mo</span></div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-brand-navy">Up to 150</div>
                    <div className="text-xs text-slate-500">Active Listings</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-brand-navy">300 Updates</div>
                    <div className="text-xs text-slate-500">per month</div>
                  </td>
                  <td className="px-8 py-8">
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li>🔥 <strong>Hot Leads:</strong> Instant delivery</li>
                      <li>☀️ <strong>Warm/Cold Leads:</strong> Daily morning batch</li>
                      <li>Email + CSV reports</li>
                    </ul>
                  </td>
                </tr>
                {/* Custom */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-8">
                    <div className="font-bold text-xl italic text-brand-navy">Custom</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-xl italic text-brand-navy">Custom Pricing</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="text-xs text-slate-500">Unlimited volume</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="text-xs text-slate-500">Unlimited updates</div>
                  </td>
                  <td className="px-8 py-8">
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li>- For large brokerages with 200+ agents</li>
                      <li>- Optional CRM / API integration</li>
                      <li>- Optional all-lead instant delivery</li>
                      <li>- Dedicated customer success support</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Early Partner Offer Banner */}
        <div className="mt-20 text-center">
           <div className="inline-flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-brand-navy">
                <Zap className="text-amber-500 fill-amber-500" size={32} />
                EARLY PARTNER OFFER: FREE SETUP ($2,500 Value)
              </div>
              <div className="text-xl md:text-2xl font-bold">
                <span className="text-orange-600">Available Until March 31.</span>
                <span className="text-slate-500 ml-2">Experience the future of RE tech.</span>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchJobCards } from '@/utils/jobCardStorage';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  FileText,
  Truck,
  Layers,
  PlusSquare,
  ArrowRight,
  IndianRupee,
  CalendarDays,
  Printer,
} from 'lucide-react';
import WorkflowStepper from '@/components/crm/WorkflowStepper';

const CountUp = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easeOutQuad = (t) => t * (2 - t);
      setCount(Math.floor(easeOutQuad(percentage) * end));
      if (percentage < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};

const StatCard = ({ title, value, prefix, diff, icon: Icon, gradient, iconBg }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
        <p className="text-2xl sm:text-3xl font-black text-gray-900 truncate">
          <CountUp end={value} prefix={prefix} />
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
              diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {diff >= 0 ? '+' : ''}
            {diff.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, desc, onClick, color }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-4 w-full p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40 transition-all text-left"
  >
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
      <Icon size={18} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-500 truncate">{desc}</p>
    </div>
    <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
  </button>
);

export default function Dashboard() {
  const router = useRouter();
  const [latestJobCards, setLatestJobCards] = useState([]);
  const [allJobCards, setAllJobCards] = useState([]);
  const [loadingJobCards, setLoadingJobCards] = useState(true);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlyDiff: 0,
    yearlyRevenue: 0,
    yearlyDiff: 0,
    totalJobs: 0,
    monthJobs: 0,
    chartData: [],
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingJobCards(true);
      const data = await fetchJobCards();
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllJobCards(sorted);
      setLatestJobCards(sorted.slice(0, 5));

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let curMonthSum = 0;
      let prevMonthSum = 0;
      let curYearSum = 0;
      let prevYearSum = 0;
      let monthJobs = 0;

      const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyTotals = Array(12).fill(0);

      data.forEach((card) => {
        const cardDate = new Date(card.jobDate || card.createdAt);
        const amt = Number(card.totalAmount) || 0;
        const cardYear = cardDate.getFullYear();
        const cardMonth = cardDate.getMonth();

        if (cardYear === currentYear) {
          curYearSum += amt;
          monthlyTotals[cardMonth] += amt;
          if (cardMonth === currentMonth) monthJobs += 1;
        }
        if (cardYear === currentYear - 1) prevYearSum += amt;
        if (cardYear === currentYear && cardMonth === currentMonth) curMonthSum += amt;

        const isPrevMonth =
          currentMonth === 0
            ? cardYear === currentYear - 1 && cardMonth === 11
            : cardYear === currentYear && cardMonth === currentMonth - 1;
        if (isPrevMonth) prevMonthSum += amt;
      });

      let mDiff = 0;
      if (prevMonthSum > 0) mDiff = ((curMonthSum - prevMonthSum) / prevMonthSum) * 100;
      else if (curMonthSum > 0) mDiff = 100;

      let yDiff = 0;
      if (prevYearSum > 0) yDiff = ((curYearSum - prevYearSum) / prevYearSum) * 100;
      else if (curYearSum > 0) yDiff = 100;

      let cumulativeYearly = 0;
      const chartData = monthsNames.map((name, idx) => {
        cumulativeYearly += monthlyTotals[idx];
        return {
          name,
          'Monthly Revenue': monthlyTotals[idx],
          'Yearly Revenue': cumulativeYearly,
        };
      });

      setStats({
        monthlyRevenue: curMonthSum,
        monthlyDiff: mDiff,
        yearlyRevenue: curYearSum,
        yearlyDiff: yDiff,
        totalJobs: data.length,
        monthJobs,
        chartData,
      });
    } catch (err) {
      console.error('Error fetching latest job cards:', err);
    } finally {
      setLoadingJobCards(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const onUpdate = () => loadDashboardData();
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadDashboardData();
    };

    window.addEventListener('jobCardsUpdated', onUpdate);
    window.addEventListener('focus', onUpdate);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('jobCardsUpdated', onUpdate);
      window.removeEventListener('focus', onUpdate);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadDashboardData]);

  const greeting =
    new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl border border-gray-700">
          <p className="font-bold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs font-medium opacity-90" style={{ color: entry.color }}>
              {entry.name}: ₹{Number(entry.value).toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getInitials = (name) =>
    (name || 'NA')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold text-blue-600 mb-1">{today}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{greeting}! 👋</h1>
        </div>
        <button
          onClick={() => router.push('/job-card')}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] shrink-0"
        >
          <PlusSquare size={18} />
          New Job Card
        </button>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#4f46e5] p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.25),transparent_55%)]" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-4">
              <Printer size={14} className="text-orange-300" />
              Print · Design · Deliver
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
              Your print business, fully under control
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Job cards, invoices, challans, paper stock — sab ek hi dashboard se manage karo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => router.push('/invoice/add')}
              className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-md"
            >
              Add Invoice
            </button>
            <button
              onClick={() => router.push('/paper-stock')}
              className="bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl font-bold text-sm transition"
            >
              Paper Stock
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Monthly Revenue"
          value={stats.monthlyRevenue}
          prefix="₹"
          diff={stats.monthlyDiff}
          icon={IndianRupee}
          gradient="from-orange-400 to-amber-500"
          iconBg="bg-orange-50 text-orange-500"
        />
        <StatCard
          title="Yearly Revenue"
          value={stats.yearlyRevenue}
          prefix="₹"
          diff={stats.yearlyDiff}
          icon={TrendingUp}
          gradient="from-emerald-400 to-teal-500"
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total Job Cards"
          value={stats.totalJobs}
          diff={0}
          icon={Briefcase}
          gradient="from-blue-400 to-indigo-500"
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Jobs This Month"
          value={stats.monthJobs}
          diff={0}
          icon={CalendarDays}
          gradient="from-violet-400 to-purple-500"
          iconBg="bg-violet-50 text-violet-600"
        />
      </div>

      <WorkflowStepper jobCards={allJobCards} />

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-gray-900">Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly & cumulative yearly revenue</p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">This Month</p>
                <p className="text-lg font-black text-teal-600">
                  <CountUp end={stats.monthlyRevenue} prefix="₹" />
                </p>
              </div>
              <div className="border-l pl-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">This Year</p>
                <p className="text-lg font-black text-orange-500">
                  <CountUp end={stats.yearlyRevenue} prefix="₹" />
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                  dx={-5}
                />
                <Tooltip content={customTooltip} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="Monthly Revenue"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Yearly Revenue"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-lg font-black text-gray-900 mb-1">Quick Actions</h3>
          <p className="text-xs text-gray-400 mb-5">Frequently used modules</p>
          <div className="space-y-3">
            <QuickAction
              icon={Briefcase}
              label="Job Cards"
              desc="Create & manage print jobs"
              onClick={() => router.push('/job-card-list')}
              color="bg-blue-600"
            />
            <QuickAction
              icon={FileText}
              label="Invoices"
              desc="Billing & payments"
              onClick={() => router.push('/invoice/list')}
              color="bg-indigo-600"
            />
            <QuickAction
              icon={Truck}
              label="Challans"
              desc="Delivery notes"
              onClick={() => router.push('/challan/list')}
              color="bg-violet-600"
            />
            <QuickAction
              icon={Layers}
              label="Paper Stock"
              desc="Inventory tracking"
              onClick={() => router.push('/paper-stock')}
              color="bg-teal-600"
            />
          </div>
        </div>
      </div>

      {/* Latest job cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900">Latest Job Cards</h3>
            <p className="text-xs text-gray-400 mt-0.5">Recently added print jobs</p>
          </div>
          <button
            onClick={() => router.push('/job-card-list')}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-6 font-bold">Client</th>
                <th className="py-3 px-4 font-bold">Job Name</th>
                <th className="py-3 px-4 font-bold">Job No.</th>
                <th className="py-3 px-4 font-bold">Qty</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-6 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingJobCards ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 animate-pulse font-medium">
                    Loading job cards...
                  </td>
                </tr>
              ) : latestJobCards.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <p className="text-gray-400 italic mb-3">No job cards yet</p>
                    <button
                      onClick={() => router.push('/job-card')}
                      className="text-blue-600 font-bold text-sm hover:underline"
                    >
                      Create your first job card →
                    </button>
                  </td>
                </tr>
              ) : (
                latestJobCards.map((card, idx) => (
                  <tr
                    key={card._id || idx}
                    className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => router.push('/job-card-list')}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {getInitials(card.partyName)}
                        </div>
                        <span className="font-bold text-gray-900">{card.partyName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700 font-medium">{card.jobName || '—'}</td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {card.jobNumber || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-800">
                      {Number(card.jobQty || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      ₹{Number(card.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-medium whitespace-nowrap">
                      {new Date(card.jobDate || card.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

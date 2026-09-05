import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, AlertOctagon, TrendingDown, Wallet, ShieldCheck, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import InvoiceCard from '../components/InvoiceCard';
import ModelPerformanceCard from '../components/ModelPerformanceCard';
import { fetchSummary, fetchInvoices } from '../api/client';

export default function Dashboard({ onSelectInvoice, onNavigateAdd }) {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');
  const [statusTab, setStatusTab] = useState('unpaid');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, invData] = await Promise.all([
        fetchSummary(),
        fetchInvoices()
      ]);
      setSummary(sumData);
      setInvoices(invData);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to WhenTho API. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const isPaid = inv.status === 'paid';
    if (statusTab === 'unpaid' && isPaid) return false;
    if (statusTab === 'paid' && !isPaid) return false;

    const matchesRisk = filterRisk === 'all' || inv.risk_level === filterRisk;
    const clientName = (inv.client_name || inv.client_id || '').toLowerCase();
    const invId = (inv.invoice_id || '').toLowerCase();
    const matchesSearch = clientName.includes(searchQuery.toLowerCase()) || invId.includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const chartData = summary ? [
    { name: 'High Risk', count: summary.high_risk_count, color: '#f43f5e' },
    { name: 'At Risk', count: summary.medium_risk_count, color: '#f59e0b' },
    { name: 'Low Risk', count: summary.low_risk_count, color: '#10b981' },
    { name: 'Settled', count: summary.paid_count, color: '#3b82f6' }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions (shadcn dashboard style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e4e4e7] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Razorpay AI Invoicing
            </span>
            <span className="text-xs text-[#71717a] font-medium">Live Cash Flow Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#09090b]">
            Receivables Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#71717a] mt-0.5">
            Predict payment friction, view survival settlement curves, and auto-reconcile with Razorpay.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-white hover:bg-[#f4f4f5] border border-[#e4e4e7] text-[#71717a] hover:text-[#09090b] transition-all shadow-sm"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={onNavigateAdd}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (Tremor / shadcn Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables Exposure */}
        <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#71717a] font-semibold mb-2">
            <span>Capital at Risk</span>
            <div className="p-1 rounded bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600">
            {summary ? `₹${summary.total_amount_at_risk.toLocaleString('en-IN')}` : '—'}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1.5 flex items-center gap-1 font-medium">
            <span className="text-rose-600 font-bold">Late & very_late</span> exposure
          </p>
        </div>

        {/* Total Collected via Razorpay */}
        <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#71717a] font-semibold mb-2">
            <span>Collected via Razorpay</span>
            <div className="p-1 rounded bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            {summary ? `₹${summary.total_collected.toLocaleString('en-IN')}` : '—'}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1.5 font-medium">
            {summary ? `${summary.paid_count} invoices settled & reconciled` : '0 settled'}
          </p>
        </div>

        {/* Action Required Today */}
        <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#71717a] font-semibold mb-2">
            <span>Action Required Today</span>
            <div className="p-1 rounded bg-amber-50 text-amber-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            {summary ? summary.invoices_needing_action : '—'}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1.5 font-medium">
            Invoices pending nudge or escalation
          </p>
        </div>

        {/* Total Portfolio Value */}
        <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#71717a] font-semibold mb-2">
            <span>Total Booked Value</span>
            <div className="p-1 rounded bg-blue-50 text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-[#09090b]">
            {summary ? `₹${summary.total_portfolio_value.toLocaleString('en-IN')}` : '—'}
          </div>
          <p className="text-[11px] text-[#71717a] mt-1.5 font-medium">
            {summary ? `${summary.total_invoices} total invoices tracked` : '—'}
          </p>
        </div>
      </div>

      {/* Real-time Continuous Learning & Accuracy Tracking Card */}
      <ModelPerformanceCard />

      {/* Mini Tremor Bar Chart Overview */}
      {summary && (
        <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#09090b]">Portfolio Risk Distribution</h3>
              <p className="text-xs text-[#71717a]">Distribution of active invoices across machine learning risk tiers</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> High ({summary.high_risk_count})
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> At Risk ({summary.medium_risk_count})
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Safe ({summary.low_risk_count})
              </span>
            </div>
          </div>

          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`${val} invoices`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs & Filter Bar (shadcn style) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center p-1 bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg">
          <button
            onClick={() => setStatusTab('unpaid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusTab === 'unpaid' ? 'bg-white text-[#09090b] shadow-sm' : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            Active Receivables ({summary ? summary.unpaid_count : 0})
          </button>
          <button
            onClick={() => setStatusTab('paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusTab === 'paid' ? 'bg-white text-[#09090b] shadow-sm' : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            Settled via Razorpay ({summary ? summary.paid_count : 0})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by client or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e4e4e7] focus:border-blue-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#09090b] placeholder-[#a1a1aa] outline-none transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['all', 'high', 'medium', 'low'].map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all shrink-0 ${
                  filterRisk === risk
                    ? 'bg-[#18181b] text-white shadow-sm'
                    : 'bg-white hover:bg-[#f4f4f5] text-[#71717a] hover:text-[#09090b] border border-[#e4e4e7]'
                }`}
              >
                {risk === 'all' ? 'All Risks' : risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backend Offline / Connection Error State */}
      {error && !summary && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 sm:p-8 text-amber-950 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-amber-950">Backend Offline — API Connection Failed</h2>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                WhenTho dashboard requires the FastAPI server to predict payment risk, simulate survival curves, and reconcile with Razorpay.
              </p>
            </div>
          </div>

          <div className="bg-[#18181b] text-white rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-1.5 border border-zinc-800">
            <div className="text-zinc-400 text-[11px] uppercase tracking-wider font-sans font-semibold">Start Backend Service:</div>
            <div className="text-emerald-400 select-all font-medium">
              source .venv/bin/activate && cd backend && uvicorn main:app --reload --port 8000
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </button>
            <span className="text-xs text-amber-700">
              Target endpoint: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">http://localhost:8000/api</code>
            </span>
          </div>
        </div>
      )}

      {/* Generic Error display when summary exists */}
      {error && summary && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoices List */}
      {loading ? (
        <div className="py-20 text-center text-[#71717a] space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-medium">Running payment risk prediction on active invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-16 text-center bg-white border border-[#e4e4e7] rounded-xl text-[#71717a] space-y-2 shadow-sm">
          <p className="text-sm text-[#09090b] font-bold">No invoices match your selection</p>
          <p className="text-xs">Adjust your search keyword or toggle between active and settled tabs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.invoice_id}
              invoice={invoice}
              onSelect={onSelectInvoice}
            />
          ))}
        </div>
      )}
    </div>
  );
}

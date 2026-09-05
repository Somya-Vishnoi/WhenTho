import React from 'react';
import { Clock, ShieldCheck, TrendingUp, Sparkles, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import RiskBadge from './RiskBadge';

export default function PredictionCard({ prediction }) {
  if (!prediction) return null;

  const {
    predicted_status,
    confidence = 0,
    probabilities = {},
    risk_level = "low",
    plain_english_reason = "",
    days_until_likely_payment = 0,
    survival_curve = [],
    recommended_action = "wait",
    status = "unpaid"
  } = prediction;

  const statusDisplay = {
    on_time: {
      title: "On-Time Payment Expected",
      desc: "Client behavior strongly indicates invoice will settle before terms expire.",
      color: "text-emerald-700",
      progressBg: "bg-emerald-600",
    },
    late: {
      title: "Payment Likely Delayed (1-15 days)",
      desc: "Moderate payment friction expected based on historical delay rate.",
      color: "text-amber-700",
      progressBg: "bg-amber-500",
    },
    very_late: {
      title: "Critical Delay Expected (>15 days)",
      desc: "Severe cash flow disruption likelihood. Proactive escalation required.",
      color: "text-rose-700",
      progressBg: "bg-rose-600",
    }
  };

  const statusInfo = statusDisplay[predicted_status] || statusDisplay.on_time;
  const confPct = Math.round(confidence * 100);

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f4f4f5] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#71717a] mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold tracking-wide">LightGBM Multiclass Model & Survival Engine</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${statusInfo.color}`}>
            {statusInfo.title}
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">{statusInfo.desc}</p>
        </div>

        <div>
          <RiskBadge risk_level={risk_level} status={status} size="md" />
        </div>
      </div>

      {/* Confidence & Multiclass Probability Matrix */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#71717a] font-medium">Model Confidence</span>
          <span className="text-[#09090b] font-mono font-semibold">{confPct}% confidence</span>
        </div>
        <div className="w-full bg-[#f4f4f5] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${statusInfo.progressBg}`}
            style={{ width: `${confPct}%` }}
          />
        </div>

        {probabilities && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-lg p-3">
              <span className="text-[11px] text-[#71717a] font-medium block">On Time</span>
              <span className="text-base font-bold font-mono text-emerald-600">
                {Math.round((probabilities.on_time || 0) * 100)}%
              </span>
            </div>
            <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-lg p-3">
              <span className="text-[11px] text-[#71717a] font-medium block">Late (1-15d)</span>
              <span className="text-base font-bold font-mono text-amber-600">
                {Math.round((probabilities.late || 0) * 100)}%
              </span>
            </div>
            <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-lg p-3">
              <span className="text-[11px] text-[#71717a] font-medium block">Critical (&gt;15d)</span>
              <span className="text-base font-bold font-mono text-rose-600">
                {Math.round((probabilities.very_late || 0) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Plain English Reason Banner */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-1 rounded bg-blue-100 text-blue-600 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Causal Attribution Analysis
            </h4>
            <p className="text-sm text-blue-950 leading-relaxed font-medium">
              "{plain_english_reason}"
            </p>
          </div>
        </div>
      </div>

      {/* Survival Curve Chart (Tremor Style in pure white mode) */}
      {survival_curve && survival_curve.length > 0 && (
        <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-[#09090b] uppercase tracking-wider">
                Time-To-Event Settlement Probability
              </span>
            </div>
            <span className="text-[11px] text-[#71717a] font-medium">Cumulative % settled over time</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={survival_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="probGradientLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} domain={[0, 100]} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}% probability`, 'Settlement Chance']}
                />
                <Area type="monotone" dataKey="probability" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#probGradientLight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Key Forecast Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#71717a] block font-medium">Estimated Payment Timing</span>
            <span className="text-sm font-bold text-[#09090b]">
              Likely settlement in <span className="text-blue-600 font-extrabold">{days_until_likely_payment} days</span>
            </span>
          </div>
        </div>

        <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#71717a] block font-medium">Prescribed Action</span>
            <span className="text-sm font-semibold text-[#09090b]">
              {recommended_action === "escalate" ? (
                <span className="text-rose-700 font-bold">Escalate (Send urgent reminder)</span>
              ) : recommended_action === "nudge" ? (
                <span className="text-amber-700 font-bold">Nudge (Gentle check-in)</span>
              ) : (
                <span className="text-emerald-700 font-bold">Wait (No action required)</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

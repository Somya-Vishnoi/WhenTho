import React from 'react';

export default function RiskBadge({ risk_level, status = "unpaid", size = "md" }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        <span>Paid & Settled</span>
      </span>
    );
  }

  const level = (risk_level || 'low').toLowerCase();

  const configs = {
    high: {
      label: "High Risk",
      pillClass: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]"
    },
    medium: {
      label: "At Risk",
      pillClass: "bg-amber-50 text-amber-800 border-amber-200",
      dotClass: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
    },
    low: {
      label: "Low Risk",
      pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
    }
  };

  const current = configs[level] || configs.low;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all ${sizeClasses} ${current.pillClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`}></span>
      <span>{current.label}</span>
    </span>
  );
}

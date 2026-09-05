import React from 'react';
import { ArrowRight, Building2, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function InvoiceCard({ invoice, onSelect }) {
  const {
    invoice_id,
    client_name,
    client_id,
    client_industry,
    invoice_amount = 0,
    days_since_invoice_sent = 0,
    payment_terms_days = 30,
    risk_level = "low",
    status = "unpaid",
    recommended_action = "wait",
    confidence = 0
  } = invoice;

  const isPaid = status === "paid";
  const daysOverdue = Math.max(0, days_since_invoice_sent - payment_terms_days);
  const formattedAmount = `₹${Number(invoice_amount).toLocaleString('en-IN')}`;

  return (
    <div
      onClick={() => onSelect(invoice_id)}
      className="group bg-white hover:bg-[#fafafa] border border-[#e4e4e7] hover:border-blue-500/60 rounded-xl p-4 cursor-pointer transition-all shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left client details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {invoice_id}
            </span>
            {client_id && (
              <span className="font-mono text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                {client_id}
              </span>
            )}
            <span className="text-xs text-[#71717a] flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {client_industry || "Creative"}
            </span>

            {isPaid ? (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Settled
              </span>
            ) : daysOverdue > 0 ? (
              <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {daysOverdue}d overdue
              </span>
            ) : null}
          </div>

          <h3 className="text-base font-semibold text-[#09090b] group-hover:text-blue-600 transition-colors truncate">
            {client_name || client_id}
          </h3>

          <div className="flex items-center gap-3 text-xs text-[#71717a] mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isPaid ? 'Settled via Razorpay' : `Sent ${days_since_invoice_sent}d ago`}
            </span>
            <span>•</span>
            <span>Terms: {payment_terms_days} days</span>
          </div>
        </div>

        {/* Right Financials & Action indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#f4f4f5]">
          <div className="text-left sm:text-right">
            <div className={`text-lg font-bold font-mono ${isPaid ? 'text-emerald-600 line-through opacity-70' : 'text-[#09090b]'}`}>
              {formattedAmount}
            </div>
            <div className="text-[11px] text-[#71717a]">
              {isPaid ? 'Paid in Full' : `Confidence: ${Math.round(confidence * 100)}%`}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RiskBadge risk_level={risk_level} status={status} size="md" />

            <div className="hidden lg:block">
              {isPaid ? (
                <span className="text-xs font-medium px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Reconciled
                </span>
              ) : recommended_action === "escalate" ? (
                <span className="text-xs font-medium px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Escalate
                </span>
              ) : recommended_action === "nudge" ? (
                <span className="text-xs font-medium px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Nudge
                </span>
              ) : (
                <span className="text-xs font-medium px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Wait
                </span>
              )}
            </div>

            <div className="w-8 h-8 rounded-lg bg-[#f4f4f5] flex items-center justify-center text-[#71717a] group-hover:text-white group-hover:bg-[#18181b] transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

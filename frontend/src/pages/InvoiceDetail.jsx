import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Building2, Clock, AlertTriangle, CheckCircle2, ExternalLink, Zap, Check, CheckCheck, QrCode, CreditCard, Share2 } from 'lucide-react';
import PredictionCard from '../components/PredictionCard';
import EmailDraft from '../components/EmailDraft';
import RiskBadge from '../components/RiskBadge';
import ClientCheckoutModal from '../components/ClientCheckoutModal';
import RevenueRecoveryCard from '../components/RevenueRecoveryCard';
import RiskTimeline from '../components/RiskTimeline';
import { fetchInvoiceById, generateFollowupEmail, simulateRazorpayPayment } from '../api/client';

export default function InvoiceDetail({ invoiceId, onBack }) {
  const [invoice, setInvoice] = useState(null);
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isClientCheckoutOpen, setIsClientCheckoutOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState(null);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInvoiceById(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [invoiceId]);

  const handleGenerateEmail = async () => {
    try {
      setEmailLoading(true);
      const res = await generateFollowupEmail(invoiceId);
      setEmailData(res);
    } catch (err) {
      console.error(err);
      alert("Failed to generate follow-up email. Please check that the backend is active.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (invoice && invoice.razorpay_payment_url) {
      navigator.clipboard.writeText(invoice.razorpay_payment_url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const handleClientPaid = async () => {
    await simulateRazorpayPayment(invoiceId);
    await loadDetail();
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#71717a]">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium">Loading invoice telemetry...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#71717a] hover:text-[#09090b] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
          {error || "Invoice not found"}
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const daysOverdue = Math.max(0, (invoice.days_since_invoice_sent || 0) - (invoice.payment_terms_days || 30));
  const formattedAmount = `₹${Number(invoice.invoice_amount || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#71717a] hover:text-[#09090b] transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Invoices</span>
      </button>

      {/* Invoice Overview Card */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {invoice.invoice_id}
              </span>
              <RiskBadge risk_level={invoice.risk_level} status={invoice.status} size="md" />
              {isPaid ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Settled on {invoice.paid_at || 'Recently'} via {invoice.settled_channel || 'Razorpay'}
                </span>
              ) : daysOverdue > 0 ? (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {daysOverdue} Days Overdue
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Within Terms ({invoice.payment_terms_days} days)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#09090b]">
              {invoice.client_name || invoice.client_id}
            </h1>
            <p className="text-xs text-[#71717a] flex items-center gap-2 font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>Industry: {invoice.client_industry || "Creative"}</span>
              <span>•</span>
              <span>Billing Contact: <span className="font-mono text-blue-600">{invoice.client_email || "billing@client.com"}</span></span>
            </p>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-[#f4f4f5]">
            <span className="text-[11px] uppercase tracking-wider text-[#71717a] font-bold block">
              Total Invoice Amount
            </span>
            <div className={`text-3xl font-black font-mono tracking-tight ${isPaid ? 'text-emerald-600 line-through opacity-70' : 'text-[#09090b]'}`}>
              {formattedAmount}
            </div>
            <span className="text-xs text-[#71717a] block mt-0.5 font-medium">
              Issued {invoice.invoice_date || 'Recent'} ({invoice.days_since_invoice_sent || 0}d ago)
            </span>
          </div>
        </div>

        {/* Client History Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#f4f4f5] text-xs">
          <div>
            <span className="text-[#71717a] font-medium block">Payment Terms</span>
            <span className="font-bold text-[#09090b] mt-0.5 block">{invoice.payment_terms_days} Net Days</span>
          </div>
          <div>
            <span className="text-[#71717a] font-medium block">Client History</span>
            <span className="font-bold text-[#09090b] mt-0.5 block">
              {invoice.client_total_invoices_before_this ? `${invoice.client_total_invoices_before_this} past invoices` : 'New Client'}
            </span>
          </div>
          <div>
            <span className="text-[#71717a] font-medium block">Historical Late Rate</span>
            <span className="font-bold font-mono text-[#09090b] mt-0.5 block">
              {invoice.client_late_payment_rate ? `${Math.round(invoice.client_late_payment_rate * 100)}%` : '0%'}
            </span>
          </div>
          <div>
            <span className="text-[#71717a] font-medium block">Average Settlement</span>
            <span className="font-bold font-mono text-[#09090b] mt-0.5 block">
              {invoice.client_avg_days_to_pay ? `${Math.round(invoice.client_avg_days_to_pay)} days` : '30 days'}
            </span>
          </div>
        </div>
      </div>

      {/* Razorpay Invoicing Card (Client Payment Portal & Share Link) */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
              <Zap className="w-4 h-4 fill-blue-600 text-blue-600" />
              <span>Razorpay Client Payment Gateway & Dynamic UPI QR</span>
            </div>
            <p className="text-xs text-[#71717a] font-medium">
              Payment link generated for <strong className="text-[#09090b]">{invoice.client_name || invoice.client_id}</strong>.
              Clients can scan the real-time UPI QR or settle via Cards/Netbanking.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
              <button
                onClick={() => setIsClientCheckoutOpen(true)}
                className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{invoice.razorpay_payment_url}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <span className="text-[#d4d4d8]">•</span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-[#71717a] hover:text-[#09090b] font-medium flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Client Link"}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isPaid ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Payment Reconciled & Verified</span>
              </div>
            ) : (
              <button
                onClick={() => setIsClientCheckoutOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>View Client Payment Portal & QR</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Track 3: AI Revenue Recovery Card (Root Cause, Bounded Plan, Hinglish Script, Promise-to-Pay) */}
      {!isPaid && (
        <RevenueRecoveryCard
          invoice={invoice}
          onPtpUpdated={loadDetail}
        />
      )}

      {/* Machine Learning Prediction + Survival Curve Card */}
      <PredictionCard prediction={invoice} />

      {/* Dynamic 30-Day Risk Trajectory Timeline */}
      <RiskTimeline invoiceId={invoice.invoice_id} invoice={invoice} />

      {/* Dispatch History (if any) */}
      {invoice.dispatches && invoice.dispatches.length > 0 && (
        <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-[#09090b] uppercase tracking-wider">
            Follow-Up Dispatch Audit Trail
          </h4>
          <div className="space-y-2">
            {invoice.dispatches.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-[#fafafa] rounded-lg border border-[#e4e4e7]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span className="font-mono font-bold text-[#09090b]">{d.dispatch_id}</span>
                  <span className="text-[#71717a]">• Sent to {d.recipient}</span>
                </div>
                <div className="text-[#71717a] font-mono text-[11px]">{d.sent_at}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Generator Zone */}
      {!isPaid && (
        <div className="bg-white border border-[#e4e4e7] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#09090b] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Follow-Up Communications Generator
              </h3>
              <p className="text-xs text-[#71717a] mt-0.5">
                Instant tailored recovery message calibrated to this client's history and overdue status.
              </p>
            </div>

            <button
              onClick={handleGenerateEmail}
              disabled={emailLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
            >
              {emailLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading Template...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{emailData ? 'Regenerate Draft' : 'Generate Follow-up Email'}</span>
                </>
              )}
            </button>
          </div>

          {emailData && (
            <div className="pt-2">
              <EmailDraft
                invoiceId={invoice.invoice_id}
                email_subject={emailData.email_subject}
                email_body={emailData.email_body}
                tone={emailData.tone}
                recipient_email={invoice.client_email}
                onSentSuccess={loadDetail}
              />
            </div>
          )}
        </div>
      )}

      {/* Realistic Client Checkout Modal with Dynamic QR code */}
      <ClientCheckoutModal
        invoice={invoice}
        isOpen={isClientCheckoutOpen}
        onClose={() => setIsClientCheckoutOpen(false)}
        onPaymentSuccess={handleClientPaid}
      />
    </div>
  );
}

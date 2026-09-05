import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Smartphone, Building, ArrowRight, Sparkles } from 'lucide-react';

export default function RazorpayModal({ invoice, isOpen, onClose, onPaymentSuccess }) {
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('merchant@okhdfcbank');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('select'); // select, processing, success

  if (!isOpen || !invoice) return null;

  const formattedAmount = `₹${Number(invoice.invoice_amount || 0).toLocaleString('en-IN')}`;

  const handlePay = () => {
    setProcessing(true);
    setStep('processing');
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
        setStep('select');
      }, 1500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in">
      <div className="bg-white border border-[#e4e4e7] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-all">
        {/* Razorpay Brand Header */}
        <div className="bg-[#0b2265] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-black text-white text-sm">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight">Razorpay</span>
                <span className="text-[10px] bg-blue-400/20 text-blue-200 px-1.5 py-0.2 rounded font-semibold uppercase">
                  Standard Checkout
                </span>
              </div>
              <p className="text-[11px] text-blue-200">Payment for {invoice.client_name || invoice.invoice_id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Bar */}
        <div className="bg-[#f4f7fc] px-5 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#475569]">Total Amount Payable</span>
          <span className="text-lg font-black font-mono text-[#0b2265]">{formattedAmount}</span>
        </div>

        {/* Content based on step */}
        {step === 'select' && (
          <div className="p-5 space-y-4">
            <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider block">
              Select Preferred Payment Option
            </span>

            <div className="space-y-2">
              <label
                onClick={() => setMethod('upi')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  method === 'upi' ? 'border-blue-600 bg-blue-50/50' : 'border-[#e2e8f0] hover:bg-[#fafafa]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0f172a] block">UPI / QR Code</span>
                    <span className="text-[11px] text-[#64748b]">Google Pay, PhonePe, Paytm, BHIM</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payMethod"
                  checked={method === 'upi'}
                  onChange={() => setMethod('upi')}
                  className="accent-blue-600"
                />
              </label>

              <label
                onClick={() => setMethod('cards')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  method === 'cards' ? 'border-blue-600 bg-blue-50/50' : 'border-[#e2e8f0] hover:bg-[#fafafa]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0f172a] block">Cards</span>
                    <span className="text-[11px] text-[#64748b]">Visa, Mastercard, RuPay, Corporate</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payMethod"
                  checked={method === 'cards'}
                  onChange={() => setMethod('cards')}
                  className="accent-blue-600"
                />
              </label>

              <label
                onClick={() => setMethod('netbanking')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  method === 'netbanking' ? 'border-blue-600 bg-blue-50/50' : 'border-[#e2e8f0] hover:bg-[#fafafa]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0f172a] block">Netbanking</span>
                    <span className="text-[11px] text-[#64748b]">All Indian Major Banks</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payMethod"
                  checked={method === 'netbanking'}
                  onChange={() => setMethod('netbanking')}
                  className="accent-blue-600"
                />
              </label>
            </div>

            {method === 'upi' && (
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">UPI ID / VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#cbd5e1] focus:border-blue-600 outline-none"
                />
              </div>
            )}

            <button
              onClick={handlePay}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              <span>Pay {formattedAmount} via Razorpay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#94a3b8] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Razorpay Payments & PCI-DSS Level 1 Compliance</span>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Authorizing Payment</h3>
              <p className="text-xs text-[#64748b] mt-1">Connecting to Razorpay Banking Gateway & UPI Switch...</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto animate-in zoom-in">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-emerald-800">Payment Captured Successfully!</h3>
              <p className="text-xs text-[#64748b] mt-1">Razorpay Webhook dispatched. Receivables ledger updated in real-time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

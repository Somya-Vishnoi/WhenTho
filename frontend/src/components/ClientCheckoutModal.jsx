import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Smartphone, CreditCard, Building, ArrowRight, QrCode, Copy, Check, Lock } from 'lucide-react';

export default function ClientCheckoutModal({ invoice, isOpen, onClose, onPaymentSuccess }) {
  const [method, setMethod] = useState('upi_qr'); // 'upi_qr' | 'upi_id' | 'cards' | 'netbanking'
  const [upiId, setUpiId] = useState('client@okhdfcbank');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('pay'); // 'pay' | 'authorizing' | 'success'
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!isOpen || !invoice) return null;

  const formattedAmount = `₹${Number(invoice.invoice_amount || 0).toLocaleString('en-IN')}`;
  const upiVpa = `whentho.merchant@razorpay`;
  // Generate authentic SVG-based dynamic QR Code with UPI scheme
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=upi://pay?pa=${upiVpa}%26pn=WhenTho%20Invoice%26am=${invoice.invoice_amount}%26cu=INR%26tn=Invoice%20${invoice.invoice_id}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiVpa).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    });
  };

  const handleAuthorize = () => {
    setProcessing(true);
    setStep('authorizing');
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
        setStep('pay');
      }, 1800);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in">
      <div className="bg-white border border-[#e4e4e7] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-all">
        {/* Razorpay Brand Header */}
        <div className="bg-[#0b2265] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center font-black text-white text-base shadow-sm">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight">Razorpay</span>
                <span className="text-[10px] bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Client Checkout Portal
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Invoice {invoice.invoice_id} &bull; Issued to <span className="font-semibold text-white">{invoice.client_name || invoice.client_id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Amount summary */}
        <div className="bg-[#f8fafc] px-6 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block">Total Amount to Pay</span>
            <span className="text-xs text-[#94a3b8]">{invoice.description || 'Professional creative & engineering deliverables'}</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-[#0b2265]">{formattedAmount}</span>
            <span className="text-[10px] text-emerald-600 font-bold block">✓ Verified Merchant Link</span>
          </div>
        </div>

        {/* Dynamic Payment Screen */}
        {step === 'pay' && (
          <div className="p-6 space-y-5">
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#f1f5f9] rounded-xl border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setMethod('upi_qr')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  method === 'upi_qr' ? 'bg-white text-blue-700 shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <QrCode className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Scan QR</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi_id')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  method === 'upi_id' ? 'bg-white text-blue-700 shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-1" />
                <span className="text-[10px]">UPI VPA</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('cards')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  method === 'cards' ? 'bg-white text-blue-700 shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  method === 'netbanking' ? 'bg-white text-blue-700 shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                <Building className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Netbanking</span>
              </button>
            </div>

            {/* UPI QR Code Section */}
            {method === 'upi_qr' && (
              <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="p-2 bg-white rounded-xl shadow-md border border-[#cbd5e1]">
                  <img
                    src={qrUrl}
                    alt="Razorpay Dynamic UPI QR"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-[#0f172a] block">
                    Scan with any UPI App (PhonePe, GPay, Paytm)
                  </span>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#64748b]">
                    <span>UPI ID: <strong className="font-mono text-blue-700">{upiVpa}</strong></span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* UPI ID Section */}
            {method === 'upi_id' && (
              <div className="space-y-3 p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <label className="block text-xs font-bold text-[#334155]">Enter your UPI ID / VPA</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="flex-1 text-xs font-mono p-2.5 rounded-lg border border-[#cbd5e1] focus:border-blue-600 outline-none bg-white"
                  />
                </div>
                <p className="text-[11px] text-[#64748b]">
                  A payment collect request for {formattedAmount} will be sent to your UPI app.
                </p>
              </div>
            )}

            {/* Cards Section */}
            {method === 'cards' && (
              <div className="space-y-2.5 p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Card Number</label>
                  <input
                    type="text"
                    defaultValue="4111 2222 3333 4444"
                    className="w-full p-2.5 rounded-lg border border-[#cbd5e1] font-mono bg-white outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">Expiry</label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="w-full p-2.5 rounded-lg border border-[#cbd5e1] font-mono bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#334155] mb-1">CVV</label>
                    <input
                      type="password"
                      defaultValue="888"
                      className="w-full p-2.5 rounded-lg border border-[#cbd5e1] font-mono bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Netbanking Section */}
            {method === 'netbanking' && (
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-2 text-xs">
                <label className="block font-bold text-[#334155]">Select Bank</label>
                <select className="w-full p-2.5 rounded-lg border border-[#cbd5e1] bg-white font-medium outline-none">
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>State Bank of India (SBI)</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            {/* Complete Payment Button (Simulates Client Authorizing via Razorpay) */}
            <button
              onClick={handleAuthorize}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 active:scale-95 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Complete Payment of {formattedAmount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-[#64748b]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Protected by Razorpay Payments & 256-bit Bank Grade Encryption</span>
            </div>
          </div>
        )}

        {/* Authorizing Animation */}
        {step === 'authorizing' && (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-extrabold text-[#0f172a]">Authorizing Client Payment</h3>
              <p className="text-xs text-[#64748b] mt-1">Connecting to NPCI UPI Switch and Razorpay Banking Gateway...</p>
            </div>
          </div>
        )}

        {/* Success confirmation */}
        {step === 'success' && (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto animate-in zoom-in">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-800">Payment Captured & Reconciled!</h3>
              <p className="text-xs text-[#64748b] mt-1">Razorpay Webhook dispatched. Receivables ledger marked as Settled.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, AlertCircle, Zap } from 'lucide-react';
import { createInvoice, fetchClients } from '../api/client';

export default function AddInvoice({ onBack, onInvoiceCreated }) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [customClientId, setCustomClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [terms, setTerms] = useState(30);
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadClientList() {
      try {
        const list = await fetchClients();
        setClients(list || []);
        if (list && list.length > 0) {
          setSelectedClientId(list[0].client_id);
        } else {
          setIsNewClient(true);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadClientList();
  }, []);

  const handleClientSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'NEW_CLIENT') {
      setIsNewClient(true);
      setSelectedClientId('');
    } else {
      setIsNewClient(false);
      setSelectedClientId(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || Number(amount) <= 0) {
      setError("Please provide a valid invoice amount.");
      return;
    }

    const finalClientId = isNewClient
      ? (customClientId.trim() || `CL-${Math.floor(1000 + Math.random() * 9000)}`)
      : selectedClientId;

    const finalClientName = clientName.trim() || (isNewClient ? "New Client" : `Client ${selectedClientId}`);
    const finalEmail = clientEmail.trim() || `billing@${finalClientId.toLowerCase()}.com`;

    try {
      setLoading(true);
      const payload = {
        client_name: finalClientName,
        client_id: finalClientId,
        client_email: finalEmail,
        invoice_amount: parseFloat(amount),
        payment_terms_days: parseInt(terms, 10),
        invoice_date: invoiceDate,
        description: description || "Professional services delivery",
        create_razorpay_link: true
      };

      const result = await createInvoice(payload);
      onInvoiceCreated(result.invoice_id);
    } catch (err) {
      console.error(err);
      setError("Failed to create invoice. Please verify backend connectivity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#71717a] hover:text-[#09090b] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Receivables
      </button>

      <div className="bg-white border border-[#e4e4e7] rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="border-b border-[#f4f4f5] pb-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Instant Risk Scoring
            </span>
            <span className="text-xs text-[#71717a] flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Auto-generates Razorpay payment link
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#09090b]">Add New Invoice</h1>
          <p className="text-xs text-[#71717a] mt-0.5">
            WhenTho executes feature extraction and LightGBM inference immediately upon submission.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
                Client History Profile
              </label>
              <select
                value={isNewClient ? 'NEW_CLIENT' : selectedClientId}
                onChange={handleClientSelectChange}
                className="w-full bg-[#fcfcfc] border border-[#e4e4e7] focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-[#09090b] outline-none shadow-sm"
              >
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.client_id} ({c.client_industry})
                  </option>
                ))}
                <option value="NEW_CLIENT">+ New Client (No Prior History)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
                Client / Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp or Studio Nova"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#fcfcfc] border border-[#e4e4e7] focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-[#09090b] outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Email & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
                Billing Email (for Razorpay & Dispatch)
              </label>
              <input
                type="email"
                placeholder="billing@acmecorp.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-[#fcfcfc] border border-[#e4e4e7] focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-[#09090b] outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
                Invoice Amount (₹)
              </label>
              <input
                type="number"
                placeholder="75000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-[#fcfcfc] border border-[#e4e4e7] focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-[#09090b] font-mono outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Terms & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
                Payment Terms
              </label>
              <select
                value={terms}
                onChange={(e) => setTerms(Number(e.target.value))}
                className="w-full bg-[#fcfcfc] border border-[#e4e4e7] focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-[#09090b] outline-none shadow-sm"
              >
                <option value={15}>Net 15 Days</option>
                <option value={30}>Net 30 Days (Standard)</option>
                <option value={45}>Net 45 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
                Invoice Issue Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-[#fcfcfc] border border-[#e4e4e7] focus:border-blue-600 rounded-lg px-3 py-2 text-xs text-[#09090b] outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
              Deliverables / Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Design sprint, production release, and infrastructure handoff"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#fcfcfc] border border-[#e4e4e7] focus:border-blue-600 rounded-lg p-3 text-xs text-[#09090b] outline-none shadow-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#71717a] hover:text-[#09090b] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#18181b] hover:bg-[#27272a] disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm active:scale-95"
            >
              {loading ? (
                <span>Generating Risk Score...</span>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Invoice & Predict</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

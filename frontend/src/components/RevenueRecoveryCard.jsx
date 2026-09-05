import React, { useState } from 'react';
import { ShieldAlert, GitCommit, PhoneCall, CalendarCheck2, CheckCircle, ArrowRight, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import { recordPromiseToPay } from '../api/client';

export default function RevenueRecoveryCard({ invoice, onPtpUpdated }) {
  const recovery = invoice?.recovery_plan;
  const hinglishScript = invoice?.hinglish_voice_script;

  const [ptpDate, setPtpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [ptpNotes, setPtpNotes] = useState('Client verbally confirmed via phone; will clear via Razorpay link');
  const [savingPtp, setSavingPtp] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow' | 'script' | 'ptp'

  if (!recovery) return null;

  const handleSavePtp = async (e) => {
    e.preventDefault();
    try {
      setSavingPtp(true);
      await recordPromiseToPay(invoice.invoice_id, {
        promised_date: ptpDate,
        notes: ptpNotes,
        recorded_by: "Finance Recovery Specialist"
      });
      if (onPtpUpdated) onPtpUpdated();
    } catch (err) {
      alert("Error saving Promise-to-Pay: " + err.message);
    } finally {
      setSavingPtp(false);
    }
  };

  const handleCopyScript = () => {
    if (hinglishScript) {
      navigator.clipboard.writeText(hinglishScript).then(() => {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      });
    }
  };

  const existingPtp = invoice?.promise_to_pay;

  return (
    <div className="bg-white border-2 border-blue-600/20 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f4f4f5] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              AI Revenue Recovery Agent
            </span>
            <span className="text-xs text-[#71717a] font-semibold">Track 3: Autonomous Receivables Win-Back</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#09090b]">
            {recovery.strategy_name}
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Cadence: <span className="font-semibold text-[#09090b]">{recovery.cadence}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {existingPtp ? (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
              existingPtp.status === 'fulfilled'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>PTP: {existingPtp.promised_date} ({existingPtp.status})</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>PTP Window: {recovery.promise_window_days} Days</span>
            </div>
          )}
        </div>
      </div>

      {/* Root Cause Diagnosis Section */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-[#09090b] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          Degradation & Root Cause Diagnosis
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recovery.root_causes.map((rc, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs space-y-1 ${
                rc.severity === 'high'
                  ? 'bg-rose-50/50 border-rose-200'
                  : rc.severity === 'medium'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className={rc.severity === 'high' ? 'text-rose-900' : 'text-slate-900'}>
                  {rc.title}
                </span>
                <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-mono ${
                  rc.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {rc.category}
                </span>
              </div>
              <p className="text-[#71717a] leading-relaxed">
                {rc.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented Sub-Tabs: Workflow / Voice Script / Promise to Pay */}
      <div className="pt-2">
        <div className="flex items-center gap-2 border-b border-[#e4e4e7] pb-2">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'workflow' ? 'bg-[#18181b] text-white shadow-sm' : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Sequenced Recovery Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'script' ? 'bg-[#18181b] text-white shadow-sm' : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
            <span>Hinglish Voice Recovery Script</span>
          </button>

          <button
            onClick={() => setActiveTab('ptp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ptp' ? 'bg-[#18181b] text-white shadow-sm' : 'text-[#71717a] hover:text-[#09090b]'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Promise-To-Pay (PTP) Tracker</span>
          </button>
        </div>

        {/* Tab 1: Sequenced Workflow */}
        {activeTab === 'workflow' && (
          <div className="pt-4 space-y-3">
            {recovery.workflow_steps.map((ws) => (
              <div key={ws.step} className="flex items-start gap-3 p-3 rounded-lg bg-[#fafafa] border border-[#e4e4e7] text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {ws.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#09090b]">{ws.action}</span>
                    <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Target: {ws.target_date}
                    </span>
                  </div>
                  <p className="text-[#71717a] mt-0.5">{ws.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#a1a1aa]">
                    <span>Channel: <span className="font-semibold text-slate-700">{ws.channel}</span></span>
                    <span>•</span>
                    <span>Status: <span className="font-semibold uppercase text-emerald-600">{ws.status}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Hinglish Script */}
        {activeTab === 'script' && (
          <div className="pt-4 space-y-3">
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  <span>Indian Merchant B2B Calling Script (Hinglish)</span>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-blue-200 text-xs font-semibold text-blue-900 shadow-sm"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? "Copied" : "Copy Script"}</span>
                </button>
              </div>
              <p className="text-xs text-blue-950 font-sans leading-relaxed italic bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                "{hinglishScript}"
              </p>
              <p className="text-[11px] text-[#71717a]">
                💡 Specially optimized for Indian B2B client follow-up calls where formal English feels overly robotic and causes defensiveness.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: PTP Tracker */}
        {activeTab === 'ptp' && (
          <div className="pt-4 space-y-4">
            {existingPtp ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Active Promise-To-Pay Commitment</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[#71717a] block">Promised Clearing Date</span>
                    <span className="font-extrabold font-mono text-[#09090b]">{existingPtp.promised_date}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block">Recorded On</span>
                    <span className="font-mono text-[#09090b]">{existingPtp.recorded_at}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a] block">Current Status</span>
                    <span className="font-bold uppercase text-emerald-700">{existingPtp.status}</span>
                  </div>
                </div>
                <p className="text-xs text-[#71717a] pt-1">Notes: "{existingPtp.notes}"</p>
              </div>
            ) : null}

            <form onSubmit={handleSavePtp} className="p-4 rounded-xl bg-[#fafafa] border border-[#e4e4e7] space-y-3">
              <span className="text-xs font-bold text-[#09090b] block">
                {existingPtp ? "Update / Extend Client Promise-to-Pay" : "Lock In New Client Promise-to-Pay"}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#71717a] mb-1">Promised Payment Date</label>
                  <input
                    type="date"
                    value={ptpDate}
                    onChange={(e) => setPtpDate(e.target.value)}
                    required
                    className="w-full text-xs p-2 rounded-lg border border-[#e4e4e7] bg-white focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#71717a] mb-1">Confirmation Details</label>
                  <input
                    type="text"
                    value={ptpNotes}
                    onChange={(e) => setPtpNotes(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-[#e4e4e7] bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingPtp}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-95"
                >
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  <span>{savingPtp ? "Recording Commitment..." : "Commit Promise-to-Pay"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

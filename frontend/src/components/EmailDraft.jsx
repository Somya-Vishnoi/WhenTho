import React, { useState } from 'react';
import { Copy, Check, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { sendFollowupEmail } from '../api/client';

export default function EmailDraft({ invoiceId, email_subject, email_body, tone, recipient_email, onSentSuccess }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleCopy = () => {
    const fullText = `Subject: ${email_subject}\n\n${email_body}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSend = async () => {
    try {
      setSending(true);
      await sendFollowupEmail(invoiceId, {
        email_subject,
        email_body,
        recipient_email
      });
      setSentSuccess(true);
      if (onSentSuccess) onSentSuccess();
      setTimeout(() => setSentSuccess(false), 4000);
    } catch (err) {
      alert("Error sending email dispatch: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-[#e4e4e7] rounded-xl overflow-hidden shadow-sm">
      {/* Compose header */}
      <div className="bg-[#fafafa] border-b border-[#e4e4e7] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          </div>
          <span className="text-xs font-bold text-[#09090b] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            AI Drafted Follow-up
          </span>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
            tone === 'escalate' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {tone === 'escalate' ? 'Escalation Mode' : 'Gentle Nudge'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-[#f4f4f5] border border-[#e4e4e7] text-[#09090b] transition-all"
            title="Copy email text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#71717a]" />
                <span>Copy text</span>
              </>
            )}
          </button>

          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#18181b] hover:bg-[#27272a] text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {sending ? (
              <span>Sending...</span>
            ) : sentSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dispatched!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send via Gateway</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recipient & Subject Header */}
      <div className="px-5 py-2.5 bg-[#fcfcfc] border-b border-[#e4e4e7] text-xs flex flex-col gap-1.5">
        <div className="flex items-center">
          <span className="text-[#71717a] w-14 font-medium">To:</span>
          <span className="font-mono text-blue-600 font-medium">{recipient_email || "billing@client.com"}</span>
        </div>
        <div className="flex items-center">
          <span className="text-[#71717a] w-14 font-medium">Subject:</span>
          <span className="font-bold text-[#09090b] truncate">{email_subject}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 bg-white">
        <div className="whitespace-pre-line text-sm text-[#27272a] leading-relaxed font-sans select-all">
          {email_body}
        </div>
      </div>

      {/* Footer info with Razorpay mention */}
      <div className="px-5 py-2.5 bg-[#fafafa] border-t border-[#e4e4e7] flex items-center justify-between text-[11px] text-[#71717a]">
        <span>⚡ Razorpay FastCheckout Smart Payment Link appended automatically</span>
        <span className="font-mono text-[10px] text-[#a1a1aa]">Gemini 3.5 Flash</span>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, LayoutDashboard, Github } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import InvoiceDetail from './pages/InvoiceDetail';
import AddInvoice from './pages/AddInvoice';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const handleSelectInvoice = (id) => {
    setSelectedInvoiceId(id);
    setCurrentPage('detail');
  };

  const handleInvoiceCreated = (id) => {
    setSelectedInvoiceId(id);
    setCurrentPage('detail');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#09090b] flex flex-col selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Navigation (Clean Tremor / shadcn white mode) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e4e4e7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <img
                src="/whentho-icon-dark.svg"
                alt="WhenTho Logo"
                className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform shrink-0 object-contain"
              />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight leading-none">
                    <span className="text-[#09090b]">when</span>
                    <span className="text-[#eab308]">tho</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Razorpay Track 3
                  </span>
                </div>
                <span className="text-[10px] text-[#71717a] font-medium tracking-wide uppercase mt-0.5">
                  Invoice Intelligence
                </span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-[#f4f4f5] text-[#09090b]'
                    : 'text-[#71717a] hover:text-[#09090b]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Invoices</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">
                Telemetry Live
              </span>
              <span className="font-mono text-emerald-700 font-semibold">
                88.1% F1
              </span>
            </div>

            <a
              href="https://github.com/Somya-Vishnoi/WhenTho"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md bg-white hover:bg-[#f4f4f5] border border-[#e4e4e7] text-[#71717a] hover:text-[#09090b] transition-colors shadow-sm"
              title="GitHub Repo"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard
            onSelectInvoice={handleSelectInvoice}
            onNavigateAdd={() => setCurrentPage('add')}
          />
        )}

        {currentPage === 'detail' && selectedInvoiceId && (
          <InvoiceDetail
            invoiceId={selectedInvoiceId}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}

        {currentPage === 'add' && (
          <AddInvoice
            onBack={() => setCurrentPage('dashboard')}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e4e4e7] bg-white py-6 text-xs text-[#71717a]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WhenTho &bull; Razorpay AI Invoicing Intelligence Prototype</span>
          <span className="font-mono text-[11px] text-[#a1a1aa]">
            LightGBM Survival Analysis + Gemini 3.5 Flash + Razorpay Webhook Sync
          </span>
        </div>
      </footer>
    </div>
  );
}

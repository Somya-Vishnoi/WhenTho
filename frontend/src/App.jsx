import React, { useState, useEffect, useRef } from 'react';
import { Plus, LayoutDashboard, Github, ArrowLeft } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import InvoiceDetail from './pages/InvoiceDetail';
import AddInvoice from './pages/AddInvoice';

export default function App() {
  // Sync page state from browser URL hash for full native browser navigation support
  const getInitialState = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/invoice/')) {
      const id = hash.replace('#/invoice/', '');
      return { page: 'detail', id };
    }
    if (hash === '#/create') {
      return { page: 'add', id: null };
    }
    return { page: 'dashboard', id: null };
  };

  const [navigation, setNavigation] = useState(getInitialState);
  const { page: currentPage, id: selectedInvoiceId } = navigation;

  // Swipe-to-go-back gesture state (Native Chrome two-finger trackpad / touch swipe)
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeDeltaRef = useRef(0);
  const swipeTimeoutRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Listen to native browser popstate (back/forward buttons, trackpad 2-finger swipe)
  useEffect(() => {
    const handlePopState = () => {
      setNavigation(getInitialState());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page, id = null, replace = false) => {
    let newHash = '';
    if (page === 'detail' && id) {
      newHash = `#/invoice/${id}`;
    } else if (page === 'add') {
      newHash = '#/create';
    } else {
      newHash = '#/';
    }

    if (replace) {
      window.history.replaceState({ page, id }, '', newHash);
    } else {
      window.history.pushState({ page, id }, '', newHash);
    }
    setNavigation({ page, id });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectInvoice = (id) => {
    navigateTo('detail', id);
  };

  const handleInvoiceCreated = (id) => {
    navigateTo('detail', id);
  };

  const handleBackToDashboard = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('dashboard');
    }
  };

  // Custom high-fidelity Chrome swipe-to-go-back visual cue (Trackpad horizontal wheel & touch)
  useEffect(() => {
    if (currentPage === 'dashboard') return;

    // Trackpad horizontal two-finger wheel event
    const handleWheel = (e) => {
      // Horizontal swipe from left edge (swipe right to go back)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && e.deltaX < 0) {
        // Scrolling horizontally to the left (finger moving right)
        if (window.scrollX <= 0) {
          swipeDeltaRef.current += Math.abs(e.deltaX);
          setIsSwiping(true);
          const progress = Math.min(1, swipeDeltaRef.current / 120);
          setSwipeProgress(progress);

          clearTimeout(swipeTimeoutRef.current);
          if (progress >= 1) {
            handleBackToDashboard();
            swipeDeltaRef.current = 0;
            setIsSwiping(false);
            setSwipeProgress(0);
          } else {
            swipeTimeoutRef.current = setTimeout(() => {
              setIsSwiping(false);
              setSwipeProgress(0);
              swipeDeltaRef.current = 0;
            }, 250);
          }
        }
      }
    };

    // Mobile / Touch swipe
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartRef.current.x < 50 && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartRef.current.x;
        const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
        if (deltaX > 0 && deltaX > deltaY) {
          setIsSwiping(true);
          setSwipeProgress(Math.min(1, deltaX / 140));
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (isSwiping) {
        if (swipeProgress >= 0.65) {
          handleBackToDashboard();
        }
        setIsSwiping(false);
        setSwipeProgress(0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#09090b] flex flex-col selection:bg-blue-500/20 selection:text-blue-900 relative">
      {/* Chrome-style Back Navigation Bubble Indicator */}
      {isSwiping && currentPage !== 'dashboard' && (
        <div
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 p-3 rounded-full bg-white/95 text-[#09090b] shadow-2xl border border-[#e4e4e7] backdrop-blur-md transition-all duration-75"
          style={{
            transform: `translateY(-50%) translateX(${swipeProgress * 30}px) scale(${0.8 + swipeProgress * 0.3})`,
            opacity: Math.max(0.4, swipeProgress)
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#18181b] text-white flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {swipeProgress > 0.4 && (
            <span className="text-xs font-bold text-[#09090b] pr-2 whitespace-nowrap">
              Back to Invoices
            </span>
          )}
        </div>
      )}

      {/* Top Navigation (Clean Tremor / shadcn white mode) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e4e4e7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigateTo('dashboard')}
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
                </div>
                <span className="text-[10px] text-[#71717a] font-medium tracking-wide uppercase mt-0.5">
                  Invoice Intelligence
                </span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => navigateTo('dashboard')}
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

      {/* Main Content Area with smooth transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard
            onSelectInvoice={handleSelectInvoice}
            onNavigateAdd={() => navigateTo('add')}
          />
        )}

        {currentPage === 'detail' && selectedInvoiceId && (
          <InvoiceDetail
            invoiceId={selectedInvoiceId}
            onBack={handleBackToDashboard}
          />
        )}

        {currentPage === 'add' && (
          <AddInvoice
            onBack={handleBackToDashboard}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e4e4e7] bg-white py-6 text-xs text-[#71717a]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WhenTho &bull; Razorpay AI Invoicing Intelligence Prototype</span>
          <span className="font-mono text-[11px] text-[#a1a1aa]">
            LightGBM Survival Analysis + Gemini 2.5 Flash + Razorpay Webhook Sync
          </span>
        </div>
      </footer>
    </div>
  );
}

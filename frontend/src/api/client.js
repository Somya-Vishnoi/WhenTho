// In development, Vite proxies '/api' -> http://localhost:8000
// In production, VITE_API_URL can be set to the deployed backend URL (e.g. https://api.whentho.com)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) {
    throw new Error(`Failed to fetch summary: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchInvoices(statusFilter = '') {
  const url = statusFilter ? `${API_BASE}/invoices?status=${statusFilter}` : `${API_BASE}/invoices`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch invoices: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchInvoiceById(invoiceId) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice ${invoiceId}: ${res.statusText}`);
  }
  return res.json();
}

export async function createInvoice(invoiceData) {
  const res = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData)
  });
  if (!res.ok) {
    throw new Error(`Failed to create invoice: ${res.statusText}`);
  }
  return res.json();
}

export async function generateFollowupEmail(invoiceId) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/generate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Failed to generate email: ${res.statusText}`);
  }
  return res.json();
}

export async function sendFollowupEmail(invoiceId, payload) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to send email: ${res.statusText}`);
  }
  return res.json();
}

export async function simulateRazorpayPayment(invoiceId) {
  const res = await fetch(`${API_BASE}/razorpay/simulate-payment/${invoiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Failed to simulate Razorpay payment: ${res.statusText}`);
  }
  return res.json();
}

export async function markInvoicePaid(invoiceId, channel = 'razorpay_instant') {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_channel: channel })
  });
  if (!res.ok) {
    throw new Error(`Failed to mark invoice paid: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchClients() {
  const res = await fetch(`${API_BASE}/clients`);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function recordPromiseToPay(invoiceId, payload) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/promise-to-pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to record promise-to-pay: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchRiskProjection(invoiceId) {
  const res = await fetch(`${API_BASE}/invoices/${invoiceId}/risk-projection`);
  if (!res.ok) {
    throw new Error(`Failed to fetch risk projection: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchModelPerformance() {
  const res = await fetch(`${API_BASE}/model/performance`);
  if (!res.ok) {
    throw new Error(`Failed to fetch model performance: ${res.statusText}`);
  }
  return res.json();
}

export async function triggerModelRetrain() {
  const res = await fetch(`${API_BASE}/model/retrain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger retrain: ${res.statusText}`);
  }
  return res.json();
}


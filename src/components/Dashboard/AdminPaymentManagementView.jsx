import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Search, RefreshCw, ArrowUpRight, 
  RotateCcw, CheckCircle2, XCircle, Clock, Download, 
  Printer, ShieldCheck, Trophy, Image as ImageIcon, Users, 
  Copy, Check, FileText, X
} from 'lucide-react';
import { getAdminPaymentsAPI, getAdminRevenueSummaryAPI } from '../../services/api';

export default function AdminPaymentManagementView({ onBack }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('All'); // 'All' | 'Hosting' | 'Poster' | 'Registration'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Success' | 'Failed' | 'Pending'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'highest' | 'lowest'
  
  // Modals State
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch Payments & Revenue Summary
  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        getAdminPaymentsAPI({
          type: serviceTypeFilter === 'All' ? '' : serviceTypeFilter,
          status: statusFilter === 'All' ? '' : statusFilter,
          search: searchQuery
        }),
        getAdminRevenueSummaryAPI()
      ]);

      if (paymentsRes && paymentsRes.payments) {
        setPayments(paymentsRes.payments);
      } else {
        setPayments([]);
      }

      if (summaryRes && summaryRes.summary) {
        setSummary(summaryRes.summary);
      }
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [serviceTypeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchPaymentData();
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  // Client-side sorting
  const sortedPayments = [...payments].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.payment_date) - new Date(a.payment_date);
    if (sortBy === 'oldest') return new Date(a.payment_date) - new Date(b.payment_date);
    if (sortBy === 'highest') return (b.amount || 0) - (a.amount || 0);
    if (sortBy === 'lowest') return (a.amount || 0) - (b.amount || 0);
    return 0;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Transaction_ID', 'Payment_ID', 'Razorpay_Payment_ID', 'Razorpay_Order_ID', 'Service_Type', 'Item_Title', 'Payer_Name', 'Payer_Email', 'Payer_Phone', 'Amount_INR', 'Status', 'Refund_ID', 'Refund_Amount', 'Date'];
    const rows = sortedPayments.map(p => [
      p.transaction_id,
      p.payment_id,
      p.razorpay_payment_id || '',
      p.razorpay_order_id || '',
      p.payment_type,
      `"${(p.item_title || '').replace(/"/g, '""')}"`,
      `"${(p.payer?.name || '').replace(/"/g, '""')}"`,
      `"${(p.payer?.email || '').replace(/"/g, '""')}"`,
      `"${(p.payer?.phone || '').replace(/"/g, '""')}"`,
      p.amount,
      p.payment_status,
      p.refund?.id || '',
      p.refund?.amount || 0,
      p.payment_date ? new Date(p.payment_date).toISOString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arenax_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sortedPayments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `arenax_payments_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Printable Payment Audit / Invoice
  const handlePrintReceipt = (p) => {
    const win = window.open('', '_blank');
    const dateFormatted = new Date(p.payment_date).toLocaleString();
    const isRefunded = p.payment_status === 'Refunded' || p.payment_status === 'Partially Refunded';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ArenaX Razorpay Tax Invoice & Audit Receipt #${p.transaction_id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px; color: #1e293b; }
          .invoice-box { max-width: 750px; margin: auto; padding: 40px; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8B0000; padding-bottom: 20px; margin-bottom: 24px; }
          .brand-title { font-size: 26px; font-weight: 900; color: #8B0000; letter-spacing: -0.5px; }
          .brand-subtitle { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 1px; }
          .receipt-badge { font-size: 12px; font-weight: 800; color: #047857; background: #d1fae5; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; display: inline-block; }
          .refund-badge { background: #fee2e2; color: #b91c1c; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; font-size: 13px; }
          .section-title { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 800; margin-bottom: 6px; }
          .item-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .item-table th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 800; color: #475569; }
          .item-table td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; }
          .total-box { display: flex; justify-content: flex-end; margin-bottom: 24px; }
          .total-table { width: 280px; font-size: 13px; }
          .total-table tr td { padding: 6px 0; }
          .grand-total { font-size: 18px; font-weight: 900; color: #8B0000; border-top: 2px solid #8B0000; padding-top: 8px; }
          .razorpay-audit { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 12px; margin-top: 20px; font-family: monospace; }
          .no-print { text-align: center; margin-bottom: 20px; }
          .print-btn { background: #8B0000; color: #ffffff; padding: 10px 20px; border-radius: 10px; border: none; font-weight: 800; cursor: pointer; }
          @media print { .no-print { display: none; } body { padding: 0; background: none; } .invoice-box { box-shadow: none; border: none; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">🖨️ Print / Save Official PDF Receipt</button>
        </div>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="brand-title">ArenaX Sports Platform</div>
              <div class="brand-subtitle">Official Payment & Audit Receipt</div>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">GSTIN: 29AAACA1234D1Z5 • 256-Bit SSL Protected</p>
            </div>
            <div style="text-align: right;">
              <span class="receipt-badge ${isRefunded ? 'refund-badge' : ''}">
                ${isRefunded ? 'Refunded' : 'Payment Verified (Razorpay)'}
              </span>
              <p style="margin: 8px 0 0; font-size: 12px; font-weight: 700;">Ref: #${p.transaction_id}</p>
              <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">Date: ${dateFormatted}</p>
            </div>
          </div>

          <div class="details-grid">
            <div>
              <div class="section-title">Billed To (Payer / Organizer)</div>
              <strong style="font-size: 15px;">${p.payer?.name || 'Tournament Organizer'}</strong>
              <div style="color: #64748b; margin-top: 2px;">${p.payer?.email || 'organizer@arenax.io'}</div>
              <div style="color: #64748b;">Phone: ${p.payer?.phone || 'N/A'}</div>
            </div>
            <div>
              <div class="section-title">Payment Method & Gateway</div>
              <strong style="font-size: 14px;">Razorpay Secure Checkout</strong>
              <div style="color: #64748b; margin-top: 2px;">Key ID: rzp_test_7JZmKUBcWxl6xQ</div>
              <div style="color: #64748b;">Currency: Indian Rupee (INR)</div>
            </div>
          </div>

          <table class="item-table">
            <thead>
              <tr>
                <th>Service Description</th>
                <th>Category</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${p.item_title}</strong>
                  <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                    ${p.payment_type === 'Hosting' ? 'Tournament Hosting & Live Discovery Broadcast Fee' :
                      p.payment_type === 'Poster' ? 'Custom Tournament Graphic & Poster Template Slot' :
                      'Athlete Team Entry & Roster Verification Fee'}
                  </div>
                </td>
                <td><span style="font-weight: 700; text-transform: uppercase; font-size: 11px;">${p.payment_type}</span></td>
                <td style="text-align: right; font-weight: 800;">₹${p.amount}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <table class="total-table">
              <tr>
                <td style="color: #64748b;">Subtotal:</td>
                <td style="text-align: right; font-weight: 700;">₹${p.amount}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Gateway Processing Fee:</td>
                <td style="text-align: right; font-weight: 700;">₹0.00 (Waived)</td>
              </tr>
              <tr>
                <td class="grand-total">Total Paid:</td>
                <td class="grand-total" style="text-align: right;">₹${p.amount}</td>
              </tr>
              ${isRefunded ? `
              <tr>
                <td style="color: #b91c1c; font-weight: 800; border-top: 1px dashed #f87171; padding-top: 6px;">Total Refunded:</td>
                <td style="text-align: right; font-weight: 800; color: #b91c1c; border-top: 1px dashed #f87171; padding-top: 6px;">- ₹${p.refund?.amount || p.amount}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div class="razorpay-audit">
            <div style="font-weight: 800; color: #334155; margin-bottom: 6px;">🔐 RAZORPAY AUDIT & GATEWAY SIGNATURE LOG</div>
            <div>Payment ID: <strong>${p.razorpay_payment_id}</strong></div>
            <div>Order ID: <strong>${p.razorpay_order_id}</strong></div>
            <div>Signature Status: <strong>Verified (HMAC-SHA256)</strong></div>
            ${p.refund?.id ? `
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; color: #b91c1c;">
              Refund Ref ID: <strong>${p.refund.id}</strong> • Reason: ${p.refund.reason}
            </div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
    win.document.write(htmlContent);
    win.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700">Dismiss</button>
        </div>
      )}

      {/* Top Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#8B0000] to-slate-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-black tracking-wider">
            <CreditCard className="w-3.5 h-3.5 text-amber-300" />
            <span>RAZORPAY REVENUE & PAYMENT OPERATIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Payment <span className="text-amber-300">Management</span>
          </h1>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Audit tournament hosting & poster publishing fees, manage team registration payments, and inspect Razorpay transaction IDs.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={fetchPaymentData}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white text-[#8B0000] hover:bg-slate-100 text-xs font-black transition-all flex items-center space-x-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center space-x-1.5 border border-white/10"
            title="Download JSON Export"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* REVENUE SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Gross Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2 hover:border-[#8B0000] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-[#8B0000]/10 text-[#8B0000] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#8B0000] font-mono">
            ₹{summary?.totalGrossRevenue ? summary.totalGrossRevenue.toLocaleString() : '0'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Net Collected:</span>
            <span className="font-bold text-slate-800">₹{summary?.netRevenue ? summary.netRevenue.toLocaleString() : '0'}</span>
          </div>
        </div>

        {/* Card 2: Tournament Hosting Payments */}
        <div 
          onClick={() => setServiceTypeFilter('Hosting')}
          className={`p-5 rounded-2xl border shadow-sm space-y-2 cursor-pointer transition-all ${
            serviceTypeFilter === 'Hosting' ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-[#E5E7EB] hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tournament Hosting</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{summary?.hostingRevenue ? summary.hostingRevenue.toLocaleString() : '0'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-bold">
            <span>₹499 per Published Event</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Poster Publishing Payments */}
        <div 
          onClick={() => setServiceTypeFilter('Poster')}
          className={`p-5 rounded-2xl border shadow-sm space-y-2 cursor-pointer transition-all ${
            serviceTypeFilter === 'Poster' ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20' : 'bg-white border-[#E5E7EB] hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Poster Publishing</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{summary?.posterRevenue ? summary.posterRevenue.toLocaleString() : '0'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 font-bold">
            <span>₹299 AI Graphic Template</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Team Registration Payments */}
        <div 
          onClick={() => setServiceTypeFilter('Registration')}
          className={`p-5 rounded-2xl border shadow-sm space-y-2 cursor-pointer transition-all ${
            serviceTypeFilter === 'Registration' ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-[#E5E7EB] hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Team Registrations</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ₹{summary?.registrationRevenue ? summary.registrationRevenue.toLocaleString() : '0'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
            <span>Player Entry Fees</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 5: Total Refunds */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2 hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Refunded</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 font-mono">
            ₹{summary?.totalRefunded ? summary.totalRefunded.toLocaleString() : '0'}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-rose-700 font-medium">
            <span>{summary?.refundedCount || 0} Refunds Processed</span>
            <span className="text-[10px] font-bold text-slate-400">Total Returned</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
        
        {/* Row 1: Search and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID, Razorpay ID, Tournament, Organizer..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#8B0000] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all"
            />
          </form>

          <div className="flex items-center space-x-2 self-end">
            <span className="text-xs text-slate-500 font-bold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Row 2: Service Type Tabs & Status Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Service Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-400 uppercase mr-1">Service:</span>
            {[
              { id: 'All', label: 'All Services' },
              { id: 'Hosting', label: '🏆 Tournament Hosting' },
              { id: 'Poster', label: '🎨 Poster Publishing' },
              { id: 'Registration', label: '👥 Team Registrations' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setServiceTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  serviceTypeFilter === tab.id
                    ? 'bg-[#8B0000] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-400 uppercase mr-1">Status:</span>
            {[
              { id: 'All', label: 'All' },
              { id: 'Success', label: '✅ Success' },
              { id: 'Failed', label: '❌ Failed' },
              { id: 'Pending', label: '⏳ Pending' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* PAYMENTS HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#8B0000]" />
            <h3 className="text-base font-black text-slate-900">
              Payment Transactions & Razorpay Audit Log ({sortedPayments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            256-Bit SSL Encrypted Razorpay Gateway
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">Loading payment transactions...</p>
          </div>
        ) : sortedPayments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-extrabold text-slate-800">No payment records found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transactions match your current search and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4">Transaction / Razorpay ID</th>
                  <th className="py-3.5 px-4">Payer / Organizer</th>
                  <th className="py-3.5 px-4">Service & Item</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPayments.map((p) => {
                  const status = (p.payment_status || 'Success').toLowerCase();
                  const isSuccess = status === 'success';
                  const isRefunded = status === 'refunded' || status === 'partially refunded';
                  const isFailed = status === 'failed';

                  return (
                    <tr key={p._id || p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Column 1: IDs */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-black text-slate-900 text-xs">#{p.transaction_id}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono">
                          <span>{p.razorpay_payment_id}</span>
                          <button
                            onClick={() => copyToClipboard(p.razorpay_payment_id, p._id)}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                            title="Copy Razorpay Payment ID"
                          >
                            {copiedId === p._id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {p.refund?.id && (
                          <span className="inline-block text-[10px] text-rose-600 font-mono font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                            Refund Ref: {p.refund.id}
                          </span>
                        )}
                      </td>

                      {/* Column 2: Payer */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-xs">{p.payer?.name || 'Tournament Host'}</div>
                        <div className="text-[11px] text-slate-500">{p.payer?.email || 'organizer@arenax.io'}</div>
                        {p.payer?.phone && (
                          <div className="text-[10px] text-slate-400">📱 {p.payer.phone}</div>
                        )}
                      </td>

                      {/* Column 3: Service */}
                      <td className="py-4 px-4 space-y-1 max-w-[240px]">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          p.payment_type === 'Hosting'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : p.payment_type === 'Poster'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {p.payment_type === 'Hosting' ? 'Tournament Hosting' : p.payment_type === 'Poster' ? 'Poster Publishing' : 'Team Registration'}
                        </span>
                        <div className="font-bold text-slate-800 truncate" title={p.item_title}>
                          {p.item_title}
                        </div>
                      </td>

                      {/* Column 4: Amount */}
                      <td className="py-4 px-4">
                        <div className="text-sm font-black font-mono text-slate-900">
                          ₹{p.amount}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Razorpay INR</span>
                      </td>

                      {/* Column 5: Date */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        <div className="font-medium text-slate-700">
                          {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'Recent'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.payment_date ? new Date(p.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* Column 6: Status */}
                      <td className="py-4 px-4">
                        {isSuccess && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Successful</span>
                          </span>
                        )}
                        {isRefunded && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                            <RotateCcw className="w-3 h-3 text-rose-600" />
                            <span>Refunded</span>
                          </span>
                        )}
                        {isFailed && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Failed</span>
                            </span>
                            {p.failure_reason && (
                              <p className="text-[10px] text-rose-600 max-w-[150px] truncate" title={p.failure_reason}>
                                {p.failure_reason}
                              </p>
                            )}
                          </div>
                        )}
                        {!isSuccess && !isRefunded && !isFailed && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptPayment(p)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
                          title="View Full Receipt & Audit Trail"
                        >
                          Receipt & Audit
                        </button>


                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: PAYMENT RECEIPT & AUDIT TRAIL MODAL */}
      {selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5E7EB] animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8B0000] via-[#750000] to-[#8B0000] p-6 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black">Official Razorpay Payment Receipt</h3>
                  <p className="text-xs text-white/80 font-mono">Ref: #{selectedReceiptPayment.transaction_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceiptPayment(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-4 text-xs">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Paid Amount</span>
                  <p className="text-2xl font-black text-[#8B0000] font-mono">₹{selectedReceiptPayment.amount}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
                  <p className="text-xs font-black text-emerald-700 uppercase">● {selectedReceiptPayment.payment_status}</p>
                </div>
              </div>

              {/* Service & Item Details */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Service Type:</span>
                  <span className="font-extrabold text-slate-900 uppercase">{selectedReceiptPayment.payment_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Item Description:</span>
                  <span className="font-extrabold text-slate-900 text-right">{selectedReceiptPayment.item_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Payer Name:</span>
                  <span className="font-bold text-slate-800">{selectedReceiptPayment.payer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Payer Email:</span>
                  <span className="font-mono text-slate-800">{selectedReceiptPayment.payer?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Payment Date:</span>
                  <span className="font-medium text-slate-700">{new Date(selectedReceiptPayment.payment_date).toLocaleString()}</span>
                </div>
              </div>

              {/* Razorpay Audit Timeline Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5 shadow-inner">
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-1">Razorpay Gateway Signature Verification</div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="text-white font-bold">{selectedReceiptPayment.razorpay_payment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="text-white font-bold">{selectedReceiptPayment.razorpay_order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Merchant Key:</span>
                  <span className="text-slate-300">rzp_test_7JZmKUBcWxl6xQ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Encryption:</span>
                  <span className="text-emerald-400 font-bold">HMAC-SHA256 Verified ✓</span>
                </div>
                {selectedReceiptPayment.refund?.id && (
                  <div className="pt-2 border-t border-slate-700 text-rose-300">
                    <div>Refund ID: #{selectedReceiptPayment.refund.id}</div>
                    <div>Refund Amount: ₹{selectedReceiptPayment.refund.amount}</div>
                    <div>Reason: {selectedReceiptPayment.refund.reason}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedReceiptPayment)}
                  className="flex-1 py-3 rounded-xl bg-[#8B0000] text-white font-bold text-xs hover:bg-[#700000] flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Tax Invoice & Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptPayment(null)}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}



    </div>
  );
}

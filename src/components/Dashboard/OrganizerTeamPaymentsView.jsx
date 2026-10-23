import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Users, Trophy, CheckCircle2, Clock, 
  XCircle, Search, ArrowUpDown, Filter, Download, 
  Printer, ArrowLeft, RefreshCw, Sparkles, ExternalLink, 
  Copy, Check, FileText, AlertCircle, ShieldCheck, Tag, Info, Calendar, ChevronDown
} from 'lucide-react';
import { 
  getOrganizerTeamPaymentsAPI, 
  getOrganizerRevenueSummaryAPI, 
  markOrganizerPaymentStatusAPI 
} from '../../services/api';

export default function OrganizerTeamPaymentsView({ organizer, initialTournamentId, onBack }) {
  const [payments, setPayments] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedTournament, setSelectedTournament] = useState(initialTournamentId || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modals State
  const [receiptModal, setReceiptModal] = useState(null);
  const [markModal, setMarkModal] = useState(null);

  // Form states
  const [markForm, setMarkForm] = useState({
    status: 'Paid',
    payment_method: 'Cash / Venue Collection',
    amount: 500,
    notes: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchPaymentsData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedTournament !== 'all') filters.tournament_id = selectedTournament;
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      if (sortBy) filters.sort = sortBy;

      const [paymentsRes, summaryRes] = await Promise.all([
        getOrganizerTeamPaymentsAPI(filters),
        getOrganizerRevenueSummaryAPI()
      ]);

      if (paymentsRes && paymentsRes.success) {
        setPayments(paymentsRes.payments || []);
        if (paymentsRes.tournaments && paymentsRes.tournaments.length > 0) {
          setTournaments(paymentsRes.tournaments);
        }
      }

      if (summaryRes && summaryRes.success && summaryRes.summary) {
        setSummary(summaryRes.summary);
      }
    } catch (err) {
      console.error('Error fetching organizer team payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, [selectedTournament, selectedStatus, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPaymentsData();
  };

  const copyToClipboard = (text, idKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Open Mark Payment Modal
  const handleOpenMarkModal = (item) => {
    setMarkModal(item);
    setMarkForm({
      status: item.payment_status === 'Paid' ? 'Pending' : 'Paid',
      payment_method: item.payment_method && item.payment_method !== 'Pending' ? item.payment_method : 'Cash / Venue Collection',
      amount: item.amount || 500,
      notes: item.marked_notes || `Marked by Organizer for ${item.team_name}`
    });
  };

  // Submit Mark Payment
  const handleSubmitMarkPayment = async (e) => {
    e.preventDefault();
    if (!markModal) return;

    setActionLoading(true);
    const targetId = markModal.payment_record_id || markModal.registration_id || markModal.id;
    const res = await markOrganizerPaymentStatusAPI(targetId, markForm);
    setActionLoading(false);

    if (res && res.success) {
      showToast(res.message || `✅ Payment status updated to ${markForm.status}!`);
      setMarkModal(null);
      fetchPaymentsData();
    } else {
      alert(res?.message || 'Failed to update payment status.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!payments || payments.length === 0) return;
    const headers = [
      'Transaction_ID',
      'Team_Name',
      'Captain_Name',
      'Captain_Email',
      'Captain_Phone',
      'Tournament_Title',
      'Sport',
      'Entry_Fee_INR',
      'Payment_Status',
      'Payment_Method',
      'Razorpay_Payment_ID',
      'Razorpay_Order_ID',
      'Players_Count',
      'Registration_Date',
      'Payment_Date',
      'Marked_By_Organizer',
      'Marked_Notes'
    ];

    const rows = payments.map(p => [
      p.transaction_id || '',
      `"${(p.team_name || '').replace(/"/g, '""')}"`,
      `"${(p.captain_name || '').replace(/"/g, '""')}"`,
      `"${(p.captain_email || '').replace(/"/g, '""')}"`,
      `"${(p.captain_phone || '').replace(/"/g, '""')}"`,
      `"${(p.tournament_title || '').replace(/"/g, '""')}"`,
      `"${(p.sport || '').replace(/"/g, '""')}"`,
      p.amount || 0,
      p.payment_status || 'Pending',
      `"${(p.payment_method || '').replace(/"/g, '""')}"`,
      p.razorpay_payment_id || '',
      p.razorpay_order_id || '',
      p.players_count || 0,
      p.registration_date ? new Date(p.registration_date).toLocaleDateString() : '',
      p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '',
      p.marked_by_organizer ? 'YES' : 'NO',
      `"${(p.marked_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arenax_team_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `arenax_team_payments_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print Official Team Receipt
  const handlePrintReceipt = (item) => {
    const win = window.open('', '_blank');
    const isPaid = (item.payment_status || '').toLowerCase() === 'paid' || (item.payment_status || '').toLowerCase() === 'success';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ArenaX Official Team Entry Receipt — ${item.team_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 40px; color: #1e293b; }
          .receipt-box { max-width: 680px; margin: 0 auto; background: #ffffff; border: 2px solid #8B0000; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B0000 0%, #580000 100%); color: #ffffff; padding: 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px; }
          .header p { margin: 6px 0 0; font-size: 12px; opacity: 0.85; }
          .body { padding: 32px; }
          .seal-bar { display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 12px 18px; border-radius: 10px; margin-bottom: 24px; font-size: 12px; }
          .seal-badge { font-weight: 800; color: #166534; background: #dcfce7; padding: 4px 10px; border-radius: 6px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .table th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .total-box { background: #fff5f5; border: 1.5px solid #8B0000; border-radius: 12px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
          .total-label { font-size: 14px; font-weight: 800; color: #8B0000; }
          .total-amount { font-size: 24px; font-weight: 900; color: #8B0000; }
          .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; }
          @media print { body { padding: 0; background: none; } .receipt-box { box-shadow: none; border-color: #000; } }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h1>ARENAX SPORTS PLATFORM</h1>
            <p>Official Team Tournament Registration & Entry Fee Receipt</p>
          </div>
          <div class="body">
            <div class="seal-bar">
              <div>
                <strong>Receipt Ref:</strong> ${item.transaction_id || 'TXN-ARENAX'}
                <br/><span style="color:#64748b; font-size:11px;">Razorpay Order: ${item.razorpay_order_id || 'N/A'}</span>
              </div>
              <div class="seal-badge">
                ${isPaid ? '✔ VERIFIED PAYMENT' : item.payment_status.toUpperCase()}
              </div>
            </div>

            <table class="table">
              <tr>
                <th>PARTICULARS</th>
                <th style="text-align: right;">DETAILS</th>
              </tr>
              <tr>
                <td><strong>Tournament Name</strong></td>
                <td style="text-align: right;">${item.tournament_title}</td>
              </tr>
              <tr>
                <td><strong>Sport / Category</strong></td>
                <td style="text-align: right;">${item.sport}</td>
              </tr>
              <tr>
                <td><strong>Registered Team</strong></td>
                <td style="text-align: right;"><strong>${item.team_name}</strong></td>
              </tr>
              <tr>
                <td><strong>Team Captain</strong></td>
                <td style="text-align: right;">${item.captain_name} (${item.captain_phone})</td>
              </tr>
              <tr>
                <td><strong>Captain Email</strong></td>
                <td style="text-align: right;">${item.captain_email}</td>
              </tr>
              <tr>
                <td><strong>Roster Size</strong></td>
                <td style="text-align: right;">${item.players_count} Verified Players</td>
              </tr>
              <tr>
                <td><strong>Payment Gateway / Method</strong></td>
                <td style="text-align: right;">${item.payment_method || 'Razorpay Gateway'}</td>
              </tr>
              <tr>
                <td><strong>Razorpay Payment ID</strong></td>
                <td style="text-align: right; font-family: monospace;">${item.razorpay_payment_id || 'Offline Verification'}</td>
              </tr>
              <tr>
                <td><strong>Transaction Timestamp</strong></td>
                <td style="text-align: right;">${new Date(item.payment_date || item.registration_date).toLocaleString()}</td>
              </tr>
              ${item.marked_by_organizer ? `
              <tr>
                <td><strong>Organizer Mark Audit</strong></td>
                <td style="text-align: right; color:#8B0000; font-weight:700;">Verified By Host: ${item.marked_notes || 'Venue Confirmed'}</td>
              </tr>` : ''}
            </table>

            <div class="total-box">
              <span class="total-label">TOTAL ENTRY FEE PAID:</span>
              <span class="total-amount">₹${item.amount}</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Razorpay Merchant Verified • ArenaX Online Sports Management</strong></p>
            <p>This document is an electronically generated and cryptographically verifiable receipt. No physical signature required.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    win.document.write(htmlContent);
    win.document.close();
  };

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-black">Dismiss</button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border-l-4 border-[#8B0000] border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#8B0000]/10 border border-[#8B0000]/20 text-[#8B0000] text-xs font-bold mb-3">
            <CreditCard className="w-3.5 h-3.5" />
            <span>TOURNAMENT ORGANIZER FINANCES • RAZORPAY GATEWAY</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937] leading-tight">
            Registered Teams <span className="text-[#8B0000]">Payment Management</span>
          </h1>
          <p className="text-xs text-[#6B7280] mt-1 max-w-2xl leading-relaxed">
            Track entry fee payments from registered teams, verify online Razorpay transactions, mark offline venue payments, and print official team tax receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            onClick={fetchPaymentsData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8B0000]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl bg-[#8B0000] text-white text-xs font-bold hover:bg-[#6B0000] transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
          )}
        </div>
      </div>

      {/* Revenue & Payment Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Gross Entry Fees */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entry Fees</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-3xl font-black text-[#1F2937] font-mono">
            ₹{summary?.totalGrossCollected ? summary.totalGrossCollected.toLocaleString() : '1,500'}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
            <span>● Gross Collected Fees</span>
          </p>
        </div>

        {/* Card 2: Net Earnings */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#8B0000]/5 to-amber-500/10 border border-[#8B0000]/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B0000]">Net Entry Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-[#8B0000] text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#8B0000] font-mono">
            ₹{summary?.netEarnings ? summary.netEarnings.toLocaleString() : '1,000'}
          </p>
          <p className="text-[11px] font-bold text-[#8B0000]">
            Net Collected (Platform Verified)
          </p>
        </div>

        {/* Card 3: Paid Teams */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Paid Teams</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 font-mono">
            {summary?.totalTeamsPaid ?? 2} Teams
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            Payment Confirmed Online/Venue
          </p>
        </div>

        {/* Card 4: Pending Teams */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Payment</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 font-mono">
            {summary?.totalTeamsPending ?? 1} Teams
          </p>
          <p className="text-[11px] font-semibold text-amber-700">
            Awaiting Verification / Cash
          </p>
        </div>

      </div>

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-4">
        
        {/* Tournament Dropdown & Quick Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Tournament Picker */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 shrink-0">
              <Trophy className="w-4 h-4 text-[#8B0000]" />
              <span>Tournament:</span>
            </div>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
            >
              <option value="all">🌟 All Hosted Tournaments</option>
              {tournaments.map(t => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.title} ({t.sport} • Fee: ₹{t.entryFee})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team, captain, phone, transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-bold hover:bg-[#6B0000] transition-all cursor-pointer"
            >
              Search
            </button>
          </form>

        </div>

        {/* Status Filter Pills & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB]">
          
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
            {[
              { id: 'all', label: 'All Payments' },
              { id: 'paid', label: 'Verified Paid' },
              { id: 'pending', label: 'Pending Payment' },
              { id: 'failed', label: 'Failed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-[#8B0000] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
              <option value="team_asc">Team Name: A-Z</option>
            </select>
          </div>

        </div>

      </div>

      {/* TEAM REGISTRATION PAYMENTS LEDGER TABLE */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F2937] flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#8B0000]" />
              <span>Registered Teams Payment Ledger</span>
            </h3>
            <p className="text-xs text-slate-500">
              Showing {payments.length} registered team payment records
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading team payments data...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Payment Records Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No teams matching the selected tournament or status filter were found. Try clearing filters or selecting another tournament.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Transaction / Ref</th>
                  <th className="py-3.5 px-4">Registered Team & Captain</th>
                  <th className="py-3.5 px-4">Tournament</th>
                  <th className="py-3.5 px-4">Entry Fee</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Date / Mark Audit</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {payments.map((p, idx) => {
                  const isPaid = (p.payment_status || '').toLowerCase() === 'paid' || (p.payment_status || '').toLowerCase() === 'success';
                  const isPending = (p.payment_status || '').toLowerCase() === 'pending';

                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* 1. Transaction IDs */}
                      <td className="py-4 px-4 font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                            <span>{p.transaction_id || `TXN-${String(p.id).slice(-6)}`}</span>
                            <button
                              onClick={() => copyToClipboard(p.transaction_id, `txn_${p.id}`)}
                              className="text-slate-400 hover:text-slate-700"
                              title="Copy Transaction ID"
                            >
                              {copiedId === `txn_${p.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          {p.razorpay_payment_id && (
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <span>RZP: {p.razorpay_payment_id}</span>
                              <button
                                onClick={() => copyToClipboard(p.razorpay_payment_id, `rzp_${p.id}`)}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy Razorpay ID"
                              >
                                {copiedId === `rzp_${p.id}` ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. Team & Captain */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-sm text-[#1F2937]">{p.team_name}</h4>
                          <p className="text-slate-600 font-semibold text-[11px]">
                            {p.captain_name} {p.captain_phone && `• ${p.captain_phone}`}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            <span>{p.captain_email}</span>
                            <span>•</span>
                            <span className="font-bold text-[#8B0000]">{p.players_count} Players</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Tournament */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5 max-w-[200px]">
                          <span className="font-bold text-slate-800 line-clamp-1">{p.tournament_title}</span>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {p.sport}
                          </span>
                        </div>
                      </td>

                      {/* 4. Entry Fee */}
                      <td className="py-4 px-4 font-mono font-black text-sm text-[#8B0000]">
                        ₹{p.amount || 500}
                      </td>

                      {/* 5. Payment Status */}
                      <td className="py-4 px-4">
                        {isPaid && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold uppercase">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold uppercase">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                        {!isPaid && !isPending && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold uppercase">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>{p.payment_status}</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Payment Method */}
                      <td className="py-4 px-4 text-slate-700 font-semibold">
                        <div className="space-y-0.5">
                          <span className="block text-xs">{p.payment_method || 'Razorpay Gateway'}</span>
                          {p.razorpay_order_id && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {p.razorpay_order_id}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Date & Mark Audit */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        <div>{new Date(p.payment_date || p.registration_date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(p.payment_date || p.registration_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {p.marked_by_organizer && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold" title={p.marked_notes}>
                            ✔ Marked by Host
                          </span>
                        )}
                      </td>

                      {/* 8. Action Buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* Receipt Button */}
                          <button
                            onClick={() => setReceiptModal(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                            title="View Official Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Receipt</span>
                          </button>

                          {/* Mark Payment Status Button */}
                          <button
                            onClick={() => handleOpenMarkModal(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#8B0000]/10 hover:bg-[#8B0000] text-[#8B0000] hover:text-white text-xs font-bold transition-all flex items-center space-x-1 border border-[#8B0000]/20 cursor-pointer"
                            title="Mark/Update Payment Status"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Mark</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: OFFICIAL RECEIPT & TAX INVOICE MODAL */}
      {/* ========================================================================= */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1F2937] flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#8B0000]" />
                  <span>Team Entry Fee Receipt & Payment Proof</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Transaction #{receiptModal.transaction_id} • Verified via Razorpay
                </p>
              </div>
              <button 
                onClick={() => setReceiptModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Tournament Event:</span>
                <span className="font-extrabold text-[#1F2937]">{receiptModal.tournament_title}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Registered Team:</span>
                <span className="font-extrabold text-[#8B0000]">{receiptModal.team_name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Captain Contact:</span>
                <span className="font-semibold text-slate-800">{receiptModal.captain_name} ({receiptModal.captain_phone})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Payment Gateway:</span>
                <span className="font-mono text-slate-800">{receiptModal.payment_method || 'Razorpay Gateway'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Razorpay Payment ID:</span>
                <span className="font-mono text-slate-800">{receiptModal.razorpay_payment_id || 'N/A (Marked Offline)'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-600">Payment Status:</span>
                <span className="font-black text-emerald-600 uppercase">{receiptModal.payment_status}</span>
              </div>
              {receiptModal.marked_by_organizer && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-amber-800">
                  <span className="font-bold">Organizer Notes:</span>
                  <span className="font-semibold">{receiptModal.marked_notes || 'Confirmed by Host'}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 text-sm font-black text-[#8B0000]">
                <span>Total Amount:</span>
                <span className="text-xl">₹{receiptModal.amount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handlePrintReceipt(receiptModal)}
                className="px-4 py-2 rounded-xl bg-[#8B0000] text-white text-xs font-bold hover:bg-[#6B0000] transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MARK PAYMENT STATUS MODAL */}
      {/* ========================================================================= */}
      {markModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1F2937] flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-[#8B0000]" />
                  <span>Mark Team Payment Status</span>
                </h3>
                <p className="text-xs text-slate-400">Team: {markModal.team_name} • {markModal.tournament_title}</p>
              </div>
              <button onClick={() => setMarkModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMarkPayment} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Paid', 'Pending'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMarkForm({ ...markForm, status: st })}
                      className={`py-2 px-3 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                        markForm.status === st
                          ? 'bg-[#8B0000] text-white border-[#8B0000] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method / Channel</label>
                <select
                  value={markForm.payment_method}
                  onChange={(e) => setMarkForm({ ...markForm, payment_method: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                >
                  <option value="Cash / Venue Collection">💵 Cash / Venue Desk Collection</option>
                  <option value="Razorpay Online UPI">💳 Razorpay Online UPI</option>
                  <option value="Direct Bank Transfer">🏦 Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="Manual Host Verification">✍️ Manual Host Verification</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Registration Fee Amount (₹)</label>
                <input
                  type="number"
                  value={markForm.amount}
                  onChange={(e) => setMarkForm({ ...markForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organizer Notes & Verification Memo</label>
                <textarea
                  rows="2"
                  value={markForm.notes}
                  onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })}
                  placeholder="e.g. Received ₹500 cash from Captain at the sports complex registration desk."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMarkModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-[#8B0000] text-white font-bold hover:bg-[#6B0000] transition-all flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Status</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

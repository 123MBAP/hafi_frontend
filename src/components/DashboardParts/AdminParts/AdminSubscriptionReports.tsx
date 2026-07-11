import React, { useEffect, useState } from "react";
import { 
  BarChart3, 
  Download, 
  Search, 
  Calendar, 
  Users, 
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface SubscriptionReport {
  subscription_id: number | null;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_name: string;
  amount: string | number;
  status: string;
  subscription_date: string;
  ends_at: string | null;
  user_created_at: string;
}

interface AdminSubscriptionReportsProps {
  token: string | null;
  darkMode: boolean;
  apiBaseUrl?: string;
}

export default function AdminSubscriptionReports({ 
  token, 
  darkMode, 
  apiBaseUrl 
}: AdminSubscriptionReportsProps) {
  const [reports, setReports] = useState<SubscriptionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'expired', 'inactive'
  const [monthFilter, setMonthFilter] = useState("all"); // 'all', '0' (Jan) - '11' (Dec)
  const [yearFilter, setYearFilter] = useState("all"); // 'all', '2026', '2027', ...

  const API_BASE = apiBaseUrl || (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

  // Months listing
  const months = [
    { label: "January", value: "0" },
    { label: "February", value: "1" },
    { label: "March", value: "2" },
    { label: "April", value: "3" },
    { label: "May", value: "4" },
    { label: "June", value: "5" },
    { label: "July", value: "6" },
    { label: "August", value: "7" },
    { label: "September", value: "8" },
    { label: "October", value: "9" },
    { label: "November", value: "10" },
    { label: "December", value: "11" }
  ];

  // Dynamic years list starting from 2026
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = 2026; y <= Math.max(currentYear, 2026) + 2; y++) {
    years.push(String(y));
  }

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscription-reports`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Error fetching subscription reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  // Apply filters
  const filteredReports = reports.filter((item) => {
    // 1. Search Query filter (Username, Email)
    const matchesSearch = 
      String(item.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.user_email || "").toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = item.status === "active";
    } else if (statusFilter === "expired") {
      matchesStatus = item.status === "expired";
    } else if (statusFilter === "inactive") {
      matchesStatus = !item.status || item.status === "inactive" || item.status === "none";
    }

    // 3. Month & Year filter
    let matchesMonth = true;
    let matchesYear = true;

    if (item.subscription_date) {
      const date = new Date(item.subscription_date);
      if (monthFilter !== "all") {
        matchesMonth = String(date.getMonth()) === monthFilter;
      }
      if (yearFilter !== "all") {
        matchesYear = String(date.getFullYear()) === yearFilter;
      }
    } else {
      if (monthFilter !== "all" || yearFilter !== "all") {
        matchesMonth = false;
        matchesYear = false;
      }
    }

    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  // Calculate metrics based on FILTERED results
  const totalSubscribed = filteredReports.filter(r => r.status === 'active').length;
  const totalExpired = filteredReports.filter(r => r.status === 'expired').length;
  const totalRevenue = filteredReports
    .filter(r => r.status === 'active' || r.status === 'expired')
    .reduce((sum, r) => sum + parseFloat(String(r.amount || 0)), 0);

  // Generate monthly breakdown from the same filtered dataset used by the table and metrics
  const chartLabel = yearFilter === "all" ? "Filtered" : `Year ${yearFilter}`;
  const chartFileTag = yearFilter === "all" ? "filtered" : yearFilter;
  const monthlyRevenueData = Array(12).fill(0);
  
  filteredReports.forEach(r => {
    if ((r.status === 'active' || r.status === 'expired') && r.subscription_date) {
      const d = new Date(r.subscription_date);
      monthlyRevenueData[d.getMonth()] += parseFloat(String(r.amount || 0));
    }
  });

  const maxChartVal = Math.max(...monthlyRevenueData, 1000);

  // Export to CSV Functionality
  const exportToCSV = () => {
    if (filteredReports.length === 0) return;
    
    const headers = ["Subscription ID", "User Name", "Email", "Plan", "Status", "Amount (RWF)", "Date", "Expires At"];
    const rows = filteredReports.map(r => [
      r.subscription_id || "N/A",
      r.user_name || "Anonymous",
      r.user_email,
      r.plan_name,
      r.status,
      r.amount || 0,
      r.subscription_date ? new Date(r.subscription_date).toLocaleDateString() : "N/A",
      r.ends_at ? new Date(r.ends_at).toLocaleDateString() : "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Subscription_Report_${chartFileTag}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Subscribed Accounts</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-500">{totalSubscribed}</h3>
            </div>
            <div className={`p-3 border ${darkMode ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-450' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`} style={{ borderRadius: '2px' }}>
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className={`p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expired Accounts</p>
              <h3 className="text-2xl font-black mt-1 text-red-500">{totalExpired}</h3>
            </div>
            <div className={`p-3 border ${darkMode ? 'bg-red-950/20 border-red-800/30 text-red-450' : 'bg-red-50 border-red-100 text-red-650'}`} style={{ borderRadius: '2px' }}>
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className={`p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Revenue (Filtered)</p>
              <h3 className="text-2xl font-black mt-1 text-blue-500">RWF {totalRevenue.toLocaleString()}</h3>
            </div>
            <div className={`p-3 border ${darkMode ? 'bg-blue-950/20 border-blue-800/30 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`} style={{ borderRadius: '2px' }}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart - Monthly Trend */}
      <div className={`border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Monthly Revenue Trend ({chartLabel})</span>
        </h3>

        <div className="flex items-end justify-between h-48 pt-4 gap-2 overflow-x-auto min-w-[300px]">
          {monthlyRevenueData.map((val, idx) => {
            const pct = (val / maxChartVal) * 100;
            const monthLabel = months[idx].label.slice(0, 3);
            return (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                {/* Tooltip on hover */}
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -translate-y-12 px-2.5 py-1 text-[10px] font-bold uppercase border shadow-sm shrink-0 whitespace-nowrap z-10
                  ${darkMode ? 'bg-gray-900 border-gray-700 text-emerald-400' : 'bg-white border-gray-250 text-emerald-600'}`}
                  style={{ borderRadius: '2px' }}
                >
                  RWF {val.toLocaleString()}
                </div>
                {/* Bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-32 flex items-end" style={{ borderRadius: '1px' }}>
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:opacity-90 transition-all duration-300"
                    style={{ height: `${Math.max(pct, 2)}%`, borderRadius: '1px' }}
                  />
                </div>
                {/* Label */}
                <span className="text-[10px] font-bold text-gray-400 mt-2">{monthLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control filters bar */}
      <div className={`border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search bar */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
              Search User
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or email..."
                className={`w-full pl-9 pr-3 py-2 border outline-none text-sm transition-colors
                  ${darkMode 
                    ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500 placeholder-gray-600' 
                    : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600 placeholder-gray-400'}`}
                style={{ borderRadius: '2px' }}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
              Subscription Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                ${darkMode 
                  ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                  : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
              style={{ borderRadius: '2px' }}
            >
              <option value="all">All statuses</option>
              <option value="active">Subscribed</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive / Free</option>
            </select>
          </div>

          {/* Month filter */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
              Subscription Month
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                ${darkMode 
                  ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                  : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
              style={{ borderRadius: '2px' }}
            >
              <option value="all">All months</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Year filter */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>
              Subscription Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className={`w-full px-3 py-2 border outline-none text-sm transition-colors
                ${darkMode 
                  ? 'bg-gray-900 border-gray-750 text-white focus:border-emerald-500' 
                  : 'bg-white border-gray-300 text-gray-855 focus:border-emerald-600'}`}
              style={{ borderRadius: '2px' }}
            >
              <option value="all">All years (From 2026)</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className={`border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`} style={{ borderRadius: '2px' }}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <h3 className={`text-base font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Subscription Records List
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={filteredReports.length === 0}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 border text-xs font-bold uppercase tracking-wider transition-colors
                ${filteredReports.length === 0
                  ? 'bg-gray-250 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800/40 dark:border-gray-750'
                  : 'bg-emerald-500 border-emerald-500 hover:bg-emerald-600 text-white shadow-sm'}`}
              style={{ borderRadius: '2px' }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchReports}
              className={`flex items-center justify-center p-2 border transition-colors
                ${darkMode 
                  ? 'bg-gray-900 border-gray-750 text-white hover:bg-gray-850' 
                  : 'bg-white border-gray-300 text-gray-855 hover:bg-gray-50'}`}
              style={{ borderRadius: '2px' }}
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No records match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 font-bold uppercase tracking-wider text-gray-400">
                  <th className="pb-3 pr-2">User details</th>
                  <th className="pb-3 pr-2">Plan name</th>
                  <th className="pb-3 text-center pr-2">Status</th>
                  <th className="pb-3 text-right pr-2">Amount Paid</th>
                  <th className="pb-3 text-right pr-2">Active Date</th>
                  <th className="pb-3 text-right">Expires At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-755 text-gray-700 dark:text-gray-300">
                {filteredReports.map((r, idx) => (
                  <tr key={`${r.user_id}-${r.subscription_id || idx}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 pr-2">
                      <span className="font-bold block text-sm">{r.user_name || 'Anonymous User'}</span>
                      <span className="text-[10px] text-gray-500 block font-mono">{r.user_email}</span>
                    </td>
                    <td className="py-3.5 pr-2 font-bold uppercase text-emerald-500">
                      {r.plan_name}
                    </td>
                    <td className="py-3.5 text-center pr-2">
                      <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase
                        ${r.status === 'active' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                          : r.status === 'expired' 
                          ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                          : 'bg-gray-500/10 border-gray-500/20 text-gray-500'}`}
                        style={{ borderRadius: '2px' }}
                      >
                        {r.status === 'active' ? 'Subscribed' : r.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-gray-800 dark:text-white pr-2">
                      {parseFloat(String(r.amount)) > 0 
                        ? `RWF ${parseFloat(String(r.amount)).toLocaleString()}` 
                        : 'Free'}
                    </td>
                    <td className="py-3.5 text-right text-gray-500 pr-2">
                      {r.subscription_date 
                        ? new Date(r.subscription_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) 
                        : 'N/A'}
                    </td>
                    <td className="py-3.5 text-right text-gray-550">
                      {r.ends_at 
                        ? new Date(r.ends_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) 
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  FileText,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const API_URL = 'http://localhost:8000';

const Reports = () => {
  const [reportData, setReportData] = useState({
    total_sales: 0,
    num_orders: 0,
    orders: []
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(`${API_URL}/reports/daily`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });
      setReportData(response.data);
    } catch (err) {
      setError('Failed to fetch report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData.orders || reportData.orders.length === 0) return;

    const headers = ["Invoice", "Date", "Time", "Total (LKR)"];
    const csvContent = [
      headers.join(","),
      ...reportData.orders.map(o => [
        `"${o.invoice_number}"`,
        `"${new Date(o.timestamp).toLocaleDateString()}"`,
        `"${new Date(o.timestamp).toLocaleTimeString()}"`,
        o.total
      ].join(","))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_${startDate || 'Record'}_to_${endDate || 'Current'}.csv`.replace(/\s+/g, '_'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:bg-white/5 transition-all cursor-pointer h-full">
      <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}></div>
      <div className="flex items-center justify-between relative z-10 gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2 truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-emerald-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-tighter">
              <TrendingUp size={12} />
              <span className="truncate">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 sm:p-4 rounded-2xl bg-white/5 shadow-xl border border-white/10 group-hover:scale-110 transition-transform duration-300 shrink-0`}>
          <Icon size={20} className={`${colorClass.replace('bg-', 'text-')} sm:w-[24px] sm:h-[24px]`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-3xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[2rem] flex items-center justify-center text-slate-900 shadow-xl shadow-emerald-500/20 rotate-3">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
              Sales Intel
            </h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-2">Real-time performance metrics for today.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#282828] border border-white/5 rounded-2xl px-4 py-2 h-12">
            <Calendar size={16} className="text-slate-500" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 p-0 outline-none"
              placeholder="Start Date"
            />
            <span className="text-slate-500">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 p-0 outline-none"
              placeholder="End Date"
            />
          </div>

          <button 
            onClick={() => {setStartDate(''); setEndDate('');}}
            className="h-12 px-6 bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center rounded-2xl transition-all text-xs font-bold"
            title="Reset Filters"
          >
            Reset
          </button>

          <button 
            onClick={() => window.print()}
            className="h-12 bg-white/10 text-white hover:bg-white/20 border border-white/10 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
          >
            <FileText size={16} />
            Print Report
          </button>

          <button 
            onClick={handleExport}
            disabled={reportData.orders.length === 0}
            className="h-12 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-300 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 size={48} className="text-emerald-500 animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Processing Transactional Data...</p>
        </div>
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <StatCard 
              title="Today's Revenue" 
              value={`Rs. ${reportData.total_sales.toFixed(2)}`} 
              icon={DollarSign} 
              trend="+0% vs Yesterday"
              colorClass="bg-emerald-500"
            />
            <StatCard 
              title="Daily Transaction Count" 
              value={reportData.num_orders.toString()} 
              icon={ShoppingBag} 
              trend="Live Update"
              colorClass="bg-teal-500"
            />
            <StatCard 
              title="Average Ticket" 
              value={`Rs. ${reportData.num_orders > 0 ? (reportData.total_sales / reportData.num_orders).toFixed(2) : '0.00'}`} 
              icon={TrendingUp} 
              colorClass="bg-sky-500"
            />
          </div>

          {/* Today's Transactions Table */}
          <div className="glass-panel rounded-[2.5rem] overflow-hidden mb-8 border border-white/5 shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400">
                  <FileText size={24} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">Recent Sales Activity</h2>
              </div>
              <button className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:underline">View All Records</button>
            </div>
            
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/2 border-b border-white/5">
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Hash</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-10">Time</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-12">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportData.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                    <td className="p-6">
                      <div className="flex items-center gap-3 font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {order.invoice_number}
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                      </div>
                    </td>
                    <td className="p-6 text-center px-10">
                      <span className="text-sm font-bold text-slate-500">
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase text-white tracking-widest border border-white/5">
                        CASH
                      </span>
                    </td>
                    <td className="p-6 text-right px-12">
                      <span className="text-sm font-black text-white">
                        {order.total.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(reportData.orders.length === 0 || !reportData.orders) && !loading && (
              <div className="p-24 text-center">
                <p className="text-sm font-bold text-slate-500 italic">No transactions recorded yet for today.</p>
              </div>
            )}
          </div>
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print, button, .flex-wrap, header { display: none !important; }
          .glass-panel { border: none !important; background: transparent !important; box-shadow: none !important; }
          .grid { display: block !important; }
          .StatCard { border: 1px solid #eee !important; margin-bottom: 10px !important; }
          table { border-collapse: collapse !important; width: 100% !important; margin-top: 20px !important; }
          th, td { border: 1px solid #ddd !important; color: black !important; padding: 12px !important; }
          tr { page-break-inside: avoid !important; }
          h1, h2 { color: black !important; }
        }
      `}} />
    </div>
  );
};

export default Reports;

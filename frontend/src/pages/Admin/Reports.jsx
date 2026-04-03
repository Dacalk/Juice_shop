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
        o.invoice_number,
        new Date(o.timestamp).toLocaleDateString(),
        new Date(o.timestamp).toLocaleTimeString(),
        o.total
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${startDate || 'today'}_to_${endDate || 'today'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-emerald-500 font-bold text-[10px] uppercase tracking-tighter">
              <TrendingUp size={12} />
              {trend}
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-white shadow-lg border border-slate-50 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 rotate-3">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              Sales Intel
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Real-time performance metrics for today.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
            <Calendar size={16} className="text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 p-0"
              placeholder="Start Date"
            />
            <span className="text-slate-300">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 p-0"
              placeholder="End Date"
            />
          </div>

          <button 
            onClick={() => {setStartDate(''); setEndDate('');}}
            className="h-12 px-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center rounded-2xl transition-all text-xs font-bold"
            title="Reset Filters"
          >
            Reset
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Today's Revenue" 
              value={`LKR ${reportData.total_sales.toFixed(2)}`} 
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
              value={`LKR ${reportData.num_orders > 0 ? (reportData.total_sales / reportData.num_orders).toFixed(2) : '0.00'}`} 
              icon={TrendingUp} 
              colorClass="bg-sky-500"
            />
            <StatCard 
              title="Inventory Status" 
              value="Optimal" 
              icon={FileText} 
              colorClass="bg-indigo-500"
            />
          </div>

          {/* Today's Transactions Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-slate-400" />
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Recent Sales Activity</h2>
              </div>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All Records</button>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100/50">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Hash</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-10">Time</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right px-12">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reportData.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="p-6">
                      <div className="flex items-center gap-3 font-bold text-slate-800">
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
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest border border-slate-200">
                        CASH
                      </span>
                    </td>
                    <td className="p-6 text-right px-12">
                      <span className="text-sm font-black text-slate-800">
                        {order.total.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(reportData.orders.length === 0 || !reportData.orders) && !loading && (
              <div className="p-24 text-center bg-slate-50/20">
                <p className="text-sm font-bold text-slate-400 italic">No transactions recorded yet for today.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;

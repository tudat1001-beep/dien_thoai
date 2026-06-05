import React, { useState, useMemo } from 'react';
import { KhachHang, SanPham, HoaDon, ChiTietHoaDon, CongNo, TraHang } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  User, 
  Calendar, 
  Smartphone, 
  Database,
  Undo2,
  Lock,
  ChevronRight,
  Info,
  Eye,
  Pencil
} from 'lucide-react';
import InvoiceDetailModal from './InvoiceDetailModal';
import InvoiceEditModal from './InvoiceEditModal';

interface DashboardViewProps {
  khachHang: KhachHang[];
  sanPham: SanPham[];
  hoaDon: HoaDon[];
  chiTietHoaDon: ChiTietHoaDon[];
  congNo: CongNo[];
  traHang: TraHang[];
  storeInfo: {
    tenCuaHang: string;
    slogan: string;
    diaChi: string;
    hotline: string;
  };
  onEditHoaDon: (
    editedInvoice: HoaDon, 
    editedDetails: ChiTietHoaDon[], 
    originalInvoice: HoaDon, 
    originalDetails: ChiTietHoaDon[]
  ) => void;
}

type PeriodType = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'all' | 'custom';

export default function DashboardView({
  khachHang,
  sanPham,
  hoaDon,
  chiTietHoaDon,
  congNo,
  traHang,
  storeInfo,
  onEditHoaDon
}: DashboardViewProps) {
  const [period, setPeriod] = useState<PeriodType>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ date: string; value: number; count: number } | null>(null);

  // States for viewing and editing invoices
  const [viewingInvoice, setViewingInvoice] = useState<HoaDon | null>(null);
  const viewingDetails = useMemo(() => {
    if (!viewingInvoice) return [];
    return chiTietHoaDon.filter(d => d.hoaDonId === viewingInvoice.id);
  }, [viewingInvoice, chiTietHoaDon]);
  const viewingCustomer = useMemo(() => {
    if (!viewingInvoice) return null;
    return khachHang.find(k => k.id === viewingInvoice.khachHangId) || null;
  }, [viewingInvoice, khachHang]);

  const [editingInvoice, setEditingInvoice] = useState<HoaDon | null>(null);
  const editingDetails = useMemo(() => {
    if (!editingInvoice) return [];
    return chiTietHoaDon.filter(d => d.hoaDonId === editingInvoice.id);
  }, [editingInvoice, chiTietHoaDon]);

  // States for search and status filters on invoices
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceDebtStatus, setInvoiceDebtStatus] = useState<'all' | 'has_debt' | 'paid_all'>('all');

  // Helper date conversions
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };
  const getDaysAgoStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Check matching dates based on preset
  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const target = dateStr.split('T')[0]; // Safe parse
    const today = getTodayStr();

    switch (period) {
      case 'today':
        return target === today;
      case 'yesterday':
        return target === getYesterdayStr();
      case 'last7':
        return target >= getDaysAgoStr(7) && target <= today;
      case 'thisMonth': {
        const firstDayStr = `${today.substring(0, 8)}01`;
        return target >= firstDayStr && target <= today;
      }
      case 'lastMonth': {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const firstDayOfLastMonth = `${y}-${m}-01`;
        // Last day of last month
        const lastDayOfLastMonth = new Date(y, d.getMonth() + 1, 0).toISOString().split('T')[0];
        return target >= firstDayOfLastMonth && target <= lastDayOfLastMonth;
      }
      case 'custom':
        if (!customStart && !customEnd) return true;
        if (customStart && !customEnd) return target >= customStart;
        if (!customStart && customEnd) return target <= customEnd;
        return target >= customStart && target <= customEnd;
      case 'all':
      default:
        return true;
    }
  };

  // Format Helper
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatRawDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  // FILTERED DATASETS
  const filteredInvoices = useMemo(() => {
    return hoaDon.filter(h => isDateInPeriod(h.ngay));
  }, [hoaDon, period, customStart, customEnd]);

  const searchedInvoices = useMemo(() => {
    return filteredInvoices.filter(h => {
      // 1. Status Filter
      if (invoiceDebtStatus === 'has_debt' && h.conNo <= 0) return false;
      if (invoiceDebtStatus === 'paid_all' && h.conNo > 0) return false;

      // 2. Search Text Query (Invoice ID, Client Name, Client Phone Number)
      if (invoiceSearch.trim()) {
        const query = invoiceSearch.toLowerCase().trim();
        const client = khachHang.find(k => k.id === h.khachHangId);
        const clientName = client ? client.ten.toLowerCase() : '';
        const clientPhone = client ? client.sdt.toLowerCase() : '';
        const id = h.id.toLowerCase();

        return id.includes(query) || clientName.includes(query) || clientPhone.includes(query);
      }

      return true;
    });
  }, [filteredInvoices, khachHang, invoiceSearch, invoiceDebtStatus]);

  const filteredReturns = useMemo(() => {
    return traHang.filter(t => isDateInPeriod(t.ngayTra));
  }, [traHang, period, customStart, customEnd]);

  const filteredDebts = useMemo(() => {
    return congNo.filter(c => isDateInPeriod(c.ngay));
  }, [congNo, period, customStart, customEnd]);

  // CORE COMPUTATIONS IN FILTERED TIME RANGE
  // ALL metrics derived from CongNo log — same source as CustomersView
  // Formula: Còn nợ = Σ(Ghi nợ) - Σ(Thanh toán) - Σ(Giảm trừ do trả hàng)
  const metrics = useMemo(() => {
    // Get IDs of invoices in the filtered time range
    const filteredInvoiceIds = new Set(filteredInvoices.map(h => h.id));

    // Aggregate CongNo by invoice for filtered invoices
    let totalDebtCreated = 0;  // Σ(Ghi nợ)
    let totalPaid = 0;         // Σ(Thanh toán)
    let totalReturned = 0;     // Σ(Giảm trừ do trả hàng)

    filteredDebts.forEach(c => {
      if (c.hoaDonId && filteredInvoiceIds.has(c.hoaDonId)) {
        if (c.loai === 'Ghi nợ') {
          totalDebtCreated += c.soTien;
        } else if (c.loai === 'Thanh toán') {
          totalPaid += c.soTien;
        } else if (c.loai === 'Giảm trừ do trả hàng') {
          totalReturned += c.soTien;
        }
      }
    });

    // Revenue: sum of thanhTien for invoices in period
    const totalRevenue = filteredInvoices.reduce((sum, h) => sum + h.thanhTien, 0);

    // Returns value from TraHang (for display)
    let returnedValue = 0;
    filteredReturns.forEach(th => {
      returnedValue += th.soTienHoanTrat;
    });

    // COGS
    let cogs = 0;
    filteredInvoices.forEach(h => {
      const invoiceDetails = chiTietHoaDon.filter(d => d.hoaDonId === h.id);
      invoiceDetails.forEach(detail => {
        const prod = sanPham.find(p => p.id === detail.sanPhamId);
        cogs += (prod ? prod.giaNhap : 0) * detail.soLuong;
      });
    });

    const unpaidDebt = Math.max(0, totalDebtCreated - totalPaid - totalReturned);
    const netProfit = Math.max(0, totalRevenue - cogs - totalReturned);

    return {
      revenue: totalRevenue,
      paid: totalPaid,
      unpaidDebt,
      cogs,
      netProfit,
      discount: 0,
      returnsTotal: totalReturned,
      invoiceCount: filteredInvoices.length
    };
  }, [filteredInvoices, chiTietHoaDon, sanPham, filteredDebts, filteredReturns]);

  // DAILY PROGRESSION DATA POINT CALCULATOR FOR THE CHART
  const chartDataPoints = useMemo(() => {
    const dailyMap: { [key: string]: { rev: number; count: number } } = {};

    filteredInvoices.forEach(h => {
      const day = h.ngay.split('T')[0];
      if (!dailyMap[day]) {
        dailyMap[day] = { rev: 0, count: 0 };
      }
      dailyMap[day].rev += h.thanhTien;
      dailyMap[day].count += 1;
    });

    // Convert map to sorted list
    const sortedDays = Object.keys(dailyMap).sort();
    return sortedDays.map(d => ({
      date: d,
      formattedDate: formatRawDate(d),
      value: dailyMap[d].rev,
      count: dailyMap[d].count
    }));
  }, [filteredInvoices]);

  // TOP PRODUCTS SOLVED IN TIME RANGE
  const topProducts = useMemo(() => {
    const prodMap: { [key: string]: { name: string; qty: number; totalRev: number } } = {};

    filteredInvoices.forEach(h => {
      const invoiceDetails = chiTietHoaDon.filter(d => d.hoaDonId === h.id);
      invoiceDetails.forEach(d => {
        if (!prodMap[d.sanPhamId]) {
          prodMap[d.sanPhamId] = { name: d.tenSanPham || 'Không rõ', qty: 0, totalRev: 0 };
        }
        prodMap[d.sanPhamId].qty += d.soLuong;
        prodMap[d.sanPhamId].totalRev += d.thanhTien;
      });
    });

    return Object.keys(prodMap)
      .map(id => ({
        id,
        ...prodMap[id]
      }))
      .sort((a, b) => b.totalRev - a.totalRev)
      .slice(0, 5); // top 5
  }, [filteredInvoices, chiTietHoaDon]);

  // TOP CUSTOMERS DISCHARGING CAPITAL IN PERIOD
  const topCustomers = useMemo(() => {
    const custMap: { [key: string]: { name: string; sdt: string; totalSpent: number; count: number } } = {};

    filteredInvoices.forEach(h => {
      if (!custMap[h.khachHangId]) {
        const partnerInfo = khachHang.find(k => k.id === h.khachHangId);
        custMap[h.khachHangId] = { 
          name: partnerInfo ? partnerInfo.ten : `Mã đại lý: ${h.khachHangId}`, 
          sdt: partnerInfo ? partnerInfo.sdt : '',
          totalSpent: 0,
          count: 0
        };
      }
      custMap[h.khachHangId].totalSpent += h.thanhTien;
      custMap[h.khachHangId].count += 1;
    });

    return Object.keys(custMap)
      .map(id => ({
        id,
        ...custMap[id]
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5); // top 5
  }, [filteredInvoices, khachHang]);

  // Generate nice dynamic responsive SVG path coordinates
  const svgMetrics = useMemo(() => {
    if (chartDataPoints.length === 0) return { d: '', points: [] };
    
    // Chart Canvas bounds
    const width = 800;
    const height = 180;
    const padding = 20;

    const values = chartDataPoints.map(p => p.value);
    const maxValue = Math.max(...values, 1000000); // minimum 1 mil reference bounds

    const points = chartDataPoints.map((dp, idx) => {
      const x = padding + (idx / (chartDataPoints.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - (dp.value / maxValue) * (height - 2 * padding);
      return { x, y, ...dp };
    });

    // Make smooth curved SVG path
    let d = '';
    if (points.length > 0) {
      d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        // Control points for bezier curves
        const cpX1 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
        const cpY1 = points[i - 1].y;
        const cpX2 = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
        const cpY2 = points[i].y;
        d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
      }
    }

    return { d, points, width, height };
  }, [chartDataPoints]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* 1. FILTER CONTROLLER DECK */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Nhật Ký Tổng Quan Doanh Thu & Hiệu Suất Sỉ
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">Truy vấn doanh số thời gian thực, lãi gộp và xếp hạng đại lý.</p>
        </div>

        {/* Dynamic Period Preset Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { key: 'today', label: 'Hôm nay' },
            { key: 'yesterday', label: 'Hôm qua' },
            { key: 'last7', label: '7 ngày qua' },
            { key: 'thisMonth', label: 'Tháng này' },
            { key: 'lastMonth', label: 'Tháng trước' },
            { key: 'all', label: 'Tất cả' },
            { key: 'custom', label: 'Tùy chọn' }
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key as PeriodType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === btn.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOM DATE CAPTURE FOR CUSTOM PRESET */}
      {period === 'custom' && (
        <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in">
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-extrabold uppercase text-amber-900 tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" /> Ngày Bắt Đầu (Từ)
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-white border border-amber-500/20 focus:border-indigo-500 py-2 px-3 rounded-xl focus:ring-2 focus:ring-indigo-100 text-xs w-full text-zinc-800 font-mono"
            />
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-extrabold uppercase text-amber-900 tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" /> Ngày Kết Thúc (Đến)
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-white border border-amber-500/20 focus:border-indigo-500 py-2 px-3 rounded-xl focus:ring-2 focus:ring-indigo-100 text-xs w-full text-zinc-800 font-mono"
            />
          </div>
        </div>
      )}

      {/* 2. CORE METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric Card 1: Revenue */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col items-start justify-between gap-2 shadow-xs hover:shadow-sm transition duration-200 group min-h-[120px]">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest block font-mono">
            Doanh Thu
          </span>
          <strong className="text-lg sm:text-2xl font-black text-indigo-900 font-mono tracking-tight block">
            {formatMoney(metrics.revenue)}
          </strong>
          <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-sans">
            {metrics.invoiceCount} đơn
          </span>
          <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-650 rounded-xl group-hover:scale-105 transition-transform shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          </div>
        </div>

        {/* Metric Card 2: Profit margin */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col items-start justify-between gap-2 shadow-xs hover:shadow-sm transition duration-200 group min-h-[120px]">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest block font-mono">
            Lợi Nhuận
          </span>
          <strong className="text-lg sm:text-2xl font-black text-emerald-700 font-mono tracking-tight block">
            {formatMoney(metrics.netProfit)}
          </strong>
          <span className="text-[11px] text-zinc-550 flex items-center gap-1 font-sans truncate">
            vốn {formatMoney(metrics.cogs)}
          </span>
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-650 rounded-xl group-hover:scale-105 transition-transform shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
        </div>

        {/* Metric Card 3: Outstanding Debt = sum of all customer debts (matches CustomersView) */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col items-start justify-between gap-2 shadow-xs hover:shadow-sm transition duration-200 group min-h-[120px]">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest block font-mono">
            Còn Nợ Phải Thu
          </span>
          <strong className="text-lg sm:text-2xl font-black text-amber-700 font-mono tracking-tight block">
            {formatMoney(metrics.unpaidDebt)}
          </strong>
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-sans">
              Ghi nợ: {formatMoney(metrics.paid + metrics.unpaidDebt + metrics.returnsTotal)}
            </span>
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-sans">
              Thanh toán: {formatMoney(metrics.paid)}
            </span>
            <span className="text-[10px] text-red-500 flex items-center gap-1 font-sans">
              Giảm trừ: {formatMoney(metrics.returnsTotal)}
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-amber-50 text-amber-650 rounded-xl group-hover:scale-105 transition-transform shrink-0">
            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>
        </div>

        {/* Metric Card 4: Returned inventory damage offset */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col items-start justify-between gap-2 shadow-xs hover:shadow-sm transition duration-200 group min-h-[120px]">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest block font-mono">
            Đổi Trả
          </span>
          <strong className="text-lg sm:text-2xl font-black text-red-700 font-mono tracking-tight block">
            {formatMoney(metrics.returnsTotal)}
          </strong>
          <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-sans">
            {filteredReturns.length} thiết bị
          </span>
          <div className="p-2 sm:p-3 bg-red-50 text-red-650 rounded-xl group-hover:scale-105 transition-transform shrink-0">
            <Undo2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
        </div>

      </div>

      {/* 3. VISUAL SVGs AREA GRAPH ROW */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
              Bản Đồ Dao Động Doanh Số Sỉ Theo Ngày
            </h3>
            <p className="text-stone-500 text-xs">Di chuột vào điểm mốc (Node) để tra cứu doanh số chi tiết.</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-505">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              Doanh thu ngày
            </span>
          </div>
        </div>

        {/* SVG Area chart canvas container */}
        <div className="w-full relative overflow-x-auto select-none bg-slate-50/50 p-2 sm:p-4 rounded-xl border border-slate-100">
          {chartDataPoints.length === 0 ? (
            <div className="h-44 flex flex-col justify-center items-center text-stone-400 text-xs space-y-2">
              <Database className="w-8 h-8 text-stone-300 animate-pulse" />
              <span>Không phát sinh hóa đơn bán hàng trong thời gian được chọn!</span>
            </div>
          ) : (
            <div className="min-w-[800px] h-52 relative">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}>
                <defs>
                  {/* Subtle Gradient Area under curve */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid utility paths */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const yVal = 20 + ratio * (180 - 40);
                  return (
                    <line
                      key={idx}
                      x1="20"
                      y1={yVal}
                      x2={svgMetrics.width - 20}
                      y2={yVal}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                  );
                })}

                {/* Area under line path */}
                {svgMetrics.points.length > 0 && (
                  <path
                    d={`${svgMetrics.d} L ${svgMetrics.points[svgMetrics.points.length - 1].x} ${svgMetrics.height - 20} L ${svgMetrics.points[0].x} ${svgMetrics.height - 20} Z`}
                    fill="url(#areaGrad)"
                  />
                )}

                {/* Main Curved Stroke Line */}
                <path
                  d={svgMetrics.d}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points (Dots) on Curve */}
                {svgMetrics.points.map((pt, idx) => (
                  <g key={pt.date}>
                    {/* Hover hotspot circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      className="fill-transparent hover:fill-indigo-500/10 cursor-pointer transition"
                      onMouseEnter={() => setHoveredDataPoint(pt)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                    {/* Visual dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className={`fill-white stroke-2 cursor-pointer transition ${
                        hoveredDataPoint?.date === pt.date
                          ? 'stroke-indigo-700 fill-indigo-200 r-6'
                          : 'stroke-indigo-600'
                      }`}
                    />
                  </g>
                ))}
              </svg>

              {/* DYNAMIC D3-LIKE FLOATING DATA TOOLTIP */}
              {hoveredDataPoint && (
                <div 
                  className="absolute bg-slate-900 text-white rounded-xl py-2 px-3 text-[11px] shadow-xl z-20 border border-slate-700/80 text-left pointer-events-none"
                  style={{
                    left: `${(svgMetrics.points.find(p => p.date === hoveredDataPoint.date)?.x || 0) - 70}px`,
                    top: `${(svgMetrics.points.find(p => p.date === hoveredDataPoint.date)?.y || 0) - 75}px`
                  }}
                >
                  <strong className="block text-indigo-300 font-bold font-mono">{hoveredDataPoint.formattedDate}</strong>
                  <div className="flex items-center gap-1.5 mt-0.5 text-zinc-350">
                    Doanh thu:<span className="font-extrabold font-mono text-white text-xs">{formatMoney(hoveredDataPoint.value)}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Số hóa đơn sỉ: <strong className="text-white font-bold">{hoveredDataPoint.count} đơn</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* X-Axis labels for dates (staggered display for readability) */}
        {chartDataPoints.length > 0 && (
          <div className="flex justify-between px-6 mt-2 text-[10px] text-zinc-400 font-mono font-bold">
            <span>{chartDataPoints[0]?.formattedDate}</span>
            {chartDataPoints.length > 2 && (
              <span>{chartDataPoints[Math.floor(chartDataPoints.length / 2)]?.formattedDate}</span>
            )}
            <span>{chartDataPoints[chartDataPoints.length - 1]?.formattedDate}</span>
          </div>
        )}
      </div>

      {/* 4. BEST-PERFORMING DISTRIBUTORS & TOP POPULAR DEVICES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* Column A: Top partners generating most wholesale revenue */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs text-left">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Xếp Hạng Đại Lý sỉ</span>
              <span className="sm:hidden">Top Đại Lý</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5 hidden sm:block">Xếp hạng 5 đại lý sỉ đem lại doanh thu cao nhất.</p>
          </div>

          {topCustomers.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-stone-400 text-xs">
              Chưa có giao dịch khách sỉ!
            </div>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((partner, index) => {
                const colors = ['bg-indigo-600 text-white', 'bg-slate-700 text-white', 'bg-slate-500 text-white', 'bg-slate-300 text-slate-800', 'bg-slate-100 text-slate-500'];
                const pct = metrics.revenue > 0 ? (partner.totalSpent / metrics.revenue) * 100 : 0;
                
                return (
                  <div key={partner.id} className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl flex items-center justify-between gap-2 sm:gap-3 text-xs">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg text-[11px] font-black font-mono flex items-center justify-center shrink-0 ${colors[index] || 'bg-slate-105 text-slate-600'}`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block font-bold text-slate-900 text-xs sm:text-sm truncate">{partner.name}</strong>
                        <span className="text-[10px] text-zinc-500 font-mono block sm:hidden">{partner.count} đơn</span>
                        <span className="hidden sm:block text-[10px] text-zinc-500 font-mono">{partner.sdt || 'Chưa lưu'} • {partner.count} hóa đơn</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <strong className="block font-black font-mono text-slate-900 text-xs sm:text-sm">{formatMoney(partner.totalSpent)}</strong>
                      <div className="w-12 sm:w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden ml-auto">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column B: Top Selling Smartphone Models */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs text-left">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Bảng Vàng Máy Chạy Nhất</span>
              <span className="sm:hidden">Top Máy Bán</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5 hidden sm:block">Xếp hạng 5 dòng máy sỉ bán chạy nhất.</p>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-stone-400 text-xs">
              Chưa phát sinh mặt hàng xuất kho!
            </div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((phone, index) => {
                const colors = ['border-l-indigo-600 bg-indigo-50/10', 'border-l-indigo-500 bg-indigo-50/5', 'border-l-slate-400', 'border-l-slate-300', 'border-l-slate-200'];
                return (
                  <div key={phone.id} className={`border border-slate-100 border-l-[3px] p-3 rounded-xl flex items-center justify-between gap-2 sm:gap-3 text-xs ${colors[index] || 'border-l-slate-200'}`}>
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-650 rounded-lg shrink-0 hidden sm:block">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block font-bold text-slate-900 text-xs sm:text-sm truncate">{phone.name}</strong>
                        <span className="text-[10px] text-zinc-500 hidden sm:block">{phone.qty} máy</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <strong className="block font-black font-mono text-indigo-900 text-xs sm:text-sm">{formatMoney(phone.totalRev)}</strong>
                      <span className="hidden sm:inline text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Thành công</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 5. HISTORY AUDITING LOG FOR FILTERED TIME RANGE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden text-left font-sans">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full inline-block"></span>
              <span className="hidden sm:inline">Quản lý danh sách hóa đơn sỉ</span>
              <span className="sm:hidden">Hóa Đơn Sỉ</span>
            </h3>
            <p className="text-stone-500 text-xs mt-0.5">{searchedInvoices.length} / {filteredInvoices.length} đơn hàng</p>
          </div>

          {/* Advanced Search & Filtering Box */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Tìm đơn, tên..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="px-3 py-2 sm:py-1.5 text-sm sm:text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48 font-medium transition placeholder:text-stone-400 touch-feedback"
              id="search_invoice_input"
            />

            <select
              value={invoiceDebtStatus}
              onChange={(e) => setInvoiceDebtStatus(e.target.value as any)}
              className="px-3 py-2 sm:py-1.5 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer transition touch-feedback"
              id="filter_invoice_debt_status"
            >
              <option value="all">Tất cả</option>
              <option value="has_debt">Còn nợ</option>
              <option value="paid_all">Hết nợ</option>
            </select>
          </div>
        </div>

        {/* Mobile: Card View | Desktop: Table View */}
        <div className="sm:hidden divide-y divide-slate-100">
          {searchedInvoices.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-sm">
              Không tìm thấy hóa đơn nào.
            </div>
          ) : (
            searchedInvoices.map(invoice => {
              const customerObj = khachHang.find(k => k.id === invoice.khachHangId);
              return (
                <div key={invoice.id} className="p-4 space-y-3 hover:bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-black text-indigo-650 font-mono text-xs">{invoice.id}</span>
                      <p className="text-stone-400 text-[10px] font-mono mt-0.5">{formatRawDate(invoice.ngay)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      invoice.conNo > 0 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {invoice.conNo > 0 ? 'Còn nợ' : 'Hết nợ'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{customerObj?.ten || 'Ẩn danh'}</p>
                      <p className="text-stone-500 text-xs font-mono">{customerObj?.sdt || invoice.khachHangId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black font-mono text-slate-900">{formatMoney(invoice.thanhTien)}</p>
                      {invoice.conNo > 0 && (
                        <p className="text-amber-600 text-xs font-bold">Nợ: {formatMoney(invoice.conNo)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setViewingInvoice(invoice)}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition border border-indigo-150 touch-feedback"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingInvoice(invoice)}
                      className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition border border-amber-150 touch-feedback"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Sửa
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[9px] text-slate-500 font-extrabold tracking-wider font-sans">
              <tr>
                <th className="py-3 px-4">Mã Đơn</th>
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Khách Sỉ</th>
                <th className="py-3 px-4 text-right">Thành Tiền</th>
                <th className="py-3 px-4 text-right">Đã Thu</th>
                <th className="py-3 px-4 text-right">Nợ</th>
                <th className="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {searchedInvoices.map(invoice => {
                const customerObj = khachHang.find(k => k.id === invoice.khachHangId);
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-black text-indigo-650 font-mono text-[11px]">
                      {invoice.id}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatRawDate(invoice.ngay)}
                    </td>
                    <td className="py-3 px-4 text-left">
                      <span className="font-bold text-slate-900 text-sm block">
                        {customerObj ? customerObj.ten : 'Ẩn danh'}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-bold block font-mono">
                        {customerObj ? customerObj.sdt : `Mã: ${invoice.khachHangId}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      {formatMoney(invoice.thanhTien)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                      {formatMoney(invoice.daThanhToan)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono">
                      {invoice.conNo > 0 ? (
                        <span className="bg-amber-50 text-amber-800 py-0.5 px-1.5 rounded-lg border border-amber-100 font-black">
                          {formatMoney(invoice.conNo)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 py-0.5 px-1.5 border border-emerald-100 rounded-lg font-bold">
                          Hết Nợ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(invoice)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition border border-indigo-150 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingInvoice(invoice)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition border border-amber-150 shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Sửa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewingInvoice && viewingCustomer && (
        <InvoiceDetailModal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          invoice={viewingInvoice}
          details={viewingDetails}
          customer={viewingCustomer}
          storeInfo={storeInfo}
        />
      )}

      {editingInvoice && (
        <InvoiceEditModal
          isOpen={!!editingInvoice}
          onClose={() => setEditingInvoice(null)}
          invoice={editingInvoice}
          details={editingDetails}
          khachHang={khachHang}
          sanPham={sanPham}
          onSave={onEditHoaDon}
        />
      )}

    </div>
  );
}

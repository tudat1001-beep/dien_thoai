import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Eye, 
  Pencil, 
  FileText, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Printer, 
  CornerUpLeft, 
  SearchCode,
  Calendar,
  X,
  RefreshCw
} from 'lucide-react';
import { HoaDon, ChiTietHoaDon, KhachHang, SanPham, CongNo, TraHang } from '../types';
import InvoiceDetailModal from './InvoiceDetailModal';
import InvoiceEditModal from './InvoiceEditModal';

interface InvoicesViewProps {
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

export default function InvoicesView({
  khachHang,
  sanPham,
  hoaDon,
  chiTietHoaDon,
  congNo,
  traHang,
  storeInfo,
  onEditHoaDon
}: InvoicesViewProps) {
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debtStatusFilter, setDebtStatusFilter] = useState<'all' | 'has_debt' | 'paid_all'>('all');

  // Selected invoice states
  const [viewingInvoice, setViewingInvoice] = useState<HoaDon | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<HoaDon | null>(null);

  // Helper date conversions
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    if (period === 'all') return true;
    if (period === 'today') return dateStr === today;
    if (period === 'yesterday') return dateStr === yesterday;

    const rowDate = new Date(dateStr);
    const todayDate = new Date(today);

    if (period === 'last7') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return rowDate >= sevenDaysAgo && rowDate <= todayDate;
    }

    if (period === 'thisMonth') {
      const currentYear = todayDate.getFullYear();
      const currentMonth = todayDate.getMonth();
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      return rowDate >= startOfMonth && rowDate <= todayDate;
    }

    if (period === 'lastMonth') {
      const currentYear = todayDate.getFullYear();
      const currentMonth = todayDate.getMonth();
      const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfLastMonth = new Date(currentYear, currentMonth, 0);
      return rowDate >= startOfLastMonth && rowDate <= endOfLastMonth;
    }

    if (period === 'custom') {
      if (!customStart && !customEnd) return true;
      if (customStart && !customEnd) {
        return dateStr >= customStart;
      }
      if (!customStart && customEnd) {
        return dateStr <= customEnd;
      }
      return dateStr >= customStart && dateStr <= customEnd;
    }

    return true;
  };

  const filteredInvoices = useMemo(() => {
    return hoaDon.filter(h => isDateInPeriod(h.ngay));
  }, [hoaDon, period, customStart, customEnd]);

  // Apply Search Query AND Payment Status Filter
  const finalizedInvoices = useMemo(() => {
    return filteredInvoices.filter(h => {
      // 1. Payment Status Filter
      if (debtStatusFilter === 'has_debt' && h.conNo <= 0) return false;
      if (debtStatusFilter === 'paid_all' && h.conNo > 0) return false;

      // 2. Search query matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const client = khachHang.find(k => k.id === h.khachHangId);
        const name = client ? client.ten.toLowerCase() : '';
        const phone = client ? client.sdt.toLowerCase() : '';
        const id = h.id.toLowerCase();
        const notes = h.ghiChu ? h.ghiChu.toLowerCase() : '';

        return id.includes(query) || name.includes(query) || phone.includes(query) || notes.includes(query);
      }

      return true;
    });
  }, [filteredInvoices, khachHang, searchQuery, debtStatusFilter]);

  const viewingDetails = useMemo(() => {
    if (!viewingInvoice) return [];
    return chiTietHoaDon.filter(d => d.hoaDonId === viewingInvoice.id);
  }, [viewingInvoice, chiTietHoaDon]);

  const viewingCustomer = useMemo(() => {
    if (!viewingInvoice) return null;
    const found = khachHang.find(k => k.id === viewingInvoice.khachHangId);
    if (found) return found;

    // Handle guest invoices: extract info from [GUEST: Name - Phone] pattern in note
    if (viewingInvoice.khachHangId === 'KH_VANGLAI' || viewingInvoice.khachHangId.startsWith('KHVL')) {
      let guestName = 'Khách vãng lai';
      let guestPhone = '---';
      
      if (viewingInvoice.ghiChu && viewingInvoice.ghiChu.includes('[GUEST:')) {
        try {
          const match = viewingInvoice.ghiChu.match(/\[GUEST:\s*(.*?)\s*-\s*(.*?)\]/);
          if (match) {
            guestName = match[1];
            guestPhone = match[2];
          }
        } catch (e) {
          console.error('Error parsing guest info from note', e);
        }
      }

      return {
        id: viewingInvoice.khachHangId,
        ten: guestName,
        sdt: guestPhone,
        diaChi: 'Khách lẻ vãng lai',
        mst: '',
        ghiChu: 'Thông tin từ hóa đơn',
        ngayTao: viewingInvoice.ngay
      } as KhachHang;
    }
    
    return null;
  }, [viewingInvoice, khachHang]);

  const editingDetails = useMemo(() => {
    if (!editingInvoice) return [];
    return chiTietHoaDon.filter(d => d.hoaDonId === editingInvoice.id);
  }, [editingInvoice, chiTietHoaDon]);

  // Analytics of filtered list — derived from CongNo log (same source as Dashboard + customerDebts)
  const summaryKPIs = useMemo(() => {
    const filteredInvoiceIds = new Set(filteredInvoices.map(h => h.id));

    let totalRevenue = 0;
    let totalDebtCreated = 0;
    let totalPaid = 0;
    let totalDebtOutstanding = 0;
    let totalReturned = 0;

    filteredInvoices.forEach(h => {
      totalRevenue += h.thanhTien;
    });

    congNo.forEach(c => {
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

    totalDebtOutstanding = Math.max(0, totalDebtCreated - totalPaid - totalReturned);

    return {
      salesCount: filteredInvoices.length,
      totalRevenue,
      totalPaid,
      totalDebtOutstanding,
      totalReturned
    };
  }, [filteredInvoices, congNo]);

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

  const handleResetFilters = () => {
    setPeriod('all');
    setSearchQuery('');
    setDebtStatusFilter('all');
    setCustomStart('');
    setCustomEnd('');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header and Page Intro */}
      <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 text-left font-sans">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </span>
            <span className="hidden sm:inline">Quản Lý Hóa Đơn Sỉ</span>
            <span className="sm:hidden">Hóa Đơn Sỉ</span>
          </h2>
          <p className="text-slate-500 text-xs hidden sm:block">
            Tra cứu lịch sử xuất sỉ, sửa đơn, gối nợ và tải ảnh hóa đơn PNG.
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="px-3 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Làm mới bộ lọc</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </div>

      {/* 2. Visual KPIs for current selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl text-left shadow-xs flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-700 rounded-xl shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 stroke-2" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">Số đơn</span>
            <strong className="block text-base sm:text-lg font-black text-slate-900 font-mono">{summaryKPIs.salesCount}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl text-left shadow-xs flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-2" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">Thành tiền</span>
            <strong className="block text-sm sm:text-base font-black text-emerald-700 font-mono truncate">{formatMoney(summaryKPIs.totalRevenue)}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl text-left shadow-xs flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-sky-50 text-sky-700 rounded-xl shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-2" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">Đã thu</span>
            <strong className="block text-sm sm:text-base font-black text-sky-700 font-mono truncate">{formatMoney(summaryKPIs.totalPaid)}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl text-left shadow-xs flex items-center gap-3">
          <div className="p-2 sm:p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-2" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">Còn nợ</span>
            <strong className="block text-sm sm:text-base font-black text-amber-800 font-mono truncate">{formatMoney(summaryKPIs.totalDebtOutstanding)}</strong>
          </div>
        </div>

      </div>

      {/* 3. Search and filtering panel */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 text-left font-sans space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Main search box */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight">Từ khóa tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm Mã Đơn (HDxx), Tên Đối tác, SĐT sỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium transition placeholder:text-stone-400"
                id="invoices_view_search"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Payment status filter */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight">Trạng thái gối nợ</label>
            <select
              value={debtStatusFilter}
              onChange={(e) => setDebtStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer transition"
              id="invoices_view_debt_filter"
            >
              <option value="all">Tất cả biên lai / Nợ gối đầu</option>
              <option value="has_debt">⚠️ Đơn hàng chưa đối soát xong (Còn nợ)</option>
              <option value="paid_all">✅ Đơn hàng đã dứt điểm nợ (Hết nợ)</option>
            </select>
          </div>

          {/* Period selector */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight">Thời gian ghi nhận hóa đơn</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer transition w-full"
                id="invoices_view_period_filter"
              >
                <option value="all">Sự kiện: Toàn thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="yesterday">Hôm qua</option>
                <option value="last7">7 ngày gần đây</option>
                <option value="thisMonth">Tháng này</option>
                <option value="lastMonth">Tháng trước</option>
                <option value="custom">Tùy chọn khoảng ngày...</option>
              </select>

              {period === 'custom' && (
                <div className="flex gap-1.5 items-center w-full">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-1/2 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    id="invoices_custom_start"
                  />
                  <span className="text-[10px] text-zinc-400 font-bold font-mono shrink-0">➝</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-1/2 p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    id="invoices_custom_end"
                  />
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. Table view of finalized invoices */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden text-left font-sans">
        
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">
              Danh Sách Hóa Đơn Sỉ Đơn Hàng Đã Bán
            </h3>
            <p className="text-stone-500 text-[10px] mt-0.5">Khớp tìm kiếm thấy {finalizedInvoices.length} đơn hàng sỉ.</p>
          </div>
        </div>

        {finalizedInvoices.length === 0 ? (
          <div className="p-16 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-slate-50 rounded-full text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <p className="font-semibold text-slate-500">Không tìm thấy hóa đơn nào trùng khớp với bộ lọc ứng dụng!</p>
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline mt-1 cursor-pointer"
            >
              Đặt lại toàn bộ lọc mặc định
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {finalizedInvoices.map((invoice) => {
                const customerObj = khachHang.find(k => k.id === invoice.khachHangId);
                const realDebt = Math.max(0, invoice.thanhTien - invoice.daThanhToan - (invoice.daTra || 0));
                const isDebt = realDebt > 0;
                
                return (
                  <div 
                    key={invoice.id}
                    className="p-4 hover:bg-slate-50/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-extrabold text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-100 rounded-md inline-block">
                          {invoice.id}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">{formatRawDate(invoice.ngay)}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                        isDebt 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isDebt ? formatMoney(realDebt) : 'Đã dứt'}
                      </span>
                    </div>
                    
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {customerObj ? customerObj.ten : 'Khách vãng lai'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {customerObj ? customerObj.sdt : invoice.khachHangId}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex gap-3">
                        <span className="text-[10px] text-slate-500">
                          <span className="font-semibold">{formatMoney(invoice.thanhTien)}</span>
                        </span>
                        {(invoice.daTra || 0) > 0 && (
                          <span className="text-[10px] text-purple-600">
                            ↩ {formatMoney(invoice.daTra)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingInvoice(invoice)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        Xem
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/85 border-b border-slate-200 uppercase text-[9px] text-slate-500 font-extrabold tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Ngày Đi Đơn</th>
                  <th className="py-3 px-4">Đại Lý Sỉ</th>
                  <th className="py-3 px-4 text-right">Cộng Sườn</th>
                  <th className="py-3 px-4 text-right">Chiết Khấu</th>
                  <th className="py-3 px-4 text-right">Thành Tiền Sỉ</th>
                  <th className="py-3 px-4 text-right">Đã Thanh Toán</th>
                  <th className="py-3 px-4 text-right">Đã Trả</th>
                  <th className="py-3 px-4 text-right">Dư nợ Gối Đầu</th>
                  <th className="py-3 px-4 text-center">Tác Vụ Đại Lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {finalizedInvoices.map((invoice, index) => {
                  const customerObj = khachHang.find(k => k.id === invoice.khachHangId);
                  const realDebt = Math.max(0, invoice.thanhTien - invoice.daThanhToan - (invoice.daTra || 0));
                  const isDebt = realDebt > 0;

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/65 transition-all">
                      
                      {/* Invoice ID Code */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-[11px] font-mono hover:underline text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-100 rounded-md">
                          {invoice.id}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-550 font-mono text-[11.5px]">
                        {formatRawDate(invoice.ngay)}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-4 text-left">
                        <span className="font-bold text-slate-900 block text-xs">
                          {customerObj ? customerObj.ten : (invoice.ghiChu?.includes('[GUEST:') ? invoice.ghiChu.match(/\[GUEST:\s*(.*?)\s*-\s*.*?\]/)?.[1] || 'Khách vãng lai' : 'Khách vãng lai')}
                        </span>
                        <span className="text-[10px] text-indigo-500 font-mono font-medium block">
                          {customerObj ? customerObj.sdt : (invoice.ghiChu?.includes('[GUEST:') ? invoice.ghiChu.match(/\[GUEST:\s*.*?\s*-\s*(.*?)\]/)?.[1] || invoice.khachHangId : invoice.khachHangId)}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-4 text-right font-mono text-zinc-500 text-[11.5px]">
                        {formatMoney(invoice.tongTien)}
                      </td>

                      {/* Discount Amount */}
                      <td className="py-3 px-4 text-right font-mono text-red-500 text-[11.5px]">
                        {invoice.giamGia > 0 ? `-${formatMoney(invoice.giamGia)}` : '—'}
                      </td>

                      {/* Final Total Wholesale val */}
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900 text-[12px]">
                        {formatMoney(invoice.thanhTien)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold text-[11.5px]">
                        {formatMoney(invoice.daThanhToan)}
                      </td>

                      {/* Outstanding remaining debt: Tổng - Đã thu - Trả lại */}
                      <td className="py-3 px-4 text-right">
                        {(invoice.daTra || 0) > 0 ? (
                          <span className="font-mono text-purple-700 font-bold text-[11.5px]">
                            {formatMoney(invoice.daTra)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Outstanding remaining debt: thanhTien - daThanhToan - daTra */}
                      <td className="py-3 px-4 text-right">
                        {(() => {
                          const realDebt = Math.max(0, invoice.thanhTien - invoice.daThanhToan - (invoice.daTra || 0));
                          return realDebt > 0 ? (
                            <div className="space-y-0.5">
                              <span className="font-extrabold font-mono text-amber-700 text-xs block">
                                {formatMoney(realDebt)}
                              </span>
                              <span className="text-[8px] uppercase tracking-wide px-1.5 py-0.2 rounded font-black bg-amber-50 text-amber-700 border border-amber-100 inline-block font-sans">
                                Còn nợ
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider text-emerald-600 bg-emerald-50 py-0.5 px-1.5 border border-emerald-100 rounded-lg font-black font-sans">
                              Đã dứt điểm
                            </span>
                          );
                        })()}
                      </td>

                      {/* Interactive Buttons for modal hooks */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* 1. View & Export Ticket (PNG / Copy) */}
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(invoice)}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition border border-indigo-650 shadow-xs"
                            title="XEM MẪU IN & TẢI ẢNH ĐƠN PNG GỬI KHÁCH"
                          >
                            <Eye className="w-3 h-3 stroke-[2.5]" />
                            Bìa / PNG sỉ
                          </button>

                          {/* 2. Edit Invoice */}
                          <button
                            type="button"
                            onClick={() => setEditingInvoice(invoice)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition border border-amber-200 shadow-xs"
                            title="CHỈNH SỬA CHI TIẾT SỐ LƯỢNG MÁY / IMEI / TIỀN NỢ"
                          >
                            <Pencil className="w-3 h-3 text-amber-700 stroke-[2.5]" />
                            Sửa đơn sỉ
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}

      </div>

      {/* 5. Detail Modals Portal renders */}
      {viewingInvoice && (
        <InvoiceDetailModal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          invoice={viewingInvoice}
          details={viewingDetails}
          customer={viewingCustomer!}
          storeInfo={storeInfo}
          traHang={traHang}
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

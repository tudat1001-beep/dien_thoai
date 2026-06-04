import React, { useState, useMemo } from 'react';
import { KhachHang, HoaDon, CongNo, GiaKhachHang, SanPham, TraHang, ChiTietHoaDon } from '../types';
import { User, Phone, MapPin, FileSpreadsheet, PlusCircle, CreditCard, ChevronRight, X, DollarSign, Settings, Edit, Heart, ChevronDown, Search, Eye, Receipt, ArrowUpDown, Wallet } from 'lucide-react';
import InvoiceDetailModal from './InvoiceDetailModal';

interface CustomersViewProps {
  khachHang: KhachHang[];
  hoaDon: HoaDon[];
  chiTietHoaDon: ChiTietHoaDon[];
  congNo: CongNo[];
  giaKhachHang: GiaKhachHang[];
  sanPham: SanPham[];
  traHang: TraHang[];
  storeInfo: {
    tenCuaHang: string;
    slogan: string;
    diaChi: string;
    hotline: string;
  };
  onAddKhachHang: (khach: KhachHang) => void;
  onAddCongNo: (cn: CongNo) => void;
  onUpdateGiaKhachHang: (khachHangId: string, sanPhamId: string, giaRieng: number) => void;
  onRemoveGiaKhachHang: (id: string) => void;
}

export default function CustomersView({
  khachHang,
  hoaDon,
  chiTietHoaDon,
  congNo,
  giaKhachHang,
  sanPham,
  traHang,
  storeInfo,
  onAddKhachHang,
  onAddCongNo,
  onUpdateGiaKhachHang,
  onRemoveGiaKhachHang
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeCustomerTab, setActiveCustomerTab] = useState<'info' | 'invoices' | 'debt' | 'prices'>('info');
  
  // Invoice detail modal
  const [viewingInvoice, setViewingInvoice] = useState<HoaDon | null>(null);
  const [viewingInvoiceDetails, setViewingInvoiceDetails] = useState<ChiTietHoaDon[]>([]);

  // Form States for New Customer
  const [newTen, setNewTen] = useState('');
  const [newSdt, setNewSdt] = useState('');
  const [newDiaChi, setNewDiaChi] = useState('');
  const [newMst, setNewMst] = useState('');
  const [newGhiChu, setNewGhiChu] = useState('');

  // Custom Pricing State
  const [newGkhSpId, setNewGkhSpId] = useState('');
  const [newGkhPrice, setNewGkhPrice] = useState<number>(0);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayNote, setRepayNote] = useState('');
  const [repayAll, setRepayAll] = useState(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumberWithCommas = (num: number | string): string => {
    if (num === 0 || num === '0') return '0';
    if (!num) return '';
    const cleanStr = String(num).replace(/[^\d]/g, '');
    if (!cleanStr) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(cleanStr, 10));
  };

function findNextCustomerId(khachHang: KhachHang[]): string {
  if (khachHang.length === 0) return 'KH001';
  const nums = khachHang
    .map(k => parseInt(k.id.replace('KH', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `KH${String(max + 1).padStart(3, '0')}`;
}
  const customerDebts = useMemo(() => {
    const debtsMap: Record<string, number> = {};
    
    // Initialize
    khachHang.forEach(kh => {
      debtsMap[kh.id] = 0;
    });

    // Compute from CongNo log (source of truth)
    congNo.forEach(cn => {
      if (debtsMap[cn.khachHangId] !== undefined) {
        if (cn.loai === 'Ghi nợ') {
          debtsMap[cn.khachHangId] += cn.soTien;
        } else if (cn.loai === 'Thanh toán' || cn.loai === 'Giảm trừ do trả hàng') {
          debtsMap[cn.khachHangId] -= cn.soTien;
        }
      }
    });

    return debtsMap;
  }, [khachHang, congNo]);

  // List of filtered customers
  const filteredCustomers = useMemo(() => {
    return khachHang.filter(kh => 
      kh.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kh.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kh.sdt.includes(searchTerm)
    );
  }, [khachHang, searchTerm]);

  // Handle adding new customer
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTen || !newSdt) {
      alert('Vui lòng điền Họ tên và Số điện thoại khách sỉ!');
      return;
    }

    const nextId = findNextCustomerId(khachHang);
    const newKh: KhachHang = {
      id: nextId,
      ten: newTen,
      sdt: newSdt,
      diaChi: newDiaChi || 'Bàn giao trực tiếp',
      mst: newMst,
      ghiChu: newGhiChu,
      ngayTao: new Date().toISOString().split('T')[0]
    };

    onAddKhachHang(newKh);
    setShowAddModal(false);

    // Reset Form
    setNewTen('');
    setNewSdt('');
    setNewDiaChi('');
    setNewMst('');
    setNewGhiChu('');
  };

  // Handle adding custom prices
  const handleAddCustomPriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newGkhSpId || newGkhPrice <= 0) {
      alert('Vui lòng lựa chọn sản phẩm và điền đơn giá sỉ ưu đãi!');
      return;
    }

    onUpdateGiaKhachHang(selectedCustomerId, newGkhSpId, JackNewPrice(newGkhPrice));
    
    // reset gkh inputs
    setNewGkhSpId('');
    setNewGkhPrice(0);
  };

  const JackNewPrice = (price: number) => {
    return price < 0 ? 0 : price;
  };

  // Get current active customer if selected
  const activeDetailKh = useMemo(() => {
    return khachHang.find(kh => kh.id === selectedCustomerId) || null;
  }, [khachHang, selectedCustomerId]);

  // Customer Invoices & Logs
  const activeCustomerInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return hoaDon
      .filter(h => h.khachHangId === selectedCustomerId)
      .sort((a, b) => b.ngay.localeCompare(a.ngay));
  }, [hoaDon, selectedCustomerId]);

  // Stats for active customer — formula: Còn nợ = Tổng mua - Đã thu - Trả lại
  const activeCustomerStats = useMemo(() => {
    if (!selectedCustomerId) return { totalOrders: 0, totalSpent: 0, totalDebt: 0, totalReturns: 0 };

    // Get CongNo payments for this customer's invoices
    const customerInvoiceIds = new Set(
      hoaDon
        .filter(h => h.khachHangId === selectedCustomerId)
        .map(h => h.id)
    );

    const invoices = hoaDon.filter(h => h.khachHangId === selectedCustomerId);
    const totalSpent = invoices.reduce((sum, h) => sum + h.thanhTien, 0);

    // Sum CongNo payments linked to these invoices
    let totalPaidViaCongNo = 0;
    congNo.forEach(c => {
      if (customerInvoiceIds.has(c.hoaDonId) && c.loai === 'Thanh toán') {
        totalPaidViaCongNo += c.soTien;
      }
    });

    const totalPaid = invoices.reduce((sum, h) => sum + h.daThanhToan, 0) + totalPaidViaCongNo;
    const totalReturns = traHang
      .filter(t => invoices.some(i => i.id === t.hoaDonId))
      .reduce((sum, t) => sum + t.soTienHoanTrat, 0);

    const totalDebt = Math.max(0, totalSpent - totalPaid - totalReturns);

    return {
      totalOrders: invoices.length,
      totalSpent,
      totalDebt,
      totalReturns
    };
  }, [hoaDon, selectedCustomerId, congNo, traHang]);

  const activeCustomerDebtLogs = useMemo(() => {
    if (!selectedCustomerId) return [];
    return congNo.filter(cn => cn.khachHangId === selectedCustomerId);
  }, [congNo, selectedCustomerId]);

  const activeCustomerCustomPrices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return giaKhachHang.filter(g => g.khachHangId === selectedCustomerId);
  }, [giaKhachHang, selectedCustomerId]);

  return (
    <div className="flex gap-6">
      
      {/* LEFT LIST: CUSTOMER DIRECTORY */}
      <div className={`${activeDetailKh ? 'hidden lg:block lg:w-1/2' : 'w-full'} space-y-4`}>
        
        {/* Search header container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, SĐT, mã KH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
              id="search_customer"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all bg-indigo-600 touch-feedback"
            id="btn_add_customer_trigger"
          >
            <PlusCircle className="w-4 h-4" />
            Thêm đại lý mới
          </button>
        </div>

        {/* Customer Database Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCustomers.map((kh) => {
            const debtVal = customerDebts[kh.id] || 0;
            const isSelected = selectedCustomerId === kh.id;

            return (
              <div
                key={kh.id}
                onClick={() => setSelectedCustomerId(kh.id)}
                className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all cursor-pointer active:scale-[0.99] touch-feedback ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md' : 'border-slate-200 hover:shadow-sm'
                }`}
                id={`customer_card_${kh.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{kh.ten}</h3>
                      <span className="text-[10px] font-mono text-slate-500">{kh.sdt}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                      debtVal > 0 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : debtVal < 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {debtVal === 0 ? 'OK' : formatMoney(debtVal)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 truncate">{kh.diaChi}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{kh.ngayTao}</span>
                  <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5">
                    Chi tiết
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
              Chưa có đại lý nào
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CUSTOMER DETAIL */}
      {activeDetailKh && (
        <div className="fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto bg-white lg:bg-transparent w-full lg:w-1/2 h-full lg:h-auto">
          {/* Mobile backdrop */}
          <div 
            className="lg:hidden absolute inset-0 bg-black/40 -z-10"
            onClick={() => setSelectedCustomerId(null)}
          />
          
          <div className="bg-white lg:rounded-xl border border-slate-200 lg:shadow-lg h-full lg:h-[calc(100vh-120px)] lg:sticky lg:top-[100px] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{activeDetailKh.ten}</h3>
                    <p className="text-indigo-200 text-xs font-mono">{activeDetailKh.sdt}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-black">{activeCustomerStats.totalOrders}</p>
                  <p className="text-[10px] text-indigo-200">Đơn hàng</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-lg font-black">{formatMoney(activeCustomerStats.totalDebt)}</p>
                  <p className="text-[10px] text-indigo-200">Còn nợ</p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto">
              {[
                { id: 'info', label: 'Thông tin', icon: User },
                { id: 'invoices', label: 'Đơn hàng', icon: Receipt },
                { id: 'debt', label: 'Công nợ', icon: DollarSign },
                { id: 'prices', label: 'Bảng giá', icon: ArrowUpDown }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCustomerTab(tab.id as typeof activeCustomerTab)}
                  className={`flex-1 min-w-0 px-3 py-3 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
                    activeCustomerTab === tab.id
                      ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                      : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              
              {/* TAB: INFO */}
              {activeCustomerTab === 'info' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Số điện thoại</p>
                        <p className="text-sm font-semibold">{activeDetailKh.sdt}</p>
                      </div>
                    </div>
                    {activeDetailKh.diaChi && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Địa chỉ</p>
                          <p className="text-sm">{activeDetailKh.diaChi}</p>
                        </div>
                      </div>
                    )}
                    {activeDetailKh.mst && (
                      <div className="flex items-start gap-3">
                        <FileSpreadsheet className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Mã số thuế</p>
                          <p className="text-sm font-mono">{activeDetailKh.mst}</p>
                        </div>
                      </div>
                    )}
                    {activeDetailKh.ghiChu && (
                      <div className="flex items-start gap-3">
                        <Settings className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Ghi chú</p>
                          <p className="text-sm">{activeDetailKh.ghiChu}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                      <p className="text-lg font-black text-emerald-700">{formatMoney(activeCustomerStats.totalSpent)}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Tổng mua</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                      <p className="text-lg font-black text-purple-700">{formatMoney(activeCustomerStats.totalReturns)}</p>
                      <p className="text-[10px] text-purple-600 font-medium">Đã trả</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: INVOICES */}
              {activeCustomerTab === 'invoices' && (
                <div className="space-y-3">
                  {activeCustomerInvoices.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có đơn hàng nào</p>
                    </div>
                  ) : (
                    activeCustomerInvoices.map(inv => (
                      <div 
                        key={inv.id}
                        className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-indigo-200 transition cursor-pointer"
                        onClick={() => {
                          setViewingInvoice(inv);
                          setViewingInvoiceDetails(chiTietHoaDon.filter(ct => ct.hoaDonId === inv.id));
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-700 text-xs">{inv.id}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                inv.conNo > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {inv.conNo > 0 ? 'Còn nợ' : 'Đã dứt điểm'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">{inv.ngay}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm text-slate-800">{formatMoney(inv.thanhTien)}</p>
                            {inv.conNo > 0 && (
                              <p className="text-[10px] text-red-600 font-semibold">Nợ: {formatMoney(inv.conNo)}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{(chiTietHoaDon.filter(ct => ct.hoaDonId === inv.id)).length} sản phẩm</span>
                          <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                            Xem chi tiết <Eye className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: DEBT */}
              {activeCustomerTab === 'debt' && (
                <div className="space-y-3">
                  {/* Repay Debt Form */}
                  {activeDetailKh && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const currentDebt = customerDebts[selectedCustomerId!] || 0;
                        if (repayAmount <= 0) {
                          alert('Vui lòng nhập số tiền trả nợ!');
                          return;
                        }
                        if (repayAmount > currentDebt) {
                          alert(`Số tiền trả không được vượt quá số nợ hiện tại (${formatMoney(currentDebt)})!`);
                          return;
                        }
                        const newCongNo: CongNo = {
                          id: `CN${Date.now()}`,
                          khachHangId: selectedCustomerId!,
                          loai: 'Thanh toán',
                          soTien: repayAmount,
                          ngay: new Date().toISOString().split('T')[0],
                          ghiChu: repayNote || 'Thanh toán công nợ'
                        };
                        onAddCongNo(newCongNo);
                        setRepayAmount(0);
                        setRepayNote('');
                        setRepayAll(false);
                        alert('Đã ghi nhận thanh toán công nợ!');
                      }}
                      className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <p className="text-xs font-bold text-emerald-800">Trả nợ cho {activeDetailKh.ten}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-emerald-700 font-semibold min-w-20">Số tiền:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Nhập số tiền..."
                          value={repayAmount > 0 ? formatNumberWithCommas(repayAmount) : ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, '');
                            const numVal = parseInt(val, 10) || 0;
                            setRepayAmount(numVal);
                            setRepayAll(numVal >= (customerDebts[selectedCustomerId!] || 0));
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-mono text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={repayAll}
                          onChange={(e) => {
                            setRepayAll(e.target.checked);
                            if (e.target.checked) {
                              setRepayAmount(customerDebts[selectedCustomerId!] || 0);
                            }
                          }}
                          className="w-4 h-4 rounded accent-emerald-600"
                        />
                        <span className="text-sm text-emerald-700 font-semibold">Trả hết nợ ({formatMoney(customerDebts[selectedCustomerId!] || 0)})</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ghi chú (tùy chọn)..."
                        value={repayNote}
                        onChange={(e) => setRepayNote(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm"
                      >
                        Xác nhận trả nợ
                      </button>
                    </form>
                  )}

                  {/* Debt Summary */}
                  <div className={`rounded-xl p-4 text-center font-bold ${
                    customerDebts[selectedCustomerId!] > 0 
                      ? 'bg-red-50 border border-red-200 text-red-700' 
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}>
                    <p className="text-[10px] uppercase opacity-75">Dư nợ hiện tại</p>
                    <p className="text-2xl font-black mt-1">{formatMoney(Math.abs(customerDebts[selectedCustomerId!] || 0))}</p>
                  </div>

                  {/* Debt History */}
                  {activeCustomerDebtLogs.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có giao dịch nào</p>
                    </div>
                  ) : (
                    activeCustomerDebtLogs.map(cn => (
                      <div key={cn.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          cn.loai === 'Ghi nợ' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <ArrowUpDown className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cn.loai === 'Ghi nợ' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {cn.loai}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{cn.ngay}</span>
                          </div>
                          {cn.ghiChu && (
                            <p className="text-xs text-slate-600 mt-1">{cn.ghiChu}</p>
                          )}
                        </div>
                        <span className={`font-mono font-bold text-sm shrink-0 ${
                          cn.loai === 'Ghi nợ' ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {cn.loai === 'Ghi nợ' ? '+' : '-'}{formatMoney(cn.soTien)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: PRICES */}
              {activeCustomerTab === 'prices' && (
                <div className="space-y-3">
                  {/* Add custom price form */}
                  <form onSubmit={handleAddCustomPriceSubmit} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-3">
                    <p className="text-xs font-bold text-indigo-800">Thêm giá sỉ riêng</p>
                    <select
                      value={newGkhSpId}
                      onChange={(e) => setNewGkhSpId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="">-- Chọn dòng máy --</option>
                      {sanPham.map(s => (
                        <option key={s.id} value={s.id}>{s.ten} ({formatMoney(s.giaBan)})</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Giá sỉ ưu đãi..."
                      value={formatNumberWithCommas(newGkhPrice)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setNewGkhPrice(parseInt(val, 10) || 0);
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-mono text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm"
                    >
                      Lưu giá sỉ
                    </button>
                  </form>

                  {/* List of custom prices */}
                  <div className="space-y-2">
                    {activeCustomerCustomPrices.map(g => {
                      const sRef = sanPham.find(sp => sp.id === g.sanPhamId);
                      return (
                        <div key={g.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{sRef ? sRef.ten : '(Đã xóa)'}</p>
                            <p className="text-[10px] text-slate-400">Giá gốc: {formatMoney(sRef?.giaBan || 0)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-600">{formatMoney(g.giaRieng)}</span>
                            <button
                              onClick={() => onRemoveGiaKhachHang(g.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {activeCustomerCustomPrices.length === 0 && (
                      <div className="text-center py-6 text-slate-400">
                        <ArrowUpDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa thiết lập giá sỉ riêng</p>
                        <p className="text-[10px] mt-1">Dùng bảng giá mặc định</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AD CUSTOMER MODAL OVERLAY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-50 w-7 h-7 rounded-full flex items-center justify-center border border-slate-100"
            >
              ✖
            </button>

            <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-1">
              🏢 Đăng ký đại lý sỉ mới
            </h3>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Tên Đại lý / Cửa hàng / Khách mua sỉ (*)</label>
                <input
                  type="text"
                  required
                  value={newTen}
                  onChange={(e) => setNewTen(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
                  placeholder="Ví dụ: Hoàng Hà Mobile Hải Phòng..."
                  id="new_customer_name"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Số Điện Thoại liên lạc (*)</label>
                <input
                  type="text"
                  required
                  value={newSdt}
                  onChange={(e) => setNewSdt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
                  placeholder="Ví dụ: 0945xxxxxx"
                  id="new_customer_phone"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Địa chỉ Đại lý / Chành xe nhận hàng</label>
                <input
                  type="text"
                  value={newDiaChi}
                  onChange={(e) => setNewDiaChi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
                  placeholder="Nhập địa chỉ của cửa hàng để giao chành xe..."
                  id="new_customer_address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Mã số thuế đại lý</label>
                  <input
                    type="text"
                    value={newMst}
                    onChange={(e) => setNewMst(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
                    placeholder="Mã số thuế doanh nghiệp sỉ"
                    id="new_customer_mst"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Ghi chú hành vi sỉ</label>
                  <input
                    type="text"
                    value={newGhiChu}
                    onChange={(e) => setNewGhiChu(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
                    placeholder="Thanh toán gối đầu / trả tiền ngay"
                    id="new_customer_note"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-md transition-all bg-indigo-600 mt-2"
                id="btn_submit_customer"
              >
                Hoàn tất đăng ký & cấp mã KH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE DETAIL MODAL */}
      {viewingInvoice && (
        <InvoiceDetailModal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          invoice={viewingInvoice}
          details={viewingInvoiceDetails}
          customer={khachHang.find(k => k.id === viewingInvoice.khachHangId) || {
            id: viewingInvoice.khachHangId,
            ten: 'Khách hàng',
            sdt: '',
            diaChi: '',
            mst: '',
            ghiChu: '',
            ngayTao: ''
          }}
          storeInfo={storeInfo}
          traHang={traHang}
        />
      )}

    </div>
  );
}

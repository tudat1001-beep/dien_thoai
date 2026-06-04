import React, { useState, useMemo } from 'react';
import { HoaDon, ChiTietHoaDon, TraHang, KhachHang, SanPham } from '../types';
import { ArrowLeftRight, FileText, BadgeAlert, Smile, AlertCircle, ShoppingBag, Send, ShieldAlert, Check } from 'lucide-react';

interface ReturnsViewProps {
  hoaDon: HoaDon[];
  chiTietHoaDon: ChiTietHoaDon[];
  khachHai: KhachHang[]; // list of customers for matching invoices
  traHang: TraHang[];
  onAddTraHang: (traHang: TraHang) => void;
}

export default function ReturnsView({
  hoaDon,
  chiTietHoaDon,
  khachHai,
  traHang,
  onAddTraHang
}: ReturnsViewProps) {
  const [selectedKhId, setSelectedKhId] = useState('');
  const [selectedHdId, setSelectedHdId] = useState('');
  const [selectedCtId, setSelectedCtId] = useState('');
  const [soLuongTra, setSoLuongTra] = useState<number>(1);
  const [lyDo, setLyDo] = useState('');
  const [phuongThuc, setPhuongThuc] = useState<'Trừ vào công nợ' | 'Hoàn tiền mặt'>('Trừ vào công nợ');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // List of invoices that have clickable details
  const invoicesList = useMemo(() => {
    let filtered = hoaDon;
    
    // Filter by selected customer if any
    if (selectedKhId && selectedKhId !== 'KH_VANGLAI') {
      filtered = filtered.filter(hd => hd.khachHangId === selectedKhId);
    }
    
    // Search filter
    if (invoiceSearch) {
      const search = invoiceSearch.toLowerCase();
      filtered = filtered.filter(hd => {
        const kh = khachHai.find(k => k.id === hd.khachHangId);
        return hd.id.toLowerCase().includes(search) ||
               (kh?.ten || '').toLowerCase().includes(search) ||
               (kh?.sdt || '').includes(search);
      });
    }
    
    return filtered.map(hd => {
      const khRef = khachHai.find(k => k.id === hd.khachHangId);
      return {
        ...hd,
        tenKhach: khRef ? khRef.ten : '(Khách hàng ẩn)',
        sdtKhach: khRef?.sdt || ''
      };
    });
  }, [hoaDon, khachHai, selectedKhId, invoiceSearch]);

  // Filtered customers based on search (include vãng lai option)
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) {
      return [{ id: 'KH_VANGLAI', ten: '🛒 Khách vãng lai', sdt: '' } as KhachHang, ...khachHai];
    }
    const search = customerSearch.toLowerCase();
    const walkIn: KhachHang[] = [];
    if ('khách vãng lai'.includes(search) || 'vãng lai'.includes(search)) {
      walkIn.push({ id: 'KH_VANGLAI', ten: '🛒 Khách vãng lai', sdt: '' } as KhachHang);
    }
    const matched = khachHai.filter(kh =>
      kh.ten.toLowerCase().includes(search) || kh.sdt.includes(search)
    );
    return [...walkIn, ...matched];
  }, [khachHai, customerSearch]);

  // Line items for the selected invoice
  const selectedInvoiceDetails = useMemo(() => {
    if (!selectedHdId) return [];
    return chiTietHoaDon.filter(ct => ct.hoaDonId === selectedHdId);
  }, [chiTietHoaDon, selectedHdId]);

  // Selected Line Item Detail reference object
  const activeDetail = useMemo(() => {
    return selectedInvoiceDetails.find(ct => ct.id === selectedCtId) || null;
  }, [selectedInvoiceDetails, selectedCtId]);

  // Calculate cumulative returned quantity for the current selected invoice + product line-item over time
  const totalReturnedQty = useMemo(() => {
    if (!selectedHdId || !activeDetail) return 0;
    return traHang
      .filter(t => t.hoaDonId === selectedHdId && t.sanPhamId === activeDetail.sanPhamId)
      .reduce((sum, t) => sum + t.soLuong, 0);
  }, [traHang, selectedHdId, activeDetail]);

  const maxReturnableQty = useMemo(() => {
    if (!activeDetail) return 0;
    const remaining = activeDetail.soLuong - totalReturnedQty;
    return remaining < 0 ? 0 : remaining;
  }, [activeDetail, totalReturnedQty]);

  const executeReturn = () => {
    // Calculate refund value
    const refundUnitValue = activeDetail ? activeDetail.donGia : 0;
    const totalRefund = refundUnitValue * soLuongTra;

    const nextId = `TH${Math.floor(100 + Math.random() * 900)}`;
    const newTraHang: TraHang = {
      id: nextId,
      hoaDonId: selectedHdId,
      sanPhamId: activeDetail ? activeDetail.sanPhamId : '',
      soLuong: soLuongTra,
      imei: activeDetail?.imei || '',
      ngayTra: new Date().toISOString().split('T')[0],
      soTienHoanTrat: totalRefund,
      lyDo: lyDo,
      phuongThuc: phuongThuc
    };

    onAddTraHang(newTraHang);

    setSuccessMsg(`Đã tạo thành công lệnh thu hồi ${nextId}! Trả lại kho ${soLuongTra} máy, đối trừ tài chính: ${formatMoney(totalRefund)}.`);
    setTimeout(() => setSuccessMsg(''), 6000);

    // Reset Form inputs
    setSelectedKhId('');
    setSelectedHdId('');
    setSelectedCtId('');
    setSoLuongTra(1);
    setLyDo('');
    setInvoiceSearch('');
    setCustomerSearch('');
    setPhuongThuc('Trừ vào công nợ');
  };

  // Handle Return Submission
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!selectedKhId || !selectedHdId || !selectedCtId || soLuongTra <= 0 || !lyDo) {
      setErrorMsg('Vui lòng hoàn thành Đại lý, Hóa đơn sỉ gốc, Dòng máy trả lại, Số lượng trả và Lý do thu hồi!');
      return;
    }

    if (activeDetail && soLuongTra > maxReturnableQty) {
      setErrorMsg(`Chỉ được hoàn tối đa ${maxReturnableQty} chiếc dòng máy này (Mua: ${activeDetail.soLuong} máy, đã hoàn trước đó: ${totalReturnedQty} máy)!`);
      return;
    }

    setShowConfirm(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* MOBILE: appears 1st | DESKTOP: LEFT side (col-span-7) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-rose-500" />
              Sổ theo dõi thu hồi & trả hàng (`TraHang`)
            </h3>
            <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
              {traHang.length} giao dịch
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[calc(100vh-220px)] overflow-y-auto">
            {traHang.map((t) => {
              const invoicesDetails = invoicesList.find(i => i.id === t.hoaDonId);
              return (
                <div key={t.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                          {t.id}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Đơn gốc: {t.hoaDonId}</span>
                        <span className="text-xs text-slate-500 font-semibold">• Đối tác: {invoicesDetails?.tenKhach || 'Đối tác'}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">Dòng máy thu hồi: <strong className="text-slate-700">{t.sanPhamId}</strong> (SL: {t.soLuong})</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium block">
                        Ngày hoàn: {t.ngayTra}
                      </span>
                      <strong className="text-sm font-mono text-rose-600 block mt-1">
                        -{formatMoney(t.soTienHoanTrat)}
                      </strong>
                    </div>
                  </div>

                  {/* Reason Display */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                    <div>
                      <span className="text-slate-400">Phương thức:</span>{' '}
                      <span className="text-amber-700 font-bold">{t.phuongThuc}</span>
                    </div>
                    <div className="col-span-2 pt-1 mt-1 border-t border-slate-150 text-slate-500 italic flex items-center gap-1">
                      <BadgeAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Lý do: {t.lyDo}
                    </div>
                  </div>
                </div>
              );
            })}

            {traHang.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs">
                Chưa có bất kỳ lệnh thu hồi / trả hàng nào được ghi nhận trong cơ sở dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE: appears 2nd | DESKTOP: RIGHT side (col-span-5) */}
      <div className="lg:col-span-5 order-first lg:order-last space-y-4">
        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-lg flex items-start gap-2 shadow-sm animate-bounce">
            <Smile className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <div>{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-lg flex items-start gap-2 shadow-sm">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
            <div>{errorMsg}</div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-xs space-y-4">
          <div className="border-b border-slate-105 pb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-rose-500" />
            <h3 className="font-extrabold text-slate-850 text-sm uppercase">Khai báo thu hồi trả máy sỉ</h3>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-4">
            
            {/* 1. Chọn Đại lý - Tìm kiếm dropdown */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-600">Chọn Đại lý (*):</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm đại lý..."
                  value={selectedKhId === 'KH_VANGLAI' ? '🛒 Khách vãng lai' : (customerSearch || (selectedKhId ? khachHai.find(k => k.id === selectedKhId)?.ten || '' : ''))}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  className="w-full px-2.5 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                {showCustomerDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs">Không tìm thấy</div>
                    ) : (
                      filteredCustomers.map(kh => (
                        <button
                          key={kh.id}
                          type="button"
                          onClick={() => {
                            setSelectedKhId(kh.id);
                            setSelectedHdId('');
                            setSelectedCtId('');
                            setShowCustomerDropdown(false);
                            setCustomerSearch('');
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-rose-50 border-b border-slate-100 last:border-0 ${selectedKhId === kh.id ? 'bg-rose-100' : ''}`}
                        >
                          <div className={`font-medium text-xs ${kh.id === 'KH_VANGLAI' ? 'text-rose-700' : 'text-slate-800'}`}>{kh.ten}</div>
                          {kh.sdt && <div className="text-[10px] text-slate-500 font-mono">{kh.sdt}</div>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Tìm kiếm / Chọn Hóa đơn */}
            {selectedKhId && (
              <div className="space-y-2 animate-fade-in">
                <label className="block font-bold text-slate-600">Tìm hóa đơn (*):</label>
                <input
                  type="text"
                  placeholder="Tìm theo mã HD..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
                
                {/* Danh sách hóa đơn có thể chọn */}
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50">
                  {invoicesList.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">Không có hóa đơn</div>
                  ) : (
                    invoicesList.map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setSelectedHdId(h.id);
                          setSelectedCtId('');
                        }}
                        className={`w-full text-left p-2.5 border-b border-slate-100 last:border-0 hover:bg-rose-50 transition ${
                          selectedHdId === h.id ? 'bg-rose-100' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-rose-700">{h.id}</span>
                          <span className="text-xs text-slate-500">{h.ngay}</span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                          <span className="text-xs text-slate-600">{h.tenKhach}</span>
                          {h.sdtKhach && <span className="text-[10px] text-slate-400 font-mono">{h.sdtKhach}</span>}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">{formatMoney(h.thanhTien)}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. Choose Line Item */}
            {selectedHdId && (
              <div className="space-y-1 animate-fade-in">
                <label className="block font-bold text-slate-600">Chọn thiết bị hoàn trả (*):</label>
                <select
                  value={selectedCtId}
                  onChange={(e) => {
                    setSelectedCtId(e.target.value);
                  }}
                  className="w-full px-2.5 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                >
                  <option value="">-- Click chọn sản phẩm thiết bị --</option>
                  {selectedInvoiceDetails.map(ct => {
                    const ctReturnedQty = traHang
                      .filter(t => t.hoaDonId === selectedHdId && t.sanPhamId === ct.sanPhamId)
                      .reduce((sum, t) => sum + t.soLuong, 0);
                    const remainingQt = ct.soLuong - ctReturnedQty;
                    const isFullyReturned = remainingQt <= 0;
                    return (
                      <option key={ct.id} value={ct.id} disabled={isFullyReturned}>
                        {ct.tenSanPham} (Đã mua {ct.soLuong} máy • Đã trả {ctReturnedQty} máy • Còn trả được {remainingQt} máy) {isFullyReturned ? ' [ĐÃ HẾT]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* 3. Return Details (Qty & Method) */}
            {activeDetail && (
              <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-lg space-y-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-655 font-semibold text-rose-850">Số lượng hoàn trả (*):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={maxReturnableQty}
                    value={soLuongTra}
                    onChange={(e) => setSoLuongTra(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white font-mono font-bold rounded focus:ring-1 focus:ring-rose-400"
                    id="return_input_qty"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-sans font-medium">
                    Tối đa có thể trả thêm: <strong className="text-rose-700">{maxReturnableQty} máy</strong> (Đã mua {activeDetail.soLuong} - Đã trả trước đó {totalReturnedQty})
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Cách thức đối trừ tài chính (*):</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={phuongThuc === 'Trừ vào công nợ'}
                        onChange={() => setPhuongThuc('Trừ vào công nợ')}
                      />
                      <span>Trừ vào công nợ sỉ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={phuongThuc === 'Hoàn tiền mặt'}
                        onChange={() => setPhuongThuc('Hoàn tiền mặt')}
                      />
                      <span>Hoàn tiền mặt sỉ</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Reason */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-600">Lý do thu hồi / trả hàng (*):</label>
              <textarea
                required
                rows={3}
                value={lyDo}
                onChange={(e) => setLyDo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:outline-none placeholder-slate-400 bg-slate-50 focus:bg-white transition"
                placeholder="Ví dụ: Thiết bị sọc màn hình bọc đổi trả bảo hành, khách đổi mẫu iPhone và chịu khấu trừ v.v."
                id="return_input_reason"
              />
            </div>

            {/* Checkout Returns */}
            <button
              type="submit"
              disabled={!selectedHdId || !selectedCtId || !lyDo}
              className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                !selectedHdId || !selectedCtId || !lyDo
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer hover:shadow hover:shadow-rose-100'
              }`}
              id="btn_submit_return"
            >
              <Send className="w-3.5 h-3.5" />
              Kiểm tra & Chốt hoàn trả kho
            </button>
          </form>
        </div>

        {/* Informative advice */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
          <p>Lệnh thu hồi sỉ sau khi duyệt sẽ tự động tăng số lượng tồn dòng máy tương ứng trong mục <strong>Sản Phẩm</strong>.</p>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2 bg-rose-50 rounded-full">
                <ArrowLeftRight className="w-5 h-5 shrink-0" />
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm">Xác nhận thu hồi</h4>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              Quá trình này sẽ khôi phục lại tồn kho của sản phẩm sỉ, đồng thời khấu trừ tài chính nợ của đại lý nếu chọn đối trừ công nợ. Xác nhận tiến hành?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition animate-none cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  executeReturn();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

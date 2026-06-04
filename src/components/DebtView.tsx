import React, { useState, useMemo } from 'react';
import { KhachHang, CongNo } from '../types';
import { DollarSign, Bell, ShieldAlert, Sparkles, Filter, Calendar, FileText, CheckCircle } from 'lucide-react';

interface DebtViewProps {
  khachHang: KhachHang[];
  congNo: CongNo[];
  onAddCongNo: (cn: CongNo) => void;
}

export default function DebtView({
  khachHang,
  congNo,
  onAddCongNo
}: DebtViewProps) {
  const [selectedKhId, setSelectedKhId] = useState('');
  const [soTienTra, setSoTienTra] = useState<number>(0);
  const [ghiChu, setGhiChu] = useState('');
  const [dateGiaoDich, setDateGiaoDich] = useState(new Date().toISOString().split('T')[0]);
  const [debtFilter, setDebtFilter] = useState<'all' | 'unpaid' | 'overdue'>('unpaid');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showOverpayConfirm, setShowOverpayConfirm] = useState(false);

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

  // Compile total debt balance dynamically for each customer
  const customerDebts = useMemo(() => {
    const debtsMap: Record<string, number> = {};
    const earliestDebtDate: Record<string, string> = {};

    khachHang.forEach(kh => {
      debtsMap[kh.id] = 0;
    });

    // Sort to compile chronologically
    const sortedLogs = [...congNo].sort((a,b) => a.ngay.localeCompare(b.ngay));

    sortedLogs.forEach(cn => {
      if (debtsMap[cn.khachHangId] !== undefined) {
        if (cn.loai === 'Ghi nợ') {
          debtsMap[cn.khachHangId] += cn.soTien;
          // Set earliest unpaid debt timeline if not set yet
          if (!earliestDebtDate[cn.khachHangId]) {
            earliestDebtDate[cn.khachHangId] = cn.ngay;
          }
        } else if (cn.loai === 'Thanh toán' || cn.loai === 'Giảm trừ do trả hàng') {
          debtsMap[cn.khachHangId] -= cn.soTien;
          // If debt is fully paid off, reset timeline
          if (debtsMap[cn.khachHangId] <= 0) {
            delete earliestDebtDate[cn.khachHangId];
          }
        }
      }
    });

    return { debtsMap, earliestDebtDate };
  }, [khachHang, congNo]);

  // Evaluate if debt is overdue (>15 days based on earliest debt date vs current local time / system date)
  const isDebtOverdue = (khId: string) => {
    const earliestDateStr = customerDebts.earliestDebtDate[khId];
    if (!earliestDateStr) return false;

    const earliestDate = new Date(earliestDateStr);
    const today = new Date('2026-05-28T08:23:33Z'); // Use current system local time from metadata
    
    const diffTime = Math.abs(today.getTime() - earliestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 15; // Overdue if unpaid for more than 15 days
  };

  // List of customers filtered by debt status
  const filteredDebtCustomers = useMemo(() => {
    return khachHang.map(kh => {
      const duNo = customerDebts.debtsMap[kh.id] || 0;
      const isOverdue = isDebtOverdue(kh.id);
      const earliestDate = customerDebts.earliestDebtDate[kh.id] || null;

      return {
        ...kh,
        duNo,
        isOverdue,
        earliestDate
      };
    }).filter(item => {
      if (debtFilter === 'unpaid') return item.duNo > 0;
      if (debtFilter === 'overdue') return item.duNo > 0 && item.isOverdue;
      return true;
    });
  }, [khachHang, customerDebts, debtFilter]);

  const executePayment = () => {
    const nextId = `CN00${congNo.length + 1}`;
    const newCn: CongNo = {
      id: nextId,
      khachHangId: selectedKhId,
      ngay: dateGiaoDich,
      loai: 'Thanh toán',
      soTien: soTienTra,
      ghiChu: ghiChu || `Thu nợ gối đầu trực tiếp`
    };

    onAddCongNo(newCn);
    setSuccessMsg(`Đã thu công nợ sỉ thành công từ đại lý! Số phiếu: ${nextId}.`);
    
    // reset form
    setSoTienTra(0);
    setGhiChu('');
    setTimeout(() => setSuccessMsg(''), 6050);
  };

  // Handle direct debt payment registration
  const handleReceivePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!selectedKhId || soTienTra <= 0) {
      setErrorMsg('Vui lòng chọn khách nợ và điền số tiền thanh khoản hợp lý!');
      return;
    }

    const outstandingDebt = customerDebts.debtsMap[selectedKhId] || 0;
    if (soTienTra > outstandingDebt) {
      setShowOverpayConfirm(true);
      return;
    }

    executePayment();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SECTION: OUTSTANDING DEBTS GRID & TIMELINE (col-span-8) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Filter controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500 animate-bounce" />
            Kiểm soát dư nợ của các đại lý sỉ
          </h2>

          <div className="flex bg-slate-100 rounded-lg p-1 text-[11px] font-bold text-slate-500">
            <button
              onClick={() => setDebtFilter('unpaid')}
              className={`px-3 py-1.5 rounded-md transition ${debtFilter === 'unpaid' ? 'bg-white text-rose-700 shadow-xs' : 'hover:text-slate-800'}`}
            >
              Chỉ đại lý nợ ({khachHang.filter(k => (customerDebts.debtsMap[k.id] || 0) > 0).length})
            </button>
            <button
              onClick={() => setDebtFilter('overdue')}
              className={`px-3 py-1.5 rounded-md transition ${debtFilter === 'overdue' ? 'bg-white text-red-600 shadow-xs' : 'hover:text-slate-800'}`}
            >
              Nợ quá hạn &gt;15 ngày ({khachHang.filter(k => isDebtOverdue(k.id)).length})
            </button>
            <button
              onClick={() => setDebtFilter('all')}
              className={`px-3 py-1.5 rounded-md transition ${debtFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-800'}`}
            >
              Toàn bộ hồ sơ sỉ ({khachHang.length})
            </button>
          </div>
        </div>

        {/* List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebtCustomers.map((item) => {
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-5 space-y-3 shadow-xs relative overflow-hidden transition-all ${
                  item.isOverdue && item.duNo > 0 
                  ? 'border-red-300 bg-red-50/10' 
                  : item.duNo > 0 
                  ? 'border-indigo-150' 
                  : 'border-slate-200 opacity-70'
                }`}
              >
                {/* Overdue Red Strip flag */}
                {item.isOverdue && item.duNo > 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white font-mono font-bold text-[8px] uppercase tracking-wider py-0.5 px-3 rounded-bl-lg flex items-center gap-0.5">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    Quá hạn gối đầu
                  </div>
                )}

                {/* Profile Identity */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono bg-zinc-100 text-zinc-500 font-bold px-1.5 rounded">
                      {item.id}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1">{item.ten}</h3>
                    <p className="text-xs text-slate-500 font-mono">{item.sdt}</p>
                  </div>
                </div>

                {/* Balance display */}
                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium">Số dư nợ hiện thời:</span>
                    <strong className={`block font-mono text-base font-black ${item.duNo > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {formatMoney(item.duNo)}
                    </strong>
                  </div>
                  <div className="text-right flex flex-col justify-end">
                    {item.earliestDate ? (
                      <>
                        <span className="text-[9px] text-slate-400">Nợ cũ nhất từ:</span>
                        <span className="font-mono text-zinc-600 font-semibold">{item.earliestDate}</span>
                      </>
                    ) : (
                      <span className="text-emerald-600 font-medium flex items-center justify-end gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã thanh toán hết
                      </span>
                    )}
                  </div>
                </div>

                {/* Action shortcut to load into payment form */}
                {item.duNo > 0 && (
                  <button
                    onClick={() => {
                      setSelectedKhId(item.id);
                      setSoTienTra(item.duNo);
                    }}
                    className="w-full mt-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition"
                    id={`btn_set_payment_${item.id}`}
                  >
                    Nạp nhanh số tiền nợ vào phiếu thu
                  </button>
                )}
              </div>
            );
          })}

          {filteredDebtCustomers.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              Không có dánh sách đại lý sỉ nào phù hợp với điều kiện lọc trên.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: REGISTER DIRECT DEBT PAYMENT FORM (col-span-4) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm text-xs">
          <div className="border-b border-sidebar-100 pb-3 flex items-center gap-1.5">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">Ghi nhận biên lai thu nợ</h3>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-lg flex items-center gap-2 font-semibold animate-bounce">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleReceivePaymentSubmit} className="space-y-4">
            
            {/* Choose Customer */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-600">Lựa chọn khách nợ sỉ (*):</label>
              <select
                value={selectedKhId}
                onChange={(e) => setSelectedKhId(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none"
                id="payment_select_customer"
              >
                <option value="">-- Click chọn khách sỉ --</option>
                {khachHang.map(k => {
                  const duNo = customerDebts.debtsMap[k.id] || 0;
                  return (
                    <option key={k.id} value={k.id} disabled={duNo <= 0}>
                      {k.ten} (Còn nợ: {formatMoney(duNo)})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Payment Input */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-600">Số tiền Thu hồi nợ (VND) (*):</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formatNumberWithCommas(soTienTra)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  setSoTienTra(parseInt(val, 10) || 0);
                }}
                className="w-full px-3 py-2 border border-slate-250 text-sm font-mono font-bold text-emerald-600 rounded-lg focus:outline-none"
                placeholder="Ví dụ: 5,000,000"
                id="payment_input_amount"
              />
            </div>

            {/* Date Input */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-600">Ngày ghi sổ thu nợ (*):</label>
              <input
                type="date"
                required
                value={dateGiaoDich}
                onChange={(e) => setDateGiaoDich(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 font-mono text-slate-700 rounded-lg focus:outline-none bg-slate-50"
              />
            </div>

            {/* Extra notes */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-600">Nội dung / Ghi chú thanh toán:</label>
              <input
                type="text"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg focus:outline-none"
                placeholder="Chuyển khoản Vietcombank v.v."
                id="payment_input_note"
              />
            </div>

            {/* Action */}
            <button
              type="submit"
              disabled={!selectedKhId || soTienTra <= 0}
              className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wide shadow-xs transition-all ${
                !selectedKhId || soTienTra <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow'
              }`}
              id="btn_submit_payment"
            >
              Cấp Biên nhận Thu nợ sỉ
            </button>
          </form>
        </div>

        {/* Quick reminder box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500 space-y-1">
          <strong className="text-slate-700">Chính sách Đại lý cấp 1:</strong>
          <p>Mỗi hóa đơn sỉ nợ gối (chưa thanh toán đủ) sẽ tự động tạo một lệnh "Ghi nợ" trong sổ. Hãy luôn thu bớt nợ gối sau 15 ngày để đề phòng rủi ro dòng tiền và duy trì doanh nghiệp lành mạnh.</p>
        </div>
      </div>

      {showOverpayConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="p-2 bg-amber-50 rounded-full">
                <ShieldAlert className="w-5 h-5 shrink-0" />
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm">Xác nhận thanh dư</h4>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              Đại lý hiện chỉ nợ {formatMoney(customerDebts.debtsMap[selectedKhId] || 0)}. Số tiền thanh toán {formatMoney(soTienTra)} sẽ tạo ra số dư âm (thanh dư credit). Bạn muốn tiếp tục nạp tiền chứ?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowOverpayConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowOverpayConfirm(false);
                  executePayment();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                Tiếp tục nạp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

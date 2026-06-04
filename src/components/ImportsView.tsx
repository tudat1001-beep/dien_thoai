import React, { useState, useMemo } from 'react';
import { SanPham, NhapHang } from '../types';
import { 
  PackagePlus, 
  Check, 
  Search, 
  Calendar, 
  Layers, 
  DollarSign, 
  Barcode, 
  FileText, 
  PlusCircle, 
  Sparkles, 
  Info,
  CalendarDays,
  History,
  Trash2
} from 'lucide-react';

interface ImportsViewProps {
  sanPham: SanPham[];
  onAddSanPham: (sp: SanPham) => void;
  onUpdateSanPham: (spId: string, updatedFields: Partial<SanPham>) => void;
  lichSuNhap: NhapHang[];
  onAddNhapHang: (nh: NhapHang) => void;
  onClearLichSuNhap?: () => void;
}

export default function ImportsView({
  sanPham,
  onAddSanPham,
  onUpdateSanPham,
  lichSuNhap,
  onAddNhapHang,
  onClearLichSuNhap
}: ImportsViewProps) {
  // Navigation inside view: 'create' or 'history'
  const [subTab, setSubTab] = useState<'create' | 'history'>('create');

  // New import form states
  const [selectedSpId, setSelectedSpId] = useState('');
  const [isNewSpMode, setIsNewSpMode] = useState(false);

  // New product quick declaration fields
  const [quickSpName, setQuickSpName] = useState('');
  
  // Standard import fields
  const [giaNhap, setGiaNhap] = useState<number>(0);
  const [giaBan, setGiaBan] = useState<number>(0);
  const [soLuong, setSoLuong] = useState<number>(0);
  const [imeiText, setImeiText] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [ngayNhap, setNgayNhap] = useState(() => new Date().toISOString().split('T')[0]);
  const [shouldUpdatePrices, setShouldUpdatePrices] = useState(true);

  // Status state
  const [successMsg, setSuccessMsg] = useState('');
  const [searchHistoryTerm, setSearchHistoryTerm] = useState('');

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

  // Auto-detect IMEIs list from text area
  const parsedImeis = useMemo(() => {
    if (!imeiText.trim()) return [];
    return imeiText
      .split(/[\n,\s]+/)
      .map(i => i.trim())
      .filter(i => i.length > 0);
  }, [imeiText]);

  // Sync Quantity with IMEI count if IMEIs are entered
  const handleSyncImeiCount = () => {
    if (parsedImeis.length > 0) {
      setSoLuong(parsedImeis.length);
    }
  };

  // Find info of current product selected
  const activeSp = useMemo(() => {
    return sanPham.find(s => s.id === selectedSpId);
  }, [sanPham, selectedSpId]);

  // Handle selected product changing
  const handleProductSelect = (id: string) => {
    setSelectedSpId(id);
    const found = sanPham.find(s => s.id === id);
    if (found) {
      setGiaNhap(found.giaNhap);
      setGiaBan(found.giaBan);
    } else {
      setGiaNhap(0);
      setGiaBan(0);
    }
  };

  // Handle Submit Stock-In
  const handleSubmitStockIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNewSpMode) {
      if (!quickSpName.trim()) {
        alert('Vui lòng nhập tên dòng máy mới!');
        return;
      }
      if (giaNhap <= 0 || giaBan <= 0) {
        alert('Vui lòng cung cấp giá nhập và giá sỉ sườn!');
        return;
      }
    } else {
      if (!selectedSpId) {
        alert('Vui lòng chọn dòng máy từ danh mục!');
        return;
      }
    }

    if (soLuong <= 0) {
      alert('Số lượng nhập hàng phải lớn hơn 0!');
      return;
    }

    if (parsedImeis.length > 0 && parsedImeis.length !== soLuong) {
      if (!window.confirm(`Bạn đã điền ${parsedImeis.length} số IMEI nhưng số lượng nhập là ${soLuong}. Hệ thống sẽ vẫn tính số lượng tồn kho cộng thêm là ${soLuong} chiếc. Bạn có muốn tiếp tục?`)) {
        return;
      }
    }

    let finalSpId = selectedSpId;
    let finalSpName = activeSp ? activeSp.ten : '';

    if (isNewSpMode) {
      // 1. Declare and register a new product
      const nextNum = sanPham.length + 1;
      const computedId = `SP${String(nextNum).padStart(3, '0')}`;
      finalSpId = computedId;
      finalSpName = quickSpName.trim();

      const newSp: SanPham = {
        id: computedId,
        ten: finalSpName,
        imei: parsedImeis.join(', '),
        giaNhap: giaNhap,
        giaBan: giaBan,
        tonKho: soLuong,
        trangThai: 'Còn hàng'
      };

      onAddSanPham(newSp);
    } else {
      // 2. Update existing product: Add to inventory, merge new IMEIs
      if (activeSp) {
        const mergedImeiList = activeSp.imei 
          ? activeSp.imei.split(',').map(i => i.trim()).filter(Boolean) 
          : [];
        
        parsedImeis.forEach(imei => {
          if (!mergedImeiList.includes(imei)) {
            mergedImeiList.push(imei);
          }
        });

        const updatedFields: Partial<SanPham> = {
          tonKho: activeSp.tonKho + soLuong,
          trangThai: 'Còn hàng',
          imei: mergedImeiList.join(', ')
        };

        if (shouldUpdatePrices) {
          updatedFields.giaNhap = giaNhap;
          updatedFields.giaBan = giaBan;
        }

        onUpdateSanPham(activeSp.id, updatedFields);
      }
    }

    // 3. Register the Stock-In transaction history
    const importId = `NH${Math.floor(100 + Math.random() * 900)}`;
    const newImport: NhapHang = {
      id: importId,
      ngay: ngayNhap,
      sanPhamId: finalSpId,
      tenSanPham: finalSpName,
      soLuong: soLuong,
      giaNhap: giaNhap,
      tongTien: giaNhap * soLuong,
      imeiList: parsedImeis,
      ghiChu: ghiChu || 'Nhập thêm tồn kho bình thường'
    };

    onAddNhapHang(newImport);

    // Reset Form
    setSelectedSpId('');
    setIsNewSpMode(false);
    setQuickSpName('');
    setGiaNhap(0);
    setGiaBan(0);
    setSoLuong(0);
    setImeiText('');
    setGhiChu('');

    setSuccessMsg('🎉 Đã ghi nhận phiếu nhập hàng sỉ thành công! Tồn kho đã tăng tương ứng.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Filter and compute active history entries
  const filteredHistory = useMemo(() => {
    return lichSuNhap.filter(h => {
      const matchSearch = h.tenSanPham.toLowerCase().includes(searchHistoryTerm.toLowerCase()) ||
                          h.sanPhamId.toLowerCase().includes(searchHistoryTerm.toLowerCase()) ||
                          h.id.toLowerCase().includes(searchHistoryTerm.toLowerCase()) ||
                          h.ghiChu.toLowerCase().includes(searchHistoryTerm.toLowerCase()) ||
                          h.imeiList.some(i => i.includes(searchHistoryTerm));
      return matchSearch;
    });
  }, [lichSuNhap, searchHistoryTerm]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-2 sm:p-4 animate-fade-in no-print">
      
      {/* Visual Header */}
      <div className="border bg-white rounded-2xl shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
              Quản Trị Nhập Hàng Sỉ
            </h2>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Nhập và bổ sung số máy điện thoại, cấu hình giá bán lẻ/sỉ nội bộ, khai báo và nạp dải IMEI hàng loạt để tự động gia tăng số tồn kho sỉ.
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-bold text-slate-655 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setSubTab('create')}
            className={`px-3.5 py-1.5 rounded-md transition duration-150 flex items-center gap-1.5 ${
              subTab === 'create' ? 'bg-white text-slate-850 shadow-xs' : 'hover:text-slate-800'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            Nhập kho máy
          </button>
          <button
            onClick={() => setSubTab('history')}
            className={`px-3.5 py-1.5 rounded-md transition duration-150 flex items-center gap-1.5 ${
              subTab === 'history' ? 'bg-white text-slate-850 shadow-xs' : 'hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch sử nhập sỉ ({lichSuNhap.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold animate-scale-in flex items-center gap-2">
          <Check className="w-4.5 h-4.5 text-emerald-600 stroke-[3]" />
          <span>{successMsg}</span>
        </div>
      )}

      {subTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main workspace Form - 7 Col */}
          <form onSubmit={handleSubmitStockIn} className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-5 sm:p-6 space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block">
                  Cơ chế nạp hàng sỉ
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSpMode(!isNewSpMode);
                    setSelectedSpId('');
                    setQuickSpName('');
                    setGiaNhap(0);
                    setGiaBan(0);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {isNewSpMode ? 'Chọn máy có sẵn' : 'Khai báo mã máy mới'}
                </button>
              </div>

              {!isNewSpMode ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chọn dòng máy hiện hữu (*):
                  </label>
                  <select
                    value={selectedSpId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-205 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                  >
                    <option value="">-- Click để lựa chọn dòng chiếc sỉ --</option>
                    {sanPham.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.ten} (Tồn hiện tại: {s.tonKho} chiếc)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-indigo-50/45 rounded-xl border border-indigo-100/50">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-950 font-black">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Khai báo nhanh dòng máy sỉ hoàn toàn mới</span>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-655 uppercase">
                      Tên dòng máy sỉ thương mại (*):
                    </label>
                    <input
                      type="text"
                      required={isNewSpMode}
                      placeholder="Ví dụ: iPhone 15 Plus 128GB Quốc Tế..."
                      value={quickSpName}
                      onChange={(e) => setQuickSpName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-white text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-indigo-500 leading-normal italic">
                    * Mã số dòng máy (ví dụ SP034) sẽ được hệ thống đếm số phân chia tự động để đảm bảo tính nhất quán của cơ sở.
                  </p>
                </div>
              )}

              {/* Prices layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Đơn giá nhập mới sườn (VNĐ) (*):
                    </label>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatNumberWithCommas(giaNhap)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setGiaNhap(parseInt(val, 10) || 0);
                    }}
                    placeholder="Đơn giá nhập vào"
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-xs font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none"
                  />
                  {activeSp && (
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Vốn cũ: {formatMoney(activeSp.giaNhap)}
                    </span>
                  )}
                </div>

                <div className="space-y-1 w-full font-sans">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Cập nhật giá sỉ sườn (VNĐ) (*):
                    </label>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatNumberWithCommas(giaBan)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setGiaBan(parseInt(val, 10) || 0);
                    }}
                    placeholder="Mức giá bán buôn sườn"
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-xs font-mono font-bold text-indigo-650 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                  {activeSp && (
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Nhà sỉ cũ: {formatMoney(activeSp.giaBan)}
                    </span>
                  )}
                </div>

              </div>

              {/* Sync check option */}
              {!isNewSpMode && selectedSpId && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 pl-1">
                  <input
                    type="checkbox"
                    id="update_prices_flag"
                    checked={shouldUpdatePrices}
                    onChange={(e) => setShouldUpdatePrices(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-350 cursor-pointer"
                  />
                  <label htmlFor="update_prices_flag" className="text-xs text-slate-600 font-medium cursor-pointer">
                    Cập nhật Giá Nhập & Giá Sỉ Sườn của dòng máy sỉ ngoài danh mục chung
                  </label>
                </div>
              )}

              {/* Quantity input and Date options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Số lượng máy nhập kho (*):
                    </label>
                    {parsedImeis.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSyncImeiCount}
                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                        title="Sao chép số IMEI đã nạp gán trực tiếp lên số lượng sườn"
                      >
                        Khớp số lượng ({parsedImeis.length})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    value={soLuong || ''}
                    onChange={(e) => setSoLuong(parseInt(e.target.value) || 0)}
                    placeholder="Ví dụ: 10, 25, 50..."
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Thời điểm nhập kho sỉ:
                  </label>
                  <input
                    type="date"
                    required
                    value={ngayNhap}
                    onChange={(e) => setNgayNhap(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-205 rounded-lg text-xs font-mono font-semibold focus:outline-none"
                  />
                </div>

              </div>

              {/* Note details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ghi chú lô hoặc nội dung hóa đơn đầu vào:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: lô hàng nhập tổng kho Chợ Lớn đợt 1..."
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 rounded-lg text-xs focus:outline-none"
                />
              </div>

            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 font-medium">
                {soLuong > 0 && giaNhap > 0 ? (
                  <span>
                    Tổng số vốn tạm chi thanh toán lô này:{' '}
                    <strong className="text-rose-600 font-mono text-xs font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {formatMoney(giaNhap * soLuong)}
                    </strong>
                  </span>
                ) : (
                  'Vui lòng nhập đơn giá và số lượng để máy tự tính tổng thanh toán.'
                )}
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Xác nhận nhập kho sỉ
              </button>
            </div>
          </form>

          {/* Right column: Serials/IMEIs quick bulk parser - 5 Col */}
          <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Barcode className="w-4.5 h-4.5 text-teal-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Dán & Phân tích dải số IMEI
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Khi dán hàng loạt IMEI của điện thoại phân phối (cách nhau bởi phím xuống dòng hoặc dấu phẩy), hệ thống sẽ ghi nhận từng số và liên kết vào dữ liệu dòng máy để tra cứu POS khi bán hàng.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Nội dung danh sách IMEI:</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                  Phát hiện: {parsedImeis.length} số máy
                </span>
              </div>
              <textarea
                value={imeiText}
                onChange={(e) => setImeiText(e.target.value)}
                placeholder="Dán dải IMEI tại đây...&#10;358999123456781&#10;358999123456782&#10;358999123456783"
                rows={9}
                className="w-full p-2.5 border border-slate-250 rounded-xl font-mono text-xs focus:outline-none bg-slate-50/50 focus:bg-white resize-none transition-all focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            {parsedImeis.length > 0 && (
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Bản lọc IMEI trước khi sáp nhập:</span>
                  <button
                    type="button"
                    onClick={() => setImeiText('')}
                    className="text-[10px] text-rose-600 font-bold hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-3 max-h-40 overflow-y-auto text-[10px] font-mono text-slate-600 grid grid-cols-2 gap-1.5 scrollbar-thin">
                  {parsedImeis.map((imei, idx) => (
                    <div key={idx} className="flex items-center gap-1 py-0.5 px-1.5 bg-white rounded border border-slate-200">
                      <span className="text-[8px] text-slate-400 font-bold">#{idx + 1}</span>
                      <span className="truncate block select-all font-bold text-slate-800">{imei}</span>
                    </div>
                  ))}
                </div>
                {soLuong !== parsedImeis.length && (
                  <div className="p-2.5 bg-amber-50 border border-amber-150 rounded-lg text-[11px] text-amber-800 flex items-start gap-1.5 leading-snug animate-pulse">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <p>
                      Cảnh báo: Số lượng ghi nhận nhập sườn đang là <strong>{soLuong} chiếc</strong> khác với số lượng dải IMEI là <strong>{parsedImeis.length}</strong>. Click "Khớp số lượng" phía trên để khớp tự động!
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed flex items-start gap-2 mt-auto">
              <Info className="w-4.5 h-4.5 text-indigo-650 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-indigo-950 uppercase tracking-tight mb-0.5">Sự chính xác sỉ:</strong>
                Việc nạp IMEI sỉ bảo đảm hệ thống chống bán tràn lộn hàng, đồng thời hỗ trợ tra cứu bảo hành, hoặc hoàn trả (Returns) dòng máy bị lỗi của đại lý nhanh chóng theo đúng mã nguồn nhập gốc.
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* History lists - Stock In Log List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-scale-in">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-sm">Nhật ký sáp nhập tổng kho sỉ</h3>
              <p className="text-[11px] text-slate-400">Danh sách lưu các đợt sáp nhập tồn kho, tổng thanh chi và dải IMEI đã nhập.</p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tra cứu IMEI, dòng máy, mã phiếu..."
                  value={searchHistoryTerm}
                  onChange={(e) => setSearchHistoryTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-205 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {onClearLichSuNhap && lichSuNhap.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có thực sự muốn xóa hết lịch sử nhập hàng sỉ sườn này? (Tồn kho của các dòng máy sẽ giữ nguyên không thay đổi)')) {
                      onClearLichSuNhap();
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa lịch sử
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[calc(100vh-270px)] overflow-y-auto">
            {filteredHistory.map((h, i) => (
              <div key={h.id || i} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition">
                
                {/* Product Name & Receipt Code */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-black px-2 py-0.5 rounded">
                      Mã phiếu: {h.id}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                      <Calendar className="w-3 h-3" />
                      {h.ngay}
                    </span>
                    <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded">
                      Mã máy: {h.sanPhamId}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm leading-snug">{h.tenSanPham}</h4>
                  
                  {/* Notes */}
                  <p className="text-xs text-slate-450 italic leading-none">Ghi chú: {h.ghiChu}</p>
                  
                  {/* IMEIs display if there is any */}
                  {h.imeiList && h.imeiList.length > 0 && (
                    <div className="pt-1 select-all">
                      <div className="text-[10px] text-slate-400 mb-1 font-bold">IMEIs lô hàng này ({h.imeiList.length}):</div>
                      <div className="flex flex-wrap gap-1">
                        {h.imeiList.map((im, idx) => (
                          <span key={idx} className="text-[9px] font-mono bg-indigo-50/50 text-indigo-700 px-1 py-0.2 rounded border border-indigo-100/40">
                            {im}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing / Stock changes summary details */}
                <div className="md:text-right shrink-0 flex flex-row md:flex-col justify-between items-center md:items-end gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-x-6 gap-y-1 text-left md:text-right">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Giá Nhạp sườn:</span>
                      <strong className="font-mono text-xs text-slate-705 block font-bold">{formatMoney(h.giaNhap)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-450 block uppercase tracking-wider">Đã bổ sung:</span>
                      <span className="font-mono text-emerald-700 font-bold block bg-emerald-50 text-center md:text-right px-2 py-0.5 rounded border border-emerald-100 self-start md:self-auto text-xs">
                        +{h.soLuong} chiếc
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[9px] text-slate-400 uppercase block leading-none">Thành tiền đầu tư:</span>
                    <strong className="font-mono text-sm text-indigo-650 font-black block mt-1">{formatMoney(h.tongTien)}</strong>
                  </div>
                </div>

              </div>
            ))}

            {filteredHistory.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                Thư mục lịch sử nhập hàng sỉ đang trống
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

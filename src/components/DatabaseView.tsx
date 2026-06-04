import React, { useState } from 'react';
import { 
  FileText, 
  Check, 
  Printer, 
  Building2, 
  PhoneCall, 
  MapPin, 
  Info,
  Sparkles
} from 'lucide-react';

interface DatabaseViewProps {
  // Retaining props interface for system compatibility & seamless compiling
  khachHang: any[];
  sanPham: any[];
  hoaDon: any[];
  chiTietHoaDon: any[];
  congNo: any[];
  giaKhachHang: any[];
  lichSuGia: any[];
  traHang: any[];
  storeInfo: {
    tenCuaHang: string;
    slogan: string;
    diaChi: string;
    hotline: string;
  };
  onUpdateStoreInfo: (info: {
    tenCuaHang: string;
    slogan: string;
    diaChi: string;
    hotline: string;
  }) => void;
  onResetData: () => void;
  isSupabaseLoading: boolean;
  supabaseSyncError: string | null;
  onSyncToSupabase?: () => void;
}

export default function DatabaseView({
  storeInfo,
  onUpdateStoreInfo
}: DatabaseViewProps) {
  // Local form states
  const [storeName, setStoreName] = useState(storeInfo.tenCuaHang);
  const [storeSlogan, setStoreSlogan] = useState(storeInfo.slogan);
  const [storeAddress, setStoreAddress] = useState(storeInfo.diaChi);
  const [storeHotline, setStoreHotline] = useState(storeInfo.hotline);
  const [storeUpdatedMsg, setStoreUpdatedMsg] = useState(false);

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreInfo({
      tenCuaHang: storeName,
      slogan: storeSlogan,
      diaChi: storeAddress,
      hotline: storeHotline
    });
    setStoreUpdatedMsg(true);
    setTimeout(() => {
      setStoreUpdatedMsg(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-2 sm:p-4 animate-fade-in no-print">
      
      {/* Title Header Section */}
      <div className="border bg-white rounded-2xl shadow-xs p-5 flex items-start gap-4 border-slate-200">
        <div className="p-3 bg-indigo-550/10 text-indigo-600 bg-indigo-50 rounded-xl shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cấu Hình Trực Quan Hóa Đơn Sỉ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nơi thay đổi thông tin thương hiệu, hotline, slogan, mã số thuế và văn phòng giao dịch của tổng đại lý sỉ. Toàn bộ thay đổi sẽ được áp dụng trực tiếp lên mẫu in biên nhận xuất kho nhiệt hoặc laser A4 khi xuất hàng cho đại lý thành viên.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column: Setup Form fields (7 cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-650" />
            <h3 className="font-extrabold text-slate-800 text-sm">Điền thông tin thương hiệu</h3>
          </div>

          <form onSubmit={handleSaveStoreInfo} className="p-5 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wide">
                Tên tổng kho / Đơn vị phân phối sỉ (*):
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ví dụ: TỔNG KHO QUẢN LÝ BÁN HÀNG..."
                className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500"
                id="edit_store_name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wide">
                Khẩu hiệu / Slogan kinh nghiệm:
              </label>
              <input
                type="text"
                value={storeSlogan}
                onChange={(e) => setStoreSlogan(e.target.value)}
                placeholder="Ví dụ: Đại lý sỉ cao cấp - Giá gốc tận nhà phân phối..."
                className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-slate-50 focus:bg-white text-xs text-slate-650 focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500"
                id="edit_store_slogan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wide">
                Địa chỉ văn phòng giao dịch / Điểm xuất sỉ (*):
              </label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Ví dụ: ĐC: 124 Hùng Vương, Phường 2, Quận 10, TP.HCM..."
                className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-slate-50 focus:bg-white text-xs focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500"
                id="edit_store_address"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wide">
                Hotline hỗ trợ & Mã số thuế tổng kho (*):
              </label>
              <input
                type="text"
                required
                value={storeHotline}
                onChange={(e) => setStoreHotline(e.target.value)}
                placeholder="Ví dụ: Hotline: 0909.888.999 - MST: 031267899..."
                className="w-full px-3 py-2 border border-slate-205 rounded-lg bg-slate-50 focus:bg-white text-xs font-mono focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500"
                id="edit_store_hotline"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs tracking-wider rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                id="btn_save_store_info"
              >
                <Check className="w-4 h-4" />
                Cập Nhật Layout Hóa Đơn
              </button>
              
              {storeUpdatedMsg && (
                <span className="text-[11px] font-semibold text-emerald-600 animate-scale-in text-center sm:text-left">
                  ✔ Đã lưu cấu hình mới thành công!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Right column: Dynamic Live Preview Mockup (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-start">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-500" />
                <h3 className="font-extrabold text-slate-850 text-xs tracking-wide uppercase text-slate-600">Bản mộc in thử</h3>
              </div>
              <span className="text-[9px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded uppercase">Xem trước</span>
            </div>

            {/* Dynamic replica mockup mimicking Receipt structure with nice monospace elements */}
            <div className="p-6 flex-1 flex flex-col justify-between bg-slate-50/35 relative">
              
              {/* Receipt Header Container */}
              <div className="border border-indigo-100 bg-white p-4 rounded-xl shadow-xs space-y-3.5 text-center relative border-dashed">
                <div className="absolute top-2 right-2 flex items-center text-[8px] text-slate-300 font-mono">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-indigo-400" />
                  Mẫu in sỉ
                </div>

                <div className="space-y-1">
                  <h4 className="text-[13px] font-black uppercase text-slate-900 tracking-wide break-words max-w-full leading-snug">
                    {storeName || 'CỬA HÀNG QUẢN LÝ BÁN HÀNG'}
                  </h4>
                  {storeSlogan && (
                    <p className="text-[10px] text-slate-550 italic leading-tight">
                      {storeSlogan}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-1 text-[10px] text-slate-500 font-sans text-left leading-normal">
                  <p className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-all">{storeAddress || 'ĐC: 124 Hùng Vương, Phường 2, Q10, TP.HCM'}</span>
                  </p>
                  <p className="flex items-start gap-1 font-mono">
                    <PhoneCall className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-all">{storeHotline || 'Hotline: 0909.888.999'}</span>
                  </p>
                </div>
              </div>

              {/* Simulation visual of items table */}
              <div className="mt-4 border-t border-slate-100 pt-3 text-[9px] text-slate-450 font-mono space-y-2">
                <div className="flex justify-between font-bold text-slate-500 border-b border-slate-100 pb-1">
                  <span>Dòng máy</span>
                  <div className="flex gap-4">
                    <span>SL</span>
                    <span>Đơn giá sỉ</span>
                  </div>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>iPhone 15 Pro Max...</span>
                  <div className="flex gap-5 font-bold">
                    <span>10</span>
                    <span>25.500.000đ</span>
                  </div>
                </div>
                <div className="flex justify-between text-slate-400 border-b border-dashed border-slate-200 pb-1.5">
                  <span>Galaxy S24 Ultra...</span>
                  <div className="flex gap-5 font-bold">
                    <span>05</span>
                    <span>21.700.000đ</span>
                  </div>
                </div>
                <div className="flex justify-between text-slate-700 font-extrabold text-[10px] pt-1 leading-none text-right">
                  <span className="text-slate-450 font-normal">Tổng thanh toán sỉ:</span>
                  <span className="text-indigo-600">363.500.000đ</span>
                </div>
              </div>

              {/* Decorative paper cut edge */}
              <div className="mt-4 text-center text-[10px] text-slate-400 font-medium">
                -------------------------------------------------
                <p className="mt-1 text-[8px] italic font-serif">Cảm ơn quý đại lý đại đối tác sỉ đã tín nhiệm!</p>
              </div>

            </div>
          </div>

          <div className="mt-4 bg-slate-50 border border-slate-205 rounded-xl p-3 text-[11px] text-slate-500 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p>
              Mẹo in: Hệ thống sẽ tự lưu trữ cấu hình này vào trình duyệt của máy bạn. Hóa đơn xuất đi sẽ hiển thị đúng chuẩn doanh thu, địa chỉ của bạn.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

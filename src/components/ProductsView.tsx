import React, { useState, useMemo } from 'react';
import { SanPham, LichSuGia } from '../types';
import { Search, PlusCircle, Bookmark, Monitor, Edit2, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

function findNextProductId(sanPham: SanPham[]): string {
  if (sanPham.length === 0) return 'SP001';
  const nums = sanPham
    .map(p => parseInt(p.id.replace('SP', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `SP${String(max + 1).padStart(3, '0')}`;
}

interface ProductsViewProps {
  sanPham: SanPham[];
  lichSuGia: LichSuGia[];
  onAddSanPham: (sp: SanPham) => void;
  onUpdateSanPham: (spId: string, updatedFields: Partial<SanPham>) => void;
}

export default function ProductsView({
  sanPham,
  lichSuGia,
  onAddSanPham,
  onUpdateSanPham
}: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'instock' | 'out'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSp, setEditingSp] = useState<SanPham | null>(null);

  // Form states for New Product
  const [newTen, setNewTen] = useState('');
  const [newTonKho, setNewTonKho] = useState<number>(0);
  const [newGiaNhap, setNewGiaNhap] = useState<number>(0);
  const [newGiaBan, setNewGiaBan] = useState<number>(0);
  const [newLoai, setNewLoai] = useState<'Điện thoại' | 'Linh phụ kiện'>('Điện thoại');

  // Form states for Editing Product
  const [editTen, setEditTen] = useState('');
  const [editTonKho, setEditTonKho] = useState<number>(0);
  const [editGiaNhap, setEditGiaNhap] = useState<number>(0);
  const [editGiaBan, setEditGiaBan] = useState<number>(0);
  const [editLoai, setEditLoai] = useState<'Điện thoại' | 'Linh phụ kiện'>('Điện thoại');

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

  const filteredProducts = useMemo(() => {
    return sanPham.filter(p => {
      const matchesSearch = p.ten.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.imei && p.imei.includes(searchTerm));
      
      if (filterStock === 'instock') return matchesSearch && p.tonKho > 0;
      if (filterStock === 'out') return matchesSearch && p.tonKho === 0;
      return matchesSearch;
    });
  }, [sanPham, searchTerm, filterStock]);

  // Handle addition of a new product
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTen || newGiaNhap <= 0 || newGiaBan <= 0) {
      alert('Vui lòng hoàn tất Tên, Giá nhập và Giá bán!');
      return;
    }

    const nextId = findNextProductId(sanPham);

    const newSp: SanPham = {
      id: nextId,
      ten: newTen,
      imei: '',
      giaNhap: newGiaNhap,
      giaBan: newGiaBan,
      tonKho: newTonKho || 0,
      trangThai: newTonKho > 0 ? 'Còn hàng' : 'Hết hàng',
      loai: newLoai
    };

    onAddSanPham(newSp);
    setShowAddModal(false);

    // Reset Form
    setNewTen('');
    setNewTonKho(0);
    setNewGiaNhap(0);
    setNewGiaBan(0);
    setNewLoai('Điện thoại');
  };

  // Open Edit Mode
  const handleOpenEdit = (p: SanPham) => {
    setEditingSp(p);
    setEditTen(p.ten);
    setEditTonKho(p.tonKho);
    setEditGiaNhap(p.giaNhap);
    setEditGiaBan(p.giaBan);
    setEditLoai(p.loai || 'Điện thoại');
  };

  // Submit edits and check if there is a price trace requirement!
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSp) return;

    if (!editTen || editGiaNhap <= 0 || editGiaBan <= 0) {
      alert('Vui lòng điền đủ Tên sản phẩm và Giá bán!');
      return;
    }

    const updatedFields: Partial<SanPham> = {
      ten: editTen,
      imei: '',
      giaNhap: editGiaNhap,
      giaBan: editGiaBan,
      tonKho: editTonKho,
      trangThai: editTonKho > 0 ? 'Còn hàng' : 'Hết hàng',
      loai: editLoai
    };

    onUpdateSanPham(editingSp.id, updatedFields);
    setEditingSp(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-505 bg-slate-50 focus:bg-white transition"
            id="search_product"
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 rounded-lg p-1 text-[11px] font-bold text-slate-500 flex-1 sm:flex-none">
            <button
              onClick={() => setFilterStock('all')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition touch-feedback ${filterStock === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-800'}`}
            >
              Tất cả ({sanPham.length})
            </button>
            <button
              onClick={() => setFilterStock('instock')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition touch-feedback ${filterStock === 'instock' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-800'}`}
            >
              Còn ({sanPham.filter(s => s.tonKho > 0).length})
            </button>
            <button
              onClick={() => setFilterStock('out')}
              className={`flex-1 sm:flex-none px-3 py-2 rounded-md transition touch-feedback ${filterStock === 'out' ? 'bg-white text-rose-700 shadow-xs' : 'hover:text-slate-800'}`}
            >
              Hết ({sanPham.filter(s => s.tonKho === 0).length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all bg-indigo-600 touch-feedback"
            id="btn_add_product_trigger"
          >
            <PlusCircle className="w-4 h-4" />
            Thêm máy
          </button>
        </div>
      </div>

      {/* Product List - Card Layout */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-slate-800 text-sm">Danh sách dòng máy ({filteredProducts.length})</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const priceHistoryCount = lichSuGia.filter(l => l.sanPhamId === p.id).length;

            return (
              <div 
                key={p.id} 
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer active:scale-[0.99]"
                onClick={() => handleOpenEdit(p)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{p.ten}</h4>
                    <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{p.id}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                    p.tonKho > 0 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {p.tonKho > 0 ? `${p.tonKho} máy` : 'Hết hàng'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Giá nhập:</span>
                    <span className="font-mono text-slate-600">{formatMoney(p.giaNhap)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Giá sỉ:</span>
                    <span className="font-mono font-bold text-indigo-700">{formatMoney(p.giaBan)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    p.loai === 'Linh phụ kiện'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {p.loai || 'Điện thoại'}
                  </span>
                  {priceHistoryCount > 0 && (
                    <span className="text-[9px] text-zinc-400">Đổi giá {priceHistoryCount}x</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400 text-sm">
            Không tìm thấy thiết bị nào
          </div>
        )}
      </div>

      {/* PRICE CHANGE RECORD TRACES COLUMN */}
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-xs space-y-1 text-slate-600">
            <span className="font-extrabold text-indigo-850 block uppercase tracking-tight">Chi tiết Quản Lý Tồn:</span>
            <p>Quản lý tồn kho linh hoạt theo số lượng thực tế trong kho. Trạng thái Còn hàng / Hết hàng sẽ tự động cập nhật dựa trên số lượng tồn hiện có.</p>
          </div>

          {/* B. HISTORICAL PRICE CHANGES TRACES PANEL (`LichSuGia`) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-450 tracking-wider block">Lịch sử thay đổi đơn giá (`LichSuGia`)</span>
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {lichSuGia.map((l) => {
                const sRef = sanPham.find(sp => sp.id === l.sanPhamId);
                const percentChange = ((l.giaMoi - l.giaCu) / l.giaCu) * 100;
                
                return (
                  <div key={l.id} className="text-xs border-b border-dashed border-slate-100 pb-2.5 last:border-0 last:pb-0 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-indigo-650">{l.sanPhamId}</span>
                      <span className="text-slate-400 text-[10px]">{l.ngayThayDoi}</span>
                    </div>
                    <p className="font-semibold text-slate-800 line-clamp-1">{sRef ? sRef.ten : 'Dòng máy đã xóa'}</p>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <div className="font-mono text-slate-400">
                        Từ: <span className="line-through">{formatMoney(l.giaCu)}</span>
                      </div>
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        mới: <span className="text-indigo-600">{formatMoney(l.giaMoi)}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${percentChange >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {lichSuGia.length === 0 && (
                <p className="text-xs text-slate-400 text-center italic py-4">Chưa có dòng máy nào phát sinh lịch sử đổi giá sỉ</p>
              )}
            </div>
          </div>
      </div>

      {/* NEW PRODUCT DIALOG OVERLAY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6 relative animate-fade-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-50 w-7 h-7 rounded-full flex items-center justify-center border border-slate-100"
            >
              ✖
            </button>

            <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-1">
              📱 Khai báo dòng máy sỉ mới
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Tên gốc dòng điện thoại sỉ sườn (*)</label>
                <input
                  type="text"
                  required
                  value={newTen}
                  onChange={(e) => setNewTen(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none font-medium text-slate-800"
                  placeholder="Ví dụ: iPhone 15 Pro Max 256GB hoặc Phụ kiện cáp sạc USB-C..."
                  id="new_product_name"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Phân loại sản phẩm (*)</label>
                <select
                  value={newLoai}
                  onChange={(e) => setNewLoai(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none font-bold text-slate-705"
                  id="new_product_loai"
                >
                  <option value="Điện thoại">Điện thoại sườn sỉ</option>
                  <option value="Linh phụ kiện">Linh phụ kiện sỉ & lẻ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Đơn giá nhập vào (VND) (*)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatNumberWithCommas(newGiaNhap)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setNewGiaNhap(parseInt(val, 10) || 0);
                    }}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm font-mono bg-slate-50 focus:bg-white focus:outline-none"
                    placeholder="Nhập giá sỉ mua..."
                    id="new_product_import"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Mức giá bán sỉ lẻ sườn (*)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formatNumberWithCommas(newGiaBan)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setNewGiaBan(parseInt(val, 10) || 0);
                    }}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm font-mono bg-slate-50 focus:bg-white focus:outline-none"
                    placeholder="Đơn giá bán niêm yết..."
                    id="new_product_price"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Số lượng máy nhập kho ban đầu (*):</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newTonKho}
                  onChange={(e) => setNewTonKho(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Ví dụ: 10, 50, 100"
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm font-mono bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-md transition-all bg-indigo-600 mt-2"
                id="btn_submit_product"
              >
                Hoàn tất khai báo sản phẩm
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT DIALOG OVERLAY */}
      {editingSp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in-rapid">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingSp(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-50 w-7 h-7 rounded-full flex items-center justify-center border border-slate-100"
            >
              ✖
            </button>

            <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-1.5">
              ✏️ Cập nhật Thông Tin dòng máy
            </h3>

            <p className="text-xs text-slate-400 mb-4 font-mono">Dòng máy ID: <span className="font-bold text-slate-655">{editingSp.id}</span></p>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Tên sản phẩm:</label>
                <input
                  type="text"
                  value={editTen}
                  onChange={(e) => setEditTen(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Phân loại sản phẩm</label>
                <select
                  value={editLoai}
                  onChange={(e) => setEditLoai(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none font-bold text-slate-705"
                  id="edit_product_loai"
                >
                  <option value="Điện thoại">Điện thoại sườn sỉ</option>
                  <option value="Linh phụ kiện">Linh phụ kiện sỉ & lẻ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Đơn giá Nhập (VND):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(editGiaNhap)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setEditGiaNhap(parseInt(val, 10) || 0);
                    }}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none font-mono font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">Giá bán sỉ lẻ sườn (VND):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(editGiaBan)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setEditGiaBan(Math.max(0, parseInt(val, 10) || 0));
                    }}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none font-mono font-bold text-indigo-750 text-indigo-650"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Số lượng máy tồn kho (*):</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editTonKho}
                  onChange={(e) => setEditTonKho(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Nhập số tồn kho sỉ sườn..."
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm font-mono bg-slate-50 focus:bg-white focus:outline-none font-bold text-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-md transition-all bg-indigo-600 mt-2"
                id="btn_submit_edit_sp"
              >
                Xác nhận sửa đổi & lưu hệ thống
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

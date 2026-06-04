import React, { useState, useEffect, useMemo } from 'react';
import { HoaDon, ChiTietHoaDon, KhachHang, SanPham } from '../types';
import { 
  X, 
  Check, 
  Trash2, 
  PlusCircle, 
  TrendingUp, 
  User, 
  Calendar, 
  FileText, 
  AlertTriangle,
  Coins
} from 'lucide-react';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: HoaDon;
  details: ChiTietHoaDon[];
  khachHang: KhachHang[];
  sanPham: SanPham[];
  onSave: (
    editedInvoice: HoaDon, 
    editedDetails: ChiTietHoaDon[], 
    originalInvoice: HoaDon, 
    originalDetails: ChiTietHoaDon[]
  ) => void;
}

export default function InvoiceEditModal({
  isOpen,
  onClose,
  invoice,
  details,
  khachHang,
  sanPham,
  onSave
}: InvoiceEditModalProps) {
  // Local editable invoice fields
  const [selectedKhachHangId, setSelectedKhachHangId] = useState('');
  const [editedNgay, setEditedNgay] = useState('');
  const [editedGhiChu, setEditedGhiChu] = useState('');
  const [editedGiamGia, setEditedGiamGia] = useState<number>(0);
  const [editedDaThanhToan, setEditedDaThanhToan] = useState<number>(0);

  // Editable invoice line items
  const [editedDetails, setEditedDetails] = useState<ChiTietHoaDon[]>([]);

  // Interactive search for adding additional items to invoice
  const [newProductId, setNewProductId] = useState('');
  const [newProductQty, setNewProductQty] = useState<number>(1);
  const [newProductImei, setNewProductImei] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hydrate states when modal opens
  useEffect(() => {
    if (invoice && isOpen) {
      setSelectedKhachHangId(invoice.khachHangId);
      setEditedNgay(invoice.ngay);
      setEditedGhiChu(invoice.ghiChu || '');
      setEditedGiamGia(invoice.giamGia);
      setEditedDaThanhToan(invoice.daThanhToan);
      // Make a deep copy to prevent mutating father component instantly
      setEditedDetails(JSON.parse(JSON.stringify(details)));
      setNewProductId('');
      setNewProductQty(1);
      setNewProductImei('');
      setErrorMessage('');
    }
  }, [invoice, details, isOpen]);

  if (!isOpen || !invoice) return null;

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

  // Compute live calculations
  const totalMoney = useMemo(() => {
    return editedDetails.reduce((sum, item) => sum + item.thanhTien, 0);
  }, [editedDetails]);

  const finalTaxPayable = useMemo(() => {
    const net = totalMoney - editedGiamGia;
    return net > 0 ? net : 0;
  }, [totalMoney, editedGiamGia]);

  const finalConNo = useMemo(() => {
    const net = finalTaxPayable - editedDaThanhToan;
    return net > 0 ? net : 0;
  }, [finalTaxPayable, editedDaThanhToan]);

  // Handle removing an item
  const handleRemoveItem = (idToRemove: string) => {
    setEditedDetails(prev => prev.filter(item => item.id !== idToRemove));
  };

  // Handle mutable cell edits (qty, unitPrice) inside billing listings
  const handleCellEdit = (itemId: string, field: 'soLuong' | 'donGia' | 'imei', value: any) => {
    setEditedDetails(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item };
        if (field === 'soLuong') {
          const qty = parseInt(value) || 0;
          updated.soLuong = qty;
          updated.thanhTien = qty * updated.donGia;
        } else if (field === 'donGia') {
          const price = parseFloat(value) || 0;
          updated.donGia = price;
          updated.thanhTien = updated.soLuong * price;
        } else if (field === 'imei') {
          updated.imei = value;
        }
        return updated;
      }
      return item;
    }));
  };

  // Add more items from the catalog
  const handleAddNewItem = () => {
    setErrorMessage('');
    if (!newProductId) {
      setErrorMessage('Vui lòng chọn một dòng máy!');
      return;
    }

    const matchedProd = sanPham.find(p => p.id === newProductId);
    if (!matchedProd) return;

    if (newProductQty <= 0) {
      setErrorMessage('Số lượng máy mua sỉ phải lớn hơn 0!');
      return;
    }

    // Check if item is already added to details list
    const isAlreadyAdded = editedDetails.some(d => d.sanPhamId === newProductId);
    if (isAlreadyAdded) {
      setErrorMessage(`Dòng máy ${matchedProd.ten} đã tồn tại trong phiếu mua! Hãy trực tiếp thay đổi số lượng ở bảng dưới.`);
      return;
    }

    // Build new unique ChiTiet ID
    const nextId = `CT_${Math.floor(1000 + Math.random() * 9000)}`;
    const lineItem: ChiTietHoaDon = {
      id: nextId,
      hoaDonId: invoice.id,
      sanPhamId: matchedProd.id,
      tenSanPham: matchedProd.ten,
      soLuong: newProductQty,
      donGia: matchedProd.giaBan, // default wholesalers fee
      thanhTien: newProductQty * matchedProd.giaBan,
      imei: newProductImei.trim()
    };

    setEditedDetails(prev => [...prev, lineItem]);
    setNewProductId('');
    setNewProductQty(1);
    setNewProductImei('');
  };

  // Submit edits
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (editedDetails.length === 0) {
      setErrorMessage('Hóa đơn sửa không được để danh mục sản phẩm rỗng!');
      return;
    }

    if (editedDetails.some(d => d.soLuong <= 0 || d.donGia < 0)) {
      setErrorMessage('Tất cả sản phẩm phải có số lượng và đơn giá hợp lệ!');
      return;
    }

    // Construct edited Invoice object
    const updatedInvoiceObject: HoaDon = {
      ...invoice,
      khachHangId: selectedKhachHangId,
      ngay: editedNgay,
      tongTien: totalMoney,
      giamGia: editedGiamGia,
      thanhTien: finalTaxPayable,
      daThanhToan: editedDaThanhToan,
      conNo: finalConNo,
      ghiChu: editedGhiChu
    };

    onSave(updatedInvoiceObject, editedDetails, invoice, details);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print animate-fade-in" id="invoice_edit_modal_container">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-205 text-xs">
        
        {/* HEADER */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">Sửa Đơn Hàng Sỉ {invoice.id}</h3>
              <p className="text-[10px] text-slate-400">Thay đổi thông tin hóa đơn và dải sản phẩm tương ứng an toàn.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition"
            id="btn_close_invoice_edit_modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTAINER CONTENT */}
        <form onSubmit={handleSaveEdits} className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Left panel (7 cols): Products breakdown and adder */}
          <div className="lg:col-span-8 space-y-4 flex flex-col min-h-0">
            
            {/* Adding quick device item */}
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 space-y-3">
              <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px] text-slate-500">Nạp thêm sản phẩm vào đơn sỉ này:</span>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                
                <div className="md:col-span-6 space-y-1">
                  <select
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-250 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                  >
                    <option value="">-- Click chọn máy thêm --</option>
                    {sanPham.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.ten} (Tồn sỉ cũ: {p.tonKho})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <input
                    type="number"
                    min={1}
                    value={newProductQty || ''}
                    onChange={(e) => setNewProductQty(parseInt(e.target.value) || 1)}
                    placeholder="S.Lượng"
                    className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg bg-white font-mono font-bold text-center"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <input
                    type="text"
                    value={newProductImei}
                    onChange={(e) => setNewProductImei(e.target.value)}
                    placeholder="Nhập IMEI (nếu có)"
                    className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg bg-white font-mono text-center"
                  />
                </div>

                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center justify-center transition cursor-pointer h-[32px]"
                    title="Nạp vào danh sách"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

            {/* Error alerts inside form */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg flex items-start gap-2 max-w-full font-semibold animate-scale-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Main Details Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col bg-white">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Chi tiết các dải sản phẩm nằm trong đơn sỉ
              </div>

              <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[300px]">
                <table className="w-full text-xs text-left border-collapse min-w-[550px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Dòng Máy sỉ</th>
                      <th className="py-2.5 px-3 text-center">S.Lượng</th>
                      <th className="py-2.5 px-3 text-right">Đơn giá bán</th>
                      <th className="py-2.5 px-3">Nhập IMEI</th>
                      <th className="py-2.5 px-3 text-right">Thành tiền</th>
                      <th className="py-2.5 px-3 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editedDetails.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-slate-900 max-w-[200px] truncate">
                          {item.tenSanPham}
                          <span className="block text-[9px] text-slate-400 font-mono font-semibold uppercase">{item.sanPhamId}</span>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={1}
                            value={item.soLuong || ''}
                            onChange={(e) => handleCellEdit(item.id, 'soLuong', e.target.value)}
                            className="w-16 px-1.5 py-1 border border-slate-250 bg-white rounded font-mono font-bold text-center"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithCommas(item.donGia)}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^\d]/g, '');
                              handleCellEdit(item.id, 'donGia', val);
                            }}
                            className="w-24 px-1.5 py-1 border border-slate-250 bg-white rounded font-mono font-semibold text-right"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.imei || ''}
                            onChange={(e) => handleCellEdit(item.id, 'imei', e.target.value)}
                            className="w-32 px-1.5 py-1 border border-slate-250 bg-white rounded font-mono text-[10px]"
                            placeholder="Không bắt buộc"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold font-mono text-slate-800">
                          {formatMoney(item.thanhTien)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-150 text-[11px] text-amber-900 leading-relaxed flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <p>
                <strong>Quy tắc Restock tồn kho:</strong> Khi bạn thay đổi số lượng mua hoặc bổ sung thêm/bớt thiết bị mới sườn từ đơn sỉ, hệ thống thông minh sẽ tự động nạp trả kho máy dư, hoặc trừ bớt dải IMEI thích ứng ở danh mục sản phẩm tổng.
              </p>
            </div>

          </div>

          {/* Right panel (4 cols): Meta calculations, discount, customer etc. */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Customer select and Date select */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-slate-655 tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-650" />
                  Đại lý đối tác sỉ mua hàng sườn (*):
                </label>
                <select
                  value={selectedKhachHangId}
                  onChange={(e) => setSelectedKhachHangId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-250 bg-slate-5 focus:bg-white rounded-lg focus:outline-none font-semibold text-xs"
                >
                  {khachHang.map(kh => (
                    <option key={kh.id} value={kh.id}>
                      {kh.ten} ({kh.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-slate-655 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-650" />
                  Thời mốc hóa đơn (*):
                </label>
                <input
                  type="date"
                  required
                  value={editedNgay}
                  onChange={(e) => setEditedNgay(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs font-mono font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-655 uppercase tracking-wide">
                  Giao chú đơn / Ghi chú giao hàng:
                </label>
                <input
                  type="text"
                  placeholder="Ghi nhận giao hàng đợt mới..."
                  value={editedGhiChu}
                  onChange={(e) => setEditedGhiChu(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none"
                />
              </div>

            </div>

            {/* Calculations summaries */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Bảng đối soát sổ sỉ</span>
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-3.5 font-sans">
                
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-500">Cộng tiền sườn:</span>
                  <strong className="font-mono text-slate-900 text-sm font-extrabold">{formatMoney(totalMoney)}</strong>
                </div>

                {/* Editable Discount */}
                <div className="space-y-1 border-t border-slate-50 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-amber-700">Giá Chiết khấu sỉ (VNĐ):</span>
                    <strong className="font-mono text-amber-700 font-bold">-{formatMoney(editedGiamGia)}</strong>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(editedGiamGia)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setEditedGiamGia(parseFloat(val) || 0);
                    }}
                    placeholder="Mức bớt chiết khấu"
                    className="w-full px-2 py-1 border border-slate-250 rounded font-mono font-semibold text-right"
                  />
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 pt-2.5 font-bold text-slate-900">
                  <span>Thành tiền thu sỉ:</span>
                  <strong className="font-mono text-rose-700 font-black text-sm">{formatMoney(finalTaxPayable)}</strong>
                </div>

                {/* Editable Paid amount */}
                <div className="space-y-1 border-t border-slate-100 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-emerald-700">Đại lý đã thanh toán ngay (VNĐ):</span>
                    <strong className="font-mono text-emerald-700 font-bold">{formatMoney(editedDaThanhToan)}</strong>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(editedDaThanhToan)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      setEditedDaThanhToan(parseFloat(val) || 0);
                    }}
                    placeholder="Mức thu tiền ngay"
                    className="w-full px-2 py-1 border border-slate-250 rounded font-mono font-semibold text-right text-emerald-700"
                  />
                </div>

                {/* Gối đầu residual debt balance */}
                <div className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-2.5 rounded border border-slate-200 font-black text-xs text-red-700 mt-2">
                  <span>Dư nợ gối lại kì này:</span>
                  <strong className="font-mono text-sm tracking-tight">{formatMoney(finalConNo)}</strong>
                </div>

              </div>

              {/* SAVE ACTION TRIGGERS */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-center cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-95"
                  id="btn_submit_edit_invoice"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Lưu thay đổi
                </button>
              </div>

            </div>

          </div>

        </form>

      </div>
    </div>
  );
}

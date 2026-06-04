import React, { useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { HoaDon, ChiTietHoaDon, KhachHang, TraHang } from '../types';
import { 
  Printer, 
  X, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  MessageSquare,
  Sparkles,
  MapPin,
  PhoneCall,
  Info,
  RotateCcw
} from 'lucide-react';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: HoaDon;
  details: ChiTietHoaDon[];
  customer: KhachHang;
  storeInfo: {
    tenCuaHang: string;
    slogan: string;
    diaChi: string;
    hotline: string;
  };
  traHang?: TraHang[];
}

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  details,
  customer,
  storeInfo,
  traHang = []
}: InvoiceDetailModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  // Compute returns per product
  const returnsByProduct = useMemo(() => {
    const map: Record<string, { soLuong: number; soTien: number }> = {};
    traHang
      .filter(t => t.hoaDonId === invoice.id)
      .forEach(t => {
        if (!map[t.sanPhamId]) {
          map[t.sanPhamId] = { soLuong: 0, soTien: 0 };
        }
        map[t.sanPhamId].soLuong += t.soLuong;
        map[t.sanPhamId].soTien += t.soTienHoanTrat;
      });
    return map;
  }, [traHang, invoice.id]);

  if (!isOpen || !invoice) return null;

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

  const handlePrint = () => {
    const printContent = document.getElementById('print-area-content');
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Direct high quality system printing support
      window.print();
    }
  };

  const handleDownloadImage = () => {
    const node = document.getElementById('print-area-content');
    if (!node) return;
    setIsExporting(true);

    setTimeout(() => {
      toPng(node, { 
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          padding: '20px'
        }
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `HOADON_${invoice.id}.png`;
        link.href = dataUrl;
        link.click();
        setIsExporting(false);
        triggerToast('🎉 Đã tải ảnh hóa đơn (.PNG) thành công!');
      })
      .catch((err) => {
        console.error('Error generating image link', err);
        setIsExporting(false);
        alert('Không khởi tạo được hình ảnh, vui lòng thử lại.');
      });
    }, 150);
  };

  const handleCopyImage = () => {
    const node = document.getElementById('print-area-content');
    if (!node) return;
    setIsExporting(true);

    setTimeout(() => {
      toPng(node, { 
        backgroundColor: '#ffffff',
        style: {
          padding: '20px'
        }
      })
      .then((dataUrl) => {
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]).then(() => {
              setCopySuccess(true);
              setIsExporting(false);
              triggerToast('📋 Đã sao chép ảnh! Bạn có thể dán (Ctrl+V) sang Zalo/Messenger.');
              setTimeout(() => setCopySuccess(false), 3000);
            }).catch(err => {
              console.error('Copy Clipboard Error', err);
              setIsExporting(false);
              // Fallback to copy link if clipboard item is not supported in nested iframe
              // We'll write to clipboard standard note
              alert('Trình duyệt chưa hỗ trợ ghi Bitmap trực tiếp. Bạn nên nhấn nút "Tải xuống" để chia sẻ file ảnh!');
            });
          });
      })
      .catch(() => {
        setIsExporting(false);
      });
    }, 150);
  };

  const triggerToast = (msg: string) => {
    setShareMsg(msg);
    setTimeout(() => setShareMsg(''), 4500);
  };

  const handleOpenSocial = (platform: 'zalo' | 'mess') => {
    // Generate text to copy to clipboard for quick chat send-off
    let listDesc = details.map((d, index) => `${index + 1}. ${d.tenSanPham} x${d.soLuong} : ${formatMoney(d.thanhTien)}`).join('\n');
    let textToShare = `--- HÓA ĐƠN SỈ SỨ LIÊN ${invoice.id} ---\nKhách hàng: ${customer?.ten || 'Bên mua sỉ'}\nNgày: ${formatRawDate(invoice.ngay)}\n\nThiết bị:\n${listDesc}\n\nTổng cộng: ${formatMoney(invoice.thanhTien)}\nĐã thanh toán: ${formatMoney(invoice.daThanhToan)}\nDư nợ gối lại: ${formatMoney(invoice.conNo)}\nCám ơn quý khách!`;
    
    navigator.clipboard.writeText(textToShare).then(() => {
      triggerToast(`📋 Đã sao chép tóm tắt chữ đơn hàng! Đang mở ${platform === 'zalo' ? 'Zalo' : 'Messenger'} để dán gửi khách...`);
      setTimeout(() => {
        if (platform === 'zalo') {
          window.open('https://chat.zalo.me/', '_blank');
        } else {
          window.open('https://www.messenger.com/', '_blank');
        }
      }, 1000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 no-print animate-fade-in" id="invoice_detail_modal_container">
      <div className="bg-white rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border-0 sm:border border-slate-205">
        
        {/* TOP COMPONENT ACTIONS */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-1 bg-indigo-600 text-white font-bold text-xs sm:text-[11px] font-mono rounded">
              {invoice.id}
            </span>
            <h3 className="font-bold text-slate-800 text-sm truncate">
              Hóa đơn sỉ
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition active:scale-95"
              title="Tải ảnh"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition active:scale-95"
              title="In hóa đơn"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              id="btn_close_invoice_detail_modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT - Full width on mobile */}
        <div className="flex-1 overflow-y-auto p-0 sm:p-4 min-h-0">
          
          {/* Receipt visualization */}
          <div className="bg-white p-4 sm:p-6 space-y-4" id="print-area-content">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div className="space-y-0.5">
                <h1 className="text-base font-black uppercase text-slate-900">{storeInfo.tenCuaHang}</h1>
                <p className="text-[10px] text-slate-500">{storeInfo.diaChi}</p>
                <p className="text-[10px] text-slate-600 font-mono">{storeInfo.hotline}</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-sm font-black text-rose-700 font-mono">{invoice.id}</p>
                <p className="text-[10px] text-slate-500 font-mono">{formatRawDate(invoice.ngay)}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span><strong>Khách:</strong> {customer?.ten || 'Khách vãng lai'}</span>
                <span className="font-mono text-slate-500">{customer?.sdt || '---'}</span>
              </div>
              {customer?.diaChi && (
                <p className="text-slate-500 text-[11px]">Địa chỉ: {customer.diaChi}</p>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-450">Chi tiết đơn hàng</h3>
              <div className="divide-y divide-slate-100">
                {details.map((item, idx) => {
                  const ret = returnsByProduct[item.sanPhamId];
                  return (
                    <div key={item.id || idx} className="py-2.5 first:pt-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-slate-900">{item.tenSanPham}</p>
                            {ret && (
                              <span className="flex items-center gap-1 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                                <RotateCcw className="w-3 h-3" />
                                -{ret.soLuong} máy
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {item.soLuong} x {formatMoney(item.donGia)}
                          </p>
                          {item.imei && (
                            <p className="text-[9px] text-indigo-600 font-mono mt-0.5">IMEI: {item.imei}</p>
                          )}
                          {ret && (
                            <p className="text-[9px] text-purple-600 font-mono mt-0.5">
                              Đã trả: {ret.soLuong} máy = {formatMoney(ret.soTien)}
                            </p>
                          )}
                        </div>
                        <p className="font-black font-mono text-sm text-slate-900 shrink-0">
                          {formatMoney(item.thanhTien)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Tạm tính:</span>
                <span className="font-semibold text-slate-700">{formatMoney(invoice.tongTien)}</span>
              </div>
              {invoice.giamGia > 0 && (
                <div className="flex justify-between font-mono text-red-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold">- {formatMoney(invoice.giamGia)}</span>
                </div>
              )}
              <div className="flex justify-between font-mono font-black text-base border-t border-slate-200 pt-1.5">
                <span className="text-slate-900">Tổng:</span>
                <span className="text-rose-700">{formatMoney(invoice.thanhTien)}</span>
              </div>
              <div className="flex justify-between font-mono text-emerald-700">
                <span>Đã thanh toán:</span>
                <span className="font-bold">{formatMoney(invoice.daThanhToan)}</span>
              </div>
              {(invoice.daTra || 0) > 0 && (
                <div className="flex justify-between font-mono text-purple-700">
                  <span>Đã trả hàng:</span>
                  <span className="font-bold">- {formatMoney(invoice.daTra)}</span>
                </div>
              )}
              <div className={`flex justify-between font-mono font-bold p-2 rounded-lg ${
                invoice.conNo > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                <span>{invoice.conNo > 0 ? 'Còn nợ:' : 'Trạng thái:'}</span>
                <span>{invoice.conNo > 0 ? formatMoney(invoice.conNo) : 'Đã thanh toán hết'}</span>
              </div>
            </div>

            {/* Note */}
            {invoice.ghiChu && (
              <div className="text-xs text-slate-500 pt-2 border-t border-dashed border-slate-200">
                <strong>Ghi chú:</strong> {invoice.ghiChu}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-3">
              <button
                onClick={handleCopyImage}
                disabled={isExporting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                Copy ảnh
              </button>
              <button
                onClick={() => handleOpenSocial('zalo')}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                Gửi Zalo
              </button>
            </div>

            {shareMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold animate-scale-in">
                {shareMsg}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

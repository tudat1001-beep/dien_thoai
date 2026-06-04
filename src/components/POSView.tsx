import React, { useState, useMemo, useEffect } from 'react';
import { KhachHang, SanPham, GiaKhachHang, LichSuGia, HoaDon, ChiTietHoaDon } from '../types';
import { Search, ShoppingCart, User, Percent, Receipt, Trash2, Printer, Check, CreditCard, ChevronRight, AlertCircle, Sparkles, Filter } from 'lucide-react';
import InvoiceDetailModal from './InvoiceDetailModal';

interface POSViewProps {
  khachHang: KhachHang[];
  sanPham: SanPham[];
  giaKhachHang: GiaKhachHang[];
  lichSuGia: LichSuGia[];
  storeInfo: {
    tenCuaHang: string;
    slogan: string;
    diaChi: string;
    hotline: string;
  };
  onAddHoaDon: (hoaDon: HoaDon, chiTiet: ChiTietHoaDon[]) => void;
  onAddKhachHang: (kh: KhachHang) => void;
  onOpenAddCustomer: () => void;
}

interface CartItem {
  sanPhamId: string;
  ten: string;
  imeiSlipped: string[]; // IMEIs currently in the product's list
  imeiSelected: string; // The specific IMEI selected for this unit / sale
  donGia: number; // The active unit price
  giaGocDefault: number; // For highlighting custom price drops
  soLuong: number;
}

export default function POSView({
  khachHang,
  sanPham,
  giaKhachHang,
  lichSuGia,
  storeInfo,
  onAddHoaDon,
  onAddKhachHang,
  onOpenAddCustomer
}: POSViewProps) {
  const [selectedKhId, setSelectedKhId] = useState<string>('');
  const [guestName, setGuestName] = useState('Khách vãng lai');
  const [guestPhone, setGuestPhone] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [giamGia, setGiamGia] = useState<number>(0);
  const [daThanhToan, setDaThanhToan] = useState<number>(0);
  const [traHetDon, setTraHetDon] = useState(false);
  const [ghiChu, setGhiChu] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'instock'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Điện thoại' | 'Linh phụ kiện'>('all');
  const [posTab, setPosTab] = useState<'products' | 'cart'>('products');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Print section invoice receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [printedInvoice, setPrintedInvoice] = useState<{ hoaDon: HoaDon, chiTiet: ChiTietHoaDon[], khach: KhachHang } | null>(null);

  // Custom dialog or modal alerts
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

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

  // Find active customer object
  const activeCustomer = useMemo(() => {
    if (selectedKhId === 'KH_VANGLAI') {
      return {
        id: 'KH_VANGLAI',
        ten: guestName || 'Khách vãng lai',
        sdt: guestPhone || '0900000000',
        diaChi: 'Khách mua lẻ vãng lai',
        mst: '',
        ghiChu: 'Khách mua vãng lai tại quầy',
        ngayTao: new Date().toISOString().split('T')[0]
      } as KhachHang;
    }
    return khachHang.find(k => k.id === selectedKhId) || null;
  }, [khachHang, selectedKhId, guestName, guestPhone]);

  // Filtered customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return khachHang.filter(k => k.id !== 'KH_VANGLAI' && !k.id.startsWith('KHVL'));
    const search = customerSearch.toLowerCase();
    return khachHang.filter(k =>
      k.id !== 'KH_VANGLAI' && !k.id.startsWith('KHVL') &&
      (k.ten.toLowerCase().includes(search) || k.sdt.includes(search))
    );
  }, [khachHang, customerSearch]);

  // Handle customer selection from dropdown
  const handleCustomerSelect = (khId: string) => {
    handleCustomerChange(khId);
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  // Handle customer transition: automatically apply custom prices for existing cart items
  const handleCustomerChange = (khId: string) => {
    setSelectedKhId(khId);
    
    if (!khId) {
      setTraHetDon(false);
      setDaThanhToan(0);
      setCart(prev => prev.map(item => {
        const prod = sanPham.find(s => s.id === item.sanPhamId);
        return {
          ...item,
          donGia: prod ? prod.giaBan : item.donGia
        };
      }));
      return;
    }

    // Khách vãng lai: mặc định trả hết
    if (khId === 'KH_VANGLAI') {
      setTraHetDon(true);
    } else {
      setTraHetDon(false);
      setDaThanhToan(0);
    }

    // Apply custom prices from GiaKhachHang if exists
    setCart(prev => prev.map(item => {
      const customPriceMatch = giaKhachHang.find(g => g.khachHangId === khId && g.sanPhamId === item.sanPhamId);
      if (customPriceMatch) {
        return {
          ...item,
          donGia: customPriceMatch.giaRieng
        };
      } else {
        const prod = sanPham.find(s => s.id === item.sanPhamId);
        return {
          ...item,
          donGia: prod ? prod.giaBan : item.donGia
        };
      }
    }));
  };

  // Add Product to Invoice Cart
  const handleAddToCart = (itemSp: SanPham) => {
    if (!selectedKhId) {
      setAlertMessage('Vui lòng chọn khách hàng phục vụ ở khung hóa đơn trước khi chọn sản phẩm!');
      return;
    }

    if (itemSp.tonKho <= 0) {
      setAlertMessage('Sản phẩm đã hết hàng trong kho! Không thể thêm vào hóa đơn sỉ.');
      return;
    }

    // Check if product is already in cart
    const existingIndex = cart.findIndex(item => item.sanPhamId === itemSp.id);
    const existingCountInCart = existingIndex > -1 ? cart[existingIndex].soLuong : 0;

    if (existingCountInCart >= itemSp.tonKho) {
      setAlertMessage(`Sản phẩm chỉ còn tồn kho tối đa ${itemSp.tonKho} chiếc! Không đủ số lượng cung cấp.`);
      return;
    }

    // Determine donGia (check for customer custom price, otherwise default selling price)
    let finalPrice = itemSp.giaBan;
    const customPriceMatch = giaKhachHang.find(g => g.khachHangId === selectedKhId && g.sanPhamId === itemSp.id);
    if (customPriceMatch) {
      finalPrice = customPriceMatch.giaRieng;
    }

    if (existingIndex > -1) {
      // Increase quantity
      setCart(prev => prev.map((item, idx) => {
        if (idx === existingIndex) {
          return {
            ...item,
            soLuong: item.soLuong + 1
          };
        }
        return item;
      }));
    } else {
      // Create new cart item
      const newItem: CartItem = {
        sanPhamId: itemSp.id,
        ten: itemSp.ten,
        imeiSlipped: [],
        imeiSelected: '',
        donGia: finalPrice,
        giaGocDefault: itemSp.giaBan,
        soLuong: 1
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  // Modify cart item properties
  const updateCartItemQty = (id: string, newQty: number, maxTonKho: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    if (newQty > maxTonKho) {
      setAlertMessage(`Vượt quá tồn kho khả dụng (${maxTonKho} chiếc) của dòng máy này!`);
      return;
    }
    setCart(prev => prev.map(item => item.sanPhamId === id ? { ...item, soLuong: newQty } : item));
  };

  const updateCartItemPrice = (id: string, newPrice: number) => {
    if (newPrice < 0) return;
    setCart(prev => prev.map(item => item.sanPhamId === id ? { ...item, donGia: newPrice } : item));
  };

  const updateCartItemImei = (id: string, newImei: string) => {
    setCart(prev => prev.map(item => item.sanPhamId === id ? { ...item, imeiSelected: newImei } : item));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.sanPhamId !== id));
  };

  // Product Catalogue Listing filtered
  const filteredProducts = useMemo(() => {
    return sanPham.filter(s => {
      const matchesSearch = s.ten.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
                            s.id.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
                            (s.imei && s.imei.includes(searchProductQuery));
      const matchesStock = categoryFilter === 'all' || s.tonKho > 0;
      const matchesType = typeFilter === 'all' || s.loai === typeFilter || (typeFilter === 'Điện thoại' && !s.loai);
      return matchesSearch && matchesStock && matchesType;
    });
  }, [sanPham, searchProductQuery, categoryFilter, typeFilter]);

  // Auto Calculations
  const tongTien = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.donGia * item.soLuong), 0);
  }, [cart]);

  const thanhTien = useMemo(() => {
    const result = tongTien - giamGia;
    return result < 0 ? 0 : result;
  }, [tongTien, giamGia]);

  const conNo = useMemo(() => {
    const debt = thanhTien - daThanhToan;
    return debt < 0 ? 0 : debt;
  }, [thanhTien, daThanhToan]);

  // Auto-fill thanh toán when traHetDon is checked
  useEffect(() => {
    if (traHetDon) {
      setDaThanhToan(thanhTien);
    }
  }, [traHetDon, thanhTien]);

  // Handle Save & Checkout
  const handleCheckoutSubmit = () => {
    if (!selectedKhId) {
      setAlertMessage('Chưa chọn thông tin khách hàng sỉ hoặc khách vãng lai!');
      return;
    }
    if (cart.length === 0) {
      setAlertMessage('Hóa đơn bán hàng đang trống! Vui lòng chọn sản phẩm.');
      return;
    }

    setConfirmDialog({
      message: 'Quá trình tạo hóa đơn sẽ trừ trực tiếp vào tồn kho, ghi nhận doanh thu và cập nhật công nợ đối tác. Bạn muốn tiếp tục chứ?',
      onConfirm: () => {
        // Generate Invoice ID with timestamp + random suffix for uniqueness
        const invoiceId = `HD${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 100)}`;
        const invoiceDate = new Date().toISOString().split('T')[0];

        let finalKhId = selectedKhId;
        let finalCustomerObj = activeCustomer;
        let finalInvoiceNote = ghiChu || (selectedKhId === 'KH_VANGLAI' ? 'Bán lẻ khách vãng lai' : 'Bán sỉ trực tiếp tại quầy');

        if (selectedKhId === 'KH_VANGLAI') {
          const newGuestName = guestName.trim() || 'Khách vãng lai';
          const newGuestPhone = guestPhone.trim() || '0900000000';

          // Set the "customer" object only for the receipt preview, do NOT save to database
          finalKhId = 'KH_VANGLAI';
          finalCustomerObj = {
            id: 'KH_VANGLAI',
            ten: newGuestName,
            sdt: newGuestPhone,
            diaChi: 'Khách lẻ vãng lai',
            mst: '',
            ghiChu: 'Bán lẻ vãng lai',
            ngayTao: invoiceDate
          };
          
          // Always prepend guest info to note for these transactions
          const guestTag = `[GUEST: ${newGuestName} - ${newGuestPhone}]`;
          finalInvoiceNote = ghiChu ? `${guestTag} ${ghiChu}` : guestTag;
        }

        const newInvoice: HoaDon = {
          id: invoiceId,
          khachHangId: finalKhId,
          ngay: invoiceDate,
          tongTien,
          giamGia,
          thanhTien,
          daThanhToan,
          conNo,
          daTra: 0,
          ghiChu: finalInvoiceNote
        };

        // Generate Invoice Details
        const invoiceDetails: ChiTietHoaDon[] = cart.map((item) => ({
          id: `CTHD${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`,
          hoaDonId: invoiceId,
          sanPhamId: item.sanPhamId,
          tenSanPham: item.ten,
          imei: item.imeiSelected || '',
          soLuong: item.soLuong,
          donGia: item.donGia,
          thanhTien: item.donGia * item.soLuong
        }));

        // Trigger save up to App Controller
        onAddHoaDon(newInvoice, invoiceDetails);

        // Save state to trigger print review
        setPrintedInvoice({
          hoaDon: newInvoice,
          chiTiet: invoiceDetails,
          khach: finalCustomerObj!
        });
        setShowReceiptModal(true);

        // Clear cart and ephemeral guest data
        setCart([]);
        setGiamGia(0);
        setDaThanhToan(0);
        setGhiChu('');
        setGuestName('Khách vãng lai');
        setGuestPhone('');
      }
    });
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. MOBILE-FRIENDLY CUSTOMER SELECTOR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Chọn đại lý nhập sỉ:</span>
            <span className="sm:hidden">Đại lý:</span>
          </label>
          <button
            onClick={onOpenAddCustomer}
            className="text-xs text-indigo-600 font-bold"
          >
            + Thêm mới
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Tìm đại lý hoặc nhập 'vãng lai'..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setShowCustomerDropdown(true);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
            className="w-full px-3 py-3 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium touch-feedback"
          />
          {showCustomerDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => handleCustomerSelect('KH_VANGLAI')}
                className={`w-full text-left px-3 py-2.5 hover:bg-indigo-50 border-b border-slate-100 ${selectedKhId === 'KH_VANGLAI' ? 'bg-indigo-100' : ''}`}
              >
                <span className="font-medium">🛒 Khách lẻ vãng lai</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenAddCustomer();
                  setShowCustomerDropdown(false);
                }}
                className="w-full text-left px-3 py-2.5 text-indigo-600 font-bold hover:bg-indigo-50 border-b border-slate-100"
              >
                + Thêm đại lý mới
              </button>
              {filteredCustomers.map(k => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => handleCustomerSelect(k.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 ${selectedKhId === k.id ? 'bg-indigo-100' : ''}`}
                >
                  <div className="font-medium text-slate-800">{k.ten}</div>
                  <div className="text-xs text-slate-500 font-mono">{k.sdt}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedKhId === 'KH_VANGLAI' && (
          <div className="grid grid-cols-2 gap-2 animate-fade-in">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-400 font-medium"
              placeholder="Tên khách..."
            />
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-400 font-mono"
              placeholder="SĐT..."
            />
          </div>
        )}

        {activeCustomer && selectedKhId !== 'KH_VANGLAI' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-xs">
            <p className="font-bold text-slate-800">{activeCustomer.ten}</p>
            <p className="text-slate-500 font-mono text-[11px]">{activeCustomer.sdt}</p>
          </div>
        )}

        {!selectedKhId && (
          <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg">
            Chưa chọn đại lý - hiển thị giá mặc định
          </p>
        )}
      </div>

      {/* 2. MOBILE TAB SWITCHER */}
      <div className="flex items-center bg-slate-200/70 rounded-xl p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setPosTab('products')}
          className={`flex-1 py-3 px-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            posTab === 'products'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Kho hàng</span>
          <span className="sm:hidden">Kho</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{filteredProducts.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setPosTab('cart')}
          className={`flex-1 py-3 px-2 rounded-lg flex items-center justify-center gap-2 transition-all relative ${
            posTab === 'cart'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="hidden sm:inline">Hóa đơn</span>
          <span className="sm:hidden">Đơn</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full font-mono font-bold text-[9px] w-5 h-5 flex items-center justify-center border-2 border-white">
              {cart.reduce((sum, item) => sum + item.soLuong, 0)}
            </span>
          )}
        </button>
      </div>

      {/* 3. PRODUCT LIST - MOBILE OPTIMIZED GRID */}
      <div className={`${posTab === 'products' ? 'block' : 'hidden sm:block'}`}>
        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, IMEI..."
              value={searchProductQuery}
              onChange={(e) => setSearchProductQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
              id="pos_search_product"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => { setCategoryFilter('all'); setTypeFilter('all'); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap touch-feedback ${
                categoryFilter === 'all' && typeFilter === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Tất cả ({sanPham.length})
            </button>
            <button
              onClick={() => { setCategoryFilter('instock'); setTypeFilter('all'); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap touch-feedback ${
                categoryFilter === 'instock' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Còn hàng ({sanPham.filter(s => s.tonKho > 0).length})
            </button>
            <button
              onClick={() => setTypeFilter('Điện thoại')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap touch-feedback ${
                typeFilter === 'Điện thoại' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Điện thoại
            </button>
            <button
              onClick={() => setTypeFilter('Linh phụ kiện')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap touch-feedback ${
                typeFilter === 'Linh phụ kiện' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Phụ kiện
            </button>
          </div>
        </div>

        {!selectedKhId && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700 mb-3">
            ⚠️ Chưa chọn đại lý - giá hiển thị theo bảng giá mặc định
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {filteredProducts.map((p) => {
            const hasCustomPrice = activeCustomer && giaKhachHang.find(g => g.khachHangId === activeCustomer.id && g.sanPhamId === p.id);
            const customPriceVal = hasCustomPrice ? hasCustomPrice.giaRieng : null;
            const cartItem = cart.find(item => item.sanPhamId === p.id);
            const isInCart = !!cartItem;
            const cartQty = cartItem ? cartItem.soLuong : 0;

            return (
              <div
                key={p.id}
                onClick={() => handleAddToCart(p)}
                className={`relative rounded-xl border p-3 transition-all cursor-pointer active:scale-[0.97] select-none touch-feedback ${
                  p.tonKho <= 0 
                    ? 'opacity-50 border-slate-200 bg-slate-50' 
                    : isInCart
                    ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                id={`pos_product_card_${p.id}`}
              >
                {/* Stock Badge */}
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  p.tonKho > 0 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {p.tonKho}
                </span>

                {/* Product Name */}
                <h3 className={`font-bold text-xs leading-tight pr-10 mb-2 ${
                  isInCart ? 'text-indigo-900' : 'text-slate-800'
                }`}>
                  {p.ten}
                </h3>

                {/* Price */}
                <div className="mb-2">
                  {customPriceVal ? (
                    <>
                      <p className="text-[10px] text-slate-400 line-through font-mono">
                        {formatMoney(p.giaBan)}
                      </p>
                      <p className="text-sm font-black font-mono text-emerald-700">
                        {formatMoney(customPriceVal)}
                      </p>
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded">Sỉ riêng</span>
                    </>
                  ) : (
                    <p className={`font-black font-mono text-sm ${
                      isInCart ? 'text-indigo-700' : 'text-slate-900'
                    }`}>
                      {formatMoney(p.giaBan)}
                    </p>
                  )}
                </div>

                {/* Add Button */}
                <div className="flex justify-center">
                  {isInCart ? (
                    <span className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      <Check className="w-3 h-3" />
                      {cartQty}
                    </span>
                  ) : (
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                      p.tonKho > 0
                        ? 'bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'
                        : 'bg-slate-100 text-slate-300'
                    }`}>
                      +
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
            Không tìm thấy sản phẩm
          </div>
        )}
      </div>

      {/* 4. CART PANEL - MOBILE OPTIMIZED */}
      <div className={`${posTab === 'cart' ? 'block' : 'hidden sm:block'}`}>
        <div className="bg-white rounded-xl shadow-md border border-indigo-100 overflow-hidden">
          {/* Cart Header */}
          <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              Hóa đơn
            </span>
            <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              {cart.reduce((sum, i) => sum + i.soLuong, 0)} sản phẩm
            </span>
          </div>

          {/* Cart Items */}
          <div className="max-h-[40vh] overflow-y-auto">
            {cart.length > 0 ? (
              cart.map((item, index) => {
                const limitStock = sanPham.find(s => s.id === item.sanPhamId)?.tonKho || 5;

                return (
                  <div key={`${item.sanPhamId}-${index}`} className="p-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{item.ten}</h4>
                        <span className="text-[10px] font-mono text-slate-400">{item.sanPhamId}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.sanPhamId)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition touch-feedback"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Price */}
                      <div className="w-32 sm:flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(item.donGia)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d]/g, '');
                            updateCartItemPrice(item.sanPhamId, parseInt(val, 10) || 0);
                          }}
                          className="w-full px-2 py-2 text-sm font-mono border border-slate-200 rounded-lg text-indigo-700 touch-feedback"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateCartItemQty(item.sanPhamId, item.soLuong - 1, limitStock)}
                          className="w-10 h-10 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 transition touch-feedback"
                        >
                          −
                        </button>
                        <span className="w-10 h-10 flex items-center justify-center font-bold font-mono text-sm bg-white">
                          {item.soLuong}
                        </span>
                        <button
                          onClick={() => updateCartItemQty(item.sanPhamId, item.soLuong + 1, limitStock)}
                          className="w-10 h-10 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 transition touch-feedback"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[80px]">
                        <p className="text-[10px] text-slate-400">Thành tiền</p>
                        <p className="font-black font-mono text-sm text-slate-800">
                          {formatMoney(item.donGia * item.soLuong)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có sản phẩm</p>
                <p className="text-xs">Bấm vào sản phẩm để thêm</p>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-slate-600">Tạm tính:</span>
              <span className="font-semibold text-slate-800">{formatMoney(tongTien)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 flex-1">Giảm giá:</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(giamGia)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  setGiamGia(parseInt(val, 10) || 0);
                }}
                className="w-28 px-2 py-1.5 text-sm font-mono font-bold text-red-600 border border-slate-200 rounded-lg text-right touch-feedback"
                placeholder="0"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={traHetDon}
                onChange={(e) => setTraHetDon(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <span className="text-sm text-slate-600 font-semibold">Trả hết đơn</span>
            </label>

            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-700 flex-1 font-semibold">Khách trả:</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(daThanhToan)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  const numVal = parseInt(val, 10) || 0;
                  const cappedVal = numVal > thanhTien ? thanhTien : numVal;
                  setDaThanhToan(cappedVal);
                  if (cappedVal < thanhTien) {
                    setTraHetDon(false);
                  } else {
                    setTraHetDon(true);
                  }
                }}
                className="w-28 px-2 py-1.5 text-sm font-mono font-bold text-emerald-600 border border-slate-200 rounded-lg text-right touch-feedback"
                placeholder="0"
              />
            </div>

            {conNo > 0 && (
              <div className="flex justify-between text-sm font-mono bg-red-50 p-2 rounded-lg">
                <span className="font-bold text-red-700">Còn nợ:</span>
                <span className="font-black text-red-700">{formatMoney(conNo)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-mono pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-900">Cần thanh toán:</span>
              <span className="font-black text-lg text-rose-700">{formatMoney(thanhTien)}</span>
            </div>

            {/* Note */}
            <input
              type="text"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg placeholder-slate-400"
              placeholder="Ghi chú giao hàng..."
            />
          </div>

          {/* Checkout Button */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={handleCheckoutSubmit}
              disabled={cart.length === 0 || !selectedKhId}
              className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all flex items-center justify-center gap-3 touch-feedback ${
                cart.length === 0 || !selectedKhId
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
              }`}
            >
              <Check className="w-6 h-6" />
              LẬP HÓA ĐƠN
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING CART BUTTON - Mobile only, when on products tab */}
      {posTab === 'products' && cart.length > 0 && (
        <button
          onClick={() => setPosTab('cart')}
          className="sm:hidden fixed bottom-4 right-4 bg-indigo-600 text-white px-5 py-4 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm z-50 active:scale-95 transition touch-feedback"
        >
          <Receipt className="w-5 h-5" />
          Xem đơn ({cart.reduce((sum, i) => sum + i.soLuong, 0)})
        </button>
      )}

      {/* PRINTABLE RECEIPT TEMPLATE PREVIEW MODAL */}
      {showReceiptModal && printedInvoice && (
        <InvoiceDetailModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoice={printedInvoice.hoaDon}
          details={printedInvoice.chiTiet}
          customer={printedInvoice.khach}
          storeInfo={storeInfo}
        />
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 space-y-4 transform scale-100 transition-all">
            <div className="flex items-center gap-3 text-amber-600">
              <span className="p-2 bg-amber-50 rounded-full">
                <AlertCircle className="w-5 h-5 shrink-0 animate-bounce" />
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm">Thông báo hệ thống</h4>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              {alertMessage}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAlertMessage(null)}
                className="px-4 py-2 bg-slate-905 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
              >
                Đã rõ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-150 space-y-4 transform scale-100 transition-all">
            <div className="flex items-center gap-3 text-indigo-600">
              <span className="p-2 bg-indigo-50 rounded-full">
                <Check className="w-5 h-5 shrink-0" />
              </span>
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">Xác nhận thao tác</h4>
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-xs cursor-pointer"
              >
                Đồng ý tiến hành
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

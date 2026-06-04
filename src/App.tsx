import React, { useState, useEffect, useMemo } from 'react';
import { KhachHang, SanPham, HoaDon, ChiTietHoaDon, CongNo, GiaKhachHang, LichSuGia, TraHang, NhapHang } from './types';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { SQL_SCHEMA_TEXT } from './lib/sqlSchema';
import { 
  seedSupabaseIfNeeded, 
  sFetchKhachHang, 
  sFetchSanPham, 
  sFetchHoaDon, 
  sFetchChiTietHoaDon, 
  sFetchCongNo, 
  sFetchGiaKhachHang, 
  sFetchLichSuGia, 
  sFetchTraHang,
  sUpsertKhachHang,
  sUpsertSanPham,
  sUpsertHoaDonAndDetails,
  sUpsertCongNo,
  sUpsertTraHangAndInventory,
  sUpsertGiaKhachHang,
  sDeleteGiaKhachHang,
  sUpsertLichSuGia,
  sSyncAllLocalStorageToSupabase
} from './lib/supabaseStore';
import {
  INITIAL_KHACH_HANG,
  INITIAL_SAN_PHAM,
  INITIAL_HOA_DON,
  INITIAL_CHI_TIET_HOA_DON,
  INITIAL_CONG_NO,
  INITIAL_GIA_KHACH_HANG,
  INITIAL_LICHSU_GIA,
  INITIAL_TRA_HANG
} from './data';

// Import Views
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import InvoicesView from './components/InvoicesView';
import CustomersView from './components/CustomersView';
import ProductsView from './components/ProductsView';
import ReturnsView from './components/ReturnsView';
import DatabaseView from './components/DatabaseView';
import ImportsView from './components/ImportsView';

// Lucide Icons
import {
  TrendingUp,
  CreditCard,
  Layers,
  Users2,
  ShoppingCart,
  Database,
  ArrowUpDown,
  BookOpen,
  DollarSign,
  Undo2,
  Smartphone,
  Chrome,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  PackagePlus,
  Menu,
  X
} from 'lucide-react';

type TabType = 'dashboard' | 'pos' | 'invoices' | 'customers' | 'products' | 'returns' | 'database' | 'imports';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [copiedSqlState, setCopiedSqlState] = useState(false);
  const [forceOffline, setForceOffline] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Store information for printed invoice layout
  const [storeInfo, setStoreInfo] = useState(() => {
    const saved = localStorage.getItem('TA_STORE_INFO_v1');
    return saved ? JSON.parse(saved) : {
      tenCuaHang: 'QUẢN LÝ BÁN HÀNG',
      slogan: 'Đại lý sỉ cấp 1 - Uy tín, chất lượng hàng đầu',
      diaChi: 'ĐC: 124 Hùng Vương, Phường 2, Quận 10, TP.HCM',
      hotline: 'Hotline: 0909.888.999 - MST: 031267899'
    };
  });

  const handleGlobalCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_TEXT);
    setCopiedSqlState(true);
    setTimeout(() => setCopiedSqlState(false), 2000);
  };

  // Synchronize storeInfo to local storage
  useEffect(() => {
    localStorage.setItem('TA_STORE_INFO_v1', JSON.stringify(storeInfo));
  }, [storeInfo]);

  // Core State Managers with Local Storage hookups
  const [khachHang, setKhachHang] = useState<KhachHang[]>(() => {
    const saved = localStorage.getItem('TA_KHACH_HANG_v1');
    return saved ? JSON.parse(saved) : INITIAL_KHACH_HANG;
  });

  const [sanPham, setSanPham] = useState<SanPham[]>(() => {
    const saved = localStorage.getItem('TA_SAN_PHAM_v1');
    return saved ? JSON.parse(saved) : INITIAL_SAN_PHAM;
  });

  const [hoaDon, setHoaDon] = useState<HoaDon[]>(() => {
    const saved = localStorage.getItem('TA_HOA_DON_v1');
    return saved ? JSON.parse(saved) : INITIAL_HOA_DON;
  });

  const [chiTietHoaDon, setChiTietHoaDon] = useState<ChiTietHoaDon[]>(() => {
    const saved = localStorage.getItem('TA_CHI_TIET_HOA_DON_v1');
    return saved ? JSON.parse(saved) : INITIAL_CHI_TIET_HOA_DON;
  });

  const [congNo, setCongNo] = useState<CongNo[]>(() => {
    const saved = localStorage.getItem('TA_CONG_NO_v1');
    return saved ? JSON.parse(saved) : INITIAL_CONG_NO;
  });

  const [giaKhachHang, setGiaKhachHang] = useState<GiaKhachHang[]>(() => {
    const saved = localStorage.getItem('TA_GIA_KHACH_HANG_v1');
    return saved ? JSON.parse(saved) : INITIAL_GIA_KHACH_HANG;
  });

  const [lichSuGia, setLichSuGia] = useState<LichSuGia[]>(() => {
    const saved = localStorage.getItem('TA_LICHSU_GIA_v1');
    return saved ? JSON.parse(saved) : INITIAL_LICHSU_GIA;
  });

  const [traHang, setTraHang] = useState<TraHang[]>(() => {
    const saved = localStorage.getItem('TA_TRA_HANG_v1');
    return saved ? JSON.parse(saved) : INITIAL_TRA_HANG;
  });

  const [lichSuNhap, setLichSuNhap] = useState<NhapHang[]>(() => {
    const saved = localStorage.getItem('TA_LICH_SU_NHAP_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Synchronize with Local Storage on mutational updates
  useEffect(() => {
    localStorage.setItem('TA_KHACH_HANG_v1', JSON.stringify(khachHang));
  }, [khachHang]);

  useEffect(() => {
    localStorage.setItem('TA_SAN_PHAM_v1', JSON.stringify(sanPham));
  }, [sanPham]);

  useEffect(() => {
    localStorage.setItem('TA_HOA_DON_v1', JSON.stringify(hoaDon));
  }, [hoaDon]);

  useEffect(() => {
    localStorage.setItem('TA_CHI_TIET_HOA_DON_v1', JSON.stringify(chiTietHoaDon));
  }, [chiTietHoaDon]);

  useEffect(() => {
    localStorage.setItem('TA_CONG_NO_v1', JSON.stringify(congNo));
  }, [congNo]);

  useEffect(() => {
    localStorage.setItem('TA_GIA_KHACH_HANG_v1', JSON.stringify(giaKhachHang));
  }, [giaKhachHang]);

  useEffect(() => {
    localStorage.setItem('TA_LICHSU_GIA_v1', JSON.stringify(lichSuGia));
  }, [lichSuGia]);

  useEffect(() => {
    localStorage.setItem('TA_TRA_HANG_v1', JSON.stringify(traHang));
  }, [traHang]);

  useEffect(() => {
    localStorage.setItem('TA_LICH_SU_NHAP_v1', JSON.stringify(lichSuNhap));
  }, [lichSuNhap]);

  // Supabase sync & load on mount if configured
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const [supabaseSyncError, setSupabaseSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || forceOffline) {
      return;
    }

    const loadSupabaseData = async () => {
      try {
        setIsSupabaseLoading(true);
        setSupabaseSyncError(null);

        // 1. Fetch customers first. If SQL tables have not been created in Supabase yet,
        // this will throw an error caught in the catch block block to prompt the user to execute raw SQL schema.
        let kh = await sFetchKhachHang();

        // 2. If the query succeeds and returns 0 clients, it means tables are newly created and empty (Step 2 completed on Supabase side).
        // We will automatically run Step 3: Sync existing local storage state directly up to Supabase to keep all data safe online.
        if (kh.length === 0) {
          console.log("Supabase is freshly created and empty! Automatically syncing local state as initial data...");
          await sSyncAllLocalStorageToSupabase(
            khachHang,
            sanPham,
            hoaDon,
            chiTietHoaDon,
            congNo,
            giaKhachHang,
            lichSuGia,
            traHang
          );
          // Re-fetch
          kh = await sFetchKhachHang();
        }

        // 3. Batch load all remaining database tables
        const [sp, hd, cthd, cn, gkh, lsg, th] = await Promise.all([
          sFetchSanPham(),
          sFetchHoaDon(),
          sFetchChiTietHoaDon(),
          sFetchCongNo(),
          sFetchGiaKhachHang(),
          sFetchLichSuGia(),
          sFetchTraHang()
        ]);

        setKhachHang(kh);
        setSanPham(sp);
        setHoaDon(hd);
        setChiTietHoaDon(cthd);
        setCongNo(cn);
        setGiaKhachHang(gkh);
        setLichSuGia(lsg);
        setTraHang(th);

        console.log("Supabase synchronization completed for all 8 wholesale entities!");
      } catch (err: any) {
        console.error('Lỗi khi nạp đồng bộ Supabase:', err);
        let errorMsg = err?.message || 'Không thể lấy dữ liệu từ Supabase Cloud.';
        if (
          (errorMsg.includes('relation') && errorMsg.includes('does not exist')) ||
          errorMsg.includes('Could not find the table') ||
          errorMsg.includes('schema cache')
        ) {
          errorMsg = 'Bảng CSDL chưa tồn tại trong dự án Supabase của bạn. Vui lòng hoàn thành 2 bước bên dưới dán SQL Schema để tạo cấu trúc dữ liệu.';
        }
        setSupabaseSyncError(errorMsg);
      } finally {
        setIsSupabaseLoading(false);
      }
    };

    loadSupabaseData();
  }, []);

  // Bulk reset handler
  const handleResetData = async () => {
    const confirmReset = window.confirm('Quá trình khôi phục sẽ xóa sạch toàn bộ hóa đơn sỉ, nợ sỉ và giá riêng bạn vừa thêm mới để về mặc định của hệ thống chính. Bạn muốn tải lại chứ?');
    if (!confirmReset) return;

    localStorage.clear();

    if (isSupabaseConfigured) {
      try {
        setIsSupabaseLoading(true);
        // Re-write base seeds to Supabase for reset
        for (const kh of INITIAL_KHACH_HANG) {
          await sUpsertKhachHang(kh);
        }
        for (const sp of INITIAL_SAN_PHAM) {
          await sUpsertSanPham(sp);
        }
        alert('Đã khôi phục dữ liệu mặc định hệ thống lên Supabase CSDL thành công!');
      } catch (err) {
        console.error('Lỗi khôi phục Supabase:', err);
      } finally {
        setIsSupabaseLoading(false);
      }
    }

    setKhachHang(INITIAL_KHACH_HANG);
    setSanPham(INITIAL_SAN_PHAM);
    setHoaDon(INITIAL_HOA_DON);
    setChiTietHoaDon(INITIAL_CHI_TIET_HOA_DON);
    setCongNo(INITIAL_CONG_NO);
    setGiaKhachHang(INITIAL_GIA_KHACH_HANG);
    setLichSuGia(INITIAL_LICHSU_GIA);
    setTraHang(INITIAL_TRA_HANG);
  };

  const handleSyncToSupabase = async () => {
    if (!isSupabaseConfigured) {
      alert('Chưa cấu hình Supabase! Vui lòng vào Cài đặt (Settings > Secrets) để cấu hình.');
      return;
    }
    try {
      setIsSupabaseLoading(true);
      setSupabaseSyncError(null);
      await sSyncAllLocalStorageToSupabase(
        khachHang,
        sanPham,
        hoaDon,
        chiTietHoaDon,
        congNo,
        giaKhachHang,
        lichSuGia,
        traHang
      );
      // After success, reload dataset from Supabase
      const [kh, sp, hd, cthd, cn, gkh, lsg, th] = await Promise.all([
        sFetchKhachHang(),
        sFetchSanPham(),
        sFetchHoaDon(),
        sFetchChiTietHoaDon(),
        sFetchCongNo(),
        sFetchGiaKhachHang(),
        sFetchLichSuGia(),
        sFetchTraHang()
      ]);
      setKhachHang(kh);
      setSanPham(sp);
      setHoaDon(hd);
      setChiTietHoaDon(cthd);
      setCongNo(cn);
      setGiaKhachHang(gkh);
      setLichSuGia(lsg);
      setTraHang(th);

      alert('Đồng bộ thành công! Toàn bộ dữ liệu offline từ máy cá nhân đã được tải trực tiếp lên Supabase Cloud.');
    } catch (err: any) {
      console.error('Lỗi khi đồng bộ lên Supabase:', err);
      setSupabaseSyncError(err?.message || 'Lỗi khi đồng bộ lên Supabase.');
      alert('Lỗi đồng bộ lên Supabase: ' + (err?.message || 'Bạn cần chạy đoạn SQL schema trong tài liệu đính kèm trước khi bắt đầu đồng bộ.'));
    } finally {
      setIsSupabaseLoading(false);
    }
  };

  // CORE MUTATIONS
  // 1. Invoicing & Stock Adjustment
  const handleAddHoaDon = async (newInvoice: HoaDon, itemDetails: ChiTietHoaDon[]) => {
    // Update Product Stock Count and available IMEIs array
    const updatedProducts: SanPham[] = [];
    const nextProducts = sanPham.map(p => {
      // Find if this product is part of checkout items
      const inSale = itemDetails.find(d => d.sanPhamId === p.id);
      if (inSale && inSale.imei) {
        const currentImeis = p.imei ? p.imei.split(',').map(i => i.trim()).filter(Boolean) : [];
        // Subtract the selected IMEI from catalog
        const remainingImeis = currentImeis.filter(i => i !== inSale.imei);
        const newTonKho = p.tonKho - inSale.soLuong;
        const updated = {
          ...p,
          imei: remainingImeis.join(', '),
          tonKho: newTonKho < 0 ? 0 : newTonKho,
          trangThai: (newTonKho - inSale.soLuong > 0 ? 'Còn hàng' : 'Hết hàng') as 'Còn hàng' | 'Hết hàng'
        } as SanPham;
        updatedProducts.push(updated);
        return updated;
      }
      return p;
    });

    let newDebtRecord: CongNo | undefined = undefined;
    if (newInvoice.conNo > 0) {
      const debtId = `CN${Math.floor(1000 + Math.random() * 9000)}`;
      newDebtRecord = {
        id: debtId,
        khachHangId: newInvoice.khachHangId,
        ngay: newInvoice.ngay,
        loai: 'Ghi nợ',
        soTien: newInvoice.conNo,
        hoaDonId: newInvoice.id,
        ghiChu: `Nợ phát sinh tự động gối đầu từ đơn ${newInvoice.id}`
      };
    }

    if (isSupabaseConfigured) {
      try {
        await sUpsertHoaDonAndDetails(newInvoice, itemDetails, updatedProducts, newDebtRecord);
      } catch (err) {
        alert('Lỗi khi ghi nhận hóa đơn lên Supabase CSDL!');
        return;
      }
    }

    // Add Invoice object
    setHoaDon(prev => [newInvoice, ...prev]);
    // Add list of Invoice Details
    setChiTietHoaDon(prev => [...itemDetails, ...prev]);
    // Update State Products
    setSanPham(nextProducts);

    if (newDebtRecord) {
      setCongNo(prev => [newDebtRecord!, ...prev]);
    }
  };

  // 2. Add Customer
  const handleAddKhachHang = async (kh: KhachHang) => {
    if (isSupabaseConfigured) {
      try {
        await sUpsertKhachHang(kh);
      } catch (err) {
        alert('Lỗi lưu khách hàng mới lên Supabase CSDL!');
        return;
      }
    }
    setKhachHang(prev => [kh, ...prev]);
  };

  // 3. Add Product to catalog
  const handleAddSanPham = async (sp: SanPham) => {
    if (isSupabaseConfigured) {
      try {
        await sUpsertSanPham(sp);
      } catch (err) {
        alert('Lỗi lưu sản phẩm mới lên Supabase CSDL!');
        return;
      }
    }
    setSanPham(prev => [sp, ...prev]);
  };

  // 4. Update Product & pricing historical trace (`LichSuGia`)
  const handleUpdateSanPham = async (spId: string, updatedFields: Partial<SanPham>) => {
    const currentSp = sanPham.find(p => p.id === spId);
    if (!currentSp) return;

    const nextSp: SanPham = { ...currentSp, ...updatedFields } as SanPham;
    let newPriceRecord: LichSuGia | undefined = undefined;

    if (updatedFields.giaBan !== undefined && updatedFields.giaBan !== currentSp.giaBan) {
      const priceTraceId = `LSG${Math.floor(1000 + Math.random() * 9000)}`;
      newPriceRecord = {
        id: priceTraceId,
        sanPhamId: spId,
        ngayThayDoi: new Date().toISOString().split('T')[0],
        giaCu: currentSp.giaBan,
        giaMoi: updatedFields.giaBan
      };
    }

    if (isSupabaseConfigured) {
      try {
        await sUpsertSanPham(nextSp);
        if (newPriceRecord) {
          await sUpsertLichSuGia(newPriceRecord);
        }
      } catch (err) {
        alert('Lỗi cập nhật sản phẩm lên Supabase!');
        return;
      }
    }

    setSanPham(prev => prev.map(p => p.id === spId ? nextSp : p));
    if (newPriceRecord) {
      setLichSuGia(traceList => [newPriceRecord!, ...traceList]);
    }
  };

  // 5. Update/Add custom prices for partners
  const handleUpdateGiaKhachHang = async (kId: string, spId: string, price: number) => {
    const matchIndex = giaKhachHang.findIndex(g => g.khachHangId === kId && g.sanPhamId === spId);
    let updatedGkh: GiaKhachHang;

    if (matchIndex > -1) {
      updatedGkh = { ...giaKhachHang[matchIndex], giaRieng: price };
    } else {
      const nextId = `GKH${Math.floor(1000 + Math.random() * 9000)}`;
      updatedGkh = { id: nextId, khachHangId: kId, sanPhamId: spId, giaRieng: price };
    }

    if (isSupabaseConfigured) {
      try {
        await sUpsertGiaKhachHang(updatedGkh);
      } catch (err) {
        alert('Lỗi cập nhật giá khách hàng lên Supabase!');
        return;
      }
    }

    setGiaKhachHang(prev => {
      if (matchIndex > -1) {
        return prev.map((g, idx) => idx === matchIndex ? updatedGkh : g);
      } else {
        return [...prev, updatedGkh];
      }
    });
  };

  const handleRemoveGiaKhachHang = async (idToRemove: string) => {
    if (isSupabaseConfigured) {
      try {
        await sDeleteGiaKhachHang(idToRemove);
      } catch (err) {
        alert('Lỗi xóa giá riêng khỏi Supabase!');
        return;
      }
    }
    setGiaKhachHang(prev => prev.filter(g => g.id !== idToRemove));
  };

  // 6. Direct Payment Receipts
  const handleAddCongNo = async (cn: CongNo) => {
    if (isSupabaseConfigured) {
      try {
        await sUpsertCongNo(cn);
      } catch (err) {
        alert('Lỗi ghi phiếu công nợ lên Supabase!');
        return;
      }
    }
    setCongNo(prev => [cn, ...prev]);
  };

  // 7. Core Return Processing (`TraHang` & catalog restock)
  const handleAddTraHang = async (newReturn: TraHang) => {
    const matchingProd = sanPham.find(p => p.id === newReturn.sanPhamId);
    if (!matchingProd) return;

    // Restock the product inventory & re-insert IMEI
    const currentImeis = matchingProd.imei ? matchingProd.imei.split(',').map(i => i.trim()).filter(Boolean) : [];
    // Prepend returned imei to prevent loss of IMEI index
    if (newReturn.imei && !currentImeis.includes(newReturn.imei)) {
      currentImeis.unshift(newReturn.imei);
    }
    const nextStock = matchingProd.tonKho + newReturn.soLuong;
    const updatedProd: SanPham = {
      ...matchingProd,
      imei: currentImeis.join(', '),
      tonKho: nextStock,
      trangThai: 'Còn hàng'
    };

    let returnDebtOffset: CongNo | undefined = undefined;
    if (newReturn.phuongThuc === 'Trừ vào công nợ') {
      const origHd = hoaDon.find(hi => hi.id === newReturn.hoaDonId);
      const targetCustomer = origHd ? origHd.khachHangId : '';

      if (targetCustomer) {
        const debtId = `CN${Math.floor(1000 + Math.random() * 9000)}`;
        returnDebtOffset = {
          id: debtId,
          khachHangId: targetCustomer,
          ngay: newReturn.ngayTra,
          loai: 'Giảm trừ do trả hàng',
          soTien: newReturn.soTienHoanTrat,
          hoaDonId: newReturn.hoaDonId,
          ghiChu: `Duyệt khấu trừ sỉ do hoàn trả sản phẩm ${newReturn.sanPhamId} từ kiểm kê ${newReturn.id}`
        };
      }
    }

    if (isSupabaseConfigured) {
      try {
        await sUpsertTraHangAndInventory(newReturn, updatedProd, returnDebtOffset);
      } catch (err) {
        alert('Lỗi tạo đơn trả hàng thu hồi lên Supabase!');
        return;
      }
    }

    setTraHang(prev => [newReturn, ...prev]);
    setSanPham(prev => prev.map(p => p.id === newReturn.sanPhamId ? updatedProd : p));

    if (returnDebtOffset) {
      setCongNo(prev => [returnDebtOffset!, ...prev]);
    }

    // Update hoaDon daTra field
    const currentHd = hoaDon.find(h => h.id === newReturn.hoaDonId);
    if (currentHd) {
      const updatedHd: HoaDon = {
        ...currentHd,
        daTra: (currentHd.daTra || 0) + newReturn.soTienHoanTrat
      };
      setHoaDon(prev => prev.map(h => h.id === newReturn.hoaDonId ? updatedHd : h));
    }
  };

  const handleEditHoaDon = async (
    editedInvoice: HoaDon,
    editedDetails: ChiTietHoaDon[],
    originalInvoice: HoaDon,
    originalDetails: ChiTietHoaDon[]
  ) => {
    const updatedProducts = sanPham.map(p => {
      let currentImeis = p.imei ? p.imei.split(',').map(i => i.trim()).filter(Boolean) : [];
      let nextTonKho = p.tonKho;

      const origItem = originalDetails.find(d => d.sanPhamId === p.id);
      if (origItem) {
        nextTonKho += origItem.soLuong;
        if (origItem.imei && !currentImeis.includes(origItem.imei)) {
          currentImeis.push(origItem.imei);
        }
      }

      const newItem = editedDetails.find(d => d.sanPhamId === p.id);
      if (newItem) {
        nextTonKho -= newItem.soLuong;
        if (newItem.imei) {
          currentImeis = currentImeis.filter(i => i !== newItem.imei);
        }
      }

      return {
        ...p,
        tonKho: nextTonKho < 0 ? 0 : nextTonKho,
        imei: currentImeis.join(', '),
        trangThai: (nextTonKho > 0 ? 'Còn hàng' : 'Hết hàng') as 'Còn hàng' | 'Hết hàng'
      };
    });

    const newDebtId = `CN${Math.floor(1000 + Math.random() * 9000)}`;
    let newDebtRecord: CongNo | undefined = undefined;
    if (editedInvoice.conNo > 0) {
      newDebtRecord = {
        id: newDebtId,
        khachHangId: editedInvoice.khachHangId,
        ngay: editedInvoice.ngay,
        loai: 'Ghi nợ',
        soTien: editedInvoice.conNo,
        hoaDonId: editedInvoice.id,
        ghiChu: `Nợ phát sinh tự động gối đầu từ đơn sỉ ${editedInvoice.id} (cập nhật chỉnh sửa)`
      };
    }

    if (isSupabaseConfigured) {
      try {
        await sUpsertHoaDonAndDetails(editedInvoice, editedDetails, updatedProducts.filter(p => {
          const origP = sanPham.find(o => o.id === p.id);
          return origP && (origP.tonKho !== p.tonKho || origP.imei !== p.imei);
        }), newDebtRecord);
      } catch (err) {
        alert('Lỗi khi cập nhật hóa đơn chỉnh sửa lên Supabase!');
        return;
      }
    }

    setHoaDon(prev => prev.map(h => h.id === editedInvoice.id ? editedInvoice : h));
    setChiTietHoaDon(prev => {
      const filtered = prev.filter(d => d.hoaDonId !== editedInvoice.id);
      return [...editedDetails, ...filtered];
    });
    setSanPham(updatedProducts);
    setCongNo(prev => {
      const filtered = prev.filter(cn => !(cn.hoaDonId === editedInvoice.id && cn.loai === 'Ghi nợ'));
      if (newDebtRecord) {
        return [newDebtRecord, ...filtered];
      }
      return filtered;
    });
  };

  const handleAddNhapHang = (nh: NhapHang) => {
    setLichSuNhap(prev => [nh, ...prev]);
  };

  const handleClearLichSuNhap = () => {
    setLichSuNhap([]);
  };

  // DYNAMIC COMPUTATIONS FOR HEADER KPIs
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // A. Total Revenue
  const totalRevenue = useMemo(() => {
    return hoaDon.reduce((sum, h) => sum + h.thanhTien, 0);
  }, [hoaDon]);

  // B. Net outstanding debt
  const totalDebtsReceivables = useMemo(() => {
    return congNo.reduce((sum, cn) => {
      if (cn.loai === 'Ghi nợ') return sum + cn.soTien;
      if (cn.loai === 'Thanh toán' || cn.loai === 'Giảm trừ do trả hàng') return sum - cn.soTien;
      return sum;
    }, 0);
  }, [congNo]);

  // C. Total physical devices in stock
  const totalPhonesInWarehouse = useMemo(() => {
    return sanPham.reduce((sum, p) => sum + p.tonKho, 0);
  }, [sanPham]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      
      {/* 1. APP HEADER BAR (Exempt from print layout) */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 no-print shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Icon (Hamburger) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer active:scale-95"
                title="Mở menu điều hướng"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-rose-450" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent leading-none sm:leading-normal">
                    Quản lý bán hàng
                  </h1>
                  <p className="hidden sm:block text-[9px] sm:text-[10px] text-zinc-400 font-mono tracking-tight uppercase leading-none mt-0.5">Hệ thống quản lý chuyên nghiệp</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-zinc-500 text-[10px] font-mono">v1.2.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body: Collapsible Left Sidebar + Central Scrollable Content Pane */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 no-print safe-area-pb">
          <div className="grid grid-cols-5 gap-1 px-1 py-1">
            {[
              { id: 'dashboard', label: 'Trang chủ', icon: TrendingUp },
              { id: 'pos', label: 'Bán hàng', icon: ShoppingCart },
              { id: 'invoices', label: 'Hóa đơn', icon: FileText },
              { id: 'products', label: 'Kho máy', icon: Layers },
              { id: 'menu', label: 'Khác', icon: Menu }
            ].map(item => {
              const active = activeTab === item.id || (item.id === 'menu' && ['customers', 'imports', 'returns', 'database'].includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'menu') {
                      setMobileMenuOpen(true);
                    } else {
                      setActiveTab(item.id as TabType);
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                    active
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-[9px] font-semibold mt-1 leading-tight text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Sidebar Backdrop overlay */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-950/60 z-30 transition-opacity no-print"
          />
        )}

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex bg-slate-900 text-slate-300 flex-col no-print w-64 shrink-0">
          <div className="p-4 border-b border-slate-800">
            <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-400 select-none">
              Danh Mục Hệ Thống
            </span>
          </div>
          <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto scrollbar-none">
            {[
              { id: 'dashboard', label: 'Trang chủ', icon: TrendingUp },
              { id: 'pos', label: 'Xuất Đơn', icon: ShoppingCart },
              { id: 'invoices', label: 'Hóa Đơn', icon: FileText },
              { id: 'customers', label: 'Đại Lý', icon: Users2 },
              { id: 'products', label: 'Kho Máy', icon: Layers },
              { id: 'imports', label: 'Nhập Hàng', icon: PackagePlus },
              { id: 'returns', label: 'Đổi Trả', icon: Undo2 },
              { id: 'database', label: 'Thiết Lập', icon: Database }
            ].map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none active:scale-[0.97] ${
                    active
                      ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono tracking-tight select-none shrink-0">
            Quản lý bán hàng v1.2.0
          </div>
        </aside>

        {/* MOBILE SIDEBAR OVERLAY */}
        <aside 
          className={`md:hidden bg-slate-900 text-slate-300 flex flex-col no-print transition-all duration-300 z-40 fixed inset-y-0 left-0 transform ${
            mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full'}`
          }
        >
          {/* Menu Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between min-h-16 shrink-0">
            <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-400 select-none">
              Danh Mục Hệ Thống
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto scrollbar-none">
            {[
              { id: 'dashboard', label: 'Trang chủ', icon: TrendingUp },
              { id: 'pos', label: 'Xuất Đơn', icon: ShoppingCart },
              { id: 'invoices', label: 'Hóa Đơn', icon: FileText },
              { id: 'customers', label: 'Đại Lý', icon: Users2 },
              { id: 'products', label: 'Kho Máy', icon: Layers },
              { id: 'imports', label: 'Nhập Hàng', icon: PackagePlus },
              { id: 'returns', label: 'Đổi Trả', icon: Undo2 },
              { id: 'database', label: 'Thiết Lập', icon: Database }
            ].map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none active:scale-[0.97] ${
                    active
                      ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono tracking-tight select-none shrink-0">
            Quản lý bán hàng v1.2.0
          </div>
        </aside>

        {/* CONTENT PANEL AREA */}
        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col min-h-0 text-slate-800 pb-20 md:pb-0">
          
          {isSupabaseConfigured && supabaseSyncError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3.5 text-xs text-red-900 no-print animate-fade-in shrink-0">
              <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 text-left">
                  <div className="bg-red-100 text-red-750 p-2 rounded-xl shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-red-650" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-sm text-red-950 flex items-center gap-1.5 flex-wrap">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Bạn cần Kích Hoạt bảng CSDL mới trên Supabase Cloud để đồng bộ!
                    </p>
                    <div className="text-red-800 text-[11px] leading-relaxed">
                      <p className="mb-1">
                        Cơ sở dữ liệu Supabase của bạn hiện <strong className="font-bold text-red-900">chưa được tạo cấu trúc bảng SQL</strong>. Hãy hoàn thành <strong className="font-bold underline">2 bước tự động</strong> sau để dữ liệu được đồng bộ online trơn tru:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>
                          <strong className="font-bold text-slate-900">BƯỚC 1:</strong> Bấm nút <strong className="font-black text-indigo-700">"Bước 1: Copy Mã SQL Cài Đặt"</strong> ở bên phải (mã script sẽ được lưu vào bộ nhớ tạm).
                        </li>
                        <li>
                          <strong className="font-bold text-slate-900">BƯỚC 2:</strong> Bấm nút <strong className="font-bold text-slate-900">"Bước 2: Mở SQL Editor"</strong> dán toàn bộ vào sau đoạn dán của Supabase, chọn <strong className="font-bold">"Run"</strong>. Sau đó quay lại đây tải lại trang!
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto shrink-0 self-stretch lg:self-auto justify-end">
                  <button
                    onClick={handleGlobalCopySql}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs hover:shadow-xs cursor-pointer text-xs"
                  >
                    {copiedSqlState ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedSqlState ? 'Đã copy thành công!' : 'Bước 1: Copy Mã SQL Cài Đặt'}
                  </button>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs text-center border border-slate-700"
                  >
                    Bước 2: Mở SQL Editor <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 4. WORKSPACE CONTROLLERS WRAPPER */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 no-print">
        {activeTab === 'dashboard' && (
          <DashboardView
            khachHang={khachHang}
            sanPham={sanPham}
            hoaDon={hoaDon}
            chiTietHoaDon={chiTietHoaDon}
            congNo={congNo}
            traHang={traHang}
            storeInfo={storeInfo}
            onEditHoaDon={handleEditHoaDon}
          />
        )}

        {activeTab === 'pos' && (
          <POSView
            khachHang={khachHang}
            sanPham={sanPham}
            giaKhachHang={giaKhachHang}
            lichSuGia={lichSuGia}
            storeInfo={storeInfo}
            onAddHoaDon={handleAddHoaDon}
            onAddKhachHang={handleAddKhachHang}
            onOpenAddCustomer={() => {
              setActiveTab('customers');
              setTimeout(() => {
                const trigger = document.getElementById('btn_add_customer_trigger');
                if (trigger) trigger.click();
              }, 150);
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            khachHang={khachHang}
            sanPham={sanPham}
            hoaDon={hoaDon}
            chiTietHoaDon={chiTietHoaDon}
            congNo={congNo}
            traHang={traHang}
            storeInfo={storeInfo}
            onEditHoaDon={handleEditHoaDon}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            khachHang={khachHang}
            hoaDon={hoaDon}
            chiTietHoaDon={chiTietHoaDon}
            congNo={congNo}
            sanPham={sanPham}
            giaKhachHang={giaKhachHang}
            traHang={traHang}
            storeInfo={storeInfo}
            onAddKhachHang={handleAddKhachHang}
            onAddCongNo={handleAddCongNo}
            onUpdateGiaKhachHang={handleUpdateGiaKhachHang}
            onRemoveGiaKhachHang={handleRemoveGiaKhachHang}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            sanPham={sanPham}
            lichSuGia={lichSuGia}
            onAddSanPham={handleAddSanPham}
            onUpdateSanPham={handleUpdateSanPham}
          />
        )}

        {activeTab === 'returns' && (
          <ReturnsView
            hoaDon={hoaDon}
            chiTietHoaDon={chiTietHoaDon}
            khachHai={khachHang}
            traHang={traHang}
            onAddTraHang={handleAddTraHang}
          />
        )}

        {activeTab === 'imports' && (
          <ImportsView
            sanPham={sanPham}
            onAddSanPham={handleAddSanPham}
            onUpdateSanPham={handleUpdateSanPham}
            lichSuNhap={lichSuNhap}
            onAddNhapHang={handleAddNhapHang}
            onClearLichSuNhap={handleClearLichSuNhap}
          />
        )}

          {activeTab === 'database' && (
          <DatabaseView
            khachHang={khachHang}
            sanPham={sanPham}
            hoaDon={hoaDon}
            chiTietHoaDon={chiTietHoaDon}
            congNo={congNo}
            giaKhachHang={giaKhachHang}
            lichSuGia={lichSuGia}
            traHang={traHang}
            storeInfo={storeInfo}
            onUpdateStoreInfo={setStoreInfo}
            onResetData={handleResetData}
            isSupabaseLoading={isSupabaseLoading}
            supabaseSyncError={supabaseSyncError}
            onSyncToSupabase={handleSyncToSupabase}
          />
        )}
      </main>

      {/* DDL SCHEMA MISSING POPUP MODAL */}
      {isSupabaseConfigured && !forceOffline && supabaseSyncError && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl animate-fade-in relative text-left">
            <div className="flex items-start gap-4 border-b border-slate-800/80 pb-4 mb-4">
              <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                  ⚠️ CHƯA KHỞI TẠO BẢNG DỮ LIỆU TRÊN SUPABASE CLOUD
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Lỗi hệ thống: <code className="text-red-300 font-mono bg-red-500/5 px-1.5 py-0.5 rounded text-[11px] font-semibold">{supabaseSyncError}</code>
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  Do tài khoản Supabase của bạn mới tạo, bạn cần khởi động cấu trúc dữ liệu cho 8 bảng. Hãy làm theo 2 bước cực kỳ dễ sau:
                </p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              {/* Step 1 */}
              <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest block w-fit mb-1">Bước 1</span>
                  <p className="font-bold text-sm text-zinc-200">Copy đoạn mã SQL Cài đặt</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">Bộ mã tự động tạo 8 bảng, khóa ngoại và mở chặn Security chính sách RLS.</p>
                </div>
                <button
                  onClick={handleGlobalCopySql}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg shrink-0 w-full sm:w-auto justify-center active:scale-95"
                >
                  {copiedSqlState ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedSqlState ? 'Đã copy thành công!' : 'Bước 1: Bấm Copy Mã SQL'}
                </button>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest block w-fit mb-1">Bước 2</span>
                  <p className="font-bold text-sm text-zinc-200">Mở SQL Editor và dán để chạy</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">Nhấn dán mã SQL vào bảng soạn thảo của Supabase rồi nhấn nút "Run".</p>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg shrink-0 w-full sm:w-auto justify-center text-center leading-normal"
                >
                  Bước 2: Mở SQL Editor <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-zinc-400 leading-normal max-w-md">
                💡 Sau khi nhấn nút <strong className="text-white font-bold">"Run"</strong> trong Supabase dashboard, quý khách chỉ cần quay lại và tải lại (Reload) trang web này là hoàn thành!
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 self-stretch sm:self-auto">
                <button
                  onClick={() => {
                    setForceOffline(true);
                    setSupabaseSyncError(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-zinc-200 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer w-full sm:w-auto text-center border border-slate-700 active:scale-95"
                >
                  Bỏ qua & Chạy Offline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 no-print mt-auto shrink-0">
        <p>&copy; 2026 Quản lý bán hàng - Phát triển theo cấu trúc hệ quản trị cơ sở dữ liệu Supabase chuyên nghiệp.</p>
      </footer>
        </div> {/* closes CONTENT PANEL AREA */}
      </div> {/* closes main flex layout wrapper */}
    </div>
  );
}

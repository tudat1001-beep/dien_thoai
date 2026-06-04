import { KhachHang, SanPham, HoaDon, ChiTietHoaDon, CongNo, GiaKhachHang, LichSuGia, TraHang } from './types';

export const INITIAL_KHACH_HANG: KhachHang[] = [
  {
    id: 'KH001',
    ten: 'Cửa hàng Điện Thoại Gia Bảo',
    sdt: '0912345678',
    diaChi: '123 Đường Ba Tháng Hai, Quận 10, TP.HCM',
    mst: '0314567890',
    ghiChu: 'Khách sỉ lớn chuyên lấy iPhone phân khúc cao cấp',
    ngayTao: '2026-05-10'
  },
  {
    id: 'KH002',
    ten: 'Khách Mobile Bình Dương',
    sdt: '0987654321',
    diaChi: '45 Đại lộ Bình Dương, Thủ Dầu Một, Bình Dương',
    mst: '3701234567',
    ghiChu: 'Thanh toán gối đầu, hạn nợ tối đa 15 ngày',
    ngayTao: '2026-05-15'
  },
  {
    id: 'KH003',
    ten: 'Di Động Thông Minh Hải Phòng',
    sdt: '0906123456',
    diaChi: '78 Lạch Tray, Ngô Quyền, Hải Phòng',
    mst: '0209876543',
    ghiChu: 'Chuyên mua sỉ số lượng vừa các dòng Xiaomi và Samsung',
    ngayTao: '2026-05-20'
  },
  {
    id: 'KH004',
    ten: 'Lâm Store Đà Nẵng',
    sdt: '0977222333',
    diaChi: '210 Nguyễn Văn Linh, Đà Nẵng',
    mst: '0401234599',
    ghiChu: 'Khách thanh toán chuyển khoản ngay khi nhận hàng',
    ngayTao: '2026-05-22'
  }
];

export const INITIAL_SAN_PHAM: SanPham[] = [
  {
    id: 'SP001',
    ten: 'iPhone 15 Pro Max 256GB - Vàng Titan (VNA)',
    imei: '351234567890123, 351234567890124, 351234567890125',
    giaNhap: 26500000,
    giaBan: 28200000,
    tonKho: 3,
    trangThai: 'Còn hàng'
  },
  {
    id: 'SP002',
    ten: 'Samsung Galaxy S24 Ultra 512GB (Chính hãng)',
    imei: '359876543210981, 359876543210982',
    giaNhap: 24000000,
    giaBan: 25800000,
    tonKho: 2,
    trangThai: 'Còn hàng'
  },
  {
    id: 'SP003',
    ten: 'Xiaomi Redmi Note 13 Pro 8GB/256GB',
    imei: '861234567890451, 861234567890452, 861234567890453, 861234567890454',
    giaNhap: 4800000,
    giaBan: 5300000,
    tonKho: 4,
    trangThai: 'Còn hàng'
  },
  {
    id: 'SP004',
    ten: 'iPhone 13 128GB - Đen (Active Online)',
    imei: '356677889900111',
    giaNhap: 11500000,
    giaBan: 12500000,
    tonKho: 1,
    trangThai: 'Còn hàng'
  },
  {
    id: 'SP005',
    ten: 'iPad Pro M4 11-inch 256GB Wi-Fi - Gray',
    imei: 'DLXLL002231A, DLXLL002231B',
    giaNhap: 22000000,
    giaBan: 23900000,
    tonKho: 2,
    trangThai: 'Còn hàng'
  },
  {
    id: 'SP006',
    ten: 'iPhone 15 Pro 128GB - Titan Tự Nhiên',
    imei: '',
    giaNhap: 22800000,
    giaBan: 24500000,
    tonKho: 0,
    trangThai: 'Hết hàng'
  }
];

export const INITIAL_GIA_KHACH_HANG: GiaKhachHang[] = [
  {
    id: 'GKH001',
    khachHangId: 'KH001',
    sanPhamId: 'SP001',
    giaRieng: 27900000
  },
  {
    id: 'GKH002',
    khachHangId: 'KH002',
    sanPhamId: 'SP002',
    giaRieng: 25000000
  }
];

export const INITIAL_LICHSU_GIA: LichSuGia[] = [
  {
    id: 'LSG001',
    sanPhamId: 'SP001',
    ngayThayDoi: '2026-05-01',
    giaCu: 28500000,
    giaMoi: 28200000
  },
  {
    id: 'LSG002',
    sanPhamId: 'SP003',
    ngayThayDoi: '2026-05-12',
    giaCu: 5500000,
    giaMoi: 5300000
  }
];

export const INITIAL_HOA_DON: HoaDon[] = [
  {
    id: 'HD001',
    khachHangId: 'KH001',
    ngay: '2026-05-24',
    tongTien: 27900000,
    giamGia: 0,
    thanhTien: 27900000,
    daThanhToan: 20000000,
    conNo: 7900000,
    ghiChu: 'Giao hàng qua chành xe Tô Châu, Quận 5'
  },
  {
    id: 'HD002',
    khachHangId: 'KH002',
    ngay: '2026-05-26',
    tongTien: 25400000,
    giamGia: 400000,
    thanhTien: 25000000,
    daThanhToan: 10000000,
    conNo: 15000000,
    ghiChu: 'Khách tự lấy tại kho'
  }
];

export const INITIAL_CHI_TIET_HOA_DON: ChiTietHoaDon[] = [
  {
    id: 'CTHD001',
    hoaDonId: 'HD001',
    sanPhamId: 'SP001',
    tenSanPham: 'iPhone 15 Pro Max 256GB - Vàng Titan (VNA)',
    imei: '351234567890123',
    soLuong: 1,
    donGia: 27900000,
    thanhTien: 27900000
  },
  {
    id: 'CTHD002',
    hoaDonId: 'HD002',
    sanPhamId: 'SP002',
    tenSanPham: 'Samsung Galaxy S24 Ultra 512GB (Chính hãng)',
    imei: '359876543210981',
    soLuong: 1,
    donGia: 25000000,
    thanhTien: 25000000
  }
];

export const INITIAL_CONG_NO: CongNo[] = [
  {
    id: 'CN001',
    khachHangId: 'KH001',
    ngay: '2026-05-24',
    loai: 'Ghi nợ',
    soTien: 7900000,
    hoaDonId: 'HD001',
    ghiChu: 'Phát sinh từ hóa đơn HD001'
  },
  {
    id: 'CN002',
    khachHangId: 'KH002',
    ngay: '2026-05-26',
    loai: 'Ghi nợ',
    soTien: 15000000,
    hoaDonId: 'HD002',
    ghiChu: 'Phát sinh từ hóa đơn HD002'
  },
  {
    id: 'CN003',
    khachHangId: 'KH001',
    ngay: '2026-05-27',
    loai: 'Thanh toán',
    soTien: 5000000,
    ghiChu: 'Thanh toán chuyển khoản'
  }
];

export const INITIAL_TRA_HANG: TraHang[] = [];

export interface KhachHang {
  id: string; // e.g., KH001
  ten: string;
  sdt: string;
  diaChi: string;
  mst: string;
  ghiChu: string;
  ngayTao: string;
}

export interface SanPham {
  id: string; // e.g., SP001
  ten: string;
  imei: string; // list of IMEIs separated by comma or new lines
  giaNhap: number;
  giaBan: number; // default selling price
  tonKho: number;
  trangThai: 'Còn hàng' | 'Hết hàng';
  loai?: 'Điện thoại' | 'Linh phụ kiện';
}

export interface HoaDon {
  id: string; // e.g., HD001
  khachHangId: string;
  ngay: string;
  tongTien: number;
  giamGia: number;
  thanhTien: number; // tongTien - giamGia
  daThanhToan: number; // cash paid
  conNo: number; // thanhTien - daThanhToan
  daTra: number; // amount already returned/refunded
  ghiChu: string;
}

export interface ChiTietHoaDon {
  id: string; // e.g., CTHD001
  hoaDonId: string;
  sanPhamId: string;
  tenSanPham: string;
  imei: string; // serial/IMEIs selected
  soLuong: number;
  donGia: number; // price at checkout (can be modified)
  thanhTien: number;
}

export interface CongNo {
  id: string; // e.g., CN001
  khachHangId: string;
  ngay: string;
  loai: 'Ghi nợ' | 'Thanh toán' | 'Giảm trừ do trả hàng';
  soTien: number;
  hoaDonId?: string; // linked invoice if applicable
  ghiChu: string;
}

export interface GiaKhachHang {
  id: string; // e.g., GKH001
  khachHangId: string;
  sanPhamId: string;
  giaRieng: number; // special price configured
}

export interface LichSuGia {
  id: string; // e.g., LSG001
  sanPhamId: string;
  ngayThayDoi: string;
  giaCu: number;
  giaMoi: number;
}

export interface TraHang {
  id: string; // e.g., TH001
  hoaDonId: string;
  sanPhamId: string;
  soLuong: number;
  imei: string;
  ngayTra: string;
  soTienHoanTrat: number;
  lyDo: string;
  phuongThuc: 'Trừ vào công nợ' | 'Hoàn tiền mặt';
}

export interface NhapHang {
  id: string; // e.g., NH001
  ngay: string;
  sanPhamId: string;
  tenSanPham: string;
  soLuong: number;
  giaNhap: number;
  tongTien: number;
  imeiList: string[];
  ghiChu: string;
}

